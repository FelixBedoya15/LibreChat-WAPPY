"""
WAPPY Studio — Worker GPU Serverless para Renderizado de Video HTML/GSAP a MP4 (Opción C)
========================================================================================
Este script despliega un endpoint serverless con GPU NVIDIA L4 en Modal.com.
Solo cobra por los segundos exactos que tarda en renderizar un video (~$0.005 USD por video)
y escala automáticamente de 0 a decenas de contenedores si 100 usuarios piden videos a la vez,
protegiendo al 100% el VPS principal de WAPPY (srv999875).

Instrucciones rápidas de despliegue:
1. pip install modal
2. modal setup
3. modal deploy scripts/modal_gpu_video_worker.py
4. Copia la URL generada y pégala en WAPPY Studio -> "Configurar GPU Serverless" (o en .env como STUDIO_GPU_WORKER_URL).
"""

import base64
import os
import subprocess
import tempfile
from pathlib import Path
import modal

app = modal.App("wappy-studio-gpu-renderer")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "ffmpeg",
        "chromium",
        "fonts-liberation",
        "fonts-noto-color-emoji",
        "libnss3",
        "libatk-bridge2.0-0",
        "libdrm2",
        "libxkbcommon0",
        "libgbm1",
        "libasound2",
    )
    .pip_install("fastapi[standard]", "playwright")
    .run_commands("playwright install chromium")
)


@app.function(
    image=image,
    gpu="L4",
    timeout=300,
    memory=8192,
    cpu=4.0,
)
@modal.fastapi_endpoint(method="POST")
async def render_html_video(payload: dict):
    from playwright.async_api import async_playwright

    html_code = payload.get("html", "")
    audio_b64 = payload.get("audioBase64")
    width = int(payload.get("width", 1080))
    height = int(payload.get("height", 1920))
    duration = min(180, max(2, int(payload.get("durationSeconds", 15))))
    fps = min(60, max(15, int(payload.get("fps", 30))))

    if not html_code:
        return {"success": False, "error": "El campo 'html' es obligatorio."}

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        html_file = tmp_path / "composition.html"
        frames_dir = tmp_path / "frames"
        frames_dir.mkdir(parents=True, exist_ok=True)
        html_file.write_text(html_code, encoding="utf-8")

        audio_file = None
        if audio_b64:
            clean_b64 = audio_b64.split(",")[-1]
            audio_file = tmp_path / "audio.wav"
            audio_file.write_bytes(base64.b64decode(clean_b64))

        total_frames = duration * fps

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--use-gl=angle",
                    "--enable-gpu-rasterization",
                    "--ignore-gpu-blocklist",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                ],
            )
            page = await browser.new_page(viewport={"width": width, "height": height})
            await page.goto(f"file://{html_file}", wait_until="networkidle")
            await page.wait_for_timeout(400)

            # Pausar línea de tiempo para avanzar de forma determinista fotograma a fotograma
            await page.evaluate("window.postMessage({ type: 'STUDIO_PAUSE' }, '*')")

            for frame_idx in range(total_frames):
                progress = frame_idx / max(1, total_frames - 1)
                await page.evaluate(
                    f"window.postMessage({{ type: 'STUDIO_SEEK', progress: {progress} }}, '*')"
                )
                frame_path = frames_dir / f"frame_{frame_idx:05d}.jpg"
                await page.screenshot(path=str(frame_path), type="jpeg", quality=92)

            await browser.close()

        output_mp4 = tmp_path / "output.mp4"
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-framerate",
            str(fps),
            "-i",
            str(frames_dir / "frame_%05d.jpg"),
        ]

        if audio_file and audio_file.exists():
            ffmpeg_cmd.extend(["-i", str(audio_file), "-shortest"])

        # Intentar codificación por hardware NVENC (GPU L4) con fallback a libx264
        nvenc_cmd = ffmpeg_cmd + [
            "-c:v",
            "h264_nvenc",
            "-preset",
            "p4",
            "-b:v",
            "8M",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(output_mp4),
        ]

        proc = subprocess.run(nvenc_cmd, capture_output=True)
        if proc.returncode != 0:
            cpu_cmd = ffmpeg_cmd + [
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "20",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                str(output_mp4),
            ]
            subprocess.run(cpu_cmd, check=True)

        mp4_b64 = base64.b64encode(output_mp4.read_bytes()).decode("utf-8")
        return {
            "success": True,
            "mp4Base64": mp4_b64,
            "durationSeconds": duration,
            "fps": fps,
            "width": width,
            "height": height,
        }
