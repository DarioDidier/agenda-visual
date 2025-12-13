import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PictogramData, Category } from '../types';
import { PictogramIcon } from './PictogramIcon';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { X, Search, CloudDownload, Loader2 } from 'lucide-react';

interface Props {
  onSelect: (pic: PictogramData) => void;
  onClose: () => void;
}

export const PictogramSelectorModal: React.FC<Props> = ({ onSelect, onClose }) => {
  const { pictograms, addPictogram } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [arasaacResults, setArasaacResults] = useState<PictogramData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'LOCAL' | 'ARASAAC'>('LOCAL');

  const categories = ['All', ...Object.values(Category)];

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
           category: Category.HOME, // Default
           bgColor: 'bg-white border-2',
           iconName: 'Image' 
        }));
        
        setArasaacResults(mapped);
        setIsSearching(false);
      } else {
        if (search.length === 0) setSearchMode('LOCAL');
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
      // Add to local library before selecting
      addPictogram(pic);
      onSelect(pic);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <div>
                <h3 className="font-bold text-lg text-slate-800">Seleccionar Pictograma</h3>
                <p className="text-xs text-slate-500">Busca en ARASAAC o usa los guardados</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar pictograma (ej: comer, jugar)..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-lg"
                        autoFocus
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-3 animate-spin text-brand-primary" size={18} />}
                </div>
                {searchMode === 'LOCAL' && (
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border rounded-xl px-4 py-2 bg-white"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto min-h-[300px] p-2">
                {searchMode === 'ARASAAC' && arasaacResults.length > 0 && (
                     <div className="mb-4">
                        <h4 className="font-bold text-brand-primary text-sm mb-2 flex items-center gap-1">
                            <CloudDownload size={14} /> Resultados de ARASAAC
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {arasaacResults.map(pic => (
                                <button 
                                    key={pic.id}
                                    onClick={() => handleArasaacSelect(pic)}
                                    className="flex flex-col items-center p-2 rounded-xl border hover:border-brand-primary hover:bg-blue-50 transition-all bg-white"
                                >
                                    <img 
                                        src={getArasaacImageUrl(pic.arasaacId!)} 
                                        alt={pic.label} 
                                        className="w-16 h-16 object-contain mb-2"
                                        loading="lazy"
                                    />
                                    <span className="text-xs font-bold text-center leading-tight capitalize">{pic.label}</span>
                                </button>
                            ))}
                        </div>
                     </div>
                )}
                
                {searchMode === 'ARASAAC' && arasaacResults.length === 0 && !isSearching && (
                    <p className="text-center text-slate-400 py-4">No se encontraron resultados en ARASAAC.</p>
                )}

                {searchMode === 'LOCAL' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {filteredLocal.map(pic => (
                            <button 
                                key={pic.id}
                                onClick={() => onSelect(pic)}
                                className={`flex flex-col items-center p-3 rounded-xl border-2 border-transparent hover:border-brand-primary transition-all ${pic.bgColor}`}
                            >
                                {pic.arasaacId ? (
                                    <img src={getArasaacImageUrl(pic.arasaacId)} alt={pic.label} className="w-12 h-12 object-contain mb-2" />
                                ) : (
                                    <PictogramIcon name={pic.iconName || 'Circle'} size={32} className="text-slate-800 mb-2" />
                                )}
                                <span className="text-xs font-bold text-center leading-tight">{pic.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
