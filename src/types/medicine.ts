export type MedicineFrequency =
  | 'Every day'
  | 'Twice daily'
  | 'Every other day'
  | 'Weekly'
  | 'As needed';

export type DoseStatus = 'Completed' | 'Due' | 'Upcoming';

export type AppScreen = 'home' | 'add' | 'schedule';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string; // 24-hour format "HH:mm"
  frequency: MedicineFrequency;
  startDate: string; // "YYYY-MM-DD"
  endDate?: string; // Optional "YYYY-MM-DD"
  notes?: string;
  takenDates: Record<string, string>; // key: "YYYY-MM-DD", value: ISO timestamp
  snoozedUntil?: number; // Epoch ms for "Remind Me Later"
  createdAt: string;
}

export interface ParsedVoiceMedicine {
  name: string;
  dosage: string;
  time: string;
  frequency: MedicineFrequency;
  rawTranscript: string;
  warnings: string[];
}
