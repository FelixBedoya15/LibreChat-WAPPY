import { useEffect, useRef, type FC } from 'react';

interface VoiceOrbProps {
    status: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';
    amplitude?: number; // 0-1 for audio amplitude
    className?: string;
}

const VoiceOrb: FC<VoiceOrbProps> = ({ status, amplitude = 0.5, className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();
    const phaseRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const centerX = size / 2;
        const centerY = size / 2;

        const animate = () => {
            ctx.clearRect(0, 0, size, size);

            phaseRef.current += 0.02;
            const phase = phaseRef.current;

            // Base radius and dynamic amplitude
            const baseRadius = 80;
            const dynamicRadius = baseRadius + (amplitude * 30 * Math.sin(phase));

            // Color gradients based on status
            let gradient: CanvasGradient;

            if (status === 'idle') {
                // Gentle purple/blue gradient
                gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
                gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)'); // purple-600
                gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.6)'); // indigo-500
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)'); // blue-500
            } else if (status === 'listening') {
                // Blue gradient (user speaking)
                gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)'); // blue-500
                gradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.7)'); // blue-600
                gradient.addColorStop(1, 'rgba(29, 78, 216, 0.3)'); // blue-700
            } else if (status === 'thinking') {
                // Yellow/amber gradient (processing)
                gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
                gradient.addColorStop(0, 'rgba(251, 191, 36, 0.9)'); // amber-400
                gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.7)'); // amber-500
                gradient.addColorStop(1, 'rgba(217, 119, 6, 0.3)'); // amber-600
            } else if (status === 'speaking') {
                // Green gradient (AI speaking)
                gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
                gradient.addColorStop(0, 'rgba(34, 197, 94, 0.9)'); // green-500
                gradient.addColorStop(0.5, 'rgba(22, 163, 74, 0.7)'); // green-600
                gradient.addColorStop(1, 'rgba(21, 128, 61, 0.3)'); // green-700
            }

            // Draw main orb
            ctx.fillStyle = gradient!;
            ctx.beginPath();
            ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw pulsing rings for active states
            if (status !== 'idle') {
                const ringCount = 3;
                for (let i = 0; i < ringCount; i++) {
                    const ringPhase = phase + (i * Math.PI * 2 / ringCount);
                    const ringRadius = dynamicRadius + 10 + (20 * Math.sin(ringPhase));
                    const opacity = 0.2 - (i * 0.05);

                    ctx.strokeStyle = status === 'listening' ? `rgba(59, 130, 246, ${opacity})` :
                        status === 'thinking' ? `rgba(251, 191, 36, ${opacity})` :
                            status === 'speaking' ? `rgba(34, 197, 94, ${opacity})` :
                                `rgba(147, 51, 234, ${opacity})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Draw audio waveform for speaking
            if (status === 'speaking' && amplitude > 0.1) {
                const waveCount = 8;
                for (let i = 0; i < waveCount; i++) {
                    const angle = (Math.PI * 2 * i / waveCount) + phase;
                    const distance = dynamicRadius + 20 + (amplitude * 40 * Math.sin(phase * 3));
                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;

                    ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [status, amplitude]);

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <canvas
                ref={canvasRef}
                className="max-w-full h-auto"
                style={{ width: '300px', height: '300px' }}
            />
        </div>
    );
};

export default VoiceOrb;
