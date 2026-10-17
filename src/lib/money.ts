// Money display. Balances, budgets and payments are stored and paid in USD; tenge is a
// display currency converted at the National Bank of Kazakhstan rate (see /api/fx).
// The current choice lives here so plain helpers like money() can read it; LanguageProvider
// updates it and re-renders the app when the viewer switches currency.

export type Currency = 'USD' | 'KZT';

const state: { currency: Currency; rate: number | null } = { currency: 'USD', rate: null };

export const setMoneyState = (currency: Currency, rate: number | null) => {
  state.currency = currency;
  state.rate = rate;
};
export const moneyState = () => state;

/** Always dollars — for amounts that are charged or paid in USD (invoices, payout requests). */
export const usd = (n: number, digits = 2) =>
  `$${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/** Tenge, rounded to whole tenge (tiyn are never shown). Narrow no-break spaces group digits. */
export const kzt = (n: number, rate = state.rate ?? 0) => `${Math.round((Number(n) || 0) * rate).toLocaleString('ru-RU')} ₸`;

/** In the viewer's display currency. `digits` applies to dollars only. */
export const money = (n: number, digits = 2) => (state.currency === 'KZT' && state.rate ? kzt(n) : usd(n, digits));

/** The same amount in the other currency, for a small secondary line ("≈ $56.25" / "≈ 25 432 ₸"). */
export const moneyAlt = (n: number, digits = 2) => {
  if (!state.rate) return '';
  return state.currency === 'KZT' ? usd(n, digits) : `≈ ${kzt(n)}`;
};

/** Default display currency when the viewer hasn't chosen one: Kazakhstan → tenge. */
export function guessCurrency(country?: string | null): Currency {
  if (country) return country.toUpperCase() === 'KZ' ? 'KZT' : 'USD';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return /^Asia\/(Almaty|Astana|Qostanay|Aqtobe|Aqtau|Atyrau|Oral|Qyzylorda)$/.test(tz) ? 'KZT' : 'USD';
  } catch {
    return 'USD';
  }
}
