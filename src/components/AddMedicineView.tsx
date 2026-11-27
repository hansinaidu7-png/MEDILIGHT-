import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Keyboard,
  Mic,
  MicOff,
  Sparkles,
} from 'lucide-react';
import { Medicine, MedicineFrequency } from '../types/medicine';
import { formatTime12h, getTodayDateKey } from '../utils/scheduleUtils';
import { parseVoiceMedicineTranscript } from '../utils/voiceParser';

interface AddMedicineViewProps {
  initialMode?: 'manual' | 'voice';
  editingMedicine: Medicine | null;
  onSave: (data: Omit<Medicine, 'id' | 'takenDates' | 'createdAt'>) => void;
  onCancel: () => void;
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const FREQUENCIES: MedicineFrequency[] = [
  'Every day',
  'Twice daily',
  'Every other day',
  'Weekly',
  'As needed',
];

const QUICK_TIMES = [
  { label: 'Morning · 8:00 AM', value: '08:00' },
  { label: 'Noon · 12:00 PM', value: '12:00' },
  { label: 'Evening · 6:00 PM', value: '18:00' },
  { label: 'Bedtime · 9:00 PM', value: '21:00' },
];

const QUICK_DOSAGES = ['1 tablet', '2 tablets', '10 mg', '20 mg', '500 mg', '1000 IU'];

const VOICE_EXAMPLES = [
  'Remind me to take Vitamin D 1000 IU at 9 AM every day',
  'Take Metformin 500 mg at 1:30 PM daily',
  'Atorvastatin 20 mg at 9 PM every day',
];

export const AddMedicineView: React.FC<AddMedicineViewProps> = ({
  initialMode = 'voice',
  editingMedicine,
  onSave,
  onCancel,
}) => {
  const [inputMode, setInputMode] = useState<'voice' | 'manual'>(
    editingMedicine ? 'manual' : initialMode
  );

  // Form fields
  const [name, setName] = useState(editingMedicine?.name ?? '');
  const [dosage, setDosage] = useState(editingMedicine?.dosage ?? '');
  const [time, setTime] = useState(editingMedicine?.time ?? '09:00');
  const [frequency, setFrequency] = useState<MedicineFrequency>(
    editingMedicine?.frequency ?? 'Every day'
  );
  const [startDate, setStartDate] = useState(editingMedicine?.startDate ?? getTodayDateKey());
  const [endDate, setEndDate] = useState(editingMedicine?.endDate ?? '');
  const [notes, setNotes] = useState(editingMedicine?.notes ?? '');
  const [formError, setFormError] = useState('');

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceWarnings, setVoiceWarnings] = useState<string[]>([]);
  const [voiceError, setVoiceError] = useState('');
  const [voiceParsedReady, setVoiceParsedReady] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );

  useEffect(() => {
    setInputMode(editingMedicine ? 'manual' : initialMode);
  }, [initialMode, editingMedicine]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup stop errors
        }
      }
    };
  }, []);

  const applyParsedTranscript = (spokenText: string) => {
    const parsed = parseVoiceMedicineTranscript(spokenText);
    setName(parsed.name);
    setDosage(parsed.dosage);
    setTime(parsed.time);
    setFrequency(parsed.frequency);
    setVoiceWarnings(parsed.warnings);
    setVoiceParsedReady(true);
    setFormError('');
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    setIsListening(false);
  };

  const startVoiceRecognition = async () => {
    setVoiceError('');
    setVoiceWarnings([]);

    if (!speechSupported) {
      setVoiceError(
        'Voice recognition is not supported in this browser. Please switch to Manual Input below or use Chrome, Edge, or Safari.'
      );
      return;
    }

    // Check / request microphone permission explicitly when MediaDevices is available
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        setVoiceError(
          'Microphone permission was denied. Please allow microphone access in your browser or use Manual Input instead.'
        );
        return;
      }
    }

    const SpeechRecognitionCtor =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionInstance;
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceError('Speech recognition is unavailable. Please use Manual Input.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      let latestText = '';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setVoiceParsedReady(false);
      };

      recognition.onresult = (event) => {
        let combined = '';
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          combined += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            hasFinal = true;
          }
        }
        latestText = combined.trim();
        setTranscript(latestText);
        if (hasFinal && latestText) {
          applyParsedTranscript(latestText);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError(
            'Microphone access was denied. Please enable microphone permission or use Manual Input below.'
          );
        } else if (event.error === 'no-speech') {
          setVoiceError(
            'No speech was heard. Tap the microphone button again and speak clearly, or switch to Manual Input.'
          );
        } else if (event.error === 'audio-capture') {
          setVoiceError(
            'No microphone was detected on this device. Please use Manual Input to type your medicine.'
          );
        } else {
          setVoiceError(
            'Voice recognition could not complete. Please try again or switch to Manual Input.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (latestText) {
          applyParsedTranscript(latestText);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError('Could not start voice recognition. Please use Manual Input instead.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDosage = dosage.trim();

    if (!trimmedName) {
      setFormError('Please enter the medicine name.');
      return;
    }
    if (!trimmedDosage) {
      setFormError('Please enter the dosage (for example: 1 tablet or 500 mg).');
      return;
    }
    if (!time) {
      setFormError('Please choose a reminder time.');
      return;
    }
    if (!startDate) {
      setFormError('Please choose a start date.');
      return;
    }
    if (endDate && endDate < startDate) {
      setFormError('End date cannot be earlier than the start date.');
      return;
    }

    onSave({
      name: trimmedName,
      dosage: trimmedDosage,
      time,
      frequency,
      startDate,
      endDate: endDate || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#C4B5FD]/25 bg-[#12111A] px-4 py-2.5 text-base font-semibold text-[#E9D5FF] hover:bg-[#1B1927]"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span>Back</span>
        </button>

        <h1 className="font-display text-3xl font-extrabold text-[#F8F7FC]">
          {editingMedicine ? `Edit ${editingMedicine.name}` : 'Add Medicine'}
        </h1>
      </div>

      {/* Mode Switcher (Voice Input vs Manual Input) — hidden while editing existing medicine */}
      {!editingMedicine && (
        <div
          role="tablist"
          aria-label="Choose how to enter your medicine"
          className="grid grid-cols-2 gap-3 rounded-2xl border border-[#C4B5FD]/20 bg-[#12111A] p-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'voice'}
            onClick={() => setInputMode('voice')}
            className={`flex min-h-[54px] items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-lg font-bold whitespace-nowrap transition-colors ${
              inputMode === 'voice'
                ? 'bg-[#D8B4FE] text-[#09090D]'
                : 'text-[#C7C2D6] hover:bg-[#1B1927] hover:text-[#F8F7FC]'
            }`}
          >
            <Mic className="h-5 w-5" aria-hidden="true" />
            <span>Voice Input</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'manual'}
            onClick={() => {
              stopListening();
              setInputMode('manual');
            }}
            className={`flex min-h-[54px] items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-lg font-bold whitespace-nowrap transition-colors ${
              inputMode === 'manual'
                ? 'bg-[#D8B4FE] text-[#09090D]'
                : 'text-[#C7C2D6] hover:bg-[#1B1927] hover:text-[#F8F7FC]'
            }`}
          >
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            <span>Manual Input</span>
          </button>
        </div>
      )}

      {/* VOICE INPUT PANEL */}
      {inputMode === 'voice' && !editingMedicine && (
        <section className="rounded-3xl border border-[#C4B5FD]/25 bg-[#12111A] p-6 sm:p-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-[#F8F7FC]">
              Speak Your Medicine Reminder
            </h2>
            <p className="mx-auto max-w-xl text-lg text-[#C7C2D6]">
              Tap the microphone button and say your medicine name, dose, and time naturally.
            </p>
          </div>

          {/* Large Accessible Microphone Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={isListening ? stopListening : startVoiceRecognition}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              className={`relative flex h-28 w-28 items-center justify-center rounded-full border-4 transition-transform active:scale-95 ${
                isListening
                  ? 'border-[#FDE68A] bg-[#D8B4FE] text-[#09090D] shadow-[0_0_0_12px_rgba(216,180,254,0.2)]'
                  : 'border-[#D8B4FE]/60 bg-[#D8B4FE] text-[#09090D] hover:bg-[#E9D5FF]'
              }`}
            >
              {isListening ? (
                <MicOff className="h-12 w-12 stroke-[2.25]" aria-hidden="true" />
              ) : (
                <Mic className="h-12 w-12 stroke-[2.25]" aria-hidden="true" />
              )}
            </button>

            <p className="text-xl font-bold text-[#E9D5FF]">
              {isListening ? 'Listening... Tap to stop' : 'Tap Microphone to Speak'}
            </p>
          </div>

          {/* Live Transcript Display */}
          {transcript && (
            <div className="rounded-2xl border border-[#C4B5FD]/25 bg-[#191724] p-4 text-left">
              <p className="text-sm font-semibold text-[#D8B4FE]">Heard Speech</p>
              <p className="mt-1 text-xl font-medium text-[#F8F7FC]">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}

          {/* Voice Error with Immediate Manual Fallback */}
          {voiceError && (
            <div
              role="alert"
              className="rounded-2xl border border-[#FBBF24]/40 bg-[#221B11] p-5 text-left space-y-3"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-[#FDE68A]" aria-hidden="true" />
                <p className="text-lg text-[#FDE68A]">{voiceError}</p>
              </div>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#D8B4FE] px-5 py-2.5 text-base font-bold text-[#09090D] hover:bg-[#E9D5FF]"
              >
                <Keyboard className="h-5 w-5" aria-hidden="true" />
                <span>Switch to Manual Entry</span>
              </button>
            </div>
          )}

          {/* Warnings from Parser */}
          {voiceWarnings.length > 0 && (
            <div className="rounded-2xl border border-[#C4B5FD]/30 bg-[#1B1927] p-4 text-left space-y-1">
              {voiceWarnings.map((warning) => (
                <p key={warning} className="text-base text-[#FDE68A]">
                  {warning}
                </p>
              ))}
            </div>
          )}

          {/* Helpful Example Phrases */}
          <div className="border-t border-[#C4B5FD]/15 pt-5 text-left space-y-3">
            <p className="text-base font-semibold text-[#C7C2D6]">
              Example phrases you can say (or tap one to try):
            </p>
            <div className="flex flex-wrap gap-2.5">
              {VOICE_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setTranscript(example);
                    applyParsedTranscript(example);
                  }}
                  className="min-h-[44px] rounded-xl border border-[#C4B5FD]/25 bg-[#191724] px-4 py-2 text-left text-base text-[#E9D5FF] transition-colors hover:border-[#D8B4FE] hover:bg-[#232034]"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONFIRMATION / MANUAL DETAILS FORM */}
      {(inputMode === 'manual' || voiceParsedReady || Boolean(editingMedicine)) && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border border-[#C4B5FD]/25 bg-[#12111A] p-6 sm:p-8 space-y-6"
        >
          {voiceParsedReady && inputMode === 'voice' && (
            <div className="flex items-start gap-3 rounded-2xl border border-[#4ADE80]/35 bg-[#122219] p-4">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#86EFAC]" aria-hidden="true" />
              <div>
                <p className="text-lg font-bold text-[#86EFAC]">
                  Recognized details ready to confirm
                </p>
                <p className="text-base text-[#C7C2D6]">
                  Please review the details below and make any edits before saving.
                </p>
              </div>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-2xl border border-[#F87171]/40 bg-[#2A1418] p-4 text-lg font-semibold text-[#FCA5A5]"
            >
              <AlertCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          {/* Medicine Name */}
          <div className="space-y-2">
            <label htmlFor="med-name" className="block text-lg font-bold text-[#F8F7FC]">
              Medicine Name <span className="text-[#D8B4FE]">*</span>
            </label>
            <input
              id="med-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFormError('');
              }}
              placeholder="For example: Vitamin D3 or Lisinopril"
              className="w-full min-h-[54px] rounded-xl border border-[#C4B5FD]/30 bg-[#1A1826] px-4 py-3 text-lg text-[#F8F7FC] placeholder-[#7C7594] focus:border-[#D8B4FE]"
            />
          </div>

          {/* Dosage + Quick Presets */}
          <div className="space-y-3">
            <label htmlFor="med-dosage" className="block text-lg font-bold text-[#F8F7FC]">
              Dosage <span className="text-[#D8B4FE]">*</span>
            </label>
            <input
              id="med-dosage"
              type="text"
              required
              value={dosage}
              onChange={(e) => {
                setDosage(e.target.value);
                setFormError('');
              }}
              placeholder="For example: 500 mg, 1 tablet, 1000 IU"
              className="w-full min-h-[54px] rounded-xl border border-[#C4B5FD]/30 bg-[#1A1826] px-4 py-3 text-lg text-[#F8F7FC] placeholder-[#7C7594] focus:border-[#D8B4FE]"
            />
            <div className="flex flex-wrap gap-2">
              {QUICK_DOSAGES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDosage(preset)}
                  className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-base font-semibold transition-colors ${
                    dosage === preset
                      ? 'border-[#D8B4FE] bg-[#D8B4FE] text-[#09090D]'
                      : 'border-[#C4B5FD]/25 bg-[#191724] text-[#E9D5FF] hover:bg-[#232034]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Time + Quick Presets */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor="med-time" className="block text-lg font-bold text-[#F8F7FC]">
                Reminder Time <span className="text-[#D8B4FE]">*</span>
              </label>
              <span className="font-mono text-base font-semibold text-[#D8B4FE] tabular-nums">
                {formatTime12h(time)}
              </span>
            </div>
            <input
              id="med-time"
              type="time"
              required
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setFormError('');
              }}
              className="w-full min-h-[54px] rounded-xl border border-[#C4B5FD]/30 bg-[#1A1826] px-4 py-3 font-mono text-xl text-[#F8F7FC] focus:border-[#D8B4FE]"
            />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {QUICK_TIMES.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTime(preset.value)}
                  className={`min-h-[46px] rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    time === preset.value
                      ? 'border-[#D8B4FE] bg-[#D8B4FE] text-[#09090D]'
                      : 'border-[#C4B5FD]/25 bg-[#191724] text-[#E9D5FF] hover:bg-[#232034]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2.5">
            <span className="block text-lg font-bold text-[#F8F7FC]">Frequency</span>
            <div className="flex flex-wrap gap-2.5">
              {FREQUENCIES.map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFrequency(freq)}
                  className={`min-h-[48px] rounded-xl border px-4 py-2.5 text-base font-semibold transition-colors ${
                    frequency === freq
                      ? 'border-[#D8B4FE] bg-[#D8B4FE] text-[#09090D]'
                      : 'border-[#C4B5FD]/25 bg-[#191724] text-[#E9D5FF] hover:bg-[#232034]'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date & Optional End Date */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="med-start" className="block text-lg font-bold text-[#F8F7FC]">
                Start Date <span className="text-[#D8B4FE]">*</span>
              </label>
              <input
                id="med-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[54px] rounded-xl border border-[#C4B5FD]/30 bg-[#1A1826] px-4 py-3 text-lg text-[#F8F7FC] focus:border-[#D8B4FE]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="med-end" className="block text-lg font-bold text-[#F8F7FC]">
                End Date <span className="font-normal text-[#B4AEC8]">(Optional)</span>
              </label>
              <input
                id="med-end"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[54px] rounded-xl border border-[#C4B5FD]/30 bg-[#1A1826] px-4 py-3 text-lg text-[#F8F7FC] focus:border-[#D8B4FE]"
              />
            </div>
          </div>

          {/* Optional Instructions */}
          <div className="space-y-2">
            <label htmlFor="med-notes" className="block text-lg font-bold text-[#F8F7FC]">
              Helpful Notes <span className="font-normal text-[#B4AEC8]">(Optional)</span>
            </label>
            <input
              id="med-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="For example: Take after breakfast with water"
              className="w-full min-h-[54px] rounded-xl border border-[#C4B5FD]/30 bg-[#1A1826] px-4 py-3 text-lg text-[#F8F7FC] placeholder-[#7C7594] focus:border-[#D8B4FE]"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-[#C4B5FD]/30 bg-[#1B1927] px-6 py-3 text-lg font-bold text-[#F8F7FC] hover:bg-[#262336]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-[#D8B4FE] px-8 py-3 text-lg font-bold text-[#09090D] hover:bg-[#E9D5FF] active:scale-[0.98]"
            >
              {voiceParsedReady ? (
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Check className="h-5 w-5 stroke-[2.75]" aria-hidden="true" />
              )}
              <span>{editingMedicine ? 'Save Changes' : 'Save Medicine Reminder'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
