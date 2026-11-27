import { Medicine } from '../types/medicine';
import { getTodayDateKey } from './scheduleUtils';

const MEDICINES_STORAGE_KEY = 'medilight_medicines_v1';
const INITIALIZED_STORAGE_KEY = 'medilight_initialized_v1';
const SOUND_STORAGE_KEY = 'medilight_sound_enabled_v1';

export function createSampleMedicines(): Medicine[] {
  const today = getTodayDateKey();
  const nowIso = new Date().toISOString();

  return [
    {
      id: 'sample-lisinopril',
      name: 'Lisinopril',
      dosage: '10 mg',
      time: '08:00',
      frequency: 'Every day',
      startDate: today,
      notes: 'Blood pressure · Take with a full glass of water',
      takenDates: { [today]: nowIso },
      createdAt: nowIso,
    },
    {
      id: 'sample-vitamin-d',
      name: 'Vitamin D3',
      dosage: '1000 IU',
      time: '09:00',
      frequency: 'Every day',
      startDate: today,
      notes: 'Bone strength · Take after breakfast',
      takenDates: {},
      createdAt: nowIso,
    },
    {
      id: 'sample-metformin',
      name: 'Metformin',
      dosage: '500 mg',
      time: '13:00',
      frequency: 'Every day',
      startDate: today,
      notes: 'Take with lunch to prevent stomach upset',
      takenDates: {},
      createdAt: nowIso,
    },
    {
      id: 'sample-atorvastatin',
      name: 'Atorvastatin',
      dosage: '20 mg',
      time: '21:00',
      frequency: 'Every day',
      startDate: today,
      notes: 'Cholesterol · Take before bedtime',
      takenDates: {},
      createdAt: nowIso,
    },
  ];
}

export function loadMedicines(): Medicine[] {
  try {
    const initialized = localStorage.getItem(INITIALIZED_STORAGE_KEY);
    const raw = localStorage.getItem(MEDICINES_STORAGE_KEY);

    if (!initialized) {
      const samples = createSampleMedicines();
      localStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(samples));
      localStorage.setItem(INITIALIZED_STORAGE_KEY, 'true');
      return samples;
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return createSampleMedicines();
  }
}

export function saveMedicines(medicines: Medicine[]): void {
  try {
    localStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(medicines));
    localStorage.setItem(INITIALIZED_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetToSampleMedicines(): Medicine[] {
  const samples = createSampleMedicines();
  saveMedicines(samples);
  return samples;
}

export function loadSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}
