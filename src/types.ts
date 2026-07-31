export interface LatestResponse {
  status: string;
  currency: string;
  unit: string;
  metals: Record<string, number>;
  currencies: Record<string, number>;
  timestamps: {
    metal: string;
    currency: string;
  };
}

export interface TimeseriesDay {
  currencies: Record<string, number>;
  date: string;
  metals: Record<string, number>;
}

export interface TimeseriesResponse {
  status: string;
  currency: string;
  unit: string;
  start_date: string;
  end_date: string;
  rates: Record<string, TimeseriesDay>;
}

export interface CentralBankReserve {
  country: string;
  country_iso3: string;
  country_name: string;
  as_of_year: number;
  total_reserves_usd: number;
  reserves_excluding_gold_usd: number;
  gold_reserve_value_usd: number | null;
  gold_share_pct: number | null;
  annual_gold_value_change_usd: number | null;
  data_quality: string | null;
}

export interface CentralBankReservesResponse {
  status: string;
  source: {
    name: string;
    underlying_provider: string;
    url: string;
    terms_url: string;
    available_free_of_charge: boolean;
  };
  methodology: {
    gold_reserve_value_usd: string;
    annual_gold_value_change_usd: string;
    transformation_notice: string;
    warning: string;
  };
  coverage: {
    countries: number;
    start_year: number | null;
    end_year: number | null;
    source_updated_at: string;
    fetched_at: string;
  };
  reserves: CentralBankReserve[];
}

export interface AssetConfig {
  id: string;
  label: string;
  symbol: string;
  apiKey: string;
}

export interface PeriodChange {
  label: string;
  days: number;
  historicalPrice: number | null;
  diff: number | null;
  percentChange: number | null;
}

export interface PriceReport {
  name: string;
  symbol: string;
  currency: string;
  currentPrice: number;
  changes: PeriodChange[];
}
