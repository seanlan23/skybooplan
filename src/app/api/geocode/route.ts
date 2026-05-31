import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { query } = await req.json();
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.MAPBOX_SECRET_TOKEN}&limit=1`;
  const r = await fetch(url);
  const data = await r.json();
  const f = data.features?.[0];
  if (!f) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ lat: f.center[1], lng: f.center[0] });
}
