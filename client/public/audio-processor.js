class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = [];
        this.targetSampleRate = 16000;
        this.nextOutputFrame = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input.length) return true;

        const channelData = input[0];

        // Downsample and convert to Int16
        // We assume input sample rate is handled by the context, but we need to be careful.
        // Actually, AudioWorklet runs at the context's sample rate.
        // We need to buffer and downsample if context rate != 16000.

        // Simple decimation for now (or linear interpolation if needed)
        // For speech, simple decimation is often "okay" but proper resampling is better.
        // However, doing complex resampling in JS worklet can be heavy.
        // Let's try to just capture the raw float data and let the main thread handle complex resampling 
        // OR do a simple ratio based resampling here.

        // Let's send raw float32 data to main thread to keep worklet light, 
        // BUT main thread might be busy.
        // Better: Do simple ratio resampling here.

        // Note: Google's example uses a library 'wavefile' on the client side which is heavy.
        // We want real-time.

        // Let's try to just pass the float data and let the main thread convert to PCM16 
        // AND handle resampling if necessary, or force AudioContext to 16kHz if possible.
        // Browsers often support creating AudioContext({ sampleRate: 16000 }).
        // If that works, we just need Float32 -> Int16.

        // Let's assume the context is created with sampleRate: 16000 (we will try to enforce this in useVoiceSession).
        // If so, we just need to convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767).

        const pcmData = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
            const s = Math.max(-1, Math.min(1, channelData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        this.port.postMessage(pcmData.buffer, [pcmData.buffer]);

        return true;
    }
}

registerProcessor('pcm-processor', PCMProcessor);
