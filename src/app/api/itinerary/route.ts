import { NextResponse } from 'next/server';
import { TRAVEL_AGENT_SYSTEM } from '@/prompts/travelAgent';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const { destination, startDate, endDate, budgetEUR, travelers } = await req.json();
  const userPrompt = `Plan a trip to ${destination} from ${startDate} to ${endDate} for ${travelers} traveler(s) with a total budget of ${budgetEUR} EUR. Return the full Itinerary JSON.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      messages: [
        { role: 'system', content: TRAVEL_AGENT_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: await res.text() }, { status: res.status });
  }

  const data = await res.json();
  const itinerary = JSON.parse(data.choices[0].message.content);
  return NextResponse.json(itinerary);
}
