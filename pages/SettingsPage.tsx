import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ToggleLeft, ToggleRight, Volume2, Type, Eye, Lock, ShieldQuestion, Save, CloudDownload, CloudUpload, HardDrive, Check } from 'lucide-react';

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
            <span className={`font-medium text-lg ${settings.highContrast ? 'text-cyan-300' : 'text-slate-800'}`}>{label}</span>
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

          // Use Data URI for maximum Android compatibility (Save as...)
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

      if (!window.confirm("ATENCIÓN: Esto sobrescribirá todos los datos actuales (horarios, fotos, rutinas). ¿Estás seguro?")) {
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              const success = restoreBackupData(content);
              if (success) {
                  alert("¡Restauración completada con éxito!");
                  window.location.reload(); // Reload to ensure strict consistency
              } else {
                  alert("Error: El archivo no es válido o está corrupto.");
              }
          }
      };
      reader.readAsText(file);
      // Reset input
      if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const containerClass = settings.highContrast ? 'text-cyan-300' : '';
  const cardClass = settings.highContrast ? 'bg-black border-cyan-400 text-cyan-300 border' : 'bg-white shadow-sm border';

  return (
    <div className={`max-w-xl mx-auto space-y-6 ${containerClass}`}>
      <h2 className="text-2xl font-bold">Ajustes y Accesibilidad</h2>
      
      <div className="space-y-4">

        {/* Security Section */}
        <div className={`p-4 rounded-xl shadow-sm border space-y-4 ${cardClass}`}>
             <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-cyan-400 text-black' : 'bg-slate-100 text-slate-600'}`}>
                    <Lock size={24} />
                </div>
                <span className="font-medium text-lg">Seguridad Parental</span>
            </div>
            
            <div className={`flex items-center justify-between pl-12 border-b pb-4 ${settings.highContrast ? 'border-cyan-900' : 'border-slate-100'}`}>
                <span className={settings.highContrast ? 'text-cyan-200' : 'text-slate-500'}>PIN Modo Adulto</span>
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
                        <span className="font-mono font-bold tracking-widest">****</span>
                        <button 
                            onClick={() => { setNewPin(settings.pin); setIsEditingPin(true); }}
                            className={`text-sm underline font-medium ${settings.highContrast ? 'text-cyan-400' : 'text-brand-primary'}`}
                        >
                            Cambiar
                        </button>
                    </div>
                )}
            </div>

            {/* Recovery Question Section */}
            <div className="pl-12 space-y-3">
                <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-2 ${settings.highContrast ? 'text-cyan-200' : 'text-slate-500'}`}>
                        <ShieldQuestion size={16} /> Recuperación de PIN
                    </span>
                    {!isEditingSecurity && (
                        <button 
                            onClick={() => setIsEditingSecurity(true)}
                            className={`text-sm underline font-medium ${settings.highContrast ? 'text-cyan-400' : 'text-brand-primary'}`}
                        >
                            {settings.securityAnswer ? 'Editar' : 'Configurar'}
                        </button>
                    )}
                </div>

                {isEditingSecurity ? (
                    <div className={`p-3 rounded-lg space-y-3 animate-in fade-in ${settings.highContrast ? 'bg-cyan-900/30 border border-cyan-600' : 'bg-slate-50'}`}>
                        <div>
                            <label className="text-xs font-bold uppercase opacity-70">Pregunta</label>
                            <select 
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white text-black"
                            >
                                <option>¿Cuál es el nombre de tu primera mascota?</option>
                                <option>¿En qué ciudad naciste?</option>
                                <option>¿Cuál es tu comida favorita?</option>
                                <option>¿Cuál es el nombre de tu abuela materna?</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase opacity-70">Respuesta Secreta</label>
                            <input 
                                type="text"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Escribe tu respuesta..."
                                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white text-black focus:ring-2 focus:ring-brand-primary outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button 
                                onClick={() => setIsEditingSecurity(false)}
                                className="text-xs opacity-70 hover:opacity-100 font-medium px-2"
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
                    <p className={`text-xs ${settings.highContrast ? 'text-cyan-200' : 'text-slate-400'}`}>
                        {settings.securityAnswer 
                            ? 'Pregunta de seguridad configurada.' 
                            : 'No configurada. Si olvidas tu PIN, tendrás que borrar los datos de la app.'}
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
                <span className="font-medium text-lg">Copia de Seguridad y Restauración</span>
            </div>

            <div className={`text-sm p-3 rounded-lg ${settings.highContrast ? 'bg-cyan-900/30 text-cyan-200' : 'bg-green-50 text-green-800'}`}>
                Guarda toda tu agenda, fotos y rutinas en un archivo. <br/>
                <span className="font-bold">Android:</span> Al guardar, puedes seleccionar tu carpeta de <span className="underline">Google Drive</span> para mantenerlo en la nube.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                    onClick={handleCreateBackup}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary active:scale-95 transition-all shadow-sm"
                >
                    <CloudDownload size={20} /> Crear Copia
                </button>
                
                <button 
                    onClick={() => backupInputRef.current?.click()}
                    className={`flex items-center justify-center gap-2 py-3 px-4 border-2 font-bold rounded-xl active:scale-95 transition-all ${settings.highContrast ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-900' : 'border-slate-200 text-slate-600 hover:border-brand-primary hover:text-brand-primary'}`}
                >
                    <CloudUpload size={20} /> Restaurar Copia
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

      <div className={`p-4 rounded-xl text-sm ${settings.highContrast ? 'bg-cyan-900/30 border border-cyan-700 text-cyan-200' : 'bg-blue-50 text-blue-800'}`}>
        <p>
            <strong>Nota de privacidad:</strong> Los datos de la agenda se guardan únicamente en este dispositivo hasta que crees una copia de seguridad manualmente.
        </p>
      </div>
    </div>
  );
};
