import React from 'react';
import { MEXICAN_STATES } from '../constants/states';

interface FiltersProps {
    sortBy: 'regular' | 'premium' | 'diesel';
    onSortChange: (type: 'regular' | 'premium' | 'diesel') => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    darkMode: boolean;
    onToggleDarkMode: () => void;
    onOpenInfo: () => void;
    radius: number;
    onRadiusChange: (r: number) => void;
    selectedStateName: string;
    onSelectState: (stateName: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
    sortBy,
    onSortChange,
    searchTerm,
    onSearchChange,
    onToggleDarkMode,
    onOpenInfo,
    radius,
    onRadiusChange,
    selectedStateName,
    onSelectState
}) => {
    return (
        <header className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
            <div className="max-w-md mx-auto space-y-3 pointer-events-auto">
                {/* Search Bar */}
                <div className="relative flex items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-12 px-4 transition-all focus-within:ring-2 focus-within:ring-primary">
                    <span className="material-symbols-outlined text-slate-400 mr-2">search</span>
                    <input
                        className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full placeholder:text-slate-500 text-slate-900 dark:text-white p-0 h-full"
                        placeholder="Buscar gasolinera o ciudad..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    <button onClick={onToggleDarkMode} className="ml-2 text-primary hover:text-blue-400 transition" title="Cambiar Tema">
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                    <button onClick={onOpenInfo} className="ml-2 text-slate-400 hover:text-primary transition" title="Información">
                        <span className="material-symbols-outlined">help</span>
                    </button>
                </div>

                {/* Chips / Filters */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 mask-fade-right items-center">

                    {/* State Selector */}
                    <div className="relative flex items-center h-9 bg-white dark:bg-slate-800 rounded-full px-3 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 mr-1">map</span>
                        <select
                            value={selectedStateName}
                            onChange={(e) => onSelectState(e.target.value)}
                            className="bg-transparent border-none text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-0 p-0 pr-4 cursor-pointer outline-none w-24 truncate"
                        >
                            {MEXICAN_STATES.map(state => (
                                <option key={state.name} value={state.name}>
                                    {state.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => onSortChange('regular')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 shadow-sm border transition-all ${sortBy === 'regular'
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <p className="text-xs font-semibold leading-normal">Regular</p>
                    </button>

                    <button
                        onClick={() => onSortChange('premium')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 shadow-sm border transition-all ${sortBy === 'premium'
                            ? 'bg-danger border-danger text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <p className="text-xs font-semibold leading-normal">Premium</p>
                    </button>

                    <button
                        onClick={() => onSortChange('diesel')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 shadow-sm border transition-all ${sortBy === 'diesel'
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-600 dark:border-slate-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <p className="text-xs font-semibold leading-normal">Diesel</p>
                    </button>

                    {/* Radius Selector */}
                    <div className="relative flex items-center h-9 bg-white dark:bg-slate-800 rounded-full px-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 mr-1">radar</span>
                        <select
                            value={radius}
                            onChange={(e) => onRadiusChange(Number(e.target.value))}
                            className="bg-transparent border-none text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-0 p-0 pr-1 cursor-pointer"
                        >
                            <option value="5">5 km</option>
                            <option value="10">10 km</option>
                            <option value="20">20 km</option>
                            <option value="50">50 km</option>
                        </select>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Filters;
