import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode, PersonOrPlace } from '../types';
import { MapPin, User, Plus, Pencil, Trash2 } from 'lucide-react';
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
        <h2 className="text-2xl font-bold text-slate-800">Personas y Lugares</h2>
        {mode === UserMode.ADULT && (
             <button 
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-full font-bold shadow hover:bg-brand-secondary"
             >
                <Plus size={18} />
                <span>Agregar</span>
             </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {peoplePlaces.map(item => (
            <div 
                key={item.id}
                onClick={() => handleCardClick(item.name)}
                className={`bg-white rounded-3xl shadow-sm border-b-4 border-slate-200 overflow-hidden flex flex-col group relative ${mode === UserMode.CHILD ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
            >
                <div className="h-40 w-full bg-slate-100 relative">
                    <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 p-2 bg-white/80 rounded-full backdrop-blur-sm shadow-sm">
                        {item.type === 'PERSON' ? <User size={20} className="text-brand-primary" /> : <MapPin size={20} className="text-brand-secondary" />}
                    </div>
                </div>
                <div className="p-4 text-center bg-white flex-1">
                    <h3 className="font-bold text-xl text-slate-800">{item.name}</h3>
                    {mode === UserMode.ADULT && item.description && (
                        <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                    )}
                </div>

                {/* Edit Controls */}
                {mode === UserMode.ADULT && (
                    <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={(e) => handleEdit(item, e)} 
                            className="p-2 bg-white/90 text-blue-600 rounded-full shadow hover:bg-white"
                        >
                            <Pencil size={16} />
                         </button>
                         <button 
                            onClick={(e) => handleDelete(item.id, e)} 
                            className="p-2 bg-white/90 text-red-600 rounded-full shadow hover:bg-white"
                        >
                            <Trash2 size={16} />
                         </button>
                    </div>
                )}
            </div>
        ))}
      </div>

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
