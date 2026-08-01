import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLatest, fetchTimeseries, fetchCentralBankReserves, BullionApiError } from './bullion-client.js';
import type { CentralBankReservesResponse, LatestResponse, TimeseriesResponse } from './types.js';

const sampleLatest: LatestResponse = {
  status: 'success',
  currency: 'USD',
  unit: 'toz',
  metals: { gold: 4527.86 },
  currencies: { USD: 1, EUR: 0.92 },
  timestamps: { metal: '2026-07-08T11:55:00Z', currency: '2026-07-08T11:55:00Z' },
};

const sampleTimeseries: TimeseriesResponse = {
  status: 'success',
  currency: 'USD',
  unit: 'toz',
  start_date: '2025-07-08',
  end_date: '2026-07-08',
  rates: {
    '2026-07-08': { date: '2026-07-08', metals: { gold: 4527.86 }, currencies: { USD: 1 } },
    '2025-07-08': { date: '2025-07-08', metals: { gold: 3342.47 }, currencies: { USD: 1 } },
  },
};

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
    warning:
      'Annual value changes combine holdings changes, gold-price movement, and revisions and do not measure tonnes bought or sold.',
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

describe('bullion-client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.BULLION_API_KEY = 'test-key-123';
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BULLION_API_KEY;
  });

  describe('fetchLatest', () => {
    it('returns parsed response on 200', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(sampleLatest), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      const result = await fetchLatest('USD');
      expect(result).toEqual(sampleLatest);

      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('api.bullionapi.dev/v1/latest');
      expect(calledUrl).toContain('currency=USD');

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      expect((init.headers as Record<string, string>)['X-API-Key']).toBe('test-key-123');
    });

    it('defaults to USD', async () => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(sampleLatest), { status: 200 }));
      await fetchLatest();
      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('currency=USD');
    });

    it('throws friendly error on 401', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
      await expect(fetchLatest('USD')).rejects.toThrow(/Invalid API key/);
    });

    it('throws BullionApiError instance on 401', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
      await expect(fetchLatest('USD')).rejects.toThrow(BullionApiError);
    });

    it('throws friendly error on 429', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));
      await expect(fetchLatest('USD')).rejects.toThrow(/Rate limit/);
    });

    it('throws friendly error on 500', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }));
      await expect(fetchLatest('USD')).rejects.toThrow(/temporarily unavailable/);
    });

    it('throws network error on fetch failure', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
      await expect(fetchLatest('USD')).rejects.toThrow(/Could not reach/);
    });
  });

  describe('fetchTimeseries', () => {
    it('returns parsed response on 200', async () => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(sampleTimeseries), { status: 200 }));

      const result = await fetchTimeseries('USD', '2025-07-08', '2026-07-08');
      expect(result).toEqual(sampleTimeseries);

      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('/v1/timeseries');
      expect(calledUrl).toContain('start_date=2025-07-08');
      expect(calledUrl).toContain('end_date=2026-07-08');
    });

    it('passes through API errors', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Server Error', { status: 500 }));
      await expect(fetchTimeseries('USD', '2025-07-08', '2026-07-08')).rejects.toThrow(/temporarily unavailable/);
    });
  });

  describe('fetchCentralBankReserves', () => {
    it('uses the endpoint default when no filters are supplied', async () => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(sampleReserves), { status: 200 }));

      await fetchCentralBankReserves();

      expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.bullionapi.dev/v1/central-bank-reserves');
    });

    it('forwards optional filters and returns the parsed response', async () => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(sampleReserves), { status: 200 }));

      const result = await fetchCentralBankReserves({ country: 'gb', start: '2020', end: '2025' });

      expect(result).toEqual(sampleReserves);
      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).toBe('https://api.bullionapi.dev/v1/central-bank-reserves?country=gb&start=2020&end=2025');
    });

    it('explains that reserves require an eligible plan', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'error',
            error: {
              code: 'plan_required',
              message: 'This endpoint requires one of these plans: pro, enterprise',
              required_plans: ['pro', 'enterprise'],
              plan: 'free',
            },
          }),
          { status: 403 },
        ),
      );

      await expect(fetchCentralBankReserves()).rejects.toMatchObject({
        code: 'plan_required',
        message: expect.stringContaining('Pro or Enterprise'),
      });
    });

    it('turns validation errors into actionable messages', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'error',
            error: { code: 'invalid_year', message: 'start and end must be four-digit years' },
          }),
          { status: 400 },
        ),
      );

      await expect(fetchCentralBankReserves({ start: '20' })).rejects.toThrow(/four-digit years/);
    });

    it('explains that email verification is required', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'error',
            error: { code: 'email_not_verified', message: 'Verify your email address before using the API' },
          }),
          { status: 403 },
        ),
      );

      await expect(fetchCentralBankReserves()).rejects.toMatchObject({
        code: 'email_not_verified',
        message: expect.stringContaining('Verify your email address'),
      });
    });

    it('explains when reserve data is unavailable', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'error',
            error: { code: 'data_unavailable', message: 'Central-bank reserve data is not available' },
          }),
          { status: 503 },
        ),
      );

      await expect(fetchCentralBankReserves()).rejects.toThrow(/temporarily unavailable/);
    });
  });
});
