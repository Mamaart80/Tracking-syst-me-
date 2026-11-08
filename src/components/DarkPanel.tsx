import React from 'react';
import { 
  ChevronDown, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  ExternalLink, 
  LineChart, 
  ShieldCheck, 
  Flame,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { ScrapedMatch } from '../types';

interface DarkPanelProps {
  selectedMatch: ScrapedMatch | null;
  onOpenAiModal: (match: ScrapedMatch) => void;
  matches: ScrapedMatch[];
  onSelectMatch: (match: ScrapedMatch) => void;
}

export const DarkPanel: React.FC<DarkPanelProps> = ({
  selectedMatch,
  onOpenAiModal,
  matches,
  onSelectMatch,
}) => {
  const currentMatch = selectedMatch || matches[0];

  if (!currentMatch) return null;

  const formatMoney = (num: number) => {
    return '£' + Math.round(num).toLocaleString('en-GB');
  };

  const isDominant1 = currentMatch.dominant_outcome === '1';
  const isDominantX = currentMatch.dominant_outcome === 'X';
  const isDominant2 = currentMatch.dominant_outcome === '2';

  return (
    <aside className="w-full lg:w-[380px] bg-[#22262B] text-white p-6 sm:p-7 rounded-3xl lg:rounded-r-[32px] lg:rounded-l-none flex flex-col justify-between shrink-0 shadow-2xl">
      
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Analyse du Match
            </h2>
            <p className="text-[11px] text-slate-400">Détails des flux Betfair en direct</p>
          </div>

          <div className="relative">
            <select
              aria-label="Changer de match"
              value={currentMatch.id}
              onChange={(e) => {
                const found = matches.find(m => m.id === e.target.value);
                if (found) onSelectMatch(found);
              }}
              className="appearance-none bg-[#2D3239] text-xs text-slate-200 font-medium pl-3 pr-7 py-1.5 rounded-xl border border-slate-700/60 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.home.slice(0, 10)} vs {m.away.slice(0, 10)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Selected Match Card */}
        <div className="bg-[#2A2F36] rounded-2xl p-4 mb-4 border border-slate-700/50">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <div className="flex items-center gap-1.5 truncate">
              {currentMatch.flag_url && (
                <img 
                  src={currentMatch.flag_url} 
                  alt={currentMatch.country}
                  className="h-3 w-4 rounded-xs object-cover border border-slate-600 shrink-0" 
                />
              )}
              <span className="truncate max-w-[150px] font-medium text-slate-300">{currentMatch.league}</span>
            </div>
            <span className="font-mono text-slate-400">{currentMatch.date_formatted}</span>
          </div>

          <h3 className="text-base font-bold text-white mb-2 leading-snug">
            {currentMatch.home} <span className="text-slate-400 font-normal text-xs">vs</span> {currentMatch.away}
          </h3>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
            <span className="text-slate-400">Volume Total :</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white">{formatMoney(currentMatch.total_volume)}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentMatch.liquidity_tier}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Outcome Breakdown Cards (White Cards like the reference image) */}
        <div className="space-y-2 mb-4">
          
          {/* Issue 1: Domicile */}
          <div className={`rounded-xl p-3 text-slate-900 transition-all ${
            isDominant1 
              ? 'bg-white ring-2 ring-emerald-500 shadow-md' 
              : 'bg-white/95'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold truncate">
                1 • {currentMatch.home}
              </span>
              <span className="text-xs font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                {currentMatch.pct_1}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Cote:</span>
                <span className="font-bold text-slate-900">@{currentMatch.coef_1_new.toFixed(2)}</span>
                {currentMatch.drop_1_pct !== 0 && (
                  <span className={`text-[10px] font-semibold flex items-center ${currentMatch.drop_1_pct < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {currentMatch.drop_1_pct < 0 ? <ArrowDown className="h-3 w-3 inline" /> : <ArrowUp className="h-3 w-3 inline" />}
                    {currentMatch.drop_1_pct}%
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-800 font-extrabold">
                {formatMoney(currentMatch.volume_1)}
              </span>
            </div>
          </div>

          {/* Issue X: Nul */}
          <div className={`rounded-xl p-3 text-slate-900 transition-all ${
            isDominantX 
              ? 'bg-white ring-2 ring-emerald-500 shadow-md' 
              : 'bg-white/95'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold truncate">
                X • Match Nul
              </span>
              <span className="text-xs font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                {currentMatch.pct_x}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Cote:</span>
                <span className="font-bold text-slate-900">@{currentMatch.coef_x_new.toFixed(2)}</span>
                {currentMatch.drop_x_pct !== 0 && (
                  <span className={`text-[10px] font-semibold flex items-center ${currentMatch.drop_x_pct < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {currentMatch.drop_x_pct < 0 ? <ArrowDown className="h-3 w-3 inline" /> : <ArrowUp className="h-3 w-3 inline" />}
                    {currentMatch.drop_x_pct}%
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-800 font-extrabold">
                {formatMoney(currentMatch.volume_x)}
              </span>
            </div>
          </div>

          {/* Issue 2: Extérieur */}
          <div className={`rounded-xl p-3 text-slate-900 transition-all ${
            isDominant2 
              ? 'bg-white ring-2 ring-emerald-500 shadow-md' 
              : 'bg-white/95'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold truncate">
                2 • {currentMatch.away}
              </span>
              <span className="text-xs font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                {currentMatch.pct_2}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Cote:</span>
                <span className="font-bold text-slate-900">@{currentMatch.coef_2_new.toFixed(2)}</span>
                {currentMatch.drop_2_pct !== 0 && (
                  <span className={`text-[10px] font-semibold flex items-center ${currentMatch.drop_2_pct < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {currentMatch.drop_2_pct < 0 ? <ArrowDown className="h-3 w-3 inline" /> : <ArrowUp className="h-3 w-3 inline" />}
                    {currentMatch.drop_2_pct}%
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-800 font-extrabold">
                {formatMoney(currentMatch.volume_2)}
              </span>
            </div>
          </div>

        </div>

        {/* Smart Money Signal Gauge Card */}
        <div className="bg-[#2A2F36] rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-semibold">Indicateur Smart Money</span>
            <span className="font-mono font-bold text-emerald-400">
              {currentMatch.smart_money_score}/100
            </span>
          </div>

          {/* Gradient Spectrum Bar from reference image */}
          <div className="relative w-full h-2 rounded-full overflow-hidden bg-gradient-to-r from-[#70A1FF] via-[#2ED573] via-[#FED330] via-[#FF9F43] to-[#FF4757] my-2">
            <div 
              style={{ left: `${Math.min(96, Math.max(4, currentMatch.smart_money_score))}%` }}
              className="absolute top-0 bottom-0 w-2.5 h-2.5 -translate-x-1/2 -top-0.5 bg-white rounded-full ring-2 ring-slate-900 shadow-md"
            />
          </div>

          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
            {currentMatch.signal_label}
          </p>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
        <button
          onClick={() => onOpenAiModal(currentMatch)}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Lancer Analyse IA Smart Money</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={currentMatch.betfair_chart_url}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 rounded-xl bg-[#2D3239] hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
          >
            <LineChart className="h-3.5 w-3.5 text-cyan-400" />
            <span>Graphique</span>
          </a>

          <a
            href={currentMatch.betfair_market_url}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 rounded-xl bg-[#2D3239] hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
          >
            <span>Betfair</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        </div>
      </div>

    </aside>
  );
};
