import React from 'react';
import { useApp } from '../context/AppContext';
import { ToggleLeft, ToggleRight, Volume2, Type, Eye } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useApp();

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

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Ajustes y Accesibilidad</h2>
      
      <div className="space-y-4">
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
