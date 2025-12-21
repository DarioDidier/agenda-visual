
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ToggleLeft, ToggleRight, Volume2, Type, Eye, Lock, ShieldQuestion, Save, CloudDownload, CloudUpload, HardDrive, Check, Plus, Minus } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, generateBackupData, restoreBackupData } = useApp();
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState(settings.pin);
  
  // Security Question State
  const [question, setQuestion] = useState(settings.securityQuestion || '¿Cuál es el nombre de tu primera mascota?');
  const [answer, setAnswer] = useState(settings.securityAnswer || '');
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);

  // Backup State
  const backupInputRef = useRef<HTMLInputElement>(null);

  const ToggleItem = ({ label, icon: Icon, value, onChange }: any) => (
      <div className={`flex items-center justify-between p-4 rounded-xl shadow-sm border ${settings.highContrast ? 'bg-black border-cyan-400' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-cyan-400 text-black' : 'bg-slate-100 text-slate-600'}`}>
                <Icon size={24} />
            </div>
            <span className={`font-bold text-lg ${settings.highContrast ? 'text-cyan-300' : 'text-slate-800'}`}>{label}</span>
        </div>
        <button onClick={() => onChange(!value)} className={settings.highContrast ? 'text-cyan-400' : 'text-brand-primary'}>
            {value ? <ToggleRight size={40} className="fill-current" /> : <ToggleLeft size={40} className={settings.highContrast ? 'text-slate-600' : 'text-slate-300'} />}
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

  const handleCreateBackup = () => {
      try {
          const jsonString = generateBackupData();
          const d = new Date();
          const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const fileName = `mi_agenda_backup_${dateStr}.json`;

          const dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(jsonString);
          
          const link = document.createElement('a');
          link.setAttribute("href", dataStr);
          link.setAttribute("download", fileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
      } catch (e) {
          console.error("Backup error", e);
          alert("Error al generar la copia.");
      }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!window.confirm("ATENCIÓN: Esto sobrescribirá todos los datos actuales. ¿Estás seguro?")) {
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              const success = restoreBackupData(content);
              if (success) {
                  alert("¡Restauración completada con éxito!");
                  window.location.reload();
              } else {
                  alert("Error: El archivo no es válido.");
              }
          }
      };
      reader.readAsText(file);
      if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const changeFontSize = (delta: number) => {
      const newSize = Math.max(0.8, Math.min(1.5, settings.fontSize + delta));
      updateSettings({ fontSize: parseFloat(newSize.toFixed(1)) });
  };

  const containerClass = settings.highContrast ? 'text-cyan-300' : '';
  const cardClass = settings.highContrast ? 'bg-black border-cyan-400 text-cyan-300 border' : 'bg-white shadow-sm border';

  return (
    <div className={`max-w-xl mx-auto space-y-6 pb-20 ${containerClass}`}>
      <h2 className="text-3xl font-black uppercase tracking-tight">Ajustes</h2>
      
      <div className="space-y-4">
        
        {/* Tamaño de Fuente */}
        <div className={`p-4 rounded-xl shadow-sm border flex items-center justify-between ${cardClass}`}>
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-cyan-400 text-black' : 'bg-slate-100 text-slate-600'}`}>
                    <Type size={24} />
                </div>
                <span className="font-bold text-lg">Tamaño del Texto</span>
            </div>
            <div className="flex items-center gap-4 bg-slate-100/50 p-1 rounded-xl">
                <button 
                    onClick={() => changeFontSize(-0.1)}
                    className="p-2 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                >
                    <Minus size={20} />
                </button>
                <span className="font-black w-12 text-center text-xl">{Math.round(settings.fontSize * 100)}%</span>
                <button 
                    onClick={() => changeFontSize(0.1)}
                    className="p-2 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                >
                    <Plus size={20} />
                </button>
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

        {/* Security Section */}
        <div className={`p-4 rounded-xl shadow-sm border space-y-4 ${cardClass}`}>
             <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-cyan-400 text-black' : 'bg-slate-100 text-slate-600'}`}>
                    <Lock size={24} />
                </div>
                <span className="font-bold text-lg">Seguridad</span>
            </div>
            
            <div className={`flex items-center justify-between pl-12 border-b pb-4 ${settings.highContrast ? 'border-cyan-900' : 'border-slate-100'}`}>
                <span className={settings.highContrast ? 'text-cyan-200' : 'text-slate-500 font-bold'}>PIN Adulto</span>
                {isEditingPin ? (
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="w-16 border rounded px-2 py-1 text-center font-bold tracking-widest outline-none text-black"
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
                        <span className="font-mono font-bold tracking-widest text-lg">****</span>
                        <button 
                            onClick={() => { setNewPin(settings.pin); setIsEditingPin(true); }}
                            className={`text-sm underline font-black uppercase ${settings.highContrast ? 'text-cyan-400' : 'text-brand-primary'}`}
                        >
                            Cambiar
                        </button>
                    </div>
                )}
            </div>

            <div className="pl-12 space-y-3">
                <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-2 text-xs uppercase font-black ${settings.highContrast ? 'text-cyan-200' : 'text-slate-400'}`}>
                        <ShieldQuestion size={16} /> Recuperación
                    </span>
                    {!isEditingSecurity && (
                        <button 
                            onClick={() => setIsEditingSecurity(true)}
                            className={`text-xs underline font-black uppercase ${settings.highContrast ? 'text-cyan-400' : 'text-brand-primary'}`}
                        >
                            {settings.securityAnswer ? 'Editar' : 'Configurar'}
                        </button>
                    )}
                </div>

                {isEditingSecurity ? (
                    <div className={`p-4 rounded-xl space-y-3 animate-in fade-in ${settings.highContrast ? 'bg-cyan-900/30 border border-cyan-600' : 'bg-slate-50'}`}>
                        <div>
                            <label className="text-[10px] font-black uppercase opacity-60 mb-1 block">Pregunta</label>
                            <select 
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full mt-1 p-3 border rounded-lg text-sm bg-white text-black font-bold"
                            >
                                <option>¿Cuál es el nombre de tu primera mascota?</option>
                                <option>¿En qué ciudad naciste?</option>
                                <option>¿Cuál es tu comida favorita?</option>
                                <option>¿Cuál es el nombre de tu abuela materna?</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase opacity-60 mb-1 block">Respuesta</label>
                            <input 
                                type="text"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Tu respuesta secreta..."
                                className="w-full mt-1 p-3 border rounded-lg text-sm bg-white text-black focus:ring-2 focus:ring-brand-primary outline-none font-bold"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button 
                                onClick={() => setIsEditingSecurity(false)}
                                className="text-xs font-black uppercase opacity-60 px-2"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveSecurity}
                                className="flex items-center gap-1 bg-brand-primary text-white text-xs px-4 py-2 rounded-lg font-black uppercase shadow-lg"
                            >
                                <Save size={14} /> Guardar
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className={`text-[10px] font-bold ${settings.highContrast ? 'text-cyan-200' : 'text-slate-400'}`}>
                        {settings.securityAnswer 
                            ? 'RECUPERACIÓN CONFIGURADA' 
                            : 'SIN CONFIGURAR'}
                    </p>
                )}
            </div>
        </div>

        {/* Backup Section */}
        <div className={`p-4 rounded-xl shadow-sm border space-y-4 ${cardClass}`}>
             <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-cyan-400 text-black' : 'bg-green-100 text-green-600'}`}>
                    <HardDrive size={24} />
                </div>
                <span className="font-bold text-lg">Copia de Seguridad</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                    onClick={handleCreateBackup}
                    className="flex items-center justify-center gap-2 py-4 px-4 bg-brand-primary text-white font-black uppercase rounded-xl hover:bg-brand-secondary active:scale-95 transition-all shadow-lg"
                >
                    <CloudDownload size={20} /> Crear Copia
                </button>
                
                <button 
                    onClick={() => backupInputRef.current?.click()}
                    className={`flex items-center justify-center gap-2 py-4 px-4 border-4 font-black uppercase rounded-xl active:scale-95 transition-all ${settings.highContrast ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-900' : 'border-slate-200 text-slate-600 hover:border-brand-primary'}`}
                >
                    <CloudUpload size={20} /> Restaurar
                </button>
                <input 
                    type="file" 
                    accept=".json"
                    ref={backupInputRef}
                    className="hidden"
                    onChange={handleRestoreBackup}
                />
            </div>
        </div>
      </div>
    </div>
  );
};
