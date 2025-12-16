import React, { useState, useRef, useEffect } from 'react';
import { PersonOrPlace } from '../types';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface Props {
  initialData?: PersonOrPlace;
  onSave: (data: PersonOrPlace) => void;
  onClose: () => void;
}

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
        const MAX_WIDTH = 500; // Resize to max 500px width
        const MAX_HEIGHT = 500; // Resize to max 500px height
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
        // Return compressed JPEG at 70% quality
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
        // Reset for new entry
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
          alert("Hubo un error al procesar la imagen. Intenta con una imagen más pequeña.");
      } finally {
          setIsProcessing(false);
      }
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
                            disabled={isProcessing}
                            className="w-full py-2 bg-blue-50 text-brand-primary font-bold rounded-lg border border-blue-200 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                            <Upload size={18} /> {isProcessing ? 'Procesando...' : 'Subir Foto'}
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
                            La imagen se optimizará automáticamente para ahorrar espacio.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button 
                onClick={handleSave} 
                disabled={!name || isProcessing}
                className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg shadow hover:bg-brand-secondary disabled:opacity-50"
            >
                Guardar
            </button>
        </div>
      </div>
    </div>
  );
};