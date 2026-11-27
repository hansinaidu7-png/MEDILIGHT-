import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { Medicine } from '../types/medicine';
import {
  formatShortDate,
  formatTime12h,
  getMedicineStatus,
  getTimePeriod,
  getTodayDateKey,
  isMedicineActiveOnDate,
  sortMedicinesByTime,
} from '../utils/scheduleUtils';

interface ScheduleViewProps {
  medicines: Medicine[];
  now: Date;
  onAddNew: () => void;
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: string) => void;
  onToggleTaken: (id: string) => void;
  onResetSamples: () => void;
}

type FilterTab = 'all' | 'pending' | 'completed';

const PERIOD_ORDER: Array<'Morning' | 'Afternoon' | 'Evening' | 'Night'> = [
  'Morning',
  'Afternoon',
  'Evening',
  'Night',
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  medicines,
  now,
  onAddNew,
  onEdit,
  onDelete,
  onToggleTaken,
  onResetSamples,
}) => {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const todayKey = getTodayDateKey(now);
  const sorted = sortMedicinesByTime(medicines);

  const filteredMedicines = sorted.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchQuery.trim().toLowerCase());

    if (!matchesSearch) return false;

    const status = getMedicineStatus(med, now);
    if (filter === 'completed') return status === 'Completed';
    if (filter === 'pending') return status !== 'Completed';
    return true;
  });

  const todaysActive = sorted.filter((m) => isMedicineActiveOnDate(m, todayKey));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-[#F8F7FC]">
            Medicine Schedule
          </h1>
          <p className="mt-1 text-lg text-[#C7C2D6]">
            Review your daily routine, edit dosages, or remove medicines you no longer take.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#D8B4FE] px-6 py-3 text-lg font-bold text-[#09090D] whitespace-nowrap hover:bg-[#E9D5FF]"
        >
          <Plus className="h-5 w-5 stroke-[2.75]" aria-hidden="true" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Clear Daily Schedule Overview by Time of Day */}
      <section className="rounded-3xl border border-[#C4B5FD]/20 bg-[#12111A] p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold text-[#F8F7FC]">
            Daily Routine Overview
          </h2>
          <span className="text-base text-[#C7C2D6]">
            Active doses for today ({todaysActive.length})
          </span>
        </div>

        {todaysActive.length === 0 ? (
          <p className="text-lg text-[#C7C2D6]">No doses scheduled for today.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PERIOD_ORDER.map((period) => {
              const medsInPeriod = todaysActive.filter(
                (m) => getTimePeriod(m.time) === period
              );
              return (
                <div
                  key={period}
                  className="rounded-2xl border border-[#C4B5FD]/15 bg-[#191724] p-4 space-y-3"
                >
                  <h3 className="font-display text-lg font-bold text-[#D8B4FE]">{period}</h3>
                  {medsInPeriod.length === 0 ? (
                    <p className="text-base text-[#8C85A3]">No doses</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {medsInPeriod.map((m) => {
                        const status = getMedicineStatus(m, now);
                        const done = status === 'Completed';
                        return (
                          <li
                            key={m.id}
                            className="flex items-start justify-between gap-2 border-b border-[#C4B5FD]/10 pb-2 last:border-b-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p
                                className={`text-base font-bold truncate ${
                                  done ? 'text-[#86EFAC]' : 'text-[#F8F7FC]'
                                }`}
                              >
                                {m.name}
                              </p>
                              <p className="text-sm text-[#C7C2D6]">
                                {m.dosage} ·{' '}
                                <span className="font-mono tabular-nums">
                                  {formatTime12h(m.time)}
                                </span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onToggleTaken(m.id)}
                              aria-label={
                                done ? `Mark ${m.name} as not taken` : `Mark ${m.name} as taken`
                              }
                              className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border transition-colors ${
                                done
                                  ? 'border-[#4ADE80]/40 bg-[#122219] text-[#86EFAC]'
                                  : 'border-[#C4B5FD]/30 bg-[#221F31] text-[#E9D5FF] hover:bg-[#D8B4FE] hover:text-[#09090D]'
                              }`}
                            >
                              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Filter & Search Controls */}
      <section className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-[#C4B5FD]/20 bg-[#12111A] p-1.5">
            {(
              [
                { id: 'all', label: `All (${medicines.length})` },
                {
                  id: 'pending',
                  label: `Upcoming / Due (${
                    medicines.filter((m) => getMedicineStatus(m, now) !== 'Completed').length
                  })`,
                },
                {
                  id: 'completed',
                  label: `Completed (${
                    medicines.filter((m) => getMedicineStatus(m, now) === 'Completed').length
                  })`,
                },
              ] as Array<{ id: FilterTab; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[46px] rounded-xl px-4 py-2 text-base font-bold whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? 'bg-[#D8B4FE] text-[#09090D]'
                    : 'text-[#C7C2D6] hover:bg-[#1B1927] hover:text-[#F8F7FC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#B4AEC8]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicines..."
              aria-label="Search medicines"
              className="w-full min-h-[50px] rounded-xl border border-[#C4B5FD]/25 bg-[#12111A] pr-4 pl-11 text-base text-[#F8F7FC] placeholder-[#7C7594] focus:border-[#D8B4FE]"
            />
          </div>
        </div>

        {/* Full List of Saved Medicines */}
        {filteredMedicines.length === 0 ? (
          <div className="rounded-3xl border border-[#C4B5FD]/20 bg-[#12111A] p-8 text-center">
            <p className="text-xl font-bold text-[#F8F7FC]">No matching medicines found</p>
            <p className="mt-2 text-lg text-[#C7C2D6]">
              {medicines.length === 0
                ? 'Your medicine list is empty. Add your first medicine to begin.'
                : 'Try clearing your search or switching the filter above.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMedicines.map((med) => {
              const status = getMedicineStatus(med, now);
              const isCompleted = status === 'Completed';
              const confirmingDelete = confirmDeleteId === med.id;

              return (
                <article
                  key={med.id}
                  className="rounded-2xl border border-[#C4B5FD]/20 bg-[#12111A] p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-semibold">
                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            isCompleted
                              ? 'text-[#86EFAC]'
                              : status === 'Due'
                                ? 'text-[#FDE68A]'
                                : 'text-[#E9D5FF]'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <Clock className="h-5 w-5" aria-hidden="true" />
                          )}
                          <span>{status === 'Due' ? 'Due Now' : status}</span>
                        </span>
                        <span aria-hidden="true" className="text-[#78718C]">
                          ·
                        </span>
                        <span className="font-mono text-lg text-[#F8F7FC] tabular-nums">
                          {formatTime12h(med.time)}
                        </span>
                        <span aria-hidden="true" className="text-[#78718C]">
                          ·
                        </span>
                        <span className="text-[#C7C2D6]">{med.frequency}</span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-display text-2xl font-bold text-[#F8F7FC]">
                          {med.name}
                        </h3>
                        <span className="text-xl font-semibold text-[#D8B4FE]">{med.dosage}</span>
                      </div>

                      <p className="text-base text-[#B4AEC8]">
                        Starts {formatShortDate(med.startDate)}
                        {med.endDate ? ` · Ends ${formatShortDate(med.endDate)}` : ' · Ongoing'}
                      </p>

                      {med.notes && <p className="text-base text-[#C7C2D6]">{med.notes}</p>}
                    </div>

                    {/* Edit & Safe Delete Controls */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {!confirmingDelete ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(med)}
                            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-[#C4B5FD]/30 bg-[#1B1927] px-5 py-2.5 text-base font-bold text-[#F8F7FC] whitespace-nowrap hover:bg-[#272338]"
                          >
                            <Pencil className="h-5 w-5 text-[#D8B4FE]" aria-hidden="true" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(med.id)}
                            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-[#F87171]/35 bg-[#241418] px-5 py-2.5 text-base font-bold text-[#FCA5A5] whitespace-nowrap hover:bg-[#331B20]"
                          >
                            <Trash2 className="h-5 w-5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-[#F87171]/40 bg-[#241418] p-2.5">
                          <span className="px-2 text-base font-semibold text-[#FCA5A5]">
                            Delete {med.name}?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(med.id);
                              setConfirmDeleteId(null);
                            }}
                            className="min-h-[44px] rounded-xl bg-[#FCA5A5] px-4 py-2 text-base font-bold text-[#09090D] hover:bg-[#FECACA]"
                          >
                            Yes, Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[44px] rounded-xl border border-[#C4B5FD]/30 bg-[#1B1927] px-4 py-2 text-base font-semibold text-[#F8F7FC]"
                          >
                            Keep
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Caregiver / Demo Sample Reset Control */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#C4B5FD]/15 bg-[#12111A] p-5">
        <p className="text-base text-[#C7C2D6]">
          All changes are saved automatically on this device.
        </p>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#C4B5FD]/25 bg-[#1B1927] px-4 py-2 text-base font-semibold text-[#E9D5FF] hover:bg-[#262336]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Restore Sample Medicines</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-base font-semibold text-[#FDE68A]">
              Replace current list with sample data?
            </span>
            <button
              type="button"
              onClick={() => {
                onResetSamples();
                setConfirmReset(false);
              }}
              className="min-h-[44px] rounded-xl bg-[#D8B4FE] px-4 py-2 text-base font-bold text-[#09090D]"
            >
              Confirm Restore
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="min-h-[44px] rounded-xl border border-[#C4B5FD]/25 bg-[#1B1927] px-4 py-2 text-base font-semibold text-[#F8F7FC]"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
