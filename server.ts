import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

import { FALLBACK_RAW_DATA } from './src/data/fallbackData.js';

app.use(express.json());

// Enable CORS for iframe and client requests
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Initialize Google Gemini AI if valid API key is provided
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_')) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI with provided key:', err);
  }
}

// Memory cache to avoid spamming arbworld
interface CacheEntry {
  timestamp: number;
  data: any;
}
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 15000; // 15 seconds cache

export interface ScrapedMatch {
  id: string;
  date: string;
  date_formatted: string;
  sport: number;
  country: string;
  league: string;
  odds_type: string;
  home: string;
  away: string;
  market_id: number;
  selection_id: number;
  last_update: string;
  
  // Initial Odds
  coef_1: number;
  coef_x: number;
  coef_2: number;
  
  // Current / New Odds
  coef_1_new: number;
  coef_x_new: number;
  coef_2_new: number;
  
  // Traded Volume (£)
  volume_1: number;
  volume_x: number;
  volume_2: number;
  total_volume: number;
  
  // Percentages of Volume
  pct_1: number;
  pct_x: number;
  pct_2: number;
  
  // Odds Evolution (% drop/rise)
  drop_1_pct: number;
  drop_x_pct: number;
  drop_2_pct: number;
  
  // Implied Probabilities (%)
  implied_prob_1: number;
  implied_prob_x: number;
  implied_prob_2: number;
  
  // Divergences (Volume % - Implied Prob %)
  divergence_1: number;
  divergence_x: number;
  divergence_2: number;
  
  // Smart Money Analytics
  dominant_outcome: '1' | 'X' | '2';
  dominant_pct: number;
  smart_money_score: number; // 0 - 100
  signal_type: 'WHALE_ACCUMULATION' | 'SHARP_DROP' | 'UNDERDOG_SURGE' | 'FAVORITE_STEAM' | 'BALANCED';
  signal_label: string;
  signal_color: string;
  liquidity_tier: 'WHALE' | 'HIGH' | 'MEDIUM' | 'LOW';
  
  // External URLs
  betfair_chart_url: string;
  betfair_market_url: string;
  flag_url: string;
}

function parseAndEnrichMatches(rawList: any[]): ScrapedMatch[] {
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
    const dominantDiv = dominant === '1' ? div1 : dominant === 'X' ? divX : div2;
    
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

// Scrape Arbworld Endpoint with resilient timeout and fallback
async function scrapeArbworld(targetUrl: string, force = false): Promise<{ data: ScrapedMatch[]; meta: any }> {
  const now = Date.now();
  if (!force && cache[targetUrl] && (now - cache[targetUrl].timestamp) < CACHE_TTL_MS) {
    return cache[targetUrl].data;
  }

  let rawData: any[] = [];
  let meta: any = { source: targetUrl, scraped_at: new Date().toISOString() };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      const scriptRegex = /<script[^>]*>(\s*\{\s*\"success\"\s*:\s*true[\s\S]*?\})\s*<\/script>/;
      const match = html.match(scriptRegex);

      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          if (Array.isArray(parsed.data)) {
            rawData = parsed.data;
            meta.data_updated_at = parsed.data_updated_at;
            meta.data_age_seconds = parsed.data_age_seconds;
          }
        } catch (e) {
          console.error('Failed to parse embedded JSON from script:', e);
        }
      }
    } else {
      console.warn(`Arbworld HTTP ${response.status} on ${targetUrl}, using cached or fallback snapshot`);
    }
  } catch (err: any) {
    console.warn(`Arbworld fetch failed (${err.message}) on ${targetUrl}, using cached or fallback snapshot`);
  }

  // If live fetch failed or returned empty data, use existing cache or fallback snapshot
  if (rawData.length === 0) {
    if (cache[targetUrl] && cache[targetUrl].data?.data?.length > 0) {
      return {
        ...cache[targetUrl].data,
        meta: {
          ...cache[targetUrl].data.meta,
          is_stale: true,
          scraped_at: new Date().toISOString(),
        }
      };
    }

    if (FALLBACK_RAW_DATA && Array.isArray((FALLBACK_RAW_DATA as any).data)) {
      rawData = (FALLBACK_RAW_DATA as any).data;
      meta.data_updated_at = (FALLBACK_RAW_DATA as any).data_updated_at;
      meta.is_fallback = true;
    }
  }

  const enriched = parseAndEnrichMatches(rawData);
  const result = {
    data: enriched,
    meta: {
      ...meta,
      total_matches: enriched.length,
      total_volume_slate: enriched.reduce((sum, m) => sum + m.total_volume, 0),
    }
  };

  cache[targetUrl] = {
    timestamp: now,
    data: result,
  };

  return result;
}

// REST API Routes

// 1. Football 1X2 Moneyway (Primary target)
app.get('/api/moneyway/football/1x2', async (req: Request, res: Response) => {
  try {
    const force = req.query.force === 'true';
    const result = await scrapeArbworld('https://arbworld.net/fr/moneyway/football/1x2', force);
    res.json({
      success: true,
      url: 'https://arbworld.net/fr/moneyway/football/1x2',
      ...result,
    });
  } catch (error: any) {
    console.error('Error scraping 1X2:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du scraping de Arbworld Moneyway 1X2',
    });
  }
});

// 5. AI Smart Money Deep Match Analysis (Gemini)
app.post('/api/ai/analyze-match', async (req: Request, res: Response) => {
  try {
    const { match } = req.body;
    if (!match) {
      return res.status(400).json({ success: false, error: 'Données du match manquantes.' });
    }

    if (!ai) {
      // Provide algorithmic professional breakdown if Gemini API key not yet set
      const dominantTeam = match.dominant_outcome === '1' ? match.home : match.dominant_outcome === '2' ? match.away : 'Match Nul';
      const dropText = match.dominant_outcome === '1' ? match.drop_1_pct : match.dominant_outcome === '2' ? match.drop_2_pct : match.drop_x_pct;
      
      return res.json({
        success: true,
        source: 'heuristic',
        analysis: {
          headline: `Flux massif détecté sur ${dominantTeam} (${match.dominant_pct}% du volume)`,
          marketDynamic: `Le marché Betfair enregistre un volume de £${match.total_volume.toLocaleString()} dont £${(match.dominant_outcome === '1' ? match.volume_1 : match.dominant_outcome === '2' ? match.volume_2 : match.volume_x).toLocaleString()} concentrés sur le choix "${match.dominant_outcome}". La cote a varié de ${dropText}%.`,
          sharpVsPublic: match.dominant_pct >= 80 
            ? "Mouvement de type 'Whale Accumulation' : les capitaux professionnels écrasent l'offre sur ce marché." 
            : "Répartition active des volumes avec prise de position nette sur le favori du flux.",
          impliedVsReal: `Probabilité implicite des bookmakers : ${(match.dominant_outcome === '1' ? match.implied_prob_1 : match.dominant_outcome === '2' ? match.implied_prob_2 : match.implied_prob_x)}% contre ${(match.dominant_pct)}% des mises réelles sur Betfair (Écart de +${(match.dominant_pct - (match.dominant_outcome === '1' ? match.implied_prob_1 : match.dominant_outcome === '2' ? match.implied_prob_2 : match.implied_prob_x)).toFixed(1)}%).`,
          verdict: match.smart_money_score >= 70 ? 'Signal Fort (Smart Money confirmé)' : 'Signal Modéré',
          riskLevel: match.dominant_pct >= 85 ? 'Faible à Modéré (Forte conviction)' : 'Modéré',
          keyAdvice: `Surveillez la tenue de la cote avant le coup d'envoi. Si le volume continue de grimper sans rebond de la cote, le marché anticipe un avantage net.`
        }
      });
    }

    const prompt = `Tu es un expert mondial en analyse de flux de paris sportifs Betfair Exchange et Moneyway (Trading de cotes, détection de Sharp Money et Arbitrage).
Analyse les données suivantes pour ce match de football récupéré en direct sur Arbworld :

Match : ${match.home} vs ${match.away}
Ligue : ${match.league} (${match.country})
Date : ${match.date_formatted}
Volume total échangé : £${match.total_volume.toLocaleString()}

Cotes initiales : 1=${match.coef_1} | Nul=${match.coef_x} | 2=${match.coef_2}
Cotes actuelles : 1=${match.coef_1_new} | Nul=${match.coef_x_new} | 2=${match.coef_2_new}
Mouvement de cote : 1 (${match.drop_1_pct}%) | Nul (${match.drop_x_pct}%) | 2 (${match.drop_2_pct}%)

Répartition des volumes réels Betfair :
- 1 (${match.home}) : £${match.volume_1.toLocaleString()} (${match.pct_1}%)
- X (Match Nul) : £${match.volume_x.toLocaleString()} (${match.pct_x}%)
- 2 (${match.away}) : £${match.volume_2.toLocaleString()} (${match.pct_2}%)

Probabilités implicites des cotes : 1=${match.implied_prob_1}% | Nul=${match.implied_prob_x}% | 2=${match.implied_prob_2}%
Divergence Volume / Probabilité : 1 (${match.divergence_1}%) | 2 (${match.divergence_2}%)

Fournis une analyse concise, percutante et professionnelle structurée en JSON valide avec EXACTEMENT ces clés :
{
  "headline": "Titre percutant résumant le mouvement clé",
  "marketDynamic": "Explication de ce que racontent les flux d'argent sur ce match",
  "sharpVsPublic": "Est-ce un mouvement de Smart Money professionnel, un piège public, ou une baisse de cote justifiée ?",
  "impliedVsReal": "Analyse de la divergence entre les cotes proposées et les volumes réels posés",
  "verdict": "Verdict clair (ex: Signal Fort Smart Money / Valeur Détectée / Prudence / Piège)",
  "riskLevel": "Faible / Modéré / Élevé",
  "keyAdvice": "Conseil stratégique pour le parieur ou trader"
}
Réponds UNIQUEMENT avec le JSON, sans balise markdown superflu.`;

    let parsedAi: any = null;
    try {
      const responseContent = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = responseContent.text || '{}';
      parsedAi = JSON.parse(text);
    } catch (modelErr) {
      console.warn('gemini-3.8-flash error, falling back to heuristic:', modelErr);
      // Fallback heuristic if model fails
      const dominantTeam = match.dominant_outcome === '1' ? match.home : match.dominant_outcome === '2' ? match.away : 'Match Nul';
      const dropText = match.dominant_outcome === '1' ? match.drop_1_pct : match.dominant_outcome === '2' ? match.drop_2_pct : match.drop_x_pct;
      parsedAi = {
        headline: `Flux soutenu sur ${dominantTeam} (${match.dominant_pct}% du volume total)`,
        marketDynamic: `Volume échangé de £${match.total_volume.toLocaleString()} dont ${match.dominant_pct}% concentré sur ${dominantTeam}. La cote a varié de ${dropText}%.`,
        sharpVsPublic: match.dominant_pct >= 75 ? 'Pression nette des capitaux informés sur le marché d\'échange Betfair.' : 'Activité équilibrée avec avantage sur la sélection favorite.',
        impliedVsReal: `Probabilité implicite du bookmaker : ${(match.dominant_outcome === '1' ? match.implied_prob_1 : match.dominant_outcome === '2' ? match.implied_prob_2 : match.implied_prob_x)}% vs ${match.dominant_pct}% des mises réelles.`,
        verdict: match.smart_money_score >= 70 ? 'Signal Fort Smart Money' : 'Positionnement Standard',
        riskLevel: match.dominant_pct >= 80 ? 'Modéré' : 'Moyen',
        keyAdvice: `Surveillez la tenue de la cote avant le coup d'envoi. Un tassement continu confirme la tendance.`
      };
    }

    return res.json({
      success: true,
      source: 'gemini-3.8-flash',
      analysis: parsedAi,
    });
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Vite or static serving
async function setupVite() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MoneyWay Scraper & Analytics Server running on port ${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
