import type { VercelRequest, VercelResponse } from "@vercel/node";

// 1×1 transparent PNG — last resort when no tile exists at any zoom level
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const MIN_FALLBACK_ZOOM = 13;

async function fetchEsriTile(
  z: number,
  y: number,
  x: number,
  apiKey: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const url = `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}?token=${apiKey}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.startsWith("image/")) return null;
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { z, y, x } = req.query;

  const apiKey = process.env.ESRI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ESRI_API_KEY not configured" });
  }

  const zn = parseInt(z as string, 10);
  const yn = parseInt(y as string, 10);
  const xn = parseInt(x as string, 10);

  if (isNaN(zn) || isNaN(yn) || isNaN(xn)) {
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(TRANSPARENT_PNG);
  }

  // Try the requested zoom, then fall back one level at a time until MIN_FALLBACK_ZOOM.
  // This gives pixelated-but-visible tiles in areas where ESRI has no high-zoom coverage,
  // while still serving max-resolution tiles where they exist.
  for (let zoom = zn; zoom >= MIN_FALLBACK_ZOOM; zoom--) {
    const delta = zn - zoom;
    // Translate tile coordinates to the equivalent tile at a lower zoom
    const ty = Math.floor(yn / 2 ** delta);
    const tx = Math.floor(xn / 2 ** delta);

    const result = await fetchEsriTile(zoom, ty, tx, apiKey);
    if (result) {
      res.setHeader("Content-Type", result.contentType);
      // Cache fallback tiles shorter so they get replaced when higher-res data arrives
      const ttl = delta === 0 ? 2592000 : 86400;
      res.setHeader("Cache-Control", `s-maxage=${ttl}, stale-while-revalidate`);
      return res.status(200).send(result.buffer);
    }
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
  return res.status(200).send(TRANSPARENT_PNG);
}
