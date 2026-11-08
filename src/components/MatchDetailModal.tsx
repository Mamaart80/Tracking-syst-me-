import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  ExternalLink, 
  LineChart, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Brain, 
  DollarSign, 
  Flame, 
  Star,
  RefreshCw
} from 'lucide-react';
import { ScrapedMatch, AiMatchAnalysis } from '../types';

interface MatchDetailModalProps {
  match: ScrapedMatch | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiMatchAnalysis | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!match) return null;

  const formatGBP = (num: number) => '£' + Math.round(num).toLocaleString('fr-FR');

  const fetchAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/analyze-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Impossible de générer l\'analyse IA.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Erreur lors de la génération de l\'analyse');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b border-slate-800 bg-slate-950/90 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {match.flag_url && (
              <img 
                src={match.flag_url} 
                alt={match.country}
                className="h-5 w-7 rounded object-cover border border-slate-700 shadow-sm"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  {match.league} ({match.country})
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-mono">{match.date_formatted}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                <span>{match.home}</span>
                <span className="text-slate-500 font-normal">vs</span>
                <span>{match.away}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(match.id)}
              className={`p-2 rounded-lg border transition-colors ${
                isFavorite 
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' 
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Top Quick Overview Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Volume Total</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">{formatGBP(match.total_volume)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Issue Dominante</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {match.dominant_outcome} ({match.dominant_pct}%)
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Score Smart Money</div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                {match.smart_money_score}/100
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Liquidité Tier</div>
              <div className="text-sm font-semibold text-purple-300 mt-1">
                {match.liquidity_tier === 'WHALE' ? '🐋 Whale Pool (>£50k)' : match.liquidity_tier === 'HIGH' ? '💰 Forte' : 'Standard'}
              </div>
            </div>
          </div>

          {/* 3 Outcome Comparison Cards */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Analyse détaillée des 3 issues (1 - X - 2)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Outcome 1 (Home) */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                match.dominant_outcome === '1' 
                  ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30' 
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-400">1 • {match.home}</span>
                    <span className="text-xs font-mono font-bold text-white bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {match.pct_1}% du volume
                    </span>
                  </div>

                  {/* Odds info */}
                  <div className="mt-3 flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs text-slate-400">Cote Actuelle:</span>
                    <div className="flex items-baseline gap-2">
                      {match.coef_1 !== match.coef_1_new && (
                        <span className="text-xs text-slate-500 line-through font-mono">@{match.coef_1}</span>
                      )}
                      <span className="text-lg font-bold font-mono text-white">@{match.coef_1_new}</span>
                      <span className={`text-xs font-mono font-semibold ${match.drop_1_pct < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ({match.drop_1_pct > 0 ? `+${match.drop_1_pct}%` : `${match.drop_1_pct}%`})
                      </span>
                    </div>
                  </div>

                  {/* Volume amount */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">Volume Échangé:</span>
                    <span className="font-mono font-bold text-white">{formatGBP(match.volume_1)}</span>
                  </div>

                  {/* Implied Prob vs Volume share */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Prob. Implicite:</span>
                    <span className="font-mono text-slate-300">{match.implied_prob_1}%</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Divergence (Vol - Prob):</span>
                    <span className={`font-mono font-bold ${match.divergence_1 >= 15 ? 'text-emerald-400' : match.divergence_1 <= -15 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {match.divergence_1 > 0 ? `+${match.divergence_1}%` : `${match.divergence_1}%`}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  {match.divergence_1 >= 25 ? '🔥 Afflux massif bien supérieur aux probabilités du bookmaker' : 'Flux cohérent avec les probabilités'}
                </div>
              </div>

              {/* Outcome X (Draw) */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                match.dominant_outcome === 'X' 
                  ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30' 
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-amber-400">X • Match Nul</span>
                    <span className="text-xs font-mono font-bold text-white bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {match.pct_x}% du volume
                    </span>
                  </div>

                  {/* Odds info */}
                  <div className="mt-3 flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs text-slate-400">Cote Actuelle:</span>
                    <div className="flex items-baseline gap-2">
                      {match.coef_x !== match.coef_x_new && (
                        <span className="text-xs text-slate-500 line-through font-mono">@{match.coef_x}</span>
                      )}
                      <span className="text-lg font-bold font-mono text-white">@{match.coef_x_new}</span>
                      <span className={`text-xs font-mono font-semibold ${match.drop_x_pct < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ({match.drop_x_pct > 0 ? `+${match.drop_x_pct}%` : `${match.drop_x_pct}%`})
                      </span>
                    </div>
                  </div>

                  {/* Volume amount */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">Volume Échangé:</span>
                    <span className="font-mono font-bold text-white">{formatGBP(match.volume_x)}</span>
                  </div>

                  {/* Implied Prob vs Volume share */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Prob. Implicite:</span>
                    <span className="font-mono text-slate-300">{match.implied_prob_x}%</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Divergence (Vol - Prob):</span>
                    <span className={`font-mono font-bold ${match.divergence_x >= 15 ? 'text-amber-400' : match.divergence_x <= -15 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {match.divergence_x > 0 ? `+${match.divergence_x}%` : `${match.divergence_x}%`}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  {match.pct_x <= 5 ? 'Très peu de paris engagés sur le match nul' : 'Volume de couverture standard sur le nul'}
                </div>
              </div>

              {/* Outcome 2 (Away) */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                match.dominant_outcome === '2' 
                  ? 'bg-cyan-950/20 border-cyan-500/40 ring-1 ring-cyan-500/30' 
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-cyan-400">2 • {match.away}</span>
                    <span className="text-xs font-mono font-bold text-white bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      {match.pct_2}% du volume
                    </span>
                  </div>

                  {/* Odds info */}
                  <div className="mt-3 flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs text-slate-400">Cote Actuelle:</span>
                    <div className="flex items-baseline gap-2">
                      {match.coef_2 !== match.coef_2_new && (
                        <span className="text-xs text-slate-500 line-through font-mono">@{match.coef_2}</span>
                      )}
                      <span className="text-lg font-bold font-mono text-white">@{match.coef_2_new}</span>
                      <span className={`text-xs font-mono font-semibold ${match.drop_2_pct < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ({match.drop_2_pct > 0 ? `+${match.drop_2_pct}%` : `${match.drop_2_pct}%`})
                      </span>
                    </div>
                  </div>

                  {/* Volume amount */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">Volume Échangé:</span>
                    <span className="font-mono font-bold text-white">{formatGBP(match.volume_2)}</span>
                  </div>

                  {/* Implied Prob vs Volume share */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Prob. Implicite:</span>
                    <span className="font-mono text-slate-300">{match.implied_prob_2}%</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Divergence (Vol - Prob):</span>
                    <span className={`font-mono font-bold ${match.divergence_2 >= 15 ? 'text-cyan-400' : match.divergence_2 <= -15 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {match.divergence_2 > 0 ? `+${match.divergence_2}%` : `${match.divergence_2}%`}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  {match.divergence_2 >= 25 ? '🔥 Prise de position lourde sur la victoire extérieure' : 'Volume équilibré'}
                </div>
              </div>

            </div>
          </div>

          {/* AI Smart Money Deep Analysis Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Analyse Décisionnelle IA (Smart Money & Arbitrage)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Interprétation algorithmique & IA générative du carnet d'ordres Betfair
                  </p>
                </div>
              </div>

              <button
                onClick={fetchAiAnalysis}
                disabled={isAiLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all ${
                  isAiLoading
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/40 active:scale-95'
                }`}
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyse IA en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{aiAnalysis ? 'Réanalyser avec l\'IA' : 'Lancer l\'Analyse IA'}</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {aiAnalysis ? (
              <div className="space-y-4 text-xs mt-3">
                
                {/* Headline Banner */}
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white text-sm">{aiAnalysis.headline}</h5>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {aiAnalysis.verdict}
                      </span>
                      <span className="text-[10px] font-medium text-slate-300">
                        Risque estimé: <strong className="text-amber-300">{aiAnalysis.riskLevel}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Detail columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1">Dynamique de Marché:</span>
                    <p className="leading-relaxed text-slate-300">{aiAnalysis.marketDynamic}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1">Smart Money vs Masse Publique:</span>
                    <p className="leading-relaxed text-slate-300">{aiAnalysis.sharpVsPublic}</p>
                  </div>
                </div>

                {/* Key Advice */}
                <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-indigo-200">
                  <span className="font-semibold text-white block mb-1 flex items-center gap-1.5">
                    💡 Conseil Stratégique & Recommandation:
                  </span>
                  <p className="leading-relaxed">{aiAnalysis.keyAdvice}</p>
                </div>

              </div>
            ) : !isAiLoading ? (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-400">
                Cliquez sur <strong className="text-emerald-400">Lancer l'Analyse IA</strong> pour obtenir un décryptage complet du comportement des traders professionnels sur ce match.
              </div>
            ) : null}
          </div>

          {/* External Links Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Liens directs de vérification :</span>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={match.betfair_chart_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
              >
                <LineChart className="h-3.5 w-3.5 text-cyan-400" />
                <span>Graphique Betfair Live</span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </a>

              <a
                href={match.betfair_market_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
              >
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                <span>Marché Betfair Exchange</span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </a>

              <a
                href="https://arbworld.net/fr/moneyway/football/1x2"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
              >
                <span>Page Arbworld 1X2</span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
