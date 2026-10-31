export type ParsedInput = { amount: number; category: string };

const SUFFIXES: Record<string, number> = {
  к: 1_000,
  k: 1_000,
  kk: 1_000_000,
  м: 1_000_000,
  m: 1_000_000,
  млн: 1_000_000,
  тыч: 1_000,
  т: 1_000,
};

const parseNumber = (token: string): number | null => {
  const cleaned = token.replace(',', '.').replace(/(?<=\d)[_ ](?=\d)/g, '');
  const match = cleaned.toLowerCase().match(/^([+-]?)(\d+(?:\.\d+)?)([a-zа-яё]*)$/i);
  if (!match) return null;
  const [, sign, numStr, suffix] = match;
  const base = Number(numStr);
  if (Number.isNaN(base)) return null;
  const multiplier = SUFFIXES[suffix] ?? (suffix === '' ? 1 : null);
  if (multiplier === null) return null;
  const result = base * multiplier;
  return sign === '-' ? -Math.abs(result) : Math.abs(result);
};

export const parseInput = (raw: string, knownCategories: string[]): ParsedInput | null => {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return null;

  const numericIndices: number[] = [];
  tokens.forEach((token, index) => {
    if (parseNumber(token) !== null) numericIndices.push(index);
  });

  if (numericIndices.length === 0) return null;

  const numIdx = numericIndices[0];
  let amount = parseNumber(tokens[numIdx]) ?? 0;
  const rawSign = tokens[numIdx].trim().match(/^([+-])/);
  if (rawSign && rawSign[1] === '-') amount = -Math.abs(amount);

  const categoryTokens = tokens.filter((_, index) => index !== numIdx);
  if (categoryTokens.length === 0) return null;

  const rawCategory = categoryTokens.join(' ');
  const matched = knownCategories.find((name) => name.toLowerCase() === rawCategory.toLowerCase());
  const category = matched ?? (rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1));

  return { amount, category };
};
