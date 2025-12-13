import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ToggleLeft, ToggleRight, Volume2, Type, Eye, Lock, KeyRound, ChevronDown, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState(settings.pin);
  
  // Security Question State
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [tempQuestion, setTempQuestion] = useState(settings.securityQuestion || '¿Nombre de tu primera mascota?');
  const [tempAnswer, setTempAnswer] = useState(settings.securityAnswer || '');

  const ToggleItem = ({ label, icon: Icon, value, onChange }: any) => (
      <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <Icon size={24} />
            </div>
            <span className="font-medium text-lg text-slate-800">{label}</span>
        </div>
        <button onClick={() => onChange(!value)} className="text-brand-primary">
            {value ? <ToggleRight size={40} className="fill-current" /> : <ToggleLeft size={40} className="text-slate-300" />}
        </button>
      </div>
  );

  const handleSavePin = () => {
      if (newPin.length === 4 && /^\d+$/.test(newPin)) {
          updateSettings({ pin: newPin });
          setIsEditingPin(false);
      } else {
          alert("El PIN debe ser de 4 dígitos numéricos.");
      }
  };

  const handleSaveSecurity = () => {
      if (tempAnswer.trim().length === 0) {
          alert("La respuesta no puede estar vacía.");
          return;
      }
      updateSettings({
          securityQuestion: tempQuestion,
          securityAnswer: tempAnswer.trim()
      });
      setIsEditingSecurity(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-slate-800">Ajustes y Accesibilidad</h2>
      
      <div className="space-y-4">
        {/* Security Section */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
             <div className="p-4 bg-slate-50 border-b flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-slate-600 shadow-sm">
                    <Lock size={24} />
                </div>
                <div>
                    <span className="font-bold text-lg text-slate-800 block">Seguridad Parental</span>
                    <span className="text-xs text-slate-500">Protege la salida del modo niño</span>
                </div>
            </div>
            
            <div className="p-4 space-y-6">
                {/* PIN Config */}
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-slate-700 font-medium block">PIN de Acceso</span>
                        <span className="text-xs text-slate-400">Default: 1234</span>
                    </div>
                    {isEditingPin ? (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                maxLength={4}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="w-20 border-2 border-slate-300 rounded px-2 py-1 text-center font-bold tracking-widest bg-white text-slate-900 focus:border-brand-primary outline-none"
                                autoFocus
                            />
                            <button 
                                onClick={handleSavePin}
                                className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary"
                            >
                                <Check size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <span className="font-mono font-bold tracking-widest text-slate-800 text-xl">••••</span>
                            <button 
                                onClick={() => { setNewPin(settings.pin); setIsEditingPin(true); }}
                                className="text-sm text-brand-primary font-bold hover:underline"
                            >
                                Cambiar
                            </button>
                        </div>
                    )}
                </div>

                <div className="border-t pt-4"></div>

                {/* Security Question Config */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <KeyRound size={18} />
                            <span>Recuperación de PIN</span>
                        </div>
                        {!isEditingSecurity && (
                            <button 
                                onClick={() => setIsEditingSecurity(true)}
                                className="text-sm text-brand-primary font-bold hover:underline"
                            >
                                Configurar
                            </button>
                        )}
                    </div>
                    
                    {!isEditingSecurity ? (
                        <div className="text-sm text-slate-500 pl-6">
                            <p>Pregunta: <span className="italic">{settings.securityQuestion || 'No configurada'}</span></p>
                            <p>Respuesta: <span className="font-mono">••••••</span></p>
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-4 rounded-xl space-y-3 animate-in fade-in">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Pregunta Secreta</label>
                                <select 
                                    value={tempQuestion}
                                    onChange={(e) => setTempQuestion(e.target.value)}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                                >
                                    <option>¿Nombre de tu primera mascota?</option>
                                    <option>¿Ciudad donde naciste?</option>
                                    <option>¿Comida favorita?</option>
                                    <option>¿Nombre de tu abuelo paterno?</option>
                                    <option>¿Marca de tu primer auto?</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Respuesta</label>
                                <input 
                                    type="text"
                                    value={tempAnswer}
                                    onChange={(e) => setTempAnswer(e.target.value)}
                                    placeholder="Escribe la respuesta..."
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button 
                                    onClick={() => setIsEditingSecurity(false)}
                                    className="px-3 py-1.5 text-slate-500 text-sm hover:bg-slate-200 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveSecurity}
                                    className="px-4 py-1.5 bg-brand-primary text-white text-sm font-bold rounded-lg shadow-sm"
                                >
                                    Guardar Pregunta
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <ToggleItem 
            label="Alto Contraste" 
            icon={Eye} 
            value={settings.highContrast} 
            onChange={(v: boolean) => updateSettings({ highContrast: v })} 
        />
        <ToggleItem 
            label="Mostrar Texto" 
            icon={Type} 
            value={settings.showText} 
            onChange={(v: boolean) => updateSettings({ showText: v })} 
        />
        <ToggleItem 
            label="Sonido Activado" 
            icon={Volume2} 
            value={settings.voiceEnabled} 
            onChange={(v: boolean) => updateSettings({ voiceEnabled: v })} 
        />
        {settings.voiceEnabled && (
            <ToggleItem 
                label="Leer al tocar (Auto)" 
                icon={Volume2} 
                value={settings.autoSpeak} 
                onChange={(v: boolean) => updateSettings({ autoSpeak: v })} 
            />
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm">
        <p>
            <strong>Nota:</strong> Si usas la recuperación de PIN, este se restablecerá automáticamente a <strong>1234</strong>.
        </p>
      </div>
    </div>
  );
};