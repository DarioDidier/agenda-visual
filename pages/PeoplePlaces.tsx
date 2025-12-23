
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode, PersonOrPlace } from '../types';
import { MapPin, User, Plus, Pencil, Trash2, Smile } from 'lucide-react';
import { speakText } from '../services/speechService';
import { PersonPlaceEditModal } from '../components/PersonPlaceEditModal';

export const PeoplePlaces: React.FC = () => {
  const { peoplePlaces, mode, settings, addPersonOrPlace, updatePersonOrPlace, deletePersonOrPlace } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonOrPlace | undefined>(undefined);

  const isHighContrast = settings.highContrast;

  const handleCardClick = (name: string) => {
    if (settings.voiceEnabled) {
        speakText(name);
    }
  };

  const handleAddNew = () => {
      setEditingItem(undefined);
      setIsModalOpen(true);
  };

  const handleEdit = (item: PersonOrPlace, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingItem(item);
      setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm('¿Estás seguro de eliminar esto?')) {
          deletePersonOrPlace(id);
      }
  };

  const handleSaveModal = (data: PersonOrPlace) => {
      if (editingItem) {
          updatePersonOrPlace(data.id, data);
      } else {
          addPersonOrPlace(data);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className={`text-2xl font-bold ${isHighContrast ? 'text-white' : 'text-slate-800'}`}>Personas y Lugares</h2>
            <p className={`${isHighContrast ? 'text-cyan-300' : 'text-slate-500'} text-sm font-medium`}>Fichas para reconocer familia y sitios.</p>
        </div>
        
        {mode === UserMode.ADULT && (
             <button 
                onClick={handleAddNew}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold shadow-lg transition-all active:scale-95 ${isHighContrast ? 'bg-white text-black hover:bg-cyan-100' : 'bg-brand-primary text-white shadow-brand-primary/30 hover:bg-brand-secondary'}`}
             >
                <Plus size={20} />
                <span className="hidden sm:inline">Agregar Nuevo</span>
                <span className="sm:hidden">Agregar</span>
             </button>
        )}
      </div>

      {peoplePlaces.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed ${isHighContrast ? 'bg-black border-cyan-400' : 'bg-white border-slate-200'}`}>
              <Smile size={48} className={`${isHighContrast ? 'text-cyan-400' : 'text-slate-300'} mb-4`} />
              <p className={`font-medium ${isHighContrast ? 'text-white' : 'text-slate-500'}`}>Aún no hay personas o lugares guardados.</p>
              {mode === UserMode.ADULT && (
                  <button onClick={handleAddNew} className={`font-bold mt-2 hover:underline ${isHighContrast ? 'text-cyan-300' : 'text-brand-primary'}`}>
                      ¡Agrega el primero!
                  </button>
              )}
          </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {peoplePlaces.map(item => (
                <div 
                    key={item.id}
                    onClick={() => handleCardClick(item.name)}
                    className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col group relative transition-all duration-300 ${isHighContrast ? 'bg-black border-2 border-white' : 'bg-white border-slate-100'} ${mode === UserMode.CHILD ? 'cursor-pointer active:scale-95 hover:shadow-md' : 'hover:border-slate-300'}`}
                >
                    <div className="aspect-square w-full bg-slate-100 relative">
                        <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        <div className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm shadow-sm ${isHighContrast ? 'bg-black text-white border border-white' : 'bg-white/90 text-brand-primary'}`}>
                            {item.type === 'PERSON' ? <User size={16} /> : <MapPin size={16} className={isHighContrast ? 'text-white' : 'text-brand-secondary'} />}
                        </div>
                    </div>
                    <div className={`p-3 text-center flex-1 flex flex-col justify-center ${isHighContrast ? 'bg-black' : 'bg-white'}`}>
                        <h3 className={`font-bold text-lg md:text-xl leading-tight line-clamp-2 ${isHighContrast ? 'text-white' : 'text-slate-800'}`}>{item.name}</h3>
                        {mode === UserMode.ADULT && item.description && (
                            <p className={`text-xs mt-1 line-clamp-1 ${isHighContrast ? 'text-cyan-300' : 'text-slate-500'}`}>{item.description}</p>
                        )}
                    </div>

                    {/* Edit Controls (Adult Mode Only) */}
                    {mode === UserMode.ADULT && (
                        <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleEdit(item, e)} 
                                className={`p-2 rounded-full shadow-md transition-colors ${isHighContrast ? 'bg-white text-black hover:bg-cyan-100' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                title="Editar"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(item.id, e)} 
                                className={`p-2 rounded-full shadow-md transition-colors ${isHighContrast ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-red-600 hover:bg-red-50'}`}
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}

      {isModalOpen && (
          <PersonPlaceEditModal 
            key={editingItem?.id || 'new'} 
            initialData={editingItem}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveModal}
          />
      )}
    </div>
  );
};
