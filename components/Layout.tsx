import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode } from '../types';
import { Settings, Users, Calendar, LogOut, Baby, Lock, X, Delete, ShieldCheck, HelpCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode, setMode, settings, updateSettings } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Modal State
  const [showExitModal, setShowExitModal] = useState(false);
  const [modalView, setModalView] = useState<'PIN' | 'RECOVERY'>('PIN');
  
  // PIN State
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Recovery State
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryError, setRecoveryError] = useState(false);

  const isActive = (path: string) => location.pathname === path ? 'bg-brand-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100';

  const handleModeSwitchRequest = () => {
    if (mode === UserMode.ADULT) {
      // Enter Child Mode immediately
      setMode(UserMode.CHILD);
      navigate('/'); 
    } else {
      // Show confirmation modal for exiting Child Mode
      resetModalState();
      setShowExitModal(true);
    }
  };

  const resetModalState = () => {
      setEnteredPin('');
      setPinError(false);
      setModalView('PIN');
      setRecoveryAnswer('');
      setRecoveryError(false);
  };

  const handlePinInput = (num: string) => {
    if (enteredPin.length < 4) {
        const newPin = enteredPin + num;
        setEnteredPin(newPin);
        setPinError(false);
        
        // Auto submit on 4th digit
        if (newPin.length === 4) {
            validatePin(newPin);
        }
    }
  };

  const handlePinDelete = () => {
      setEnteredPin(prev => prev.slice(0, -1));
      setPinError(false);
  };

  const validatePin = (pinToCheck: string) => {
      if (pinToCheck === settings.pin) {
          setTimeout(() => {
              setMode(UserMode.ADULT);
              setShowExitModal(false);
              setEnteredPin('');
          }, 200);
      } else {
          setPinError(true);
          setTimeout(() => setEnteredPin(''), 500);
      }
  };

  const handleForgotPinClick = () => {
      if (!settings.securityAnswer) {
          alert("No has configurado una pregunta de seguridad en los Ajustes. Por defecto el PIN es 1234.");
          // Optional: Allow emergency reset if strictly needed for demo
          // updateSettings({ pin: '1234' });
      } else {
          setModalView('RECOVERY');
      }
  };

  const handleRecoverySubmit = () => {
      // Fallback for strict typescript checks, though button click checks above
      if (!settings.securityAnswer) {
          alert("Error: No hay respuesta configurada.");
          return;
      }

      if (recoveryAnswer.trim().toLowerCase() === settings.securityAnswer.trim().toLowerCase()) {
          // Correct answer
          updateSettings({ pin: '1234' }); // Reset PIN
          alert("¡Correcto! Tu PIN ha sido restablecido a: 1234");
          setMode(UserMode.ADULT);
          setShowExitModal(false);
      } else {
          setRecoveryError(true);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl transform -rotate-6 shadow-sm">
                Ag
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">
              Mi Agenda <span className="text-brand-primary">Visual</span>
            </h1>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:hidden">
              Agenda
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleModeSwitchRequest}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-sm active:scale-95 ${
                mode === UserMode.CHILD 
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 ring-2 ring-red-100' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {mode === UserMode.CHILD ? <LogOut size={18}/> : <Baby size={20} />}
              {mode === UserMode.CHILD ? 'Salir' : 'Modo Niño'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto flex justify-around items-center">
            
            <Link to="/" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/')}`}>
                <Calendar size={24} />
                <span className="text-xs font-medium mt-1">Agenda</span>
            </Link>

            <Link to="/people" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/people')}`}>
                <Users size={24} />
                <span className="text-xs font-medium mt-1">Personas</span>
            </Link>

            {mode === UserMode.ADULT && (
                <Link to="/settings" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/settings')}`}>
                    <Settings size={24} />
                    <span className="text-xs font-medium mt-1">Ajustes</span>
                </Link>
            )}
        </div>
      </nav>

      {/* PIN / Exit Modal */}
      {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-xs w-full text-center border-4 border-slate-100 transform scale-100 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <button onClick={() => setShowExitModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                          <X size={20} />
                      </button>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Lock size={18} className="text-brand-primary" /> Acceso Adulto
                      </h3>
                      <div className="w-9" /> {/* Spacer */}
                  </div>
                  
                  {modalView === 'PIN' ? (
                      <>
                        {/* PIN Dots Display */}
                        <div className="flex justify-center gap-4 mb-8">
                            {[0, 1, 2, 3].map((i) => (
                                <div 
                                    key={i} 
                                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                        i < enteredPin.length 
                                            ? (pinError ? 'bg-red-500 scale-110' : 'bg-brand-primary scale-110') 
                                            : 'bg-slate-200'
                                    }`}
                                />
                            ))}
                        </div>
                        
                        {/* Keypad */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handlePinInput(num.toString())}
                                    className="h-14 w-full rounded-2xl bg-slate-50 text-xl font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-sm border border-slate-200"
                                >
                                    {num}
                                </button>
                            ))}
                            <div className="h-14" /> {/* Empty Slot */}
                            <button
                                onClick={() => handlePinInput('0')}
                                className="h-14 w-full rounded-2xl bg-slate-50 text-xl font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-sm border border-slate-200"
                            >
                                0
                            </button>
                            <button
                                onClick={handlePinDelete}
                                className="h-14 w-full rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all"
                            >
                                <Delete size={24} />
                            </button>
                        </div>
                        
                        {pinError && (
                            <p className="text-red-500 text-sm font-bold animate-pulse">PIN Incorrecto</p>
                        )}
                        
                        {/* Forgot PIN Link - Always visible now */}
                        <button 
                            onClick={handleForgotPinClick}
                            className="mt-4 text-xs text-brand-primary hover:underline font-medium flex items-center justify-center gap-1 w-full p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <HelpCircle size={14} /> ¿Olvidaste tu PIN?
                        </button>
                      </>
                  ) : (
                      // Recovery View
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                          <div className="mb-4 text-left bg-blue-50 p-3 rounded-xl border border-blue-100">
                              <p className="text-xs text-blue-600 font-bold uppercase mb-1">Pregunta de Seguridad:</p>
                              <p className="text-sm text-slate-700 font-medium leading-tight">
                                  {settings.securityQuestion || 'No definida'}
                              </p>
                          </div>

                          <input 
                              type="text" 
                              value={recoveryAnswer}
                              onChange={(e) => { setRecoveryAnswer(e.target.value); setRecoveryError(false); }}
                              placeholder="Escribe tu respuesta..."
                              className="w-full p-3 bg-slate-50 border rounded-xl mb-4 focus:ring-2 focus:ring-brand-primary outline-none"
                              autoFocus
                          />

                          {recoveryError && (
                              <p className="text-red-500 text-sm font-bold mb-4 animate-pulse">Respuesta incorrecta</p>
                          )}

                          <button 
                              onClick={handleRecoverySubmit}
                              className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl shadow-md hover:bg-brand-secondary mb-3 flex items-center justify-center gap-2"
                          >
                              <ShieldCheck size={18} /> Recuperar y Restablecer
                          </button>
                          
                          <button 
                              onClick={() => setModalView('PIN')}
                              className="text-sm text-slate-400 hover:text-slate-600 font-medium p-2"
                          >
                              Cancelar y Volver
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};