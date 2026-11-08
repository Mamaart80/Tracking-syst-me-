/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NavigationRail, FilterView } from './components/NavigationRail';
import { HealthOverview } from './components/HealthOverview';
import { DarkPanel } from './components/DarkPanel';
import { MatchDetailModal } from './components/MatchDetailModal';
import { ScrapedMatch, ApiResponse } from './types';
import { FALLBACK_RAW_DATA } from './data/fallbackData';
import { parseAndEnrichMatches } from './utils/enrichMatches';
import { WifiOff, SlidersHorizontal, ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<FilterView>('all');
  
  // Mobile active screen toggle: 'feed' or 'inspector'
  const [mobileScreen, setMobileScreen] = useState<'feed' | 'inspector'>('feed');

  // Initialize matches immediately with parsed fallback matches so there is zero empty state
  const [matches, setMatches] = useState<ScrapedMatch[]>(() => {
    try {
      if (FALLBACK_RAW_DATA && Array.isArray((FALLBACK_RAW_DATA as any).data)) {
        return parseAndEnrichMatches((FALLBACK_RAW_DATA as any).data);
      }
    } catch (e) {
      console.warn('Fallback init error:', e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  });

  const [selectedMatch, setSelectedMatch] = useState<ScrapedMatch | null>(() => matches[0] || null);
  const [detailModalMatch, setDetailModalMatch] = useState<ScrapedMatch | null>(null);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('moneyway_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('moneyway_favorites', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Fetch Data Function with timeout and auto-recovery
  const fetchData = useCallback(async (force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = `/api/moneyway/football/1x2?force=${force}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(endpoint, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Erreur serveur HTTP ${res.status}`);
      }

      const json: ApiResponse = await res.json();
      if (!json.success || !Array.isArray(json.data)) {
        throw new Error(json.error || 'Format de données inattendu');
      }

      setMatches(json.data);
      if (!selectedMatch && json.data.length > 0) {
        setSelectedMatch(json.data[0]);
      }
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.warn('Fetch error caught:', err);
      setMatches(prev => {
        if (prev.length === 0 && FALLBACK_RAW_DATA && Array.isArray((FALLBACK_RAW_DATA as any).data)) {
          return parseAndEnrichMatches((FALLBACK_RAW_DATA as any).data);
        }
        return prev;
      });
      setError(`Mode hors-ligne synchronisé (${err.name === 'AbortError' ? 'délai dépassé' : err.message}). Les données restent accessibles.`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMatch]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export CSV handler
  const handleExport = () => {
    if (!matches.length) return;
    const headers = ['ID', 'Date', 'Ligue', 'Pays', 'Equipe 1', 'Equipe 2', 'Cote 1', 'Cote X', 'Cote 2', 'Volume Total GBP', 'Pct 1', 'Pct X', 'Pct 2', 'Signal'];
    const rows = matches.map(m => [
      m.id, `"${m.date_formatted}"`, `"${m.league}"`, m.country, `"${m.home}"`, `"${m.away}"`,
      m.coef_1_new, m.coef_x_new, m.coef_2_new, m.total_volume, m.pct_1, m.pct_x, m.pct_2, `"${m.signal_label}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `moneyway_football_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMatchSelect = (match: ScrapedMatch) => {
    setSelectedMatch(match);
    // On small screens, navigate to inspector view when tapping a match
    if (window.innerWidth < 1024) {
      setMobileScreen('inspector');
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EDF5] text-slate-800 p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-center font-sans antialiased pb-20 md:pb-6">
      
      {/* Outer Shell Wrapper */}
      <div className="w-full max-w-[1380px] bg-white rounded-3xl sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-200/60 overflow-hidden flex flex-col md:flex-row min-h-[88vh]">
        
        {/* 1. Left Slim Navigation Rail (Desktop sidebar / Mobile bottom bar) */}
        <NavigationRail
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setMobileScreen('feed');
          }}
          favoritesCount={favorites.length}
          onExport={handleExport}
        />

        {/* 2. Center Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Subtle Sync Warning Notice if offline */}
          {error && (
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchData(true)}
                className="font-bold underline text-amber-900 hover:text-amber-700 ml-3"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Mobile Back Header when in Inspector Mode */}
          {mobileScreen === 'inspector' && (
            <div className="lg:hidden bg-slate-900 text-white p-3 flex items-center justify-between border-b border-slate-800">
              <button
                onClick={() => setMobileScreen('feed')}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux matchs</span>
              </button>
              <span className="text-xs font-mono text-emerald-400">Détails Match</span>
            </div>
          )}

          {/* Content: On mobile toggles between feed and inspector; on desktop shows feed */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {mobileScreen === 'feed' ? (
              <HealthOverview
                matches={matches}
                isLoading={isLoading}
                onRefresh={() => fetchData(true)}
                lastUpdated={lastUpdated}
                onSelectMatch={handleMatchSelect}
                selectedMatchId={selectedMatch?.id}
                onOpenAiModal={setDetailModalMatch}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                currentView={currentView}
                onViewChange={setCurrentView}
              />
            ) : (
              <div className="lg:hidden p-4 bg-[#22262B] flex-1 overflow-y-auto">
                <DarkPanel
                  selectedMatch={selectedMatch}
                  onOpenAiModal={setDetailModalMatch}
                  matches={matches}
                  onSelectMatch={setSelectedMatch}
                />
              </div>
            )}
          </div>

        </div>

        {/* 3. Right Dark Panel (Always visible on Desktop side-by-side) */}
        <div className="hidden lg:flex">
          <DarkPanel
            selectedMatch={selectedMatch}
            onOpenAiModal={setDetailModalMatch}
            matches={matches}
            onSelectMatch={setSelectedMatch}
          />
        </div>

      </div>

      {/* Match Detail & AI Analysis Modal */}
      {detailModalMatch && (
        <MatchDetailModal
          match={detailModalMatch}
          onClose={() => setDetailModalMatch(null)}
          isFavorite={favorites.includes(detailModalMatch.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}

    </div>
  );
}
