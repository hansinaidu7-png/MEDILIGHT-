import { MedicineFrequency, ParsedVoiceMedicine } from '../types/medicine';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toTitleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^(d3|b12|b6|c|d|e|k2|iu|xr|er|sr)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function parseVoiceMedicineTranscript(rawTranscript: string): ParsedVoiceMedicine {
  const warnings: string[] = [];
  let working = rawTranscript.trim();

  // 1. Extract frequency
  let frequency: MedicineFrequency = 'Every day';
  const frequencyPatterns: Array<{ regex: RegExp; value: MedicineFrequency }> = [
    { regex: /\b(twice\s+(?:a\s+day|daily)|two\s+times\s+(?:a\s+day|daily)|2\s+times\s+daily)\b/i, value: 'Twice daily' },
    { regex: /\b(every\s+other\s+day|alternate\s+days?)\b/i, value: 'Every other day' },
    { regex: /\b(once\s+a\s+week|every\s+week|weekly)\b/i, value: 'Weekly' },
    { regex: /\b(as\s+needed|when\s+needed)\b/i, value: 'As needed' },
    { regex: /\b(every\s+day|everyday|daily|once\s+daily|each\s+day|every\s+morning|every\s+night|every\s+evening)\b/i, value: 'Every day' },
  ];

  for (const fp of frequencyPatterns) {
    const match = working.match(fp.regex);
    if (match) {
      frequency = fp.value;
      // Preserve morning/evening hint if embedded in "every morning" / "every night"
      if (/every\s+morning/i.test(match[0]) && !/\d/.test(working)) {
        working = working.replace(fp.regex, ' at 8 AM ');
      } else if (/every\s+(night|evening)/i.test(match[0]) && !/\d/.test(working)) {
        working = working.replace(fp.regex, ' at 8 PM ');
      } else {
        working = working.replace(fp.regex, ' ');
      }
      break;
    }
  }

  // 2. Extract time
  let time = '09:00';
  let foundTime = false;

  // Match "at noon" or "at midnight"
  const specialTimeMatch = working.match(/\b(?:at\s+)?(noon|midday|midnight)\b/i);
  if (specialTimeMatch) {
    const word = specialTimeMatch[1].toLowerCase();
    time = word === 'midnight' ? '00:00' : '12:00';
    foundTime = true;
    working = working.replace(specialTimeMatch[0], ' ');
  }

  // Match standard time like "at 9 AM", "at 8:30 PM", "9:15 a.m.", "at 7 in the evening", "at 21:00"
  if (!foundTime) {
    const timeRegex =
      /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm|o'clock)?(?:\s+in\s+the\s+(morning|afternoon|evening|night))?\b/i;
    // Try matching with explicit AM/PM or colon or "at" prefix so we don't grab dosage numbers like "500 mg"
    const strictTimeRegex =
      /\b(?:(?:at|around|by)\s+(\d{1,2})(?::(\d{2}))?(?:\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm|o'clock))?(?:\s+in\s+the\s+(morning|afternoon|evening|night))?|(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)|(\d{1,2}):(\d{2}))\b/i;

    const match = working.match(strictTimeRegex);
    if (match) {
      const hourRaw = Number(match[1] ?? match[5] ?? match[8]);
      const minRaw = Number(match[2] ?? match[6] ?? match[9] ?? '0');
      const ampmRaw = (match[3] ?? match[7] ?? '').replace(/\./g, '').replace(/\s+/g, '').toLowerCase();
      const periodWord = (match[4] ?? '').toLowerCase();

      if (!Number.isNaN(hourRaw) && hourRaw >= 0 && hourRaw <= 23 && minRaw >= 0 && minRaw <= 59) {
        let hour = hourRaw;
        if (ampmRaw === 'pm' && hour < 12) {
          hour += 12;
        } else if (ampmRaw === 'am' && hour === 12) {
          hour = 0;
        } else if (!ampmRaw && periodWord) {
          if ((periodWord === 'afternoon' || periodWord === 'evening' || periodWord === 'night') && hour < 12) {
            hour += 12;
          } else if (periodWord === 'morning' && hour === 12) {
            hour = 0;
          }
        }
        time = `${pad2(hour)}:${pad2(minRaw)}`;
        foundTime = true;
        working = working.replace(match[0], ' ');
      }
    } else {
      // Fallback check for bare timeRegex only if it has am/pm
      const fallbackMatch = working.match(timeRegex);
      if (fallbackMatch && fallbackMatch[3]) {
        let hour = Number(fallbackMatch[1]);
        const min = Number(fallbackMatch[2] ?? '0');
        const ampm = fallbackMatch[3].replace(/\./g, '').toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        time = `${pad2(hour)}:${pad2(min)}`;
        foundTime = true;
        working = working.replace(fallbackMatch[0], ' ');
      }
    }
  }

  if (!foundTime) {
    warnings.push('No specific time was heard — defaulted to 9:00 AM. Please check the time.');
  }

  // 3. Extract dosage (e.g., "500 mg", "1000 IU", "2 tablets", "10 milligrams", "5 ml")
  let dosage = '';
  const dosageRegex =
    /\b(\d+(?:\.\d+)?)\s*(mg|milligrams?|mcg|micrograms?|g|grams?|iu|ml|milliliters?|tablets?|tabs?|pills?|capsules?|caps?|drops?|puffs?|units?)\b/i;
  const dosageMatch = working.match(dosageRegex);
  if (dosageMatch) {
    let unit = dosageMatch[2].toLowerCase();
    if (unit.startsWith('milligram')) unit = 'mg';
    else if (unit.startsWith('microgram')) unit = 'mcg';
    else if (unit.startsWith('gram')) unit = 'g';
    else if (unit.startsWith('milliliter')) unit = 'ml';
    else if (unit === 'iu') unit = 'IU';
    else if (unit === 'tab' || unit === 'tabs') unit = Number(dosageMatch[1]) === 1 ? 'tablet' : 'tablets';
    else if (unit === 'cap' || unit === 'caps') unit = Number(dosageMatch[1]) === 1 ? 'capsule' : 'capsules';

    dosage = `${dosageMatch[1]} ${unit}`;
    working = working.replace(dosageMatch[0], ' ');
  } else {
    dosage = '1 tablet';
    warnings.push('No dosage amount was heard — set to "1 tablet". You can adjust it below.');
  }

  // 4. Clean up remaining text to obtain medicine name
  const fillerPhrases = [
    /\b(?:please\s+)?remind\s+me\s+(?:to\s+)?(?:take\s+)?/gi,
    /\bi\s+(?:need|have)\s+to\s+take\b/gi,
    /\badd\s+(?:a\s+)?(?:medicine|medication|pill|reminder)\s*(?:for|to|called)?\b/gi,
    /\bschedule\s+(?:my\s+)?/gi,
    /\btake\s+(?:my\s+)?/gi,
    /\bof\s+/gi,
    /\bmy\s+/gi,
    /\bat\s*$/gi,
    /[.,!?;:]+/g,
  ];

  for (const phrase of fillerPhrases) {
    working = working.replace(phrase, ' ');
  }

  const cleanedName = toTitleCase(working.replace(/\s+/g, ' ').trim());

  if (!cleanedName) {
    warnings.push('Could not clearly identify the medicine name. Please type it below.');
  }

  return {
    name: cleanedName,
    dosage,
    time,
    frequency,
    rawTranscript,
    warnings,
  };
}
