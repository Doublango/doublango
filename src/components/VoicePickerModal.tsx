import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppSettings, TTSEngine } from '@/contexts/AppSettingsContext';
import { getAvailableVoices, speak, cancelSpeech } from '@/lib/tts';
import { useUserProgress } from '@/hooks/useUserProgress';

interface VoicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoicePickerModal: React.FC<VoicePickerModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { settings, setTTSEngine, setTTSVoiceURI } = useAppSettings();
  const { activeCourse } = useUserProgress();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  const languageCode = activeCourse?.language_code || 'es';

  useEffect(() => {
    if (!isOpen) return;

    const loadVoices = async () => {
      const allVoices = await getAvailableVoices();
      setVoices(allVoices);

      // Filter voices that match the current language
      const primaryLang = languageCode.split('-')[0].toLowerCase();
      const matching = allVoices.filter((v) => {
        const vLang = v.lang.toLowerCase();
        return vLang.startsWith(primaryLang) || vLang.includes(primaryLang);
      });
      setFilteredVoices(matching.length > 0 ? matching : allVoices.slice(0, 10));
    };

    loadVoices();

    return () => cancelSpeech();
  }, [isOpen, languageCode]);

  const handleTestVoice = async (voiceURI: string) => {
    setTestingVoice(voiceURI);
    try {
      await speak('Hello, this is a test.', languageCode, {
        engine: 'webspeech',
        voiceURI,
        rate: 0.9,
      });
    } catch {
      // ignore
    } finally {
      setTestingVoice(null);
    }
  };

  const handleTestProxy = async () => {
    setTestingVoice('proxy');
    try {
      await speak('Hello, this is a test.', languageCode, { engine: 'proxy', rate: 0.9 });
    } catch {
      // ignore
    } finally {
      setTestingVoice(null);
    }
  };

  const handleSelectEngine = (engine: TTSEngine) => {
    setTTSEngine(engine);
    if (engine === 'proxy') {
      setTTSVoiceURI(null);
    }
  };

  const handleSelectVoice = (voiceURI: string) => {
    setTTSEngine('webspeech');
    setTTSVoiceURI(voiceURI);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-slide-up">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('settings.voiceSettings', 'Voice Settings')}</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.chooseVoice', 'Choose how audio is played')}
          </p>

          {/* Engine Selection */}
          <div className="space-y-2 mb-6">
            <h3 className="font-medium text-sm mb-2">Engine</h3>
            <button
              onClick={() => handleSelectEngine('proxy')}
              className={cn(
                'w-full p-4 rounded-xl text-left flex items-center justify-between hover:bg-muted/50 transition-colors',
                settings.ttsEngine === 'proxy' && 'bg-primary/10 border-2 border-primary'
              )}
            >
              <div className="flex-1">
                <p className="font-medium">🌐 Cloud Voice (Recommended)</p>
                <p className="text-sm text-muted-foreground">Fast, reliable, works on all devices</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestProxy();
                  }}
                  disabled={testingVoice === 'proxy'}
                >
                  <Volume2 className={cn('w-4 h-4', testingVoice === 'proxy' && 'animate-pulse')} />
                </Button>
                {settings.ttsEngine === 'proxy' && <Check className="w-5 h-5 text-primary" />}
              </div>
            </button>

            <button
              onClick={() => handleSelectEngine('webspeech')}
              className={cn(
                'w-full p-4 rounded-xl text-left flex items-center justify-between hover:bg-muted/50 transition-colors',
                settings.ttsEngine === 'webspeech' && 'bg-primary/10 border-2 border-primary'
              )}
            >
              <div>
                <p className="font-medium">🗣️ Browser Voices</p>
                <p className="text-sm text-muted-foreground">Select from device voices below</p>
              </div>
              {settings.ttsEngine === 'webspeech' && <Check className="w-5 h-5 text-primary" />}
            </button>
          </div>

          {/* Voice Selection (only for webspeech) */}
          {settings.ttsEngine === 'webspeech' && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm mb-2">
                Available Voices ({filteredVoices.length})
              </h3>
              {filteredVoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No voices found for this language.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {filteredVoices.map((voice) => (
                    <button
                      key={voice.voiceURI}
                      onClick={() => handleSelectVoice(voice.voiceURI)}
                      className={cn(
                        'w-full p-3 rounded-lg text-left flex items-center justify-between hover:bg-muted/50 transition-colors text-sm',
                        settings.ttsVoiceURI === voice.voiceURI &&
                          'bg-primary/10 border border-primary'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{voice.name}</p>
                        <p className="text-xs text-muted-foreground">{voice.lang}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestVoice(voice.voiceURI);
                          }}
                          disabled={testingVoice === voice.voiceURI}
                        >
                          <Volume2
                            className={cn(
                              'w-4 h-4',
                              testingVoice === voice.voiceURI && 'animate-pulse'
                            )}
                          />
                        </Button>
                        {settings.ttsVoiceURI === voice.voiceURI && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={onClose} className="w-full mt-6">
            {t('common.done', 'Done')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoicePickerModal;
