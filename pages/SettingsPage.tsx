import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ToggleLeft, ToggleRight, Volume2, Type, Eye, Lock, ShieldQuestion, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState(settings.pin);
  
  // Security Question State
  const [question, setQuestion] = useState(settings.securityQuestion || '¿Cuál es el nombre de tu primera mascota?');
  const [answer, setAnswer] = useState(settings.securityAnswer || '');
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);

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
      if (!answer.trim()) {
          alert("La respuesta no puede estar vacía.");
          return;
      }
      updateSettings({ securityQuestion: question, securityAnswer: answer });
      setIsEditingSecurity(false);
      alert("Pregunta de seguridad actualizada correctamente.");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Ajustes y Accesibilidad</h2>
      
      <div className="space-y-4">

        {/* Security Section */}
        <div className="p-4 bg-white rounded-xl shadow-sm border space-y-4">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    <Lock size={24} />
                </div>
                <span className="font-medium text-lg text-slate-800">Seguridad Parental</span>
            </div>
            
            <div className="flex items-center justify-between pl-12 border-b pb-4">
                <span className="text-slate-500">PIN Modo Adulto</span>
                {isEditingPin ? (
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="w-16 border rounded px-2 py-1 text-center font-bold tracking-widest outline-brand-primary"
                        />
                        <button 
                            onClick={handleSavePin}
                            className="px-3 py-1 bg-brand-primary text-white text-sm rounded-lg"
                        >
                            Guardar
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <span className="font-mono font-bold tracking-widest text-slate-800">****</span>
                        <button 
                            onClick={() => { setNewPin(settings.pin); setIsEditingPin(true); }}
                            className="text-sm text-brand-primary underline font-medium"
                        >
                            Cambiar
                        </button>
                    </div>
                )}
            </div>

            {/* Recovery Question Section */}
            <div className="pl-12 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-2">
                        <ShieldQuestion size={16} /> Recuperación de PIN
                    </span>
                    {!isEditingSecurity && (
                        <button 
                            onClick={() => setIsEditingSecurity(true)}
                            className="text-sm text-brand-primary underline font-medium"
                        >
                            {settings.securityAnswer ? 'Editar' : 'Configurar'}
                        </button>
                    )}
                </div>

                {isEditingSecurity ? (
                    <div className="bg-slate-50 p-3 rounded-lg space-y-3 animate-in fade-in">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Pregunta</label>
                            <select 
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white"
                            >
                                <option>¿Cuál es el nombre de tu primera mascota?</option>
                                <option>¿En qué ciudad naciste?</option>
                                <option>¿Cuál es tu comida favorita?</option>
                                <option>¿Cuál es el nombre de tu abuela materna?</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Respuesta Secreta</label>
                            <input 
                                type="text"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Escribe tu respuesta..."
                                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-primary outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button 
                                onClick={() => setIsEditingSecurity(false)}
                                className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveSecurity}
                                className="flex items-center gap-1 bg-brand-primary text-white text-xs px-3 py-1.5 rounded-md font-bold hover:bg-brand-secondary"
                            >
                                <Save size={12} /> Guardar
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400">
                        {settings.securityAnswer 
                            ? 'Pregunta de seguridad configurada.' 
                            : 'No configurada. Si olvidas tu PIN, tendrás que borrar los datos de la app.'}
                    </p>
                )}
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
            <strong>Nota de privacidad:</strong> Los datos de la agenda se guardan únicamente en este dispositivo.
        </p>
      </div>
    </div>
  );
};