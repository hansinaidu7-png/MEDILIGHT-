import React from 'react';
import { AlarmClock, BellRing, Check, X } from 'lucide-react';
import { Medicine } from '../types/medicine';
import { formatTime12h } from '../utils/scheduleUtils';
import { MediLightLogo } from './MediLightLogo';

interface ReminderModalProps {
  medicine: Medicine | null;
  onMarkTaken: (id: string) => void;
  onRemindLater: (id: string) => void;
  onDismiss: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  medicine,
  onMarkTaken,
  onRemindLater,
  onDismiss,
}) => {
  if (!medicine) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div className="w-full max-w-lg rounded-3xl border-2 border-[#D8B4FE] bg-[#12111A] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <MediLightLogo size={48} />
            <div>
              <p className="inline-flex items-center gap-2 text-base font-bold text-[#FDE68A]">
                <BellRing className="h-5 w-5" aria-hidden="true" />
                <span>Medicine Reminder</span>
              </p>
              <p className="font-mono text-base text-[#C7C2D6] tabular-nums">
                Scheduled for {formatTime12h(medicine.time)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close reminder popup"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#C4B5FD]/25 bg-[#1C1A29] text-[#C7C2D6] transition-colors hover:text-[#F8F7FC]"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="my-6 rounded-2xl border border-[#C4B5FD]/20 bg-[#1B1927] p-5">
          <p className="text-base font-medium text-[#C7C2D6]">Time to take your medicine:</p>
          <h2
            id="reminder-modal-title"
            className="mt-1 font-display text-3xl font-extrabold text-[#F8F7FC]"
          >
            {medicine.name}
          </h2>
          <p className="mt-2 text-2xl font-bold text-[#D8B4FE]">{medicine.dosage}</p>
          {medicine.notes && (
            <p className="mt-3 text-lg leading-relaxed text-[#E4E0F0]">{medicine.notes}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onMarkTaken(medicine.id)}
            className="inline-flex min-h-[58px] flex-1 items-center justify-center gap-2.5 rounded-2xl bg-[#D8B4FE] px-6 py-4 text-xl font-bold text-[#09090D] transition-colors hover:bg-[#E9D5FF] active:scale-[0.98]"
          >
            <Check className="h-6 w-6 stroke-[2.75]" aria-hidden="true" />
            <span>Mark as Taken</span>
          </button>

          <button
            type="button"
            onClick={() => onRemindLater(medicine.id)}
            className="inline-flex min-h-[58px] flex-1 items-center justify-center gap-2.5 rounded-2xl border border-[#C4B5FD]/35 bg-[#1E1C2B] px-6 py-4 text-lg font-bold text-[#F8F7FC] transition-colors hover:bg-[#2A273B] active:scale-[0.98]"
          >
            <AlarmClock className="h-6 w-6 text-[#D8B4FE]" aria-hidden="true" />
            <span>Remind Me Later (10 min)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
