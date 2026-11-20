import type * as Ort from 'onnxruntime-web';

/**
 * Silero VAD v5 Neural Voice Activity Detector (16 kHz PCM Float32).
 *
 * - Lazy-loads `onnxruntime-web/wasm` ONLY when voice capture starts.
 * - Loads 100% local static assets from `/vad/` (no CDN, no CSP issues).
 * - Forces single-threaded WASM (`numThreads = 1`, `proxy = false`) so it
 *   works everywhere without requiring `SharedArrayBuffer` / COOP-COEP headers.
 * - Official Silero VAD v5 inference interface:
 *     - Input frame: 512 samples @ 16 kHz (32 ms)
 *     - Context prefix: 64 samples from previous frame -> tensor `input` [1, 576] float32
 *     - Recurrent state: tensor `state` [2, 1, 128] float32 -> output `stateN` [2, 1, 128]
 *     - Sample rate: tensor `sr` [1] int64 ([16000n])
 *     - Output probability: tensor `output` [1, 1] float32 -> `data[0]` in [0, 1]
 * - Never throws fatal exceptions; degrades cleanly (`isReady === false`) so
 *   `useVoiceSession` can fall back to the calibrated energy detector seamlessly.
 */

export const SILERO_SAMPLE_RATE = 16000;
export const SILERO_FRAME_SAMPLES = 512;
export const SILERO_CONTEXT_SAMPLES = 64;
export const SILERO_FRAME_MS = (SILERO_FRAME_SAMPLES / SILERO_SAMPLE_RATE) * 1000; // 32 ms

const STATE_SIZE = 2 * 1 * 128;
const MAX_PENDING_SAMPLES = SILERO_FRAME_SAMPLES * 6; // Cap backlog at ~192ms to prevent drift
const MAX_CONSECUTIVE_ERRORS = 5;

function resolveLocalAssetUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '/vad/';
  if (/^(https?:|file:|blob:|data:)/i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      return new URL(pathOrUrl, window.location.origin).href;
    } catch {
      return pathOrUrl;
    }
  }
  return pathOrUrl;
}

export class SileroVadProcessor {
  private ort: typeof Ort | null = null;
  private session: Ort.InferenceSession | null = null;
  private stateTensor: Ort.Tensor | null = null;
  private srTensor: Ort.Tensor | null = null;
  private context: Float32Array = new Float32Array(SILERO_CONTEXT_SAMPLES);
  private pendingBuffer: Float32Array = new Float32Array(0);
  private initPromise: Promise<boolean> | null = null;
  private serialQueue: Promise<void> = Promise.resolve();
  private ready = false;
  private disposed = false;
  private pendingStateReset = false;
  private _lastSpeechProb = 0;
  private consecutiveErrors = 0;

  get isReady(): boolean {
    return this.ready && !this.disposed && this.session !== null;
  }

  get lastSpeechProb(): number {
    return this._lastSpeechProb;
  }

  /**
   * Lazily initializes ONNX Runtime Web (WASM single-thread) and loads
   * `silero_vad_v5.onnx` from local `/vad/` assets.
   * Safe to call multiple times (idempotent & deduplicated).
   */
  async init(
    modelUrl = '/vad/silero_vad_v5.onnx',
    wasmPaths = '/vad/',
  ): Promise<boolean> {
    if (this.disposed) {
      return false;
    }
    if (this.ready && this.session) {
      return true;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInit(modelUrl, wasmPaths);
    const ok = await this.initPromise;
    if (!ok) {
      // Allow future retry on next voice session if transient error occurred
      this.initPromise = null;
    }
    return ok;
  }

  private async performInit(modelUrl: string, wasmPaths: string): Promise<boolean> {
    try {
      if (typeof WebAssembly === 'undefined') {
        console.warn('[SileroVAD] WebAssembly no disponible en este navegador → usando fallback');
        return false;
      }

      const ortModule = (await import('onnxruntime-web/wasm')) as unknown as typeof Ort;
      if (this.disposed) return false;

      const resolvedWasmPaths = resolveLocalAssetUrl(
        wasmPaths.endsWith('/') ? wasmPaths : `${wasmPaths}/`,
      );
      const resolvedModelUrl = resolveLocalAssetUrl(modelUrl);

      // Configurar WASM 100% local y single-thread (sin requerir SharedArrayBuffer / COOP-COEP)
      ortModule.env.wasm.wasmPaths = resolvedWasmPaths;
      ortModule.env.wasm.numThreads = 1;
      ortModule.env.wasm.proxy = false;
      ortModule.env.logLevel = 'error';

      const response = await fetch(resolvedModelUrl, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al cargar ${resolvedModelUrl}`);
      }
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html')) {
        throw new Error(`Respuesta HTML inesperada al cargar modelo ONNX (${resolvedModelUrl})`);
      }

      const modelArrayBuffer = await response.arrayBuffer();
      if (this.disposed) return false;
      if (!modelArrayBuffer || modelArrayBuffer.byteLength < 100_000) {
        throw new Error(`Modelo ONNX inválido o incompleto (${modelArrayBuffer?.byteLength || 0} bytes)`);
      }

      const modelBytes = new Uint8Array(modelArrayBuffer);
      const session = await ortModule.InferenceSession.create(modelBytes, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });

      if (this.disposed) {
        try {
          await session.release();
        } catch {
          // ignore release error after dispose
        }
        return false;
      }

      const requiredInputs = ['input', 'state', 'sr'];
      const requiredOutputs = ['output', 'stateN'];
      const missingInputs = requiredInputs.filter((name) => !session.inputNames.includes(name));
      const missingOutputs = requiredOutputs.filter((name) => !session.outputNames.includes(name));
      if (missingInputs.length > 0 || missingOutputs.length > 0) {
        try {
          await session.release();
        } catch {
          // ignore
        }
        throw new Error(
          `Esquema ONNX incompatible. Faltan inputs=[${missingInputs.join(',')}] outputs=[${missingOutputs.join(',')}]`,
        );
      }

      this.ort = ortModule;
      this.session = session;
      this.srTensor = new ortModule.Tensor(
        'int64',
        BigInt64Array.from([BigInt(SILERO_SAMPLE_RATE)]),
        [1],
      );
      this.stateTensor = new ortModule.Tensor('float32', new Float32Array(STATE_SIZE), [2, 1, 128]);
      this.context = new Float32Array(SILERO_CONTEXT_SAMPLES);
      this.pendingBuffer = new Float32Array(0);
      this.pendingStateReset = false;
      this._lastSpeechProb = 0;
      this.consecutiveErrors = 0;

      // Warmup ligero de 1 frame de silencio y reinicio limpio del estado recurrente
      await this.runSingleFrame(new Float32Array(SILERO_FRAME_SAMPLES));
      if (this.disposed) {
        await this.cleanupTensorsAndSession();
        return false;
      }
      this.resetTensorsNow();
      this._lastSpeechProb = 0;
      this.ready = true;
      return true;
    } catch (err) {
      console.warn('[SileroVAD] Error inicializando Silero VAD v5 → fallback adaptativo activo:', err);
      this.ready = false;
      await this.cleanupTensorsAndSession();
      return false;
    }
  }

  /**
   * Feeds a PCM Float32 chunk sampled at 16 kHz into the internal 512-sample
   * frame buffer and runs serialized neural inference for each complete frame.
   *
   * Returns the latest speech probability in [0, 1] if at least one 512-sample
   * frame was evaluated, or `null` if fewer than 512 samples are buffered or VAD
   * is not ready. Never throws.
   */
  processChunk16k(float32_16k: Float32Array): Promise<number | null> {
    if (!this.isReady || !float32_16k || float32_16k.length === 0) {
      return Promise.resolve(null);
    }

    // Copy input buffer immediately so caller buffer reuse cannot corrupt queued audio
    const chunkCopy = new Float32Array(float32_16k.length);
    chunkCopy.set(float32_16k);

    let resolveResult: (value: number | null) => void = () => {};
    const resultPromise = new Promise<number | null>((resolve) => {
      resolveResult = resolve;
    });

    this.serialQueue = this.serialQueue
      .then(async () => {
        if (!this.isReady) {
          resolveResult(null);
          return;
        }

        if (this.pendingStateReset) {
          this.resetTensorsNow();
          this.pendingStateReset = false;
        }

        // Append incoming 16kHz samples to internal accumulator
        const mergedLength = this.pendingBuffer.length + chunkCopy.length;
        let combined: Float32Array;
        if (this.pendingBuffer.length === 0) {
          combined = chunkCopy;
        } else {
          combined = new Float32Array(mergedLength);
          combined.set(this.pendingBuffer, 0);
          combined.set(chunkCopy, this.pendingBuffer.length);
        }

        // Prevent unbounded latency drift on slow devices
        if (combined.length > MAX_PENDING_SAMPLES) {
          combined = combined.slice(combined.length - MAX_PENDING_SAMPLES);
        }

        let offset = 0;
        let evaluatedProb: number | null = null;

        while (offset + SILERO_FRAME_SAMPLES <= combined.length && this.isReady) {
          const frame = combined.subarray(offset, offset + SILERO_FRAME_SAMPLES);
          offset += SILERO_FRAME_SAMPLES;

          const prob = await this.runSingleFrame(frame);
          if (prob !== null) {
            this._lastSpeechProb = prob;
            evaluatedProb = prob;
            this.consecutiveErrors = 0;
          }
        }

        this.pendingBuffer =
          offset < combined.length ? combined.slice(offset) : new Float32Array(0);

        resolveResult(evaluatedProb);
      })
      .catch((err) => {
        this.consecutiveErrors += 1;
        console.warn('[SileroVAD] Error en inferencia de frame:', err);
        if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.warn('[SileroVAD] Demasiados errores consecutivos → cambiando a fallback adaptativo');
          this.ready = false;
        }
        resolveResult(null);
      });

    return resultPromise;
  }

  private async runSingleFrame(frame512: Float32Array): Promise<number | null> {
    const ort = this.ort;
    const session = this.session;
    const state = this.stateTensor;
    const sr = this.srTensor;
    if (!ort || !session || !state || !sr || this.disposed) {
      return null;
    }

    const inputWithContext = new Float32Array(SILERO_CONTEXT_SAMPLES + SILERO_FRAME_SAMPLES);
    inputWithContext.set(this.context, 0);
    inputWithContext.set(frame512, SILERO_CONTEXT_SAMPLES);
    this.context = frame512.slice(-SILERO_CONTEXT_SAMPLES);

    const inputTensor = new ort.Tensor('float32', inputWithContext, [
      1,
      SILERO_CONTEXT_SAMPLES + SILERO_FRAME_SAMPLES,
    ]);

    try {
      const outputs = await session.run({
        input: inputTensor,
        state,
        sr,
      });

      const nextState = outputs.stateN;
      const outputTensor = outputs.output;
      const rawProb = outputTensor?.data?.[0];

      if (!nextState || typeof rawProb !== 'number' || !Number.isFinite(rawProb)) {
        outputTensor?.dispose();
        nextState?.dispose();
        throw new Error('Salida inválida del modelo Silero VAD v5');
      }

      const clampedProb = Math.max(0, Math.min(1, rawProb));

      // Liberar tensores antiguos de WASM para evitar fugas de memoria en sesiones largas
      state.dispose();
      outputTensor.dispose();
      this.stateTensor = nextState;

      return clampedProb;
    } finally {
      inputTensor.dispose();
    }
  }

  private resetTensorsNow(): void {
    this.context = new Float32Array(SILERO_CONTEXT_SAMPLES);
    this.pendingBuffer = new Float32Array(0);
    if (this.ort) {
      try {
        this.stateTensor?.dispose();
      } catch {
        // ignore
      }
      this.stateTensor = new this.ort.Tensor('float32', new Float32Array(STATE_SIZE), [2, 1, 128]);
    }
  }

  /**
   * Resets internal LSTM state, 64-sample context window and pending PCM buffer.
   * Safe to call even while an inference frame is in flight.
   */
  reset(): void {
    this._lastSpeechProb = 0;
    this.pendingBuffer = new Float32Array(0);
    this.context = new Float32Array(SILERO_CONTEXT_SAMPLES);
    this.pendingStateReset = true;
  }

  private async cleanupTensorsAndSession(): Promise<void> {
    try {
      this.stateTensor?.dispose();
    } catch {
      // ignore
    }
    this.stateTensor = null;

    try {
      this.srTensor?.dispose();
    } catch {
      // ignore
    }
    this.srTensor = null;

    if (this.session) {
      const sess = this.session;
      this.session = null;
      try {
        await sess.release();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Releases ONNX session and WASM tensors permanently.
   */
  async dispose(): Promise<void> {
    this.disposed = true;
    this.ready = false;
    this._lastSpeechProb = 0;
    this.pendingBuffer = new Float32Array(0);
    this.context = new Float32Array(SILERO_CONTEXT_SAMPLES);

    try {
      await this.serialQueue;
    } catch {
      // ignore
    }
    await this.cleanupTensorsAndSession();
    this.ort = null;
    this.initPromise = null;
  }
}
