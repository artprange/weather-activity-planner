type ForecastWindowType = {
  dates: string[];
  startDate: string;
  endDate: string;
};

type ForecastGridType = {
  latitude: number;
  longitude: number;
};

type WeatherHourType = {
  timestampMs: number;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  precipitationMm: number | null;
  liquidPrecipitationMm: number | null;
  snowDepthCm: number | null;
  windSpeedKmh: number | null;
  windGustsKmh: number | null;
  visibilityM: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
};

type WeatherForecastType = {
  timezone: string;
  window: ForecastWindowType;
  grid: ForecastGridType;
  hours: WeatherHourType[];
  daylight: {
    date: string;
    sunriseMs: number | null;
    sunsetMs: number | null;
  }[];
};

type MarineHourType = {
  timestampMs: number;
  waveHeightM: number | null;
  wavePeriodS: number | null;
};

enum MarineCoverageEnum {
  WITHIN_RANGE = 'WITHIN_RANGE',
  OUTSIDE_RANGE = 'OUTSIDE_RANGE',
  NO_MARINE_DATA = 'NO_MARINE_DATA',
}

type MarineForecastType = {
  timezone: string;
  window: ForecastWindowType;
  grid: ForecastGridType;
  gridDistanceKm: number;
  coverage: MarineCoverageEnum;
  hours: MarineHourType[];
};

export { MarineCoverageEnum };

export type {
  ForecastWindowType,
  ForecastGridType,
  WeatherHourType,
  WeatherForecastType,
  MarineHourType,
  MarineForecastType,
};
