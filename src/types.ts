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

export interface ApiResponse {
  success: boolean;
  url: string;
  data: ScrapedMatch[];
  meta: {
    source: string;
    scraped_at: string;
    data_updated_at?: string;
    data_age_seconds?: number;
    total_matches: number;
    total_volume_slate: number;
  };
  error?: string;
}

export interface AiMatchAnalysis {
  headline: string;
  marketDynamic: string;
  sharpVsPublic: string;
  impliedVsReal: string;
  verdict: string;
  riskLevel: string;
  keyAdvice: string;
}
