import React, { useState, useRef, useEffect } from 'react';
import { PersonOrPlace } from '../types';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface Props {
  initialData?: PersonOrPlace;
  onSave: (data: PersonOrPlace) => void;
  onClose: () => void;
}

export const PersonPlaceEditModal: React.FC<Props> = ({ initialData, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PERSON' | 'PLACE'>('PERSON');
  const [imageUrl, setImageUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
        setType(initialData.type);
        setImageUrl(initialData.imageUrl);
    } else {
        // Reset for new entry
        setName('');
        setDescription('');
        setType('PERSON');
        setImageUrl('');
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
            setImageUrl(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name) return;
    
    // Fallback image if none selected
    const finalImage = imageUrl || `https://ui-avatars.com/api/?name=${name}&background=random`;

    const newData: PersonOrPlace = {
      id: initialData?.id || crypto.randomUUID(),
      name,
      description,
      type,
      imageUrl: finalImage
    };
    
    onSave(newData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-xl text-slate-800">
                {initialData ? 'Editar' : 'Agregar'} {type === 'PERSON' ? 'Persona' : 'Lugar'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X /></button>
        </div>

        <div className="space-y-4">
            {/* Type Selector */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setType('PERSON')}
                    className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${type === 'PERSON' ? 'bg-white shadow text-brand-primary' : 'text-slate-500'}`}
                >
                    Persona
                </button>
                <button 
                    onClick={() => setType('PLACE')}
                    className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${type === 'PLACE' ? 'bg-white shadow text-brand-primary' : 'text-slate-500'}`}
                >
                    Lugar
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Mamá, Escuela, Parque..."
                    className="w-full p-3 bg-white text-slate-900 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (Opcional)</label>
                <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Maestra de matemáticas"
                    className="w-full p-3 bg-white text-slate-900 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Imagen / Foto</label>
                
                <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center relative shrink-0">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="text-slate-400" />
                        )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 bg-blue-50 text-brand-primary font-bold rounded-lg border border-blue-200 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                        >
                            <Upload size={18} /> Subir Foto
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            onClick={(e) => { (e.target as HTMLInputElement).value = '' }} // Reset to allow re-selecting same file
                            accept="image/*" 
                            className="hidden" 
                        />
                        <p className="text-xs text-slate-500">
                            Sube una foto real para ayudar al reconocimiento.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button 
                onClick={handleSave} 
                disabled={!name}
                className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg shadow hover:bg-brand-secondary disabled:opacity-50"
            >
                Guardar
            </button>
        </div>
      </div>
    </div>
  );
};