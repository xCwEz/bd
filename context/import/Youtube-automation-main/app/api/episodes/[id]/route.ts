import { NextResponse } from "next/server";

import { deleteEpisode, getEpisode, updateEpisode } from "@/lib/store";
import type { Episode } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const episode = await getEpisode(id);
  if (!episode) {
    return NextResponse.json({ error: "Episode not found." }, { status: 404 });
  }
  return NextResponse.json({ episode });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as Partial<Episode>;

  // Never allow id / createdAt spoofing via patch
  const { id: _id, createdAt: _createdAt, ...safe } = body;
  void _id;
  void _createdAt;

  const episode = await updateEpisode(id, safe);
  if (!episode) {
    return NextResponse.json({ error: "Episode not found." }, { status: 404 });
  }
  return NextResponse.json({ episode });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const existing = await getEpisode(id);
  if (!existing) {
    return NextResponse.json({ error: "Episode not found." }, { status: 404 });
  }

  const ok = await deleteEpisode(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not delete episode." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
