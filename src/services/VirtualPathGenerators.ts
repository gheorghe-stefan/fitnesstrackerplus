import { IVirtualPathGenerator } from '../domain/VirtualGpsModels';

/**
 * Expanding Archimedean spiral around home origin.
 * Generates an synthetic non-road path so Strava cannot map-match to roads,
 * forcing Strava to honor the exact calculated treadmill elevation gain.
 */
export const SpiralPathGenerator: IVirtualPathGenerator = {
  id: 'spiral',
  name: 'Spiral Pattern (Strava Optimized)',
  getPosition(startLat: number, startLon: number, totalDistanceMeters: number) {
    if (totalDistanceMeters <= 0) {
      return { lat: startLat, lon: startLon };
    }

    const spacingMeters = 20; // 20m gap between spiral loops
    const phi = Math.sqrt((2 * totalDistanceMeters) / spacingMeters);
    const radiusMeters = (spacingMeters / (2 * Math.PI)) * phi;

    const deltaNorthMeters = radiusMeters * Math.cos(phi);
    const deltaEastMeters = radiusMeters * Math.sin(phi);

    const latOffsetDegrees = deltaNorthMeters / 111139;
    const latRad = (startLat * Math.PI) / 180;
    const lonOffsetDegrees = deltaEastMeters / (111139 * Math.cos(latRad));

    return {
      lat: Number((startLat + latOffsetDegrees).toFixed(6)),
      lon: Number((startLon + lonOffsetDegrees).toFixed(6)),
    };
  },
};

/**
 * 400m circular track around home origin.
 */
export const CircularTrackGenerator: IVirtualPathGenerator = {
  id: 'circular',
  name: '400m Circular Track',
  getPosition(startLat: number, startLon: number, totalDistanceMeters: number) {
    if (totalDistanceMeters <= 0) {
      return { lat: startLat, lon: startLon };
    }

    const trackRadiusMeters = 400 / (2 * Math.PI); // ~63.66m
    const angleRad = totalDistanceMeters / trackRadiusMeters;

    const deltaNorthMeters = trackRadiusMeters * Math.sin(angleRad);
    const deltaEastMeters = trackRadiusMeters * (1 - Math.cos(angleRad));

    const latOffsetDegrees = deltaNorthMeters / 111139;
    const latRad = (startLat * Math.PI) / 180;
    const lonOffsetDegrees = deltaEastMeters / (111139 * Math.cos(latRad));

    return {
      lat: Number((startLat + latOffsetDegrees).toFixed(6)),
      lon: Number((startLon + lonOffsetDegrees).toFixed(6)),
    };
  },
};

export const AvailablePathGenerators: Record<string, IVirtualPathGenerator> = {
  spiral: SpiralPathGenerator,
  circular: CircularTrackGenerator,
};
