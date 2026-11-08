import { ScrapedMatch } from '../types';

export function parseAndEnrichMatches(rawList: any[]): ScrapedMatch[] {
  return rawList.map((item, idx) => {
    const vol1 = Number(item.volume_1) || 0;
    const volX = Number(item.volume_x) || 0;
    const vol2 = Number(item.volume_2) || 0;
    const totalVol = Math.round((vol1 + volX + vol2) * 100) / 100;
    
    const pct1 = totalVol > 0 ? Math.round((vol1 / totalVol) * 1000) / 10 : 0;
    const pctX = totalVol > 0 ? Math.round((volX / totalVol) * 1000) / 10 : 0;
    const pct2 = totalVol > 0 ? Math.round((vol2 / totalVol) * 1000) / 10 : 0;
    
    const c1 = Number(item.coef_1) || 1;
    const cx = Number(item.coef_x) || 1;
    const c2 = Number(item.coef_2) || 1;
    
    const c1_new = Number(item.coef_1_new) || c1;
    const cx_new = Number(item.coef_x_new) || cx;
    const c2_new = Number(item.coef_2_new) || c2;
    
    // Drop percentage: negative means odds shortened (dropped), which is favorable/steaming
    const drop1 = c1 > 0 ? Math.round(((c1_new - c1) / c1) * 1000) / 10 : 0;
    const dropX = cx > 0 ? Math.round(((cx_new - cx) / cx) * 1000) / 10 : 0;
    const drop2 = c2 > 0 ? Math.round(((c2_new - c2) / c2) * 1000) / 10 : 0;
    
    // Implied probabilities (margin-inclusive)
    const imp1 = c1_new > 0 ? Math.round((1 / c1_new) * 1000) / 10 : 0;
    const impX = cx_new > 0 ? Math.round((1 / cx_new) * 1000) / 10 : 0;
    const imp2 = c2_new > 0 ? Math.round((1 / c2_new) * 1000) / 10 : 0;
    
    const div1 = Math.round((pct1 - imp1) * 10) / 10;
    const divX = Math.round((pctX - impX) * 10) / 10;
    const div2 = Math.round((pct2 - imp2) * 10) / 10;
    
    // Determine dominant outcome
    let dominant: '1' | 'X' | '2' = '1';
    let maxPct = pct1;
    if (pctX > maxPct) {
      dominant = 'X';
      maxPct = pctX;
    }
    if (pct2 > maxPct) {
      dominant = '2';
      maxPct = pct2;
    }
    
    // Liquidity tier
    let liquidityTier: ScrapedMatch['liquidity_tier'] = 'LOW';
    if (totalVol >= 50000) liquidityTier = 'WHALE';
    else if (totalVol >= 10000) liquidityTier = 'HIGH';
    else if (totalVol >= 1500) liquidityTier = 'MEDIUM';
    
    // Smart money calculation & Signal classification
    let score = 20;
    let signalType: ScrapedMatch['signal_type'] = 'BALANCED';
    let signalLabel = 'Flux Normal';
    let signalColor = 'text-slate-400 bg-slate-800/40 border-slate-700/50';
    
    const dominantDrop = dominant === '1' ? drop1 : dominant === 'X' ? dropX : drop2;
    const dominantOdds = dominant === '1' ? c1_new : dominant === 'X' ? cx_new : c2_new;
    
    // 1. Extreme Volume Concentration (Whale Accumulation)
    if (maxPct >= 80 && totalVol >= 3000) {
      score += 45;
      signalType = 'WHALE_ACCUMULATION';
      signalLabel = `Concentration Forte (${maxPct}% sur ${dominant})`;
      signalColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    } 
    // 2. Sharp Drop: Odds shortened significantly with serious volume
    else if (dominantDrop <= -8 && maxPct >= 60 && totalVol >= 1000) {
      score += 40;
      signalType = 'SHARP_DROP';
      signalLabel = `Chute de Cote (${dominantDrop}% sur ${dominant})`;
      signalColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
    }
    // 3. Underdog Surge: Heavy money backing high odds (odds > 2.70 with volume > 60%)
    else if (dominantOdds >= 2.60 && maxPct >= 55 && totalVol >= 1000) {
      score += 35;
      signalType = 'UNDERDOG_SURGE';
      signalLabel = `Anomalie Outsider (${maxPct}% @ ${dominantOdds.toFixed(2)})`;
      signalColor = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
    }
    // 4. Favorite Steam
    else if (dominantOdds <= 1.70 && maxPct >= 70) {
      score += 25;
      signalType = 'FAVORITE_STEAM';
      signalLabel = `Pression Favori (${maxPct}%)`;
      signalColor = 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30';
    }
    
    // Add bonus if liquidity is whale
    if (totalVol >= 50000) score += 20;
    else if (totalVol >= 10000) score += 10;
    
    // Cap score at 100
    score = Math.min(100, Math.max(10, score));

    const marketIdStr = String(item.market_id || '');
    const selectionIdStr = String(item.selection_id || '');
    
    // Format date readable in French
    let dateFormatted = item.date || '';
    try {
      const d = new Date(item.date);
      if (!isNaN(d.getTime())) {
        dateFormatted = d.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // fallback
    }

    return {
      id: `${item.market_id}_${item.selection_id}_${idx}`,
      date: item.date || '',
      date_formatted: dateFormatted,
      sport: item.sport || 1,
      country: item.country || 'GLOBAL',
      league: item.leage || item.league || 'Football',
      odds_type: item.odds_type || 'MATCH_ODDS',
      home: item.home || 'Équipe 1',
      away: item.away || 'Équipe 2',
      market_id: item.market_id,
      selection_id: item.selection_id,
      last_update: item.last_update || '',
      
      coef_1: c1,
      coef_x: cx,
      coef_2: c2,
      
      coef_1_new: c1_new,
      coef_x_new: cx_new,
      coef_2_new: c2_new,
      
      volume_1: vol1,
      volume_x: volX,
      volume_2: vol2,
      total_volume: totalVol,
      
      pct_1: pct1,
      pct_x: pctX,
      pct_2: pct2,
      
      drop_1_pct: drop1,
      drop_x_pct: dropX,
      drop_2_pct: drop2,
      
      implied_prob_1: imp1,
      implied_prob_x: impX,
      implied_prob_2: imp2,
      
      divergence_1: div1,
      divergence_x: divX,
      divergence_2: div2,
      
      dominant_outcome: dominant,
      dominant_pct: maxPct,
      smart_money_score: score,
      signal_type: signalType,
      signal_label: signalLabel,
      signal_color: signalColor,
      liquidity_tier: liquidityTier,
      
      betfair_chart_url: `https://graphs.betfair.com/1.${marketIdStr}/${selectionIdStr}/0`,
      betfair_market_url: `https://www.betfair.com/exchange/plus/football/market/1.${marketIdStr}`,
      flag_url: item.country ? `https://arbworld.net/assets/images/flags/${item.country}.webp` : ''
    };
  });
}
