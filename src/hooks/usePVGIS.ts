import { useEffect, useState } from "react";
import { City } from "../types";
import { ORIENTATION_ASPECT } from "../lib/constants";

interface UsePVGISParams {
  city: City;
  systemKwp: number;
  orientation: "south" | "east-west";
  tiltAngle?: number;
}

interface UsePVGISResult {
  annualKwh: number | null;
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, number>();

export function usePVGIS({
  city,
  systemKwp,
  orientation,
  tiltAngle = 35,
}: UsePVGISParams): UsePVGISResult {
  const [annualKwh, setAnnualKwh] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = `${city.id}-${systemKwp}-${orientation}-${tiltAngle}`;

    if (cache.has(cacheKey)) {
      setAnnualKwh(cache.get(cacheKey)!);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      lat: String(city.lat),
      lon: String(city.lng),
      peakpower: String(systemKwp),
      aspect: String(ORIENTATION_ASPECT[orientation]),
      angle: String(tiltAngle),
    });

    fetch(`/api/pvgis?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const value: number = data.outputs.totals.fixed.E_y;
        cache.set(cacheKey, value);
        setAnnualKwh(value);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [city, systemKwp, orientation, tiltAngle]);

  return { annualKwh, loading, error };
}

interface UsePVGISPerKwpParams {
  city: City;
  orientation: "south" | "east-west";
  tiltAngle?: number;
}

interface UsePVGISPerKwpResult {
  annualKwhPerKwp: number | null;
  loading: boolean;
  error: string | null;
}

const perKwpCache = new Map<string, number>();

export function usePVGISPerKwp({
  city,
  orientation,
  tiltAngle = 35,
}: UsePVGISPerKwpParams): UsePVGISPerKwpResult {
  const [annualKwhPerKwp, setAnnualKwhPerKwp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = `perkwp-${city.id}-${orientation}-${tiltAngle}`;

    if (perKwpCache.has(cacheKey)) {
      setAnnualKwhPerKwp(perKwpCache.get(cacheKey)!);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      lat: String(city.lat),
      lon: String(city.lng),
      peakpower: "1",
      aspect: String(ORIENTATION_ASPECT[orientation]),
      angle: String(tiltAngle),
    });

    fetch(`/api/pvgis?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const value: number = data.outputs.totals.fixed.E_y;
        perKwpCache.set(cacheKey, value);
        setAnnualKwhPerKwp(value);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [city, orientation, tiltAngle]);

  return { annualKwhPerKwp, loading, error };
}
