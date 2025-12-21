
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PictogramData, Category, PersonOrPlace } from '../types';
import { PictogramIcon } from './PictogramIcon';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { X, Search, CloudDownload, Loader2, Image as ImageIcon, Users, LayoutGrid, Plus } from 'lucide-react';
import { PersonPlaceEditModal } from './PersonPlaceEditModal';

interface Props {
  onSelect: (pic: PictogramData) => void;
  onClose: () => void;
}

export const PictogramSelectorModal: React.FC<Props> = ({ onSelect, onClose }) => {
  const { pictograms, addPictogram, peoplePlaces, addPersonOrPlace } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [arasaacResults, setArasaacResults] = useState<PictogramData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'LOCAL' | 'ARASAAC' | 'PEOPLE'>('LOCAL');
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  // Debounce search for Arasaac
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.length >= 3) {
        setSearchMode('ARASAAC');
        setIsSearching(true);
        const results = await searchArasaac(search);
        
        const mapped: PictogramData[] = results.map(r => ({
           id: `arasaac-${r._id}`,
           arasaacId: r._id,
           label: r.keywords[0]?.keyword.toUpperCase() || 'Sin etiqueta',
           category: Category.HOME,
           bgColor: 'bg-white border-2',
           iconName: 'Image' 
        }));
        
        setArasaacResults(mapped);
        setIsSearching(false);
      } else {
        if (search.length === 0 && searchMode === 'ARASAAC') setSearchMode('LOCAL');
        setArasaacResults([]);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredLocal = pictograms.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.label.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleArasaacSelect = (pic: PictogramData) => {
      addPictogram(pic);
      onSelect(pic);
  };

  const handlePersonSelect = (person: PersonOrPlace) => {
      const pic: PictogramData = {
          id: `person-${person.id}`,
          label: person.name.toUpperCase(),
          customImageUrl: person.imageUrl,
          category: Category.PEOPLE,
          bgColor: 'bg-white border-2 border-brand-primary'
      };
      onSelect(pic);
  };

  const handleSaveNewPerson = (person: PersonOrPlace) => {
      addPersonOrPlace(person);
      setShowAddPersonModal(false);
      // Seleccionar automáticamente la nueva persona creada
      handlePersonSelect(person);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border-4 border-slate-100">
        
        {/* Cabecera con pestañas */}
        <div className="bg-slate-50 border-b flex flex-col">
            <div className="p-6 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">Elegir Imagen</h3>
                <button onClick={onClose} className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm transition-all"><X size={24} /></button>
            </div>
            
            <div className="flex p-2 gap-2 bg-slate-100/50 mx-6 mb-6 rounded-2xl">
                <button 
                    onClick={() => setSearchMode('LOCAL')}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${searchMode === 'LOCAL' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400'}`}
                >
                    <LayoutGrid size={18} /> Dibujos
                </button>
                <button 
                    onClick={() => setSearchMode('PEOPLE')}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${searchMode === 'PEOPLE' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400'}`}
                >
                    <Users size={18} /> Mis Fotos
                </button>
            </div>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Buscador (solo para Dibujos/Arasaac) */}
            {searchMode !== 'PEOPLE' && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar (ej: comer, plaza)..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 text-slate-900 border-2 border-transparent rounded-2xl focus:border-brand-primary outline-none text-xl font-bold"
                            autoFocus
                        />
                        {isSearching && <Loader2 className="absolute right-4 top-4 animate-spin text-brand-primary" size={20} />}
                    </div>
                </div>
            )}

            {/* Cuadrícula de resultados */}
            <div className="flex-1 overflow-y-auto min-h-[300px] p-2 scrollbar-hide">
                
                {/* MODO FOTOS PERSONALES */}
                {searchMode === 'PEOPLE' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {/* Botón para subir nueva foto directamente */}
                        <button 
                            onClick={() => setShowAddPersonModal(true)}
                            className="flex flex-col items-center justify-center p-3 rounded-[30px] border-4 border-dashed border-slate-200 hover:border-brand-primary hover:bg-blue-50 transition-all bg-white shadow-sm aspect-square group"
                        >
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                <Plus size={32} />
                            </div>
                            <span className="text-sm font-black text-center uppercase">Subir Foto</span>
                        </button>

                        {peoplePlaces.map(person => (
                            <button 
                                key={person.id}
                                onClick={() => handlePersonSelect(person)}
                                className="flex flex-col items-center p-3 rounded-[30px] border-4 border-transparent hover:border-brand-primary hover:bg-blue-50 transition-all bg-white shadow-sm"
                            >
                                <div className="w-full aspect-square rounded-[24px] overflow-hidden mb-3 border-2 border-slate-100">
                                    <img src={person.imageUrl} alt={person.name} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-sm font-black text-center uppercase truncate w-full px-2">{person.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* MODO ARASAAC (RESULTADOS DE BÚSQUEDA) */}
                {searchMode === 'ARASAAC' && arasaacResults.length > 0 && (
                     <div className="mb-4">
                        <h4 className="font-black text-brand-primary text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CloudDownload size={16} /> Resultados en la nube
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {arasaacResults.map(pic => (
                                <button 
                                    key={pic.id}
                                    onClick={() => handleArasaacSelect(pic)}
                                    className="flex flex-col items-center p-4 rounded-3xl border-2 hover:border-brand-primary hover:bg-blue-50 transition-all bg-white"
                                >
                                    <img 
                                        src={getArasaacImageUrl(pic.arasaacId!)} 
                                        alt={pic.label} 
                                        className="w-20 h-20 object-contain mb-2"
                                        loading="lazy"
                                    />
                                    <span className="text-[10px] font-black text-center uppercase truncate w-full">{pic.label}</span>
                                </button>
                            ))}
                        </div>
                     </div>
                )}

                {/* MODO LOCAL (DIBUJOS GUARDADOS) */}
                {searchMode === 'LOCAL' && arasaacResults.length === 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        {filteredLocal.map(pic => (
                            <button 
                                key={pic.id}
                                onClick={() => onSelect(pic)}
                                className={`flex flex-col items-center p-4 rounded-[30px] border-2 border-transparent hover:border-brand-primary transition-all bg-white shadow-sm`}
                            >
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-2 ${pic.bgColor}`}>
                                    {pic.arasaacId ? (
                                        <img src={getArasaacImageUrl(pic.arasaacId)} alt={pic.label} className="w-16 h-16 object-contain" />
                                    ) : (
                                        <PictogramIcon name={pic.iconName || 'Circle'} size={40} className="text-slate-800" />
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-center uppercase truncate w-full">{pic.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {showAddPersonModal && (
          <PersonPlaceEditModal 
            onSave={handleSaveNewPerson}
            onClose={() => setShowAddPersonModal(false)}
          />
      )}
    </div>
  );
};
