import React from 'react';

interface Props {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<Props> = ({ className = "w-32 h-auto", showText = true }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Conexiones (Cables) */}
        <path d="M50 75 V95 Q50 105 60 105 H140 Q150 105 150 95 V75" stroke="#A78BFA" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M100 85 V105" stroke="#A78BFA" strokeWidth="6" strokeLinecap="round" />

        {/* Cerebro Izquierdo (Azul) */}
        <path d="M100 85 C100 85 65 85 65 60 C65 45 70 40 80 35 C75 25 80 15 90 15 C95 15 100 20 100 25 V85 Z" fill="#6FAEE5" />
        <circle cx="85" cy="45" r="12" fill="#88C0F0" />
        <circle cx="75" cy="65" r="10" fill="#88C0F0" />

        {/* Cerebro Derecho (Verde) */}
        <path d="M100 85 C100 85 135 85 135 60 C135 45 130 40 120 35 C125 25 120 15 110 15 C105 15 100 20 100 25 V85 Z" fill="#7FD1B9" />
        <circle cx="115" cy="45" r="12" fill="#9AE2CD" />
        <circle cx="125" cy="65" r="10" fill="#9AE2CD" />

        {/* Carita */}
        <circle cx="90" cy="65" r="3" fill="#1E3A8A" />
        <circle cx="110" cy="65" r="3" fill="#1E3A8A" />
        <path d="M96 70 Q100 75 104 70" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" />

        {/* Nodo Izquierdo (Cuadrado Morado) */}
        <rect x="40" y="65" width="20" height="20" rx="4" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
        <rect x="44" y="69" width="12" height="12" rx="2" fill="#A78BFA" />

        {/* Nodo Derecho (Cuadrado Amarillo) */}
        <rect x="140" y="65" width="20" height="20" rx="4" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
        <rect x="144" y="69" width="12" height="12" rx="2" fill="#FEF3C7" />

        {/* Nodo Central (Ojo) */}
        <rect x="88" y="95" width="24" height="24" rx="4" fill="#FCD34D" />
        {/* Icono Ojo */}
        <path d="M89 107 C89 107 94 102 100 102 C106 102 111 107 111 107 C111 107 106 112 100 112 C94 112 89 107 89 107 Z" fill="white" />
        <circle cx="100" cy="107" r="2.5" fill="#F59E0B" />
      </svg>
      
      {showText && (
        <div className="flex items-center -mt-2">
            <span className="text-2xl font-bold text-slate-700 tracking-tight" style={{ fontFamily: 'sans-serif' }}>
                <span style={{ color: '#2C4E80' }}>Neuro</span>
                <span style={{ color: '#8E6E9E' }}>Visual</span>
            </span>
        </div>
      )}
    </div>
  );
};
