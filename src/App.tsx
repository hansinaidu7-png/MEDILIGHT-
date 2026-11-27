import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AddMedicineView } from './components/AddMedicineView';
import { HomeDashboard } from './components/HomeDashboard';
import { MediLightLogo } from './components/MediLightLogo';
import { Navbar } from './components/Navbar';
import { ReminderModal } from './components/ReminderModal';
import { ScheduleView } from './components/ScheduleView';
import { AppScreen, Medicine } from './types/medicine';
import {
  formatTime12h,
  getTodayDateKey,
  isMedicineActiveOnDate,
  timeToMinutes,
} from './utils/scheduleUtils';
import { playReminderChime } from './utils/sound';
import {
  loadMedicines,
  loadSoundEnabled,
  resetToSampleMedicines,
  saveMedicines,
  saveSoundEnabled,
} from './utils/storage';

export default function App() {
  const [medicines, setMedicines] = useState<Medicine[]>(() => loadMedicines());
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [addMode, setAddMode] = useState<'manual' | 'voice'>('voice');
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundEnabled());
  const [activeReminder, setActiveReminder] = useState<Medicine | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string>('');

  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  const triggeredKeysRef = useRef<Set<string>>(new Set());
  const feedbackTimerRef = useRef<number | null>(null);

  const showFeedback = useCallback((message: string) => {
    setFeedbackBanner(message);
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedbackBanner('');
    }, 4500);
  }, []);

  // Persist medicines whenever updated
  useEffect(() => {
    saveMedicines(medicines);
  }, [medicines]);

  // Persist sound preference
  useEffect(() => {
    saveSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Keep live clock synced every 10 seconds
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const triggerReminderAlert = useCallback(
    (medicine: Medicine) => {
      setActiveReminder(medicine);
      if (soundEnabled) {
        playReminderChime();
      }
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(`MEDILIGHT Reminder: ${medicine.name}`, {
            body: `Time to take ${medicine.dosage} (scheduled for ${formatTime12h(medicine.time)}).`,
          });
        } catch {
          // Ignore Notification constructor errors in restricted contexts
        }
      }
    },
    [soundEnabled]
  );

  // Check for due reminders whenever clock ticks or medicines change
  useEffect(() => {
    if (activeReminder) return;

    const todayKey = getTodayDateKey(now);
    const nowMs = now.getTime();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (const med of medicines) {
      if (!isMedicineActiveOnDate(med, todayKey)) continue;
      if (med.takenDates[todayKey]) continue;

      if (med.snoozedUntil && nowMs < med.snoozedUntil) {
        continue;
      }

      const schedMinutes = timeToMinutes(med.time);
      const isWithinScheduleWindow =
        nowMinutes >= schedMinutes && nowMinutes <= schedMinutes + 180;
      const snoozeElapsed = Boolean(med.snoozedUntil && nowMs >= med.snoozedUntil);

      if (isWithinScheduleWindow || snoozeElapsed) {
        const triggerKey = `${todayKey}:${med.id}:${med.snoozedUntil ?? 'sched'}`;
        if (!triggeredKeysRef.current.has(triggerKey)) {
          triggeredKeysRef.current.add(triggerKey);
          triggerReminderAlert(med);
          break;
        }
      }
    }
  }, [now, medicines, activeReminder, triggerReminderAlert]);

  const handleRequestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      if (result === 'granted') {
        showFeedback('Browser notifications are now enabled.');
      } else if (result === 'denied') {
        showFeedback('Notifications blocked by browser. On-screen alerts remain active.');
      }
    } catch {
      showFeedback('Could not request notification permission in this browser.');
    }
  };

  const handleToggleTaken = (id: string) => {
    const todayKey = getTodayDateKey(now);
    let targetName = '';
    let markedAsTaken = false;

    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id !== id) return med;
        targetName = med.name;
        const nextTaken = { ...med.takenDates };
        if (nextTaken[todayKey]) {
          delete nextTaken[todayKey];
          markedAsTaken = false;
        } else {
          nextTaken[todayKey] = new Date().toISOString();
          markedAsTaken = true;
        }
        return {
          ...med,
          takenDates: nextTaken,
          snoozedUntil: undefined,
        };
      })
    );

    if (activeReminder?.id === id) {
      setActiveReminder(null);
    }

    if (targetName) {
      showFeedback(
        markedAsTaken
          ? `${targetName} marked as taken for today.`
          : `${targetName} moved back to pending.`
      );
    }
  };

  const handleSnooze = (id: string) => {
    const snoozeTarget = Date.now() + 10 * 60 * 1000;
    let targetName = '';

    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id !== id) return med;
        targetName = med.name;
        return {
          ...med,
          snoozedUntil: snoozeTarget,
        };
      })
    );

    if (activeReminder?.id === id) {
      setActiveReminder(null);
    }

    if (targetName) {
      showFeedback(`We will remind you again about ${targetName} in 10 minutes.`);
    }
  };

  const handleSaveMedicine = (data: Omit<Medicine, 'id' | 'takenDates' | 'createdAt'>) => {
    if (editingMedicine) {
      setMedicines((prev) =>
        prev.map((med) =>
          med.id === editingMedicine.id
            ? {
                ...med,
                ...data,
                snoozedUntil: undefined,
              }
            : med
        )
      );
      showFeedback(`Updated ${data.name} (${data.dosage} at ${formatTime12h(data.time)}).`);
      setEditingMedicine(null);
      setCurrentScreen('schedule');
      return;
    }

    const newMedicine: Medicine = {
      ...data,
      id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      takenDates: {},
      createdAt: new Date().toISOString(),
    };

    setMedicines((prev) => [...prev, newMedicine]);
    showFeedback(
      `Saved ${newMedicine.name} (${newMedicine.dosage}) for ${formatTime12h(newMedicine.time)}.`
    );
    setCurrentScreen('home');
  };

  const handleDeleteMedicine = (id: string) => {
    const target = medicines.find((m) => m.id === id);
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    if (activeReminder?.id === id) {
      setActiveReminder(null);
    }
    if (target) {
      showFeedback(`Deleted ${target.name} from your schedule.`);
    }
  };

  const handleTestReminder = () => {
    const todayKey = getTodayDateKey(now);
    const candidate =
      medicines.find((m) => isMedicineActiveOnDate(m, todayKey) && !m.takenDates[todayKey]) ||
      medicines[0] || {
        id: 'test-sample',
        name: 'Vitamin D3',
        dosage: '1000 IU',
        time: '09:00',
        frequency: 'Every day' as const,
        startDate: todayKey,
        notes: 'Sample reminder test · Take with water',
        takenDates: {},
        createdAt: new Date().toISOString(),
      };
    triggerReminderAlert(candidate);
  };

  const handleResetSamples = () => {
    const samples = resetToSampleMedicines();
    triggeredKeysRef.current.clear();
    setMedicines(samples);
    showFeedback('Sample medicines have been restored.');
  };

  const openAddScreen = (mode: 'manual' | 'voice') => {
    setEditingMedicine(null);
    setAddMode(mode);
    setCurrentScreen('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditScreen = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setAddMode('manual');
    setCurrentScreen('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090D] text-[#F8F7FC] pb-24 md:pb-12 flex flex-col">
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setEditingMedicine(null);
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAddNew={() => openAddScreen('voice')}
      />

      {/* High-contrast feedback banner for confirmations */}
      {feedbackBanner && (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-6 lg:px-8"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-[#4ADE80]/40 bg-[#122219] px-5 py-3.5 text-lg font-semibold text-[#86EFAC]">
            <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>{feedbackBanner}</span>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {currentScreen === 'home' && (
          <HomeDashboard
            medicines={medicines}
            now={now}
            notificationPermission={notificationPermission}
            soundEnabled={soundEnabled}
            onRequestNotifications={handleRequestNotifications}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            onTestReminder={handleTestReminder}
            onAddManual={() => openAddScreen('manual')}
            onAddVoice={() => openAddScreen('voice')}
            onToggleTaken={handleToggleTaken}
            onSnooze={handleSnooze}
            onEditMedicine={openEditScreen}
            onViewSchedule={() => {
              setCurrentScreen('schedule');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentScreen === 'add' && (
          <AddMedicineView
            initialMode={addMode}
            editingMedicine={editingMedicine}
            onSave={handleSaveMedicine}
            onCancel={() => {
              setEditingMedicine(null);
              setCurrentScreen('home');
            }}
          />
        )}

        {currentScreen === 'schedule' && (
          <ScheduleView
            medicines={medicines}
            now={now}
            onAddNew={() => openAddScreen('manual')}
            onEdit={openEditScreen}
            onDelete={handleDeleteMedicine}
            onToggleTaken={handleToggleTaken}
            onResetSamples={handleResetSamples}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-6xl border-t border-[#C4B5FD]/15 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-base text-[#B4AEC8]">
          <div className="flex items-center gap-2.5">
            <MediLightLogo size={28} />
            <span className="font-display font-bold text-[#F8F7FC]">MEDILIGHT</span>
            <span aria-hidden="true">·</span>
            <span>Senior-Friendly Medicine Reminders</span>
          </div>
          <p className="text-sm text-[#9A93B2]">
            Keep this tab open for live browser reminders. Saved locally on your device.
          </p>
        </div>
      </footer>

      <ReminderModal
        medicine={activeReminder}
        onMarkTaken={handleToggleTaken}
        onRemindLater={handleSnooze}
        onDismiss={() => setActiveReminder(null)}
      />
    </div>
  );
}
