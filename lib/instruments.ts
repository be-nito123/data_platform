export type DataType = 'price' | 'volume' | 'openInterest' | 'cot' | 'yield' | 'historical';

export interface InstrumentConfig {
  id: string;
  symbol: string;
  displayName: string;
  category: 'commodities' | 'rates' | 'forex' | 'equities' | 'crypto' | 'intermarket';
  description: string;
  availableDataTypes: DataType[];
  weatherAssetKey?: string;
  cotSheetKey?: string;
  priceSymbol?: string;
  hasVolume?: boolean;
  hasOpenInterest?: boolean;
  hasCOT?: boolean;
  hasYield?: boolean;
  isYield?: boolean;
  priceNotation?: "decimal" | "bond32";
  unit?: string;
  decimals?: number;
}

export const INSTRUMENTS: Record<string, InstrumentConfig> = {
  // COMMODITIES
  gold: { id: 'gold', symbol: 'XAU', displayName: 'Gold', category: 'commodities', description: 'Gold Futures · COMEX', availableDataTypes: ['price', 'volume', 'openInterest', 'cot'], weatherAssetKey: 'gold', cotSheetKey: 'COT GOLD', priceSymbol: '$', hasVolume: true, hasOpenInterest: true, hasCOT: true, unit: 'USD/oz', decimals: 2 },
  silver: { id: 'silver', symbol: 'XAG', displayName: 'Silver', category: 'commodities', description: 'Silver Futures · COMEX', availableDataTypes: ['price', 'volume', 'openInterest'], weatherAssetKey: 'silver', priceSymbol: '$', hasVolume: true, hasOpenInterest: true, hasCOT: false, unit: 'USD/oz', decimals: 3 },
  oil: { id: 'oil', symbol: 'CL', displayName: 'Crude Oil', category: 'commodities', description: 'WTI Crude Oil Futures · NYMEX', availableDataTypes: ['price', 'volume', 'openInterest'], weatherAssetKey: 'oil', priceSymbol: '$', hasVolume: true, hasOpenInterest: true, hasCOT: false, unit: 'USD/bbl', decimals: 2 },
  
  // RATES & YIELDS
  'us02y-bond': { id: 'us02y-bond', symbol: 'US02Y', displayName: 'US 2Y Bond', category: 'rates', description: '2-Year Treasury Bond Futures', availableDataTypes: ['price', 'volume', 'openInterest'], weatherAssetKey: 'us02y-bond', hasVolume: true, hasOpenInterest: true, hasCOT: false, priceNotation: 'bond32', unit: '32nds', decimals: 3 },
  'us10y-bond': { id: 'us10y-bond', symbol: 'US10Y', displayName: 'US 10Y Bond', category: 'rates', description: '10-Year Treasury Bond Futures', availableDataTypes: ['price', 'volume', 'openInterest', 'cot'], weatherAssetKey: 'us10y-bond', cotSheetKey: 'COT DXY / US BONDS', hasVolume: true, hasOpenInterest: true, hasCOT: true, priceNotation: 'bond32', unit: '32nds', decimals: 3 },
  'us02y-yield': { id: 'us02y-yield', symbol: 'US02Y', displayName: 'US 2Y Yield', category: 'rates', description: '2-Year Treasury Yield', availableDataTypes: ['yield', 'historical'], weatherAssetKey: 'us02y-yield', hasVolume: false, hasOpenInterest: false, hasYield: true, isYield: true, unit: '%', decimals: 3 },
  'us10y-yield': { id: 'us10y-yield', symbol: 'US10Y', displayName: 'US 10Y Yield', category: 'rates', description: '10-Year Treasury Yield', availableDataTypes: ['yield', 'historical'], weatherAssetKey: 'us10y-yield', hasVolume: false, hasOpenInterest: false, hasYield: true, isYield: true, unit: '%', decimals: 3 },
  'us30y-yield': { id: 'us30y-yield', symbol: 'US30Y', displayName: 'US 30Y Yield', category: 'rates', description: '30-Year Treasury Yield', availableDataTypes: ['yield', 'historical'], weatherAssetKey: 'us30y-yield', hasVolume: false, hasOpenInterest: false, hasYield: true, isYield: true, unit: '%', decimals: 3 },

  // FOREX
  dxy: { id: 'dxy', symbol: 'DXY', displayName: 'Dollar Index', category: 'forex', description: 'US Dollar Index Futures', availableDataTypes: ['price', 'volume', 'openInterest', 'cot'], weatherAssetKey: 'dxy', cotSheetKey: 'COT DXY / US BONDS', hasVolume: true, hasOpenInterest: true, hasCOT: true, unit: 'Index', decimals: 3 },
  jpy: { id: 'jpy', symbol: 'JPY', displayName: 'JPY Futures', category: 'forex', description: 'Japanese Yen Futures', availableDataTypes: ['price', 'volume', 'openInterest'], weatherAssetKey: 'jpy', hasVolume: true, hasOpenInterest: true, hasCOT: false, unit: 'USD/JPY', decimals: 5 },
  cad: { id: 'cad', symbol: 'CAD', displayName: 'CAD Futures', category: 'forex', description: 'Canadian Dollar Futures', availableDataTypes: ['price', 'volume', 'openInterest'], weatherAssetKey: 'cad', hasVolume: true, hasOpenInterest: true, hasCOT: false, unit: 'USD/CAD', decimals: 5 },
  swiss: { id: 'swiss', symbol: 'CHF', displayName: 'CHF Futures', category: 'forex', description: 'Swiss Franc Futures', availableDataTypes: ['price', 'volume', 'openInterest'], weatherAssetKey: 'swiss', hasVolume: true, hasOpenInterest: true, hasCOT: false, unit: 'USD/CHF', decimals: 5 },
  eurusd: { id: 'eurusd', symbol: 'EURUSD', displayName: 'EUR/USD', category: 'forex', description: 'Euro / US Dollar Futures', availableDataTypes: ['price', 'volume', 'openInterest', 'cot'], weatherAssetKey: 'eurusd', cotSheetKey: 'COT FOREX', hasVolume: true, hasOpenInterest: true, hasCOT: true, unit: 'EUR/USD', decimals: 5 },
  gbpusd: { id: 'gbpusd', symbol: 'GBPUSD', displayName: 'GBP/USD', category: 'forex', description: 'British Pound / US Dollar Futures', availableDataTypes: ['price', 'volume', 'openInterest', 'cot'], weatherAssetKey: 'gbpusd', cotSheetKey: 'COT FOREX', hasVolume: true, hasOpenInterest: true, hasCOT: true, unit: 'GBP/USD', decimals: 5 },

  // EQUITIES
  nasdaq100: { id: 'nasdaq100', symbol: 'NDX', displayName: 'Nasdaq 100', category: 'equities', description: 'Nasdaq 100 Futures', availableDataTypes: ['price', 'volume', 'openInterest', 'cot'], weatherAssetKey: 'nasdaq100', cotSheetKey: 'COT STOCK EXCHANGE', hasVolume: true, hasOpenInterest: true, hasCOT: true, unit: 'Index', decimals: 2 },
  sp500: { id: 'sp500', symbol: 'SPX', displayName: 'S&P 500', category: 'equities', description: 'S&P 500 Futures', availableDataTypes: ['price', 'volume', 'openInterest', 'cot'], weatherAssetKey: 'sp500', cotSheetKey: 'COT STOCK EXCHANGE', hasVolume: true, hasOpenInterest: true, hasCOT: true, unit: 'Index', decimals: 2 },
  us30: { id: 'us30', symbol: 'US30', displayName: 'US 30', category: 'equities', description: 'Dow Jones Futures', availableDataTypes: ['price', 'volume', 'openInterest'], weatherAssetKey: 'us30', hasVolume: true, hasOpenInterest: true, hasCOT: false, unit: 'Index', decimals: 0 },

  // CRYPTO
  btc: { id: 'btc', symbol: 'BTC', displayName: 'Bitcoin', category: 'crypto', description: 'Bitcoin Futures', availableDataTypes: ['price', 'volume', 'openInterest', 'cot'], weatherAssetKey: 'btc', cotSheetKey: 'COT BTC / ETH', hasVolume: true, hasOpenInterest: true, hasCOT: true, unit: 'USD', decimals: 0 },
  eth: { id: 'eth', symbol: 'ETH', displayName: 'Ethereum', category: 'crypto', description: 'Ethereum Futures', availableDataTypes: ['price', 'volume', 'openInterest', 'cot'], weatherAssetKey: 'eth', cotSheetKey: 'COT BTC / ETH', hasVolume: true, hasOpenInterest: true, hasCOT: true, unit: 'USD', decimals: 2 },
  
  // INTERMARKET
  gsr: { id: 'gsr', symbol: 'GSR', displayName: 'Gold/Silver Ratio', category: 'intermarket', description: 'Gold to Silver Ratio', availableDataTypes: ['price', 'historical'], weatherAssetKey: 'gsr', hasVolume: false, hasOpenInterest: false, hasCOT: false, unit: 'Ratio', decimals: 2 },
};

export const CATEGORIES = {
  commodities: { id: 'commodities', label: 'COMMODITIES', instruments: ['gold', 'silver', 'oil'], order: 1 },
  rates: { id: 'rates', label: 'RATES & YIELDS', instruments: ['us02y-bond', 'us10y-bond', 'us02y-yield', 'us10y-yield', 'us30y-yield'], order: 2 },
  forex: { id: 'forex', label: 'FOREX', instruments: ['dxy', 'jpy', 'cad', 'swiss', 'eurusd', 'gbpusd'], order: 3 },
  equities: { id: 'equities', label: 'EQUITIES / INDICES', instruments: ['nasdaq100', 'sp500', 'us30'], order: 4 },
  crypto: { id: 'crypto', label: 'CRYPTO', instruments: ['btc', 'eth'], order: 5 },
  intermarket: { id: 'intermarket', label: 'INTERMARKET / RATIOS', instruments: ['gsr'], order: 6 },
};

export type CategoryId = keyof typeof CATEGORIES;

export function getInstrument(id: string): InstrumentConfig | undefined {
  return INSTRUMENTS[id];
}

export function getInstrumentsByCategory(category: CategoryId): InstrumentConfig[] {
  return CATEGORIES[category].instruments.map(id => INSTRUMENTS[id]).filter(Boolean);
}

export function getAllInstruments(): InstrumentConfig[] {
  return Object.values(INSTRUMENTS);
}

export function searchInstruments(query: string): InstrumentConfig[] {
  const lower = query.toLowerCase();
  return Object.values(INSTRUMENTS).filter(inst =>
    inst.id.toLowerCase().includes(lower) ||
    inst.symbol.toLowerCase().includes(lower) ||
    inst.displayName.toLowerCase().includes(lower)
  );
}