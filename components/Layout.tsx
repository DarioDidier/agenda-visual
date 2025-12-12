import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode } from '../types';
import { Settings, Users, Calendar, Sparkles, LogOut, Baby, Lock, X, Check } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode, setMode } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);

  const isActive = (path: string) => location.pathname === path ? 'bg-brand-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100';

  const handleModeSwitchRequest = () => {
    if (mode === UserMode.ADULT) {
      // Enter Child Mode immediately
      setMode(UserMode.CHILD);
      navigate('/'); 
    } else {
      // Show confirmation modal for exiting Child Mode
      setShowExitModal(true);
    }
  };

  const confirmExitChildMode = () => {
      setMode(UserMode.ADULT);
      setShowExitModal(false);
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

            {mode === UserMode.ADULT && (
                 <Link to="/generator" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/generator')}`}>
                    <Sparkles size={24} className="text-yellow-500" />
                    <span className="text-xs font-medium mt-1">IA</span>
                </Link>
            )}

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

      {/* Exit Child Mode Modal */}
      {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-6 text-center border-4 border-slate-100 transform scale-100 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={32} />
                  </div>
                  
                  <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-800">¿Salir del Modo Niño?</h3>
                      <p className="text-slate-500">
                          Volverás a la vista de edición para padres y maestros.
                      </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                          onClick={() => setShowExitModal(false)}
                          className="py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                          <X size={20} /> Cancelar
                      </button>
                      <button 
                          onClick={confirmExitChildMode}
                          className="py-3 px-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2"
                      >
                          <Check size={20} /> Salir
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
