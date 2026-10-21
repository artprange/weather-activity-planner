import { z } from 'zod';

import coastlineData from './data/coastline.json' with { type: 'json' };
import type { ForecastGridType } from '../forecasts/forecast.types.js';

const CoastalProximityConstants = {
  EARTH_RADIUS_KM: 6371,
  NEARBY_COAST_KM: 25,
  MAP_TOLERANCE_KM: 10,
};

type VectorType = [number, number, number];
type CoastSegmentType = {
  start: VectorType;
  end: VectorType;
  tangent: VectorType;
  angle: number;
};

const coordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);
const coastline = z
  .array(z.array(coordinateSchema).min(2))
  .min(1)
  .parse(coastlineData);

function toVector(longitude: number, latitude: number): VectorType {
  const lon = (longitude * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;
  return [
    Math.cos(lat) * Math.cos(lon),
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
  ];
}

function dot(a: VectorType, b: VectorType): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function clampCosine(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

const segments: CoastSegmentType[] = coastline.flatMap((line) => {
  const result: CoastSegmentType[] = [];
  for (let index = 1; index < line.length; index++) {
    const from = line[index - 1];
    const to = line[index];
    if (!from || !to) continue;
    const start = toVector(...from);
    const end = toVector(...to);
    const cosine = clampCosine(dot(start, end));
    const angle = Math.acos(cosine);
    if (angle < 1e-10) continue;
    const sine = Math.sin(angle);
    result.push({
      start,
      end,
      angle,
      tangent: [
        (end[0] - start[0] * cosine) / sine,
        (end[1] - start[1] * cosine) / sine,
        (end[2] - start[2] * cosine) / sine,
      ],
    });
  }
  return result;
});

function getCoastDistanceKm(location: ForecastGridType): number {
  coordinateSchema.parse([location.longitude, location.latitude]);
  const point = toVector(location.longitude, location.latitude);
  let nearestCosine = -1;
  for (const segment of segments) {
    const startDot = dot(point, segment.start);
    const tangentDot = dot(point, segment.tangent);
    const along = Math.atan2(tangentDot, startDot);
    const candidate =
      along >= 0 && along <= segment.angle
        ? Math.hypot(startDot, tangentDot)
        : Math.max(startDot, dot(point, segment.end));
    nearestCosine = Math.max(nearestCosine, candidate);
  }
  return (
    Math.acos(clampCosine(nearestCosine)) *
    CoastalProximityConstants.EARTH_RADIUS_KM
  );
}

function hasNearbyCoast(location: ForecastGridType): boolean {
  return (
    getCoastDistanceKm(location) <=
    CoastalProximityConstants.NEARBY_COAST_KM +
      CoastalProximityConstants.MAP_TOLERANCE_KM
  );
}

export { getCoastDistanceKm, hasNearbyCoast };
