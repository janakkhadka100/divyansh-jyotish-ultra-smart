'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';
import { useSpeechRecognition } from 'react-speech-recognition';
import { useSpeechSynthesis } from 'react-speech-kit';

interface VoiceInterfaceProps {
  onTranscript: (transcript: string) => void;
  onSpeak: (text: string) => void;
  language: 'ne' | 'hi' | 'en';
  isListening: boolean;
  isSpeaking: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStartSpeaking: () => void;
  onStopSpeaking: () => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onTranscript,
  onSpeak,
  language,
  isListening,
  isSpeaking,
  onStartListening,
  onStopListening,
  onStartSpeaking,
  onStopSpeaking,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 1,
  });

  const { speak, cancel, speaking, supported } = useSpeechSynthesis();
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const languageConfig = {
    ne: {
      recognition: 'ne-NP',
      synthesis: 'ne-NP',
      voices: ['ne-NP', 'hi-IN', 'en-US'],
    },
    hi: {
      recognition: 'hi-IN',
      synthesis: 'hi-IN',
      voices: ['hi-IN', 'ne-NP', 'en-US'],
    },
    en: {
      recognition: 'en-US',
      synthesis: 'en-US',
      voices: ['en-US', 'hi-IN', 'ne-NP'],
    },
  };

  const config = languageConfig[language];

  useEffect(() => {
    setIsSupported(browserSupportsSpeechRecognition && supported);
  }, [browserSupportsSpeechRecognition, supported]);

  useEffect(() => {
    if (finalTranscript) {
      onTranscript(finalTranscript);
      resetTranscript();
    }
  }, [finalTranscript, onTranscript, resetTranscript]);

  useEffect(() => {
    if (isListening && !listening) {
      onStartListening();
    } else if (!isListening && listening) {
      onStopListening();
    }
  }, [listening, isListening, onStartListening, onStopListening]);

  useEffect(() => {
    if (isSpeaking && !speaking) {
      onStartSpeaking();
    } else if (!isSpeaking && speaking) {
      onStopSpeaking();
    }
  }, [speaking, isSpeaking, onStartSpeaking, onStopSpeaking]);

  const handleStartListening = () => {
    if (isSupported) {
      onStartListening();
    }
  };

  const handleStopListening = () => {
    onStopListening();
  };

  const handleStartSpeaking = (text: string) => {
    if (supported) {
      setCurrentText(text);
      onSpeak(text);
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        config.voices.some(lang => voice.lang.startsWith(lang))
      ) || voices[0];

      speak({
        text,
        voice: preferredVoice,
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume,
        onEnd: () => {
          onStopSpeaking();
        },
      });
    }
  };

  const handleStopSpeaking = () => {
    cancel();
    onStopSpeaking();
  };

  const handlePauseSpeaking = () => {
    if (speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResumeSpeaking = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleReset = () => {
    resetTranscript();
    cancel();
    setCurrentText('');
    setIsPaused(false);
  };

  const handleVoiceSettingsChange = (setting: keyof typeof voiceSettings, value: number) => {
    setVoiceSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-700 dark:text-yellow-300 text-sm text-center">
          {language === 'ne' ? 'भ्वाइस सुविधा तपाईंको ब्राउजरमा समर्थित छैन।' :
           language === 'hi' ? 'वॉइस सुविधा आपके ब्राउज़र में समर्थित नहीं है।' :
           'Voice features are not supported in your browser.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Recognition Controls */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={isListening ? handleStopListening : handleStartListening}
          disabled={!isSupported}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4 mr-2" />
              {language === 'ne' ? 'सुन्न बन्द गर्नुहोस्' :
               language === 'hi' ? 'सुनना बंद करें' :
               'Stop Listening'}
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              {language === 'ne' ? 'सुन्न शुरू गर्नुहोस्' :
               language === 'hi' ? 'सुनना शुरू करें' :
               'Start Listening'}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={!transcript && !currentText}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {language === 'ne' ? 'रिसेट' :
           language === 'hi' ? 'रीसेट' :
           'Reset'}
        </Button>
      </div>

      {/* Voice Synthesis Controls */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant={isSpeaking ? "destructive" : "outline"}
          size="sm"
          onClick={isSpeaking ? handleStopSpeaking : () => handleStartSpeaking(currentText)}
          disabled={!supported || !currentText}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="h-4 w-4 mr-2" />
              {language === 'ne' ? 'बोल्न बन्द गर्नुहोस्' :
               language === 'hi' ? 'बोलना बंद करें' :
               'Stop Speaking'}
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4 mr-2" />
              {language === 'ne' ? 'बोल्न शुरू गर्नुहोस्' :
               language === 'hi' ? 'बोलना शुरू करें' :
               'Start Speaking'}
            </>
          )}
        </Button>

        {isSpeaking && (
          <Button
            variant="outline"
            size="sm"
            onClick={isPaused ? handleResumeSpeaking : handlePauseSpeaking}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                {language === 'ne' ? 'जारी राख्नुहोस्' :
                 language === 'hi' ? 'जारी रखें' :
                 'Resume'}
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                {language === 'ne' ? 'रोक्नुहोस्' :
                 language === 'hi' ? 'रोकें' :
                 'Pause'}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Voice Settings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {language === 'ne' ? 'दर' :
             language === 'hi' ? 'दर' :
             'Rate'}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceSettings.rate}
            onChange={(e) => handleVoiceSettingsChange('rate', parseFloat(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">{voiceSettings.rate}</span>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {language === 'ne' ? 'पिच' :
             language === 'hi' ? 'पिच' :
             'Pitch'}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceSettings.pitch}
            onChange={(e) => handleVoiceSettingsChange('pitch', parseFloat(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">{voiceSettings.pitch}</span>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {language === 'ne' ? 'भोल्युम' :
             language === 'hi' ? 'वॉल्यूम' :
             'Volume'}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={voiceSettings.volume}
            onChange={(e) => handleVoiceSettingsChange('volume', parseFloat(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">{Math.round(voiceSettings.volume * 100)}%</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="space-y-2">
        {isListening && (
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-sm">
              {language === 'ne' ? 'सुनिरहेको...' :
               language === 'hi' ? 'सुन रहा है...' :
               'Listening...'}
            </span>
          </div>
        )}

        {isSpeaking && (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-sm">
              {language === 'ne' ? 'बोलिरहेको...' :
               language === 'hi' ? 'बोल रहा है...' :
               'Speaking...'}
            </span>
          </div>
        )}

        {transcript && (
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            <span className="text-muted-foreground">
              {language === 'ne' ? 'सुनिएको:' :
               language === 'hi' ? 'सुना गया:' :
               'Heard:'}
            </span>
            <p className="mt-1">{transcript}</p>
          </div>
        )}

        {interimTranscript && (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
            <span className="text-muted-foreground">
              {language === 'ne' ? 'सुनिरहेको:' :
               language === 'hi' ? 'सुन रहा है:' :
               'Listening:'}
            </span>
            <p className="mt-1 italic">{interimTranscript}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface;



