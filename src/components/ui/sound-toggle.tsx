'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SoundToggleProps {
  className?: string;
}

export default function SoundToggle({ className = '' }: SoundToggleProps) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Carregar preferência do localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('notification-sound-enabled');
    if (savedPreference !== null) {
      setIsSoundEnabled(savedPreference === 'true');
    }
  }, []);

  // Salvar preferência no localStorage
  const toggleSound = () => {
    const newValue = !isSoundEnabled;
    setIsSoundEnabled(newValue);
    localStorage.setItem('notification-sound-enabled', String(newValue));
  };

  return (
    <button
      onClick={toggleSound}
      className={`p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 ${className}`}
      title={isSoundEnabled ? 'Desligar som de notificação' : 'Ligar som de notificação'}
      type="button"
    >
      {isSoundEnabled ? (
        <Volume2 className="w-5 h-5 text-green-600" />
      ) : (
        <VolumeX className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );
}

