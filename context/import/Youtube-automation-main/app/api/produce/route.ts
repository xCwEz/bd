import { NextResponse } from "next/server";

import { startProduce, tickProduce } from "@/lib/produce";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    episodeId?: string;
    action?: "start" | "tick";
  };

  if (!body.episodeId) {
    return NextResponse.json(
      { error: "episodeId is required." },
      { status: 400 },
    );
  }

  const action = body.action ?? "start";

  try {
    const episode =
      action === "tick"
        ? await tickProduce(body.episodeId)
        : await startProduce(body.episodeId);

    return NextResponse.json({ episode });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not produce episode.",
      },
      { status: 400 },
    );
  }
}
