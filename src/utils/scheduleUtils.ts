import { DoseStatus, Medicine } from '../types/medicine';

export function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime12h(time24: string): string {
  const [hourStr, minuteStr] = time24.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time24;
  }
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateKey: string): string {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function timeToMinutes(time24: string): number {
  const [h, m] = time24.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function isMedicineActiveOnDate(medicine: Medicine, dateKey: string): boolean {
  if (medicine.startDate && dateKey < medicine.startDate) {
    return false;
  }
  if (medicine.endDate && dateKey > medicine.endDate) {
    return false;
  }

  if (medicine.frequency === 'Every other day' && medicine.startDate) {
    const start = new Date(`${medicine.startDate}T00:00:00`);
    const current = new Date(`${dateKey}T00:00:00`);
    const diffDays = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays % 2 === 0;
  }

  if (medicine.frequency === 'Weekly' && medicine.startDate) {
    const start = new Date(`${medicine.startDate}T00:00:00`);
    const current = new Date(`${dateKey}T00:00:00`);
    return start.getDay() === current.getDay();
  }

  return true;
}

export function getMedicineStatus(medicine: Medicine, now: Date = new Date()): DoseStatus {
  const todayKey = getTodayDateKey(now);
  if (medicine.takenDates[todayKey]) {
    return 'Completed';
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledMinutes = timeToMinutes(medicine.time);

  // Due if within 15 minutes before or anytime after scheduled time today
  if (nowMinutes >= scheduledMinutes - 15) {
    return 'Due';
  }

  return 'Upcoming';
}

export function getTimePeriod(time24: string): 'Morning' | 'Afternoon' | 'Evening' | 'Night' {
  const [hour] = time24.split(':').map(Number);
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

export function sortMedicinesByTime(medicines: Medicine[]): Medicine[] {
  return [...medicines].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}
