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
            <h2 className="text-2xl font-bold text-slate-800">Personas y Lugares</h2>
            <p className="text-slate-500 text-sm">Fichas para reconocer familia y sitios.</p>
        </div>
        
        {mode === UserMode.ADULT && (
             <button 
                onClick={handleAddNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-full font-bold shadow-lg shadow-brand-primary/30 hover:bg-brand-secondary active:scale-95 transition-all"
             >
                <Plus size={20} />
                <span className="hidden sm:inline">Agregar Nuevo</span>
                <span className="sm:hidden">Agregar</span>
             </button>
        )}
      </div>

      {peoplePlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <Smile size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Aún no hay personas o lugares guardados.</p>
              {mode === UserMode.ADULT && (
                  <button onClick={handleAddNew} className="text-brand-primary font-bold mt-2 hover:underline">
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
                    className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group relative transition-all duration-300 ${mode === UserMode.CHILD ? 'cursor-pointer active:scale-95 hover:shadow-md' : 'hover:border-slate-300'}`}
                >
                    <div className="aspect-square w-full bg-slate-100 relative">
                        <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        <div className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full backdrop-blur-sm shadow-sm">
                            {item.type === 'PERSON' ? <User size={16} className="text-brand-primary" /> : <MapPin size={16} className="text-brand-secondary" />}
                        </div>
                    </div>
                    <div className="p-3 text-center bg-white flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-lg md:text-xl text-slate-800 leading-tight line-clamp-2">{item.name}</h3>
                        {mode === UserMode.ADULT && item.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                        )}
                    </div>

                    {/* Edit Controls (Adult Mode Only) */}
                    {mode === UserMode.ADULT && (
                        <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleEdit(item, e)} 
                                className="p-2 bg-white text-blue-600 rounded-full shadow-md hover:bg-blue-50 transition-colors"
                                title="Editar"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(item.id, e)} 
                                className="p-2 bg-white text-red-600 rounded-full shadow-md hover:bg-red-50 transition-colors"
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