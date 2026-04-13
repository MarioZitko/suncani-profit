import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { lat, lon, peakpower, aspect, angle } = req.query;

  if (!lat || !lon || !peakpower) {
    return res.status(400).json({ error: "Missing required parameters: lat, lon, peakpower" });
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    peakpower: String(peakpower),
    aspect: String(aspect ?? 0),
    angle: String(angle ?? 0),
    loss: "14",
    outputformat: "json",
    pvtechchoice: "crystSi",
    mountingplace: "building",
  });

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?${params}`);
  } catch {
    return res.status(500).json({ error: "Failed to reach PVGIS" });
  }

  if (!upstreamRes.ok) {
    return res.status(502).json({ error: `PVGIS upstream error: ${upstreamRes.status}` });
  }

  const data = await upstreamRes.json();

  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
  return res.status(200).json(data);
}
