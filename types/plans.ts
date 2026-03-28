export type AlphaRoamCountry = {
  id: number;
  country_name: string;
  country_code: string;
  iso2: string;
  iso3: string;
  phone_code: string;
  position: number;
};

export type AlphaRoamPlan = {
  id: number;
  name: string;
  region: string | null;
  data: string | number | null;
  validity: string | number | null;
  planType: string | null;
  testPlan: boolean;
  singleUse: boolean;
  recharge_only: boolean;
  global_plan: boolean;
  price: string | number | null;
  cost_price?: string | number | null;
  package_id?: number | null;
  isRegional?: boolean;
  details?: string | null;
  countires?: AlphaRoamCountry[] | null;
};

export type AlphaRoamPlansResponse = {
  code: number;
  message: string;
  data: AlphaRoamPlan[];
};

export type NormalizedPlan = {
  id: number;
  name: string;
  region: string;
  dataGb: number | null;
  validityDays: number | null;
  planType: string;
  priceUsd: number | null;
  detailsText: string;
  countries: AlphaRoamCountry[];
};
