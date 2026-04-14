import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";

// Panel dimensions in metres (including 0.02m gap)
const PANEL_W = 1.134 + 0.02; // 1.154m
const PANEL_H = 1.762 + 0.02; // 1.782m
const KWP_PER_PANEL = 0.42;

export interface PackingResult {
  count: number;
  systemKwp: number;
}

/**
 * Counts how many panels fit inside a Leaflet polygon.
 *
 * @param latLngs - Array of [lat, lng] pairs from Leaflet (L.LatLng or plain tuples)
 */
export function packPanels(
  latLngs: Array<[number, number]>
): PackingResult {
  if (latLngs.length < 3) return { count: 0, systemKwp: 0 };

  // Leaflet: [lat, lng] → Turf: [lng, lat]
  const turfCoords = latLngs.map(([lat, lng]) => [lng, lat] as [number, number]);

  // Close the ring if needed
  const first = turfCoords[0];
  const last = turfCoords[turfCoords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    turfCoords.push(first);
  }

  const polygon: Feature<Polygon> = turf.polygon([turfCoords]);
  const bbox = turf.bbox(polygon); // [minLng, minLat, maxLng, maxLat]

  // Approximate metres-per-degree at the polygon's centroid latitude
  const centroid = turf.centroid(polygon);
  const centLat = centroid.geometry.coordinates[1];
  const latRad = (centLat * Math.PI) / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos(latRad);

  const stepLng = PANEL_W / metersPerDegLng;
  const stepLat = PANEL_H / metersPerDegLat;

  let count = 0;

  for (let lng = bbox[0] + stepLng / 2; lng < bbox[2]; lng += stepLng) {
    for (let lat = bbox[1] + stepLat / 2; lat < bbox[3]; lat += stepLat) {
      const pt = turf.point([lng, lat]);
      if (turf.booleanPointInPolygon(pt, polygon)) {
        count++;
      }
    }
  }

  return {
    count,
    systemKwp: count * KWP_PER_PANEL,
  };
}
