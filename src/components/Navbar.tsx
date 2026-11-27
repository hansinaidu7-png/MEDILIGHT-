import React from 'react';
import { CalendarDays, Home, Plus, PlusCircle } from 'lucide-react';
import { AppScreen } from '../types/medicine';
import { MediLightLogo } from './MediLightLogo';

interface NavbarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onAddNew: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onNavigate, onAddNew }) => {
  const navItems: Array<{ id: AppScreen; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'add', label: 'Add Medicine' },
    { id: 'schedule', label: 'Schedule' },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar — strict 3-zone layout */}
      <header className="sticky top-0 z-30 border-b border-[#C4B5FD]/15 bg-[#09090D]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Brand mark & wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex shrink-0 items-center gap-3 text-left whitespace-nowrap rounded-xl p-1 transition-opacity hover:opacity-90"
            aria-label="MEDILIGHT Home"
          >
            <MediLightLogo size={42} />
            <span className="font-display text-2xl font-extrabold tracking-tight text-[#F8F7FC]">
              MEDILIGHT
            </span>
          </button>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-8"
          >
            {navItems.map((item) => {
              const active = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => (item.id === 'add' ? onAddNew() : onNavigate(item.id))}
                  aria-current={active ? 'page' : undefined}
                  className={`relative min-h-[44px] px-2 py-2 text-lg font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'text-[#E9D5FF]'
                      : 'text-[#B4AEC8] hover:text-[#F8F7FC]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute right-1 bottom-0 left-1 h-1 rounded-full bg-[#D8B4FE]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action button */}
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D8B4FE] px-5 py-2.5 text-base font-bold text-[#09090D] whitespace-nowrap shadow-sm transition-colors hover:bg-[#E9D5FF] active:scale-[0.98]"
            >
              <Plus className="h-5 w-5 stroke-[2.75]" aria-hidden="true" />
              <span>Add Medicine</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar — ergonomic thumb zone (<=15% viewport height) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#C4B5FD]/20 bg-[#0F0E16]/95 backdrop-blur-md md:hidden"
      >
        <div className="grid h-18 grid-cols-3 items-center px-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-current={currentScreen === 'home' ? 'page' : undefined}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${
              currentScreen === 'home'
                ? 'bg-[#D8B4FE]/15 text-[#E9D5FF]'
                : 'text-[#B4AEC8] hover:text-[#F8F7FC]'
            }`}
          >
            <Home className="h-6 w-6" aria-hidden="true" />
            <span className="text-sm font-semibold whitespace-nowrap">Home</span>
          </button>

          <button
            type="button"
            onClick={onAddNew}
            aria-current={currentScreen === 'add' ? 'page' : undefined}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${
              currentScreen === 'add'
                ? 'bg-[#D8B4FE]/15 text-[#E9D5FF]'
                : 'text-[#B4AEC8] hover:text-[#F8F7FC]'
            }`}
          >
            <PlusCircle className="h-6 w-6" aria-hidden="true" />
            <span className="text-sm font-semibold whitespace-nowrap">Add</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('schedule')}
            aria-current={currentScreen === 'schedule' ? 'page' : undefined}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${
              currentScreen === 'schedule'
                ? 'bg-[#D8B4FE]/15 text-[#E9D5FF]'
                : 'text-[#B4AEC8] hover:text-[#F8F7FC]'
            }`}
          >
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
            <span className="text-sm font-semibold whitespace-nowrap">Schedule</span>
          </button>
        </div>
      </nav>
    </>
  );
};
