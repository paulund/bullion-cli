import dotenv from 'dotenv';
import { homedir } from 'os';
import { resolve } from 'path';
import type { CentralBankReservesResponse, LatestResponse, TimeseriesDay, TimeseriesResponse } from './types.js';

dotenv.config();
dotenv.config({ path: resolve(homedir(), '.config', 'bullion', '.env'), override: false });

const BASE_URL = 'https://api.bullionapi.dev';
const REQUEST_TIMEOUT_MS = 10_000;

export class BullionApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'BullionApiError';
  }
}

export interface CentralBankReserveFilters {
  country?: string;
  start?: string;
  end?: string;
}

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
  };
}

function getApiKey(): string {
  const key = process.env.BULLION_API_KEY;
  if (!key) {
    console.error('BULLION_API_KEY is not set.');
    console.error('');
    console.error('  Get a key at https://bullionapi.dev and configure it:');
    console.error('');
    console.error('  Option 1 — Set it in your shell profile (~/.zshrc, ~/.bashrc):');
    console.error('    export BULLION_API_KEY=your_key_here');
    console.error('');
    console.error('  Option 2 — Create ~/.config/bullion/.env:');
    console.error('    mkdir -p ~/.config/bullion && echo "BULLION_API_KEY=your_key_here" > ~/.config/bullion/.env');
    process.exit(1);
  }
  return key;
}

async function request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { 'X-API-Key': getApiKey() },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new BullionApiError(`Request to ${url.host} timed out after ${REQUEST_TIMEOUT_MS}ms`, null, 'timeout');
    }
    throw new BullionApiError(`Could not reach ${url.host}. Check your network connection.`, null, 'network_error');
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) {
    throw new BullionApiError(
      'Invalid API key. Get a valid key at https://bullionapi.dev and add it to ~/.config/bullion/.env',
      401,
      'invalid_api_key',
    );
  }

  if (res.status === 429) {
    throw new BullionApiError(
      'Rate limit exceeded. Wait a few minutes, or upgrade your plan at https://bullionapi.dev',
      429,
      'rate_limited',
    );
  }

  if (res.status >= 500) {
    throw new BullionApiError(
      'bullion-api is temporarily unavailable. Please try again in a moment.',
      res.status,
      'server_error',
    );
  }

  if (!res.ok) {
    const body = await res.text();
    let details: ApiErrorEnvelope['error'];
    try {
      details = (JSON.parse(body) as ApiErrorEnvelope).error;
    } catch {
      details = undefined;
    }

    if (details?.code === 'plan_required') {
      throw new BullionApiError(
        'This endpoint requires a Pro or Enterprise plan. Upgrade at https://bullionapi.dev',
        res.status,
        details.code,
      );
    }

    if (details?.code === 'email_not_verified') {
      throw new BullionApiError(
        'Verify your email address before using the API at https://bullionapi.dev',
        res.status,
        details.code,
      );
    }

    if (details?.code === 'data_unavailable') {
      throw new BullionApiError(
        'Central-bank reserve data is temporarily unavailable. Please try again later.',
        res.status,
        details.code,
      );
    }

    throw new BullionApiError(
      details?.message ? `API error (${res.status}): ${details.message}` : `API error (${res.status}): ${body}`,
      res.status,
      details?.code,
    );
  }

  return (await res.json()) as T;
}

export async function fetchLatest(currency = 'USD'): Promise<LatestResponse> {
  return request<LatestResponse>('/v1/latest', { currency });
}

export async function fetchTimeseries(
  currency: string,
  startDate: string,
  endDate: string,
): Promise<TimeseriesResponse> {
  return request<TimeseriesResponse>('/v1/timeseries', {
    currency,
    start_date: startDate,
    end_date: endDate,
  });
}

export async function fetchCentralBankReserves(
  filters: CentralBankReserveFilters = {},
): Promise<CentralBankReservesResponse> {
  const params: Record<string, string> = {};
  if (filters.country !== undefined) params.country = filters.country;
  if (filters.start !== undefined) params.start = filters.start;
  if (filters.end !== undefined) params.end = filters.end;
  return request<CentralBankReservesResponse>('/v1/central-bank-reserves', params);
}

// Re-export TimeseriesDay so callers don't need to import from types.ts directly
export type { TimeseriesDay };
