import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { z, y, x } = req.query;

  if (!z || !y || !x) {
    return res.status(400).json({ error: "Missing required parameters: z, y, x" });
  }

  const apiKey = process.env.ESRI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ESRI_API_KEY not configured" });
  }

  const url = `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}?token=${apiKey}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(url);
  } catch {
    return res.status(500).json({ error: "Failed to reach ESRI tile server" });
  }

  if (!upstreamRes.ok) {
    return res.status(502).json({ error: `ESRI upstream error: ${upstreamRes.status}` });
  }

  const contentType = upstreamRes.headers.get("content-type") ?? "image/jpeg";
  const buffer = await upstreamRes.arrayBuffer();

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "s-maxage=2592000, stale-while-revalidate");
  return res.status(200).send(Buffer.from(buffer));
}
