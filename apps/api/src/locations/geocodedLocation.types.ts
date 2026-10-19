type GeocodedLocationType = {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type { GeocodedLocationType };
