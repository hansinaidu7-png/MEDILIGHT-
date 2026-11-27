import React from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  Mic,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DoseStatus, Medicine } from '../types/medicine';
import {
  formatClockTime,
  formatFullDate,
  formatTime12h,
  getGreeting,
  getMedicineStatus,
  getTodayDateKey,
  isMedicineActiveOnDate,
  sortMedicinesByTime,
} from '../utils/scheduleUtils';
import { MedicineCard } from './MedicineCard';

interface HomeDashboardProps {
  medicines: Medicine[];
  now: Date;
  notificationPermission: NotificationPermission | 'unsupported';
  soundEnabled: boolean;
  onRequestNotifications: () => void;
  onToggleSound: () => void;
  onTestReminder: () => void;
  onAddManual: () => void;
  onAddVoice: () => void;
  onToggleTaken: (id: string) => void;
  onSnooze: (id: string) => void;
  onEditMedicine: (medicine: Medicine) => void;
  onViewSchedule: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  medicines,
  now,
  notificationPermission,
  soundEnabled,
  onRequestNotifications,
  onToggleSound,
  onTestReminder,
  onAddManual,
  onAddVoice,
  onToggleTaken,
  onSnooze,
  onEditMedicine,
  onViewSchedule,
}) => {
  const todayKey = getTodayDateKey(now);
  const todaysMedicines = sortMedicinesByTime(
    medicines.filter((m) => isMedicineActiveOnDate(m, todayKey))
  );

  const itemsWithStatus: Array<{ medicine: Medicine; status: DoseStatus }> = todaysMedicines.map(
    (medicine) => ({
      medicine,
      status: getMedicineStatus(medicine, now),
    })
  );

  const completedCount = itemsWithStatus.filter((i) => i.status === 'Completed').length;
  const dueCount = itemsWithStatus.filter((i) => i.status === 'Due').length;
  const upcomingCount = itemsWithStatus.filter((i) => i.status === 'Upcoming').length;
  const pendingCount = dueCount + upcomingCount;

  const nextPriorityItem =
    itemsWithStatus.find((i) => i.status === 'Due') ||
    itemsWithStatus.find((i) => i.status === 'Upcoming') ||
    null;

  return (
    <div className="space-y-8">
      {/* Welcome & Current Date/Time Section */}
      <section className="rounded-3xl border border-[#C4B5FD]/20 bg-[#12111A] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5 max-w-2xl">
            <p className="inline-flex items-center gap-2 text-base font-semibold text-[#D8B4FE]">
              <Calendar className="h-5 w-5" aria-hidden="true" />
              <span>{formatFullDate(now)}</span>
              <span aria-hidden="true" className="text-[#78718C]">
                ·
              </span>
              <span className="font-mono text-lg text-[#F8F7FC] tabular-nums">
                {formatClockTime(now)}
              </span>
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F8F7FC] sm:text-4xl [text-wrap:balance]">
              {getGreeting(now)}. Let&apos;s keep your medicines on track.
            </h1>
            <p className="text-lg leading-relaxed text-[#C7C2D6]">
              {todaysMedicines.length === 0
                ? 'You have no medicines scheduled for today. Tap Add Medicine to get started.'
                : pendingCount === 0
                  ? 'All of your medicines for today are complete. Great job staying consistent.'
                  : `You have ${pendingCount} medicine ${pendingCount === 1 ? 'dose' : 'doses'} left today and ${completedCount} completed.`}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row shrink-0">
            <button
              type="button"
              onClick={onAddVoice}
              className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-[#D8B4FE] px-6 py-3.5 text-lg font-bold text-[#09090D] whitespace-nowrap transition-colors hover:bg-[#E9D5FF] active:scale-[0.98]"
            >
              <Mic className="h-6 w-6 stroke-[2.25]" aria-hidden="true" />
              <span>Add by Voice</span>
            </button>

            <button
              type="button"
              onClick={onAddManual}
              className="inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-2xl border border-[#C4B5FD]/35 bg-[#1B1927] px-6 py-3.5 text-lg font-bold text-[#F8F7FC] whitespace-nowrap transition-colors hover:bg-[#262336] active:scale-[0.98]"
            >
              <Plus className="h-6 w-6 text-[#D8B4FE]" aria-hidden="true" />
              <span>Add Manually</span>
            </button>
          </div>
        </div>

        {/* Daily Progress Summary */}
        <div className="mt-7 grid grid-cols-1 gap-4 border-t border-[#C4B5FD]/15 pt-6 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-[#4ADE80]/25 bg-[#122219] px-5 py-4">
            <div>
              <p className="text-base font-semibold text-[#86EFAC]">Completed Today</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-[#F8F7FC] tabular-nums">
                {completedCount}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-[#86EFAC]" aria-hidden="true" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[#FBBF24]/30 bg-[#221B11] px-5 py-4">
            <div>
              <p className="text-base font-semibold text-[#FDE68A]">Due Now</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-[#F8F7FC] tabular-nums">
                {dueCount}
              </p>
            </div>
            <BellRing className="h-8 w-8 text-[#FDE68A]" aria-hidden="true" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[#C4B5FD]/25 bg-[#181624] px-5 py-4">
            <div>
              <p className="text-base font-semibold text-[#E9D5FF]">Upcoming Today</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-[#F8F7FC] tabular-nums">
                {upcomingCount}
              </p>
            </div>
            <Clock className="h-8 w-8 text-[#E9D5FF]" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Next Reminder & Browser Alert Controls */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Upcoming / Due Next Highlight */}
        <div className="rounded-3xl border border-[#C4B5FD]/20 bg-[#12111A] p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-bold text-[#F8F7FC]">
              Next Medicine Reminder
            </h2>
            <button
              type="button"
              onClick={onViewSchedule}
              className="min-h-[44px] px-2 text-base font-semibold text-[#D8B4FE] underline-offset-4 hover:underline whitespace-nowrap"
            >
              Full Schedule
            </button>
          </div>

          {nextPriorityItem ? (
            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-[#D8B4FE]/30 bg-[#1A1826] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <p className="text-base font-semibold text-[#D8B4FE]">
                  {nextPriorityItem.status === 'Due' ? 'Due Now' : 'Coming Up Next'} ·{' '}
                  <span className="font-mono text-[#F8F7FC] tabular-nums">
                    {formatTime12h(nextPriorityItem.medicine.time)}
                  </span>
                </p>
                <p className="font-display text-2xl font-extrabold text-[#F8F7FC]">
                  {nextPriorityItem.medicine.name}{' '}
                  <span className="font-semibold text-[#D8B4FE]">
                    {nextPriorityItem.medicine.dosage}
                  </span>
                </p>
                {nextPriorityItem.medicine.notes && (
                  <p className="text-base text-[#C7C2D6]">{nextPriorityItem.medicine.notes}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onToggleTaken(nextPriorityItem.medicine.id)}
                className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D8B4FE] px-5 py-3 text-lg font-bold text-[#09090D] whitespace-nowrap transition-colors hover:bg-[#E9D5FF]"
              >
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <span>Mark as Taken</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-[#4ADE80]/25 bg-[#122219] p-5">
              <p className="text-lg font-semibold text-[#86EFAC]">
                {todaysMedicines.length > 0
                  ? 'All doses for today have been completed.'
                  : 'No reminders scheduled yet for today.'}
              </p>
            </div>
          )}
        </div>

        {/* Honest Reminder & Permission Panel */}
        <div className="rounded-3xl border border-[#C4B5FD]/20 bg-[#12111A] p-6 lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-[#F8F7FC]">
              Reminder Alerts
            </h2>
            <p className="text-base leading-relaxed text-[#C7C2D6]">
              {notificationPermission === 'granted'
                ? 'Browser notifications are enabled. Alerts appear with sound and on-screen prompts while MEDILIGHT is open in your browser.'
                : notificationPermission === 'denied'
                  ? 'Browser notifications are currently blocked in your browser settings. On-screen alerts and sound chimes still work while MEDILIGHT is open.'
                  : notificationPermission === 'unsupported'
                    ? 'This browser does not support system notifications. On-screen reminder popups and chimes will still alert you while MEDILIGHT is open.'
                    : 'Allow browser notifications so MEDILIGHT can alert you promptly at medicine time while this app is open.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {notificationPermission === 'default' && (
              <button
                type="button"
                onClick={onRequestNotifications}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#D8B4FE] px-4 py-2.5 text-base font-bold text-[#09090D] whitespace-nowrap transition-colors hover:bg-[#E9D5FF]"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span>Enable Notifications</span>
              </button>
            )}

            {notificationPermission === 'granted' && (
              <span className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#4ADE80]/30 bg-[#122219] px-4 py-2.5 text-base font-semibold text-[#86EFAC]">
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span>Alerts Active</span>
              </span>
            )}

            {notificationPermission === 'denied' && (
              <span className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#FBBF24]/30 bg-[#221B11] px-4 py-2.5 text-base font-semibold text-[#FDE68A]">
                <BellOff className="h-5 w-5" aria-hidden="true" />
                <span>Browser Blocked</span>
              </span>
            )}

            <button
              type="button"
              onClick={onToggleSound}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#C4B5FD]/30 bg-[#1B1927] px-4 py-2.5 text-base font-semibold text-[#F8F7FC] whitespace-nowrap transition-colors hover:bg-[#262336]"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-5 w-5 text-[#D8B4FE]" aria-hidden="true" />
                  <span>Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-5 w-5 text-[#B4AEC8]" aria-hidden="true" />
                  <span>Sound Off</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onTestReminder}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#C4B5FD]/30 bg-[#1B1927] px-4 py-2.5 text-base font-semibold text-[#E9D5FF] whitespace-nowrap transition-colors hover:bg-[#262336]"
            >
              <BellRing className="h-5 w-5" aria-hidden="true" />
              <span>Test Alert</span>
            </button>
          </div>
        </div>
      </section>

      {/* Today's Medication Schedule */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold text-[#F8F7FC] sm:text-3xl">
            Today&apos;s Medication Schedule
          </h2>
          <p className="text-base font-medium text-[#C7C2D6] tabular-nums">
            {todaysMedicines.length} {todaysMedicines.length === 1 ? 'medicine' : 'medicines'} today
          </p>
        </div>

        {itemsWithStatus.length === 0 ? (
          <div className="rounded-3xl border border-[#C4B5FD]/20 bg-[#12111A] p-8 text-center">
            <h3 className="font-display text-2xl font-bold text-[#F8F7FC]">
              No medicines scheduled for today
            </h3>
            <p className="mx-auto mt-2 max-w-md text-lg text-[#C7C2D6]">
              Add your daily vitamins or prescriptions manually or simply by speaking aloud.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={onAddVoice}
                className="inline-flex min-h-[54px] items-center gap-2.5 rounded-2xl bg-[#D8B4FE] px-6 py-3 text-lg font-bold text-[#09090D] hover:bg-[#E9D5FF]"
              >
                <Mic className="h-5 w-5" aria-hidden="true" />
                <span>Speak to Add Medicine</span>
              </button>
              <button
                type="button"
                onClick={onAddManual}
                className="inline-flex min-h-[54px] items-center gap-2.5 rounded-2xl border border-[#C4B5FD]/30 bg-[#1B1927] px-6 py-3 text-lg font-bold text-[#F8F7FC] hover:bg-[#262336]"
              >
                <Plus className="h-5 w-5 text-[#D8B4FE]" aria-hidden="true" />
                <span>Enter Manually</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {itemsWithStatus.map(({ medicine, status }) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                status={status}
                onToggleTaken={onToggleTaken}
                onSnooze={onSnooze}
                onEdit={onEditMedicine}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
