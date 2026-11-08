import React from 'react';
import { 
  LayoutGrid, 
  Flame, 
  TrendingDown, 
  Star, 
  Download,
  Activity
} from 'lucide-react';

export type FilterView = 'all' | 'whales' | 'drops' | 'favorites';

interface NavigationRailProps {
  currentView: FilterView;
  onViewChange: (view: FilterView) => void;
  favoritesCount: number;
  onExport: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentView,
  onViewChange,
  favoritesCount,
  onExport,
}) => {
  return (
    <>
      {/* DESKTOP LEFT RAIL */}
      <aside className="hidden md:flex flex-col items-center justify-between w-20 py-8 border-r border-slate-100 bg-white rounded-l-[32px] shrink-0">
        
        {/* Top Logo */}
        <div className="flex flex-col items-center">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center cursor-pointer hover:rotate-12 transition-transform">
            <div className="h-full w-full bg-white rounded-[14px] flex items-center justify-center">
              <Activity className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Action / Filter Icons */}
        <nav className="flex flex-col items-center gap-5">
          
          {/* 1. All Matches */}
          <button
            onClick={() => onViewChange('all')}
            className={`p-3 rounded-2xl transition-all ${
              currentView === 'all'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title="Tous les matchs"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>

          {/* 2. Whales / Smart Money */}
          <button
            onClick={() => onViewChange('whales')}
            className={`p-3 rounded-2xl transition-all relative ${
              currentView === 'whales'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title="Signaux Whales & Smart Money"
          >
            <Flame className="h-5 w-5 text-amber-500" />
          </button>

          {/* 3. Dropping Odds */}
          <button
            onClick={() => onViewChange('drops')}
            className={`p-3 rounded-2xl transition-all ${
              currentView === 'drops'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title="Fortes baisses de cotes"
          >
            <TrendingDown className="h-5 w-5 text-rose-500" />
          </button>

          {/* 4. Favorites */}
          <button
            onClick={() => onViewChange('favorites')}
            className={`p-3 rounded-2xl transition-all relative ${
              currentView === 'favorites'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title="Matchs Favoris"
          >
            <Star className={`h-5 w-5 ${favoritesCount > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </button>

        </nav>

        {/* Bottom Export Icon */}
        <div className="flex flex-col items-center">
          <button
            onClick={onExport}
            className="p-3 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Exporter les données (CSV)"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-around">
        <button
          onClick={() => onViewChange('all')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            currentView === 'all' ? 'text-slate-900 font-bold' : 'text-slate-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${currentView === 'all' ? 'bg-slate-900 text-white shadow-md' : ''}`}>
            <LayoutGrid className="h-4 w-4" />
          </div>
          <span className="text-[10px]">Tous</span>
        </button>

        <button
          onClick={() => onViewChange('whales')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            currentView === 'whales' ? 'text-amber-600 font-bold' : 'text-slate-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${currentView === 'whales' ? 'bg-slate-900 text-white shadow-md' : ''}`}>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-[10px]">Whales</span>
        </button>

        <button
          onClick={() => onViewChange('drops')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            currentView === 'drops' ? 'text-rose-600 font-bold' : 'text-slate-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${currentView === 'drops' ? 'bg-slate-900 text-white shadow-md' : ''}`}>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <span className="text-[10px]">Chutes</span>
        </button>

        <button
          onClick={() => onViewChange('favorites')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors relative ${
            currentView === 'favorites' ? 'text-slate-900 font-bold' : 'text-slate-400'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${currentView === 'favorites' ? 'bg-slate-900 text-white shadow-md' : ''}`}>
            <Star className={`h-4 w-4 ${favoritesCount > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
          </div>
          <span className="text-[10px]">Favoris</span>
          {favoritesCount > 0 && (
            <span className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-bold h-3 w-3 rounded-full flex items-center justify-center">
              {favoritesCount}
            </span>
          )}
        </button>

        <button
          onClick={onExport}
          className="flex flex-col items-center gap-1 p-1 rounded-xl text-slate-400 hover:text-slate-700"
        >
          <div className="p-1.5 rounded-xl">
            <Download className="h-4 w-4" />
          </div>
          <span className="text-[10px]">Export</span>
        </button>
      </nav>
    </>
  );
};
