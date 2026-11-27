# MEDILIGHT — Accessible Medicine Reminder Application

MEDILIGHT is a senior-friendly, accessible medicine reminder web application designed in a high-contrast **Black & Lavender** palette featuring the MEDILIGHT **heart-shaped two-tablet logo**. It helps elderly users manage daily medications independently using large readable typography, effortless touch targets, voice-assisted medicine entry, and reliable local persistence.

---

## Key Features

- **Home Dashboard**
  - Friendly time-of-day welcome message, current date, and live clock.
  - Daily progress summary showing **Completed Today**, **Due Now**, and **Upcoming Today** counts.
  - **Next Medicine Reminder** highlight with one-tap **Mark as Taken**.
  - **Today's Medication Schedule** displaying medicine name, dosage, scheduled time, frequency, and explicit icon + text status (`Completed`, `Due Now`, or `Upcoming`).
- **Voice-Assisted & Manual Add Medicine**
  - **Voice Input**: Uses the browser's Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) to transcribe natural phrases such as `"Remind me to take Vitamin D 1000 IU at 9 AM every day"`, automatically extracting the medicine name, dosage, time, and frequency for review and editing before saving.
  - **Manual Input**: Clean, oversized inputs with quick dosage chips (`1 tablet`, `500 mg`, `1000 IU`), quick time presets (`Morning`, `Noon`, `Evening`, `Bedtime`), start/optional end dates, and helpful notes.
  - Automatic fallback guidance when microphone permissions are denied or speech recognition is unavailable.
- **Medicine Schedule & Management**
  - Daily routine overview grouped into **Morning**, **Afternoon**, **Evening**, and **Night**.
  - Search and filter (`All`, `Upcoming / Due`, `Completed`).
  - Edit medicines and safe two-step delete confirmation to prevent accidental removals.
  - Caregiver utility to restore sample medicines anytime.
- **Live Reminder System & Local Persistence**
  - Saves all medicines, daily taken logs, snooze timers, and sound preferences to `localStorage` so data persists across browser reloads.
  - In-app **Medicine Reminder** popup with **Mark as Taken** and **Remind Me Later (10 min)** options, gentle Web Audio chime, and optional Browser Notifications (active while MEDILIGHT is open in the browser).
  - Includes a **Test Alert** button on the Home Dashboard to preview reminders immediately.

---

## Project Structure

```text
├── index.html                      # Entry HTML, Google Fonts, and metadata
├── metadata.json                   # App metadata & microphone permission declaration
├── package.json                    # Dependencies and npm scripts
├── src/
│   ├── App.tsx                     # Root app state, live reminder loop, and screen routing
│   ├── index.css                   # Tailwind CSS v4 config, high-contrast focus rings, reduced motion
│   ├── main.tsx                    # React mount point
│   ├── types/
│   │   └── medicine.ts             # TypeScript interfaces for medicines and voice parsing
│   ├── utils/
│   │   ├── scheduleUtils.ts        # Date/time formatting, dose status, and active-date logic
│   │   ├── sound.ts                # Gentle Web Audio API reminder chime
│   │   ├── storage.ts              # localStorage persistence and sample medicines
│   │   └── voiceParser.ts          # Natural language parser for spoken reminders
│   └── components/
│       ├── AddMedicineView.tsx     # Screen 2: Voice + Manual add/edit medicine form
│       ├── HomeDashboard.tsx       # Screen 1: Dashboard, status summary, and today's doses
│       ├── MediLightLogo.tsx       # Custom SVG logo of two tablets forming a heart
│       ├── MedicineCard.tsx        # High-contrast senior-friendly medication card
│       ├── Navbar.tsx              # Responsive top navigation bar and mobile thumb bar
│       ├── ReminderModal.tsx       # Live reminder alert modal
│       └── ScheduleView.tsx        # Screen 3: Daily routine overview and medicine directory
```

---

## Installation & Running Locally

### Prerequisites
- Node.js **18+** and `npm`

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in a modern browser (Chrome, Edge, or Safari recommended for full Web Speech API voice recognition support).

### 3. Type-Check & Build for Production
```bash
npm run lint
npm run build
```
The production-ready static bundle is output to `dist/`. You can preview it locally with:
```bash
npm run preview
```

---

## Deployment

Because MEDILIGHT stores user schedules locally in the browser (`localStorage`) with zero required backend database, you can deploy the built `dist/` folder directly to any static hosting provider:
- **Vercel / Netlify / Cloudflare Pages**: Set build command to `npm run build` and publish directory to `dist`.
- **GitHub Pages**: Build with `npm run build` and publish the `dist/` artifact.

> **Important Note on Browser Notifications:** Browser notifications and audio chimes work reliably while MEDILIGHT is open in your browser. If you close the browser tab completely, browser-only web apps cannot fire scheduled alarms without an external push server or native mobile app.
