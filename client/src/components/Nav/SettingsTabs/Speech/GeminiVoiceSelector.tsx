```javascript
import React from 'react';
import { Dropdown } from '@librechat/client';

interface GeminiVoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  label: string;
}

const GEMINI_VOICES = [
  { value: 'Aoede', label: 'Aoede (Femenina - Profunda)' },
  { value: 'Kore', label: 'Kore (Femenina - Relajada)' },
  { value: 'Leda', label: 'Leda (Femenina - Sofisticada)' },
  { value: 'Zephyr', label: 'Zephyr (Femenina - Enérgica)' },
  { value: 'Puck', label: 'Puck (Masculina - Juguetona)' },
  { value: 'Charon', label: 'Charon (Masculina - Autoritaria)' },
  { value: 'Fenrir', label: 'Fenrir (Masculina - Resonante)' },
  { value: 'Orus', label: 'Orus (Masculina - Segura)' },
];

export default function GeminiVoiceSelector({ selectedVoice, onVoiceChange, label }: GeminiVoiceSelectorProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-medium text-text-primary">{label}</div>
      <Dropdown
        value={selectedVoice}
        onChange={onVoiceChange}
        options={GEMINI_VOICES}
        sizeClasses="w-[200px]"
        className="z-50"
      />
    </div>
  );
}
```
