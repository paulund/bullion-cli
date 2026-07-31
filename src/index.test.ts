import { beforeEach, describe, expect, it, vi } from 'vitest';

const getPriceReports = vi.fn().mockResolvedValue([]);
const displayReports = vi.fn();
const displayReserves = vi.fn();

vi.mock('./prices.js', () => ({ getPriceReports }));
vi.mock('./format.js', () => ({ displayReports, displayReserves }));

const { createProgram } = await import('./index.js');

describe('CLI command routing', () => {
  beforeEach(() => {
    getPriceReports.mockClear();
    displayReports.mockClear();
    displayReserves.mockClear();
  });

  it('keeps the existing price report as the default invocation', async () => {
    const program = createProgram();

    await program.parseAsync(['node', 'bullion']);

    expect(getPriceReports).toHaveBeenCalledWith(undefined, 'USD');
    expect(displayReports).toHaveBeenCalledWith([]);
  });

  it('routes reserves options to the reserves endpoint and formatter', async () => {
    const response = { status: 'success', reserves: [] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    process.env.BULLION_API_KEY = 'test-key-123';

    try {
      const program = createProgram();
      await program.parseAsync(['node', 'bullion', 'reserves', '--country', 'GB', '--start', '2020', '--end', '2025']);

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        'https://api.bullionapi.dev/v1/central-bank-reserves?country=GB&start=2020&end=2025',
      );
      expect(displayReserves).toHaveBeenCalledWith(response);
      expect(getPriceReports).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      delete process.env.BULLION_API_KEY;
    }
  });
});
