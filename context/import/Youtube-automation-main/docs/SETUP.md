# Setup

## ElevenLabs (voiceover)

1. Open [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)
2. Create an API key and paste it on **Setup**
3. (Optional) Pick a voice from [documentary narrators](https://elevenlabs.io/voice-library/documentary-narrator-voices) and paste the Voice ID  
   Default: Rachel (`21m00Tcm4TlvDq8ikWAM`)

```env
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

## Kling (images + video)

1. Open [kling.ai/dev/api-key](https://kling.ai/dev/api-key)
2. Create an **API Key** (shown once — store it)
3. Buy a small [API unit pack](https://kling.ai/dev/pricing) for **Image** and **Video** (a normal Kling membership does **not** fund the API)
4. Paste the key on **Setup**

```env
KLING_API_KEY=...
```

Each Short uses about **5 images + 5×5s video clips**, plus ElevenLabs characters for the script.

## ffmpeg

1. Install [ffmpeg](https://ffmpeg.org/download.html) and put it on your PATH
2. Restart `npm run dev`
3. Setup should show ffmpeg **Ready**

## YouTube

Add Client ID, Client Secret, and Refresh Token on Setup so you can publish with one click. Full steps are in [FULL-TUTORIAL.md](./FULL-TUTORIAL.md).

## TikTok / Reels

Download the MP4 from the episode page and upload in the app.
