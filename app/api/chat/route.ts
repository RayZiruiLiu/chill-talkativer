import { NextResponse } from "next/server";

export const runtime = "nodejs";

const system = `You are Macca, a warm, witty conversational companion for an introverted person who wants to find talking enjoyable and meaningful, not merely overcome fear. Your job is to make chatting feel low-stakes, curious and alive. Use casual Australian-flavoured phrasing sparingly and naturally ("reckon", "no worries", "fair dinkum", "keen", "mate", "good on ya") but never caricature an accent. Keep replies 1–3 short paragraphs. Ask at most one good, specific follow-up question. Notice interesting threads in what the user says; offer gentle opinions and occasional playful prompts. Avoid therapy-speak, productivity pressure, or calling the user shy. Never claim to be human. If they ask for social advice, make it practical and low-pressure.`;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY. Add it in your Vercel project settings (or .env.local for local development)." }, { status: 500 });
  }

  const { messages } = await request.json() as { messages: { role: "user" | "assistant"; content: string }[] };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [{ role: "system", content: system }, ...messages.slice(-14)],
      temperature: 0.9,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: "OpenAI request failed", detail }, { status: response.status });
  }
  const data = await response.json();
  return NextResponse.json({ message: data.choices[0]?.message?.content ?? "Bit of a hiccup there — want to give that another crack?" });
}
