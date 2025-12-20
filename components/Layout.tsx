import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode } from '../types';
import { Settings, Users, Calendar, LogOut, Baby, Lock, X, Delete, ShieldCheck, HelpCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode, setMode, settings, updateSettings } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showExitModal, setShowExitModal] = useState(false);
  const [modalView, setModalView] = useState<'PIN' | 'RECOVERY'>('PIN');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryError, setRecoveryError] = useState(false);

  const isHighContrast = settings.highContrast;

  const mainWrapperClass = isHighContrast 
    ? 'min-h-screen bg-black text-cyan-300 selection:bg-cyan-700 selection:text-white'
    : 'min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-primary selection:text-white flex flex-col';

  const headerClass = isHighContrast
    ? 'bg-black border-b-2 border-cyan-400 sticky top-0 z-40'
    : 'bg-white border-b sticky top-0 z-40 shadow-sm';

  const navClass = isHighContrast
    ? 'fixed bottom-0 left-0 right-0 bg-black border-t-2 border-cyan-400 p-2 z-40'
    : 'fixed bottom-0 left-0 right-0 bg-white border-t p-2 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]';

  const navItemClass = (path: string) => {
      const active = location.pathname === path;
      if (isHighContrast) {
          return `flex flex-col items-center p-2 rounded-xl border-2 transition-all ${active ? 'bg-cyan-400 text-black font-bold border-white' : 'text-cyan-200 border-transparent hover:border-cyan-400'}`;
      }
      return `flex flex-col items-center p-2 rounded-xl transition-all ${active ? 'bg-brand-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`;
  };

  const handleModeSwitchRequest = () => {
    if (mode === UserMode.ADULT) {
      setMode(UserMode.CHILD);
      navigate('/'); 
    } else {
      setEnteredPin('');
      setPinError(false);
      setModalView('PIN');
      setShowExitModal(true);
    }
  };

  return (
    <div className={mainWrapperClass}>
      {/* Región aria-live para anuncios globales */}
      <div className="sr-only" aria-live="polite" id="accessibility-announcer"></div>

      <header className={headerClass} role="banner">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
             {isHighContrast ? (
                 <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-cyan-400 text-black flex items-center justify-center font-bold rounded-lg text-xl" aria-hidden="true">NV</div>
                    <span className="font-bold text-xl text-cyan-300">NeuroVisual</span>
                 </div>
             ) : (
                 <Link to="/" className="flex items-center -ml-2" aria-label="Ir al inicio de NeuroVisual">
                    <Logo className="w-48 h-16" showText={true} />
                 </Link>
             )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleModeSwitchRequest}
              aria-label={mode === UserMode.CHILD ? 'Salir del Modo Niño' : 'Cambiar al Modo Niño'}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-sm active:scale-95 ${
                mode === UserMode.CHILD 
                  ? (isHighContrast ? 'bg-red-600 text-white border-2 border-white' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 ring-2 ring-red-100')
                  : (isHighContrast ? 'bg-cyan-400 text-black hover:bg-cyan-300' : 'bg-indigo-600 text-white hover:bg-indigo-700')
              }`}
            >
              {mode === UserMode.CHILD ? <LogOut size={18} aria-hidden="true"/> : <Baby size={20} aria-hidden="true" />}
              {mode === UserMode.CHILD ? 'Salir' : 'Modo Niño'}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 pb-24 flex flex-col" role="main">
        {children}
      </main>

      <nav className={navClass} aria-label="Navegación principal">
        <ul className="max-w-md mx-auto flex justify-around items-center list-none p-0 m-0">
            <li>
                <Link to="/" className={navItemClass('/')} aria-current={location.pathname === '/' ? 'page' : undefined}>
                    <Calendar size={24} aria-hidden="true" />
                    <span className="text-xs font-bold mt-1">Agenda</span>
                </Link>
            </li>
            <li>
                <Link to="/people" className={navItemClass('/people')} aria-current={location.pathname === '/people' ? 'page' : undefined}>
                    <Users size={24} aria-hidden="true" />
                    <span className="text-xs font-bold mt-1">Personas</span>
                </Link>
            </li>
            {mode === UserMode.ADULT && (
                <li>
                    <Link to="/settings" className={navItemClass('/settings')} aria-current={location.pathname === '/settings' ? 'page' : undefined}>
                        <Settings size={24} aria-hidden="true" />
                        <span className="text-xs font-bold mt-1">Ajustes</span>
                    </Link>
                </li>
            )}
        </ul>
      </nav>

      {/* Modal PIN con mejoras de foco */}
      {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-labelledby="modal-title" aria-modal="true">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-xs w-full text-center border-4 border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                      <button onClick={() => setShowExitModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full" aria-label="Cerrar modal">
                          <X size={20} />
                      </button>
                      <h3 id="modal-title" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Lock size={18} className="text-brand-primary" aria-hidden="true" /> Acceso Adulto
                      </h3>
                      <div className="w-9" />
                  </div>
                  
                  {modalView === 'PIN' ? (
                      <div role="group" aria-label="Ingreso de PIN de 4 dígitos">
                        <div className="flex justify-center gap-4 mb-8" aria-hidden="true">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < enteredPin.length ? (pinError ? 'bg-red-500 scale-110' : 'bg-brand-primary scale-110') : 'bg-slate-200'}`} />
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'spacer', 0, 'delete'].map((val, idx) => {
                                if (val === 'spacer') return <div key={idx} className="h-14" />;
                                if (val === 'delete') return (
                                    <button key={idx} onClick={() => setEnteredPin(prev => prev.slice(0, -1))} className="h-14 w-full rounded-2xl bg-red-50 text-red-500 flex items-center justify-center" aria-label="Borrar último número">
                                        <Delete size={24} />
                                    </button>
                                );
                                return (
                                    <button key={idx} onClick={() => {
                                        if (enteredPin.length < 4) {
                                            const newPin = enteredPin + val;
                                            setEnteredPin(newPin);
                                            if (newPin.length === 4) {
                                                if (newPin === settings.pin) {
                                                    setMode(UserMode.ADULT);
                                                    setShowExitModal(false);
                                                } else {
                                                    setPinError(true);
                                                    setTimeout(() => { setEnteredPin(''); setPinError(false); }, 1000);
                                                }
                                            }
                                        }
                                    }} className="h-14 w-full rounded-2xl bg-slate-50 text-xl font-bold text-slate-700 border border-slate-200" aria-label={`Número ${val}`}>
                                        {val}
                                    </button>
                                );
                            })}
                        </div>
                      </div>
                  ) : null}
              </div>
          </div>
      )}
    </div>
  );
};