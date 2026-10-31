export type Currency = { code: string; symbol: string; name: string };

export const currencies: Currency[] = [
  { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'UAH', symbol: '₴', name: 'Украинская гривна' },
  { code: 'KZT', symbol: '₸', name: 'Казахстанский тенге' },
  { code: 'BYN', symbol: 'Br', name: 'Белорусский рубль' },
  { code: 'GBP', symbol: '£', name: 'Фунт стерлингов' },
  { code: 'TRY', symbol: '₺', name: 'Турецкая лира' },
];

const CURRENCY_KEY = 'fintrack-currency';
const RATES_KEY = 'fintrack-rates';
const RATES_TS_KEY = 'fintrack-rates-ts';
const RATES_TTL = 60 * 60 * 1000;

const fallbackRates: Record<string, number> = {
  USD: 1, EUR: 0.92, RUB: 92, UAH: 41, KZT: 480, BYN: 3.2, GBP: 0.79, TRY: 34,
};

export const getCurrency = (): Currency => {
  try {
    const code = localStorage.getItem(CURRENCY_KEY) || 'RUB';
    return currencies.find((c) => c.code === code) ?? currencies[0];
  } catch {
    return currencies[0];
  }
};

export const saveCurrency = (currency: Currency): void => {
  localStorage.setItem(CURRENCY_KEY, currency.code);
};

export type Rates = Record<string, number>;

export const loadCachedRates = (): { rates: Rates; timestamp: number } => {
  try {
    const ts = Number(localStorage.getItem(RATES_TS_KEY) || 0);
    const raw = localStorage.getItem(RATES_KEY);
    const rates = raw ? JSON.parse(raw) as Rates : fallbackRates;
    return { rates, timestamp: ts };
  } catch {
    return { rates: fallbackRates, timestamp: 0 };
  }
};

export const fetchRates = async (): Promise<Rates> => {
  const cached = loadCachedRates();
  if (Date.now() - cached.timestamp < RATES_TTL && Object.keys(cached.rates).length > 1) {
    return cached.rates;
  }
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json() as { rates: Record<string, number> };
    if (data.rates) {
      localStorage.setItem(RATES_KEY, JSON.stringify(data.rates));
      localStorage.setItem(RATES_TS_KEY, String(Date.now()));
      return data.rates;
    }
  } catch { /* network unavailable, use cached/fallback */ }
  return cached.rates;
};

export const convert = (amount: number, fromCode: string, toCode: string, rates: Rates): number => {
  if (fromCode === toCode) return amount;
  const fromRate = rates[fromCode] ?? fallbackRates[fromCode] ?? 1;
  const toRate = rates[toCode] ?? fallbackRates[toCode] ?? 1;
  return (amount / fromRate) * toRate;
};

export const formatMoney = (value: number, symbol: string): string =>
  `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Math.abs(value))} ${symbol}`;
