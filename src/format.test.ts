import { describe, it, expect } from 'vitest';
import { formatPrice, formatDiff, formatPct, formatReserves } from './format.js';
import type { CentralBankReservesResponse } from './types.js';

const sampleReserves: CentralBankReservesResponse = {
  status: 'success',
  source: {
    name: 'World Bank, World Development Indicators',
    underlying_provider: 'International Monetary Fund, International Financial Statistics',
    url: 'https://data.worldbank.org/',
    terms_url: 'https://data.worldbank.org/summary-terms-of-use',
    available_free_of_charge: true,
  },
  methodology: {
    gold_reserve_value_usd: 'total reserves including gold minus total reserves excluding gold',
    annual_gold_value_change_usd: 'current derived gold reserve value minus the prior calendar year',
    transformation_notice: 'Bullion API derives gold reserve values, shares, and annual value changes.',
    warning: 'Annual value changes do not measure tonnes bought or sold.',
  },
  coverage: {
    countries: 1,
    start_year: 2025,
    end_year: 2025,
    source_updated_at: '2026-07-13',
    fetched_at: '2026-07-30T07:10:00.000Z',
  },
  reserves: [
    {
      country: 'GB',
      country_iso3: 'GBR',
      country_name: 'United Kingdom',
      as_of_year: 2025,
      total_reserves_usd: 200_000_000_000,
      reserves_excluding_gold_usd: 175_000_000_000,
      gold_reserve_value_usd: 25_000_000_000,
      gold_share_pct: 12.5,
      annual_gold_value_change_usd: 10_000_000_000,
      data_quality: null,
    },
  ],
};

describe('formatPrice', () => {
  it('formats USD with $ prefix', () => {
    expect(formatPrice(1234.56, 'USD')).toBe('$1234.56');
  });

  it('formats EUR with € prefix', () => {
    expect(formatPrice(42.1, 'EUR')).toBe('\u20AC42.10');
  });

  it('formats GBP with £ prefix', () => {
    expect(formatPrice(99.99, 'GBP')).toBe('\u00A399.99');
  });

  it('formats unknown currencies with code suffix', () => {
    expect(formatPrice(50, 'JPY')).toBe('50.00 JPY');
  });

  it('returns N/A for null value', () => {
    expect(formatPrice(null, 'USD')).toBe('N/A');
  });
});

describe('formatDiff', () => {
  it('formats positive diff with + prefix', () => {
    expect(formatDiff(18.18, 'USD')).toBe('+$18.18');
  });

  it('formats negative diff with - prefix (no explicit minus — sign is on the number)', () => {
    expect(formatDiff(-38.3, 'GBP')).toBe('-\u00A338.30');
  });

  it('returns N/A for null', () => {
    expect(formatDiff(null, 'USD')).toBe('N/A');
  });
});

describe('formatPct', () => {
  it('formats positive percentage with +', () => {
    expect(formatPct(35.46)).toBe('+35.46%');
  });

  it('formats negative percentage (sign comes from the number)', () => {
    expect(formatPct(-3.86)).toBe('-3.86%');
  });

  it('returns N/A for null', () => {
    expect(formatPct(null)).toBe('N/A');
  });
});

describe('formatReserves', () => {
  it('renders reserve values, metadata, source, and methodology warning deterministically', () => {
    const output = formatReserves(sampleReserves);

    expect(output).toContain('United Kingdom (GB / GBR) — 2025');
    expect(output).toContain('Gold reserve value: $25,000,000,000.00');
    expect(output).toContain('Gold share: 12.50%');
    expect(output).toContain('Annual gold value change: +$10,000,000,000.00');
    expect(output).toContain('Source: World Bank, World Development Indicators');
    expect(output).toContain('Annual value changes do not measure tonnes bought or sold.');
  });
});
