import { NextResponse } from "next/server";

import {
  readChannel,
  readTopics,
  writeChannel,
  writeTopics,
} from "@/lib/store";
import type { ChannelDna, TopicIdea } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const [channel, topics] = await Promise.all([readChannel(), readTopics()]);
  return NextResponse.json({ channel, topics });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    channel?: ChannelDna;
    topics?: TopicIdea[];
  };

  const channel = body.channel
    ? await writeChannel(body.channel)
    : await readChannel();
  const topics = body.topics
    ? await writeTopics(body.topics)
    : await readTopics();

  return NextResponse.json({ channel, topics });
}
