import React from 'react';
import { AlarmClock, BellRing, Check, CheckCircle2, Clock, Pencil, RotateCcw } from 'lucide-react';
import { DoseStatus, Medicine } from '../types/medicine';
import { formatTime12h } from '../utils/scheduleUtils';

interface MedicineCardProps {
  medicine: Medicine;
  status: DoseStatus;
  onToggleTaken: (id: string) => void;
  onSnooze: (id: string) => void;
  onEdit: (medicine: Medicine) => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  status,
  onToggleTaken,
  onSnooze,
  onEdit,
}) => {
  const isCompleted = status === 'Completed';
  const isDue = status === 'Due';
  const isSnoozed = Boolean(medicine.snoozedUntil && medicine.snoozedUntil > Date.now());

  const statusConfig = {
    Completed: {
      icon: CheckCircle2,
      label: 'Completed',
      textClass: 'text-[#86EFAC]',
      surfaceClass: 'bg-[#122219] border-[#4ADE80]/30',
    },
    Due: {
      icon: BellRing,
      label: isSnoozed ? 'Snoozed (10m)' : 'Due Now',
      textClass: 'text-[#FDE68A]',
      surfaceClass: 'bg-[#221B11] border-[#FBBF24]/45',
    },
    Upcoming: {
      icon: Clock,
      label: 'Upcoming',
      textClass: 'text-[#E9D5FF]',
      surfaceClass: 'bg-[#161420] border-[#C4B5FD]/25',
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <article
      className={`rounded-2xl border p-5 sm:p-6 transition-colors ${statusConfig.surfaceClass}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Time, Medicine Name, Dosage & Notes */}
        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Status & Time line — unboxed clean typography with icon + explicit text */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-semibold">
            <span className={`inline-flex items-center gap-2 ${statusConfig.textClass}`}>
              <StatusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{statusConfig.label}</span>
            </span>
            <span aria-hidden="true" className="text-[#78718C]">
              ·
            </span>
            <span className="font-mono text-lg font-semibold text-[#F8F7FC] tabular-nums">
              {formatTime12h(medicine.time)}
            </span>
            <span aria-hidden="true" className="text-[#78718C]">
              ·
            </span>
            <span className="text-[#C7C2D6]">{medicine.frequency}</span>
          </div>

          {/* Medicine Name & Dosage */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3
              className={`font-display text-2xl font-bold tracking-tight ${
                isCompleted ? 'text-[#C7C2D6]' : 'text-[#F8F7FC]'
              }`}
            >
              {medicine.name}
            </h3>
            <span className="text-xl font-semibold text-[#D8B4FE]">{medicine.dosage}</span>
          </div>

          {medicine.notes && (
            <p className="text-base leading-relaxed text-[#C7C2D6]">{medicine.notes}</p>
          )}
        </div>

        {/* Right: Large, high-contrast senior-friendly action buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={() => onToggleTaken(medicine.id)}
                className="inline-flex min-h-[52px] flex-1 sm:flex-none items-center justify-center gap-2.5 rounded-xl bg-[#D8B4FE] px-6 py-3 text-lg font-bold text-[#09090D] whitespace-nowrap transition-colors hover:bg-[#E9D5FF] active:scale-[0.98]"
              >
                <Check className="h-5 w-5 stroke-[2.75]" aria-hidden="true" />
                <span>Mark as Taken</span>
              </button>

              {isDue && (
                <button
                  type="button"
                  onClick={() => onSnooze(medicine.id)}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-[#C4B5FD]/35 bg-[#1F1C2C] px-4 py-3 text-base font-semibold text-[#F8F7FC] whitespace-nowrap transition-colors hover:bg-[#2B263D] active:scale-[0.98]"
                >
                  <AlarmClock className="h-5 w-5 text-[#D8B4FE]" aria-hidden="true" />
                  <span>Remind Later</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => onToggleTaken(medicine.id)}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-[#4ADE80]/40 bg-[#183022] px-5 py-3 text-base font-semibold text-[#86EFAC] whitespace-nowrap transition-colors hover:bg-[#1E3B2A] active:scale-[0.98]"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              <span>Undo Taken</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(medicine)}
            aria-label={`Edit ${medicine.name}`}
            className="inline-flex min-h-[52px] min-w-[52px] items-center justify-center gap-2 rounded-xl border border-[#C4B5FD]/25 bg-[#161521] px-4 py-3 text-base font-semibold text-[#C7C2D6] whitespace-nowrap transition-colors hover:border-[#D8B4FE]/50 hover:text-[#F8F7FC]"
          >
            <Pencil className="h-5 w-5" aria-hidden="true" />
            <span className="sm:hidden">Edit</span>
          </button>
        </div>
      </div>
    </article>
  );
};
