import { NextResponse } from "next/server";

import {
  getSetupStatus,
  readSecrets,
  writeSecrets,
  type SecretsFile,
} from "@/lib/credentials";

export const runtime = "nodejs";

export async function GET() {
  const [status, secrets] = await Promise.all([
    getSetupStatus(),
    readSecrets(),
  ]);

  return NextResponse.json({
    status,
    secrets: {
      hasElevenLabs: Boolean(secrets.elevenLabsApiKey),
      hasKling: Boolean(secrets.klingApiKey),
      hasVoiceId: Boolean(secrets.elevenLabsVoiceId),
      hasYoutube: Boolean(
        secrets.youtubeClientId &&
          secrets.youtubeClientSecret &&
          secrets.youtubeRefreshToken,
      ),
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as SecretsFile & {
    clearElevenLabs?: boolean;
    clearKling?: boolean;
    clearYoutube?: boolean;
  };

  const current = await readSecrets();
  const next: SecretsFile = { ...current };

  if (body.clearElevenLabs) {
    delete next.elevenLabsApiKey;
  } else if (body.elevenLabsApiKey && !body.elevenLabsApiKey.includes("•")) {
    next.elevenLabsApiKey = body.elevenLabsApiKey.trim();
  }

  if (body.elevenLabsVoiceId !== undefined) {
    const voice = body.elevenLabsVoiceId.trim();
    if (!voice) {
      delete next.elevenLabsVoiceId;
    } else if (!voice.includes("•")) {
      next.elevenLabsVoiceId = voice;
    }
  }

  if (body.clearKling) {
    delete next.klingApiKey;
    delete next.klingAccessKey;
    delete next.klingSecretKey;
  } else if (body.klingApiKey && !body.klingApiKey.includes("•")) {
    next.klingApiKey = body.klingApiKey.trim();
    delete next.klingAccessKey;
    delete next.klingSecretKey;
  }

  if (body.clearYoutube) {
    delete next.youtubeClientId;
    delete next.youtubeClientSecret;
    delete next.youtubeRefreshToken;
  } else {
    if (body.youtubeClientId && !body.youtubeClientId.includes("•")) {
      next.youtubeClientId = body.youtubeClientId.trim();
    }
    if (body.youtubeClientSecret && !body.youtubeClientSecret.includes("•")) {
      next.youtubeClientSecret = body.youtubeClientSecret.trim();
    }
    if (body.youtubeRefreshToken && !body.youtubeRefreshToken.includes("•")) {
      next.youtubeRefreshToken = body.youtubeRefreshToken.trim();
    }
  }

  await writeSecrets(next);
  const status = await getSetupStatus();
  return NextResponse.json({ ok: true, status });
}
