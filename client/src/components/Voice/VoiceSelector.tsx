import { useState, useEffect, type FC } from 'react';

interface Voice {
    id: string;
    name: string;
    description: string;
    language: string;
    gender: string;
}

interface VoiceSelectorProps {
    selectedVoice: string;
    onVoiceChange: (voiceId: string) => void;
    className?: string;
}

const VoiceSelector: FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceChange, className = '' }) => {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Fetch available voices from API
        fetch('/api/voice/voices')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.voices) {
                    setVoices(data.voices);
                    const index = data.voices.findIndex((v: Voice) => v.id === selectedVoice);
                    if (index >= 0) {
                        setCurrentIndex(index);
                    }
                }
            })
            .catch(error => {
                console.error('[VoiceSelector] Error fetching voices:', error);
            });
    }, [selectedVoice]);

    const handlePrevious = () => {
        const newIndex = (currentIndex - 1 + voices.length) % voices.length;
        setCurrentIndex(newIndex);
        onVoiceChange(voices[newIndex].id);
    };

    const handleNext = () => {
        const newIndex = (currentIndex + 1) % voices.length;
        setCurrentIndex(newIndex);
        onVoiceChange(voices[newIndex].id);
    };

    const currentVoice = voices[currentIndex];

    if (!currentVoice) {
        return null;
    }

    return (
        <div className={`flex flex-col items-center space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-text-primary">
                Selecciona una voz
            </h3>

            <div className="flex items-center space-x-4">
                {/* Previous button */}
                <button
                    onClick={handlePrevious}
                    className="p-2 rounded-full hover:bg-surface-hover transition-colors"
                    aria-label="Voz anterior"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-text-secondary"
                    >
                        <path
                            d="M15 18l-6-6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                {/* Voice info */}
                <div className="flex flex-col items-center min-w-[200px]">
                    <div className="text-xl font-semibold text-text-primary mb-1">
                        {currentVoice.name}
                    </div>
                    <div className="text-sm text-text-secondary">
                        {currentVoice.description}
                    </div>
                </div>

                {/* Next button */}
                <button
                    onClick={handleNext}
                    className="p-2 rounded-full hover:bg-surface-hover transition-colors"
                    aria-label="Siguiente voz"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-text-secondary"
                    >
                        <path
                            d="M9 18l6-6-6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            {/* Voice indicators */}
            <div className="flex space-x-2">
                {voices.map((voice, index) => (
                    <button
                        key={voice.id}
                        onClick={() => {
                            setCurrentIndex(index);
                            onVoiceChange(voice.id);
                        }}
                        className={`h-2 rounded-full transition-all ${index === currentIndex
                                ? 'w-8 bg-blue-500'
                                : 'w-2 bg-text-tertiary hover:bg-text-secondary'
                            }`}
                        aria-label={`Seleccionar ${voice.name}`}
                    />
                ))}
            </div>

            <button
                onClick={() => onVoiceChange(currentVoice.id)}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
            >
                Listo
            </button>
        </div>
    );
};

export default VoiceSelector;
