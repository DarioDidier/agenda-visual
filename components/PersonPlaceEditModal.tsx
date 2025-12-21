import React, { useState, useRef, useEffect } from 'react';
import { PersonOrPlace } from '../types';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

// Added missing Props interface definition
interface Props {
  initialData?: PersonOrPlace;
  onSave: (data: PersonOrPlace) => void;
  onClose: () => void;
}

// Generador de ID robusto local
const generateSafeId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

// Helper to compress image
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const PersonPlaceEditModal: React.FC<Props> = ({ initialData, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PERSON' | 'PLACE'>('PERSON');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
        setType(initialData.type);
        setImageUrl(initialData.imageUrl);
    } else {
        setName('');
        setDescription('');
        setType('PERSON');
        setImageUrl('');
    }
  }, [initialData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
          const compressed = await compressImage(file);
          setImageUrl(compressed);
      } catch (error) {
          console.error("Error compressing image:", error);
          alert("Error al procesar la imagen.");
      } finally {
          setIsProcessing(false);
      }
    }
  };

  const handleSave = () => {
    if (!name) return;
    
    const finalImage = imageUrl || `https://ui-avatars.com/api/?name=${name}&background=random`;

    const newData: PersonOrPlace = {
      id: initialData?.id || generateSafeId(),
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
                    placeholder="Ej: Mamá, Escuela..."
                    className="w-full p-3 bg-white text-slate-900 border rounded-xl outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Imagen</label>
                <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="text-slate-400" />
                        )}
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex-1 py-2 bg-blue-50 text-brand-primary font-bold rounded-lg border border-blue-200"
                    >
                        {isProcessing ? 'Cargando...' : 'Subir Foto'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
            </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={!name || isProcessing} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg shadow">
                Guardar
            </button>
        </div>
      </div>
    </div>
  );
};