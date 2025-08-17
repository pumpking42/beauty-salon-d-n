import React from 'react';
import { View } from '../types';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { WalletIcon } from './icons/WalletIcon';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  const navButtonClass = (view: View) => 
    `flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${
      currentView === view 
      ? 'bg-teal-500 text-white shadow-md' 
      : 'bg-white text-slate-600 hover:bg-teal-100'
    }`;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <ScissorsIcon className="h-8 w-8 text-teal-600" />
            <h1 className="text-2xl font-bold text-slate-800">Salon POS Pro</h1>
          </div>
          <nav className="flex items-center gap-2">
            <button onClick={() => setCurrentView(View.POS)} className={navButtonClass(View.POS)} aria-label="Caja">
              <ScissorsIcon className="h-5 w-5" />
              <span>Caja</span>
            </button>
            <button onClick={() => setCurrentView(View.Reports)} className={navButtonClass(View.Reports)} aria-label="Reportes">
              <CalendarIcon className="h-5 w-5" />
              <span>Reportes</span>
            </button>
            <button onClick={() => setCurrentView(View.Payroll)} className={navButtonClass(View.Payroll)} aria-label="Nómina">
              <WalletIcon className="h-5 w-5" />
              <span>Nómina</span>
            </button>
            <button onClick={() => setCurrentView(View.Settings)} className={navButtonClass(View.Settings)} aria-label="Configuración">
              <SettingsIcon className="h-5 w-5" />
              <span>Ajustes</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};