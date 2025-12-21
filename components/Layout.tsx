
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode } from '../types';
import { Settings, Users, Calendar, LogOut, Baby, Lock, X, Delete, Sparkles, LayoutGrid, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode, setMode, settings } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showExitModal, setShowExitModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const isHighContrast = settings.highContrast;

  const handleModeSwitchRequest = () => {
    if (mode === UserMode.ADULT || mode === UserMode.EASY_ADULT) {
      setMode(UserMode.CHILD);
      navigate('/'); 
    } else {
      setEnteredPin('');
      setPinError(false);
      setShowExitModal(true);
    }
  };

  const cycleAdultMode = () => {
      if (mode === UserMode.ADULT) setMode(UserMode.EASY_ADULT);
      else if (mode === UserMode.EASY_ADULT) setMode(UserMode.ADULT);
  };

  return (
    <div className={`min-h-screen ${isHighContrast ? 'bg-black text-cyan-300' : 'bg-slate-50 text-slate-900'} flex flex-col`}>
      <header className={`sticky top-0 z-40 ${isHighContrast ? 'bg-black border-b-2 border-cyan-400' : 'bg-white border-b shadow-sm'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center -ml-2">
             <Logo className="w-40 h-12" showText={!isHighContrast} />
          </Link>

          <div className="flex items-center gap-3">
            {mode !== UserMode.CHILD && (
                <button 
                    onClick={cycleAdultMode}
                    className={`p-2 rounded-xl border-2 transition-all flex items-center gap-2 ${mode === UserMode.EASY_ADULT ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                    title="Alternar entre Modo Completo y Modo Fácil"
                >
                    <Zap size={18} fill={mode === UserMode.EASY_ADULT ? "currentColor" : "none"} />
                    <span className="hidden sm:inline text-xs font-black uppercase">{mode === UserMode.EASY_ADULT ? 'Modo Fácil' : 'Normal'}</span>
                </button>
            )}
            <button 
              onClick={handleModeSwitchRequest}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${
                mode === UserMode.CHILD ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-indigo-600 text-white'
              }`}
            >
              {mode === UserMode.CHILD ? <LogOut size={18} /> : <Baby size={18} />}
              <span className="hidden sm:inline">{mode === UserMode.CHILD ? 'Salir' : 'Modo Niño'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 pb-24 flex flex-col">
        {children}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 p-2 z-40 shadow-2xl ${isHighContrast ? 'bg-black border-t-2 border-cyan-400' : 'bg-white border-t'}`}>
        <ul className="max-w-md mx-auto flex justify-around items-center">
            <li>
                <Link to="/" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${location.pathname === '/' ? 'bg-brand-primary text-white shadow-lg scale-110' : 'text-slate-400'}`}>
                    <Calendar size={28} />
                    <span className="text-[10px] font-black uppercase mt-1">Agenda</span>
                </Link>
            </li>
            {mode === UserMode.EASY_ADULT && (
                <li>
                    <Link to="/easy-creator" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${location.pathname === '/easy-creator' ? 'bg-amber-500 text-white shadow-lg scale-110' : 'text-slate-400'}`}>
                        <Zap size={28} />
                        <span className="text-[10px] font-black uppercase mt-1">Crear</span>
                    </Link>
                </li>
            )}
            {mode === UserMode.ADULT && (
                <li>
                    <Link to="/ai" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${location.pathname === '/ai' ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'text-slate-400'}`}>
                        <Sparkles size={28} />
                        <span className="text-[10px] font-black uppercase mt-1">IA</span>
                    </Link>
                </li>
            )}
            <li>
                <Link to="/people" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${location.pathname === '/people' ? 'bg-brand-primary text-white shadow-lg scale-110' : 'text-slate-400'}`}>
                    <Users size={28} />
                    <span className="text-[10px] font-black uppercase mt-1">Gente</span>
                </Link>
            </li>
            {mode === UserMode.ADULT && (
                <li>
                    <Link to="/settings" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${location.pathname === '/settings' ? 'bg-brand-primary text-white shadow-lg scale-110' : 'text-slate-400'}`}>
                        <Settings size={28} />
                        <span className="text-[10px] font-black uppercase mt-1">Ajustes</span>
                    </Link>
                </li>
            )}
        </ul>
      </nav>

      {showExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-xs w-full text-center border-4 border-slate-100 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                      <button onClick={() => setShowExitModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Lock size={20} className="text-brand-primary" /> Adulto</h3>
                      <div className="w-9" />
                  </div>
                  
                  <div className="flex justify-center gap-4 mb-8">
                      {[0, 1, 2, 3].map((i) => (
                          <div key={i} className={`w-5 h-5 rounded-full transition-all duration-300 ${i < enteredPin.length ? (pinError ? 'bg-red-500 scale-125' : 'bg-brand-primary scale-125') : 'bg-slate-200'}`} />
                      ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 0, '←'].map((val, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => {
                                if (val === '←') setEnteredPin(prev => prev.slice(0, -1));
                                else if (val === 'X') setShowExitModal(false);
                                else if (enteredPin.length < 4) {
                                    const next = enteredPin + val;
                                    setEnteredPin(next);
                                    if (next.length === 4) {
                                        if (next === settings.pin) { setMode(UserMode.ADULT); setShowExitModal(false); navigate('/'); }
                                        else { setPinError(true); setTimeout(() => { setEnteredPin(''); setPinError(false); }, 1000); }
                                    }
                                }
                            }}
                            className={`h-16 rounded-2xl text-2xl font-black flex items-center justify-center transition-all ${val === '←' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-700 active:bg-slate-200'}`}
                          >
                              {val}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
