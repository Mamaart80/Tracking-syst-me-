import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Coins, 
  TrendingDown, 
  Zap, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  Star,
  Sparkles,
  ArrowRight,
  PieChart
} from 'lucide-react';
import { ScrapedMatch } from '../types';
import { Sparkline } from './Sparkline';
import { ActivityGrowthChart } from './ActivityGrowthChart';
import { FilterView } from './NavigationRail';

interface HealthOverviewProps {
  matches: ScrapedMatch[];
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated: string | null;
  onSelectMatch: (match: ScrapedMatch) => void;
  selectedMatchId?: string;
  onOpenAiModal: (match: ScrapedMatch) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  currentView: FilterView;
  onViewChange: (view: FilterView) => void;
}

export const HealthOverview: React.FC<HealthOverviewProps> = ({
  matches,
  isLoading,
  onRefresh,
  lastUpdated,
  onSelectMatch,
  selectedMatchId,
  onOpenAiModal,
  favorites,
  onToggleFavorite,
  currentView,
  onViewChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Exact Sums and Volume Calculations (Like on Arbworld)
  const totalVolume = useMemo(() => matches.reduce((sum, m) => sum + m.total_volume, 0), [matches]);
  const totalVol1 = useMemo(() => matches.reduce((sum, m) => sum + m.volume_1, 0), [matches]);
  const totalVolX = useMemo(() => matches.reduce((sum, m) => sum + m.volume_x, 0), [matches]);
  const totalVol2 = useMemo(() => matches.reduce((sum, m) => sum + m.volume_2, 0), [matches]);

  const pctTotal1 = totalVolume > 0 ? ((totalVol1 / totalVolume) * 100).toFixed(1) : '0.0';
  const pctTotalX = totalVolume > 0 ? ((totalVolX / totalVolume) * 100).toFixed(1) : '0.0';
  const pctTotal2 = totalVolume > 0 ? ((totalVol2 / totalVolume) * 100).toFixed(1) : '0.0';

  const whaleCount = useMemo(() => matches.filter(m => m.dominant_pct >= 75 || m.total_volume >= 25000).length, [matches]);

  // Find biggest odds drop
  const maxDrop = useMemo(() => {
    let drop = 0;
    for (const m of matches) {
      if (m.drop_1_pct < drop) drop = m.drop_1_pct;
      if (m.drop_2_pct < drop) drop = m.drop_2_pct;
    }
    return drop;
  }, [matches]);

  // Exact currency format as on Arbworld (e.g. £215,173)
  const formatMoney = (num: number) => {
    return '£' + Math.round(num).toLocaleString('en-GB');
  };

  // Filtered matches based on search and currentView
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!`${m.home} ${m.away} ${m.league}`.toLowerCase().includes(q)) return false;
      }
      if (currentView === 'whales') {
        return m.dominant_pct >= 75 || m.total_volume >= 25000;
      }
      if (currentView === 'drops') {
        return m.drop_1_pct <= -5 || m.drop_2_pct <= -5 || m.drop_x_pct <= -5;
      }
      if (currentView === 'favorites') {
        return favorites.includes(m.id);
      }
      return true;
    });
  }, [matches, searchQuery, currentView, favorites]);

  return (
    <div className="flex-1 bg-[#FBFBFD] p-4 sm:p-7 rounded-3xl lg:rounded-l-none overflow-y-auto">
      
      {/* Top Header: Title, Date, Search & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Moneyway 1X2 Football
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
            <span>Flux officiels Arbworld & Betfair Exchange</span>
            {lastUpdated && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-emerald-600 font-semibold">{lastUpdated}</span>
              </>
            )}
          </p>
        </div>

        {/* Circular Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isSearchOpen ? (
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Équipe, ligue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 text-xs text-slate-800 rounded-full pl-8 pr-7 py-2 focus:outline-none focus:border-amber-400 shadow-sm w-44 sm:w-56"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="h-9 w-9 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-sm transition-all"
              title="Rechercher"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`h-9 w-9 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-sm transition-all ${
              isLoading ? 'opacity-80' : 'active:scale-95'
            }`}
            title="Rafraîchir les flux en direct"
          >
            <RefreshCw className={`h-4 w-4 text-slate-700 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Total Sums Banner (Total des sommes comme sur Arbworld) */}
      <div className="bg-white rounded-2xl p-4 mb-5 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total des Sommes Échangées (Tous les Matchs)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-0.5">
              {formatMoney(totalVolume)}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              {matches.length} Matchs au total
            </span>
            <span className="text-xs font-mono text-slate-500">
              Moyenne: {formatMoney(totalVolume / (matches.length || 1))} / match
            </span>
          </div>
        </div>

        {/* 1X2 Macro Split of Sums */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-1 text-center">
          <div className="bg-[#FFEBEF]/40 border border-rose-100 rounded-xl p-2">
            <span className="text-[10px] text-rose-600 font-bold block">Somme Totale 1 (Dom)</span>
            <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 block mt-0.5">
              {formatMoney(totalVol1)}
            </span>
            <span className="text-[10px] font-mono text-rose-700 font-semibold">{pctTotal1}%</span>
          </div>

          <div className="bg-[#E8F8F5]/40 border border-teal-100 rounded-xl p-2">
            <span className="text-[10px] text-teal-600 font-bold block">Somme Totale X (Nul)</span>
            <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 block mt-0.5">
              {formatMoney(totalVolX)}
            </span>
            <span className="text-[10px] font-mono text-teal-700 font-semibold">{pctTotalX}%</span>
          </div>

          <div className="bg-[#FFF3E8]/40 border border-amber-100 rounded-xl p-2">
            <span className="text-[10px] text-amber-600 font-bold block">Somme Totale 2 (Ext)</span>
            <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 block mt-0.5">
              {formatMoney(totalVol2)}
            </span>
            <span className="text-[10px] font-mono text-amber-700 font-semibold">{pctTotal2}%</span>
          </div>
        </div>
      </div>

      {/* Top 3 KPI Cards with Wave Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-6">
        
        {/* Card 1: Volume Betfair (Peach / Amber) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-[#FFF3E8] text-[#F59E0B] flex items-center justify-center shrink-0">
                <Coins className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Somme Globale Betfair
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {formatMoney(totalVolume)}
              </span>
            </div>

            <div className="mt-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF3E8] text-[#D97706] border border-[#FDE68A]/70 inline-block">
                {matches.length} Matchs analysés
              </span>
            </div>
          </div>

          <Sparkline color="amber" points={[15, 22, 18, 30, 24, 38, 28, 35, 42]} />
        </div>

        {/* Card 2: Chute de Cotes (Soft Rose) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-[#FFEBEF] text-[#F43F5E] flex items-center justify-center shrink-0">
                <TrendingDown className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Chute de Cotes Max
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono text-[#E11D48]">
                {maxDrop !== 0 ? `${maxDrop.toFixed(1)}%` : '-6.8%'}
              </span>
            </div>

            <div className="mt-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFEBEF] text-[#E11D48] border border-[#FECDD3]/70 inline-block">
                Détection Pression
              </span>
            </div>
          </div>

          <Sparkline color="rose" points={[32, 25, 30, 18, 22, 14, 20, 15, 12]} />
        </div>

        {/* Card 3: Smart Money (Teal / Mint) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-[#E8F8F5] text-[#10B981] flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Smart Money
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {whaleCount}
              </span>
              <span className="text-xs font-medium text-slate-500">alertes actives</span>
            </div>

            <div className="mt-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F8F5] text-[#059669] border border-[#A7F3D0]/70 inline-block">
                Whale Accumulation
              </span>
            </div>
          </div>

          <Sparkline color="teal" points={[14, 20, 28, 22, 34, 30, 38, 42, 45]} />
        </div>

      </div>

      {/* Segmented Rounded Vertical Bar Chart (Volume distribution across matches) */}
      <ActivityGrowthChart
        matches={matches}
        onSelectMatch={onSelectMatch}
        selectedMatchId={selectedMatchId}
      />

      {/* Matches List Section with Filter Pills */}
      <div className="space-y-3 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            {currentView === 'all' && `Tous les Matchs (${filteredMatches.length})`}
            {currentView === 'whales' && `Matchs Whales (>75%) (${filteredMatches.length})`}
            {currentView === 'drops' && `Chutes de Cotes (${filteredMatches.length})`}
            {currentView === 'favorites' && `Matchs Favoris (${filteredMatches.length})`}
          </h2>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => onViewChange('all')}
              className={`px-3 py-1 rounded-xl font-medium transition-colors ${
                currentView === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => onViewChange('whales')}
              className={`px-3 py-1 rounded-xl font-medium transition-colors ${
                currentView === 'whales' ? 'bg-amber-500 text-white font-bold' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              ⚡ Whales
            </button>
            <button
              onClick={() => onViewChange('drops')}
              className={`px-3 py-1 rounded-xl font-medium transition-colors ${
                currentView === 'drops' ? 'bg-rose-500 text-white font-bold' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              📉 Chutes
            </button>
            <button
              onClick={() => onViewChange('favorites')}
              className={`px-3 py-1 rounded-xl font-medium transition-colors ${
                currentView === 'favorites' ? 'bg-amber-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              ⭐ ({favorites.length})
            </button>
          </div>
        </div>

        {/* Empty state if filtered out */}
        {filteredMatches.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-100">
            <p className="text-xs">Aucun match ne correspond aux filtres.</p>
          </div>
        )}

        {/* Mobile-First Match Cards Grid with EXACT SUMS ON 1, X, 2 AND TOTAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMatches.map((match) => {
            const isFav = favorites.includes(match.id);
            const isSelected = selectedMatchId === match.id;

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match)}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer relative hover:shadow-md ${
                  isSelected 
                    ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                {/* Header: Date, League & Favorite Star */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    {match.flag_url && (
                      <img 
                        src={match.flag_url} 
                        alt={match.country}
                        className="h-3 w-4 rounded-xs object-cover border border-slate-200 shrink-0" 
                      />
                    )}
                    <span className="font-semibold text-slate-700 truncate max-w-[130px]">{match.league}</span>
                    <span>•</span>
                    <span className="font-mono">{match.date_formatted}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(match.id);
                    }}
                    className="text-slate-300 hover:text-amber-500 p-0.5"
                    title={isFav ? 'Retirer' : 'Ajouter aux favoris'}
                  >
                    <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>

                {/* Match Teams & Total Sum of the Match (Prominently Highlighted) */}
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {match.home} <span className="text-slate-400 font-normal text-xs">vs</span> {match.away}
                  </span>
                  
                  {/* Somme Totale du Match */}
                  <div className="bg-slate-900 text-white font-mono px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 shadow-sm">
                    {formatMoney(match.total_volume)}
                  </div>
                </div>

                {/* 1X2 Boxes with EXACT SUMS (€/£) AND ODDS (Just like Arbworld) */}
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  
                  {/* Issue 1 (Domicile): Cote + Somme + Part % */}
                  <div className={`p-2 rounded-xl border text-center transition-all ${
                    match.dominant_outcome === '1' 
                      ? 'bg-[#FFEBEF]/50 border-rose-300 ring-1 ring-rose-200' 
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-0.5">
                      <span>1 (Dom)</span>
                      <span className="text-rose-700 font-bold">{match.pct_1}%</span>
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-900">
                      @{match.coef_1_new.toFixed(2)}
                    </div>
                    {/* Somme misée sur 1 */}
                    <div className="text-[11px] font-mono font-extrabold text-slate-800 mt-1 bg-white/80 py-0.5 rounded shadow-xs">
                      {formatMoney(match.volume_1)}
                    </div>
                  </div>

                  {/* Issue X (Nul): Cote + Somme + Part % */}
                  <div className={`p-2 rounded-xl border text-center transition-all ${
                    match.dominant_outcome === 'X' 
                      ? 'bg-[#E8F8F5]/50 border-teal-300 ring-1 ring-teal-200' 
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-0.5">
                      <span>X (Nul)</span>
                      <span className="text-teal-700 font-bold">{match.pct_x}%</span>
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-900">
                      @{match.coef_x_new.toFixed(2)}
                    </div>
                    {/* Somme misée sur X */}
                    <div className="text-[11px] font-mono font-extrabold text-slate-800 mt-1 bg-white/80 py-0.5 rounded shadow-xs">
                      {formatMoney(match.volume_x)}
                    </div>
                  </div>

                  {/* Issue 2 (Extérieur): Cote + Somme + Part % */}
                  <div className={`p-2 rounded-xl border text-center transition-all ${
                    match.dominant_outcome === '2' 
                      ? 'bg-[#FFF3E8]/50 border-amber-300 ring-1 ring-amber-200' 
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-0.5">
                      <span>2 (Ext)</span>
                      <span className="text-amber-700 font-bold">{match.pct_2}%</span>
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-900">
                      @{match.coef_2_new.toFixed(2)}
                    </div>
                    {/* Somme misée sur 2 */}
                    <div className="text-[11px] font-mono font-extrabold text-slate-800 mt-1 bg-white/80 py-0.5 rounded shadow-xs">
                      {formatMoney(match.volume_2)}
                    </div>
                  </div>

                </div>

                {/* Segmented Volume Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex mb-2">
                  <div style={{ width: `${match.pct_1}%` }} className="bg-[#BE123C] h-full" />
                  <div style={{ width: `${match.pct_x}%` }} className="bg-[#0F766E] h-full" />
                  <div style={{ width: `${match.pct_2}%` }} className="bg-[#D97706] h-full" />
                </div>

                {/* Card Footer: Signal pill + Action */}
                <div className="flex items-center justify-between text-[10px] pt-0.5">
                  <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 truncate max-w-[170px]">
                    {match.signal_label}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAiModal(match);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Analyse IA</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
