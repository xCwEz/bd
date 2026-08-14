import { NextResponse } from "next/server";

import { createEpisode, listEpisodes } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const episodes = await listEpisodes();
  return NextResponse.json({ episodes });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json(
      { error: "Write a prompt for your short first." },
      { status: 400 },
    );
  }

  if (prompt.length > 2000) {
    return NextResponse.json(
      { error: "Keep prompts under 2000 characters." },
      { status: 400 },
    );
  }

  const episode = await createEpisode(prompt);
  return NextResponse.json({ episode }, { status: 201 });
}
