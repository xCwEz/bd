# Shorts Studio

Local app that turns a topic into a faceless YouTube Short — script, voice, scenes, captions — then publishes it to your channel.

**Create → Generate → Publish.** No CapCut. No database. Runs on your machine.

Built by [Hector Garcia](https://hexgarcia.com) · [@hex.gar](https://www.instagram.com/hex.gar/) · MIT

---

## What it does

| Step | Tool |
|------|------|
| Writes a short narrated script | Built-in story beats |
| Generates voiceover | [ElevenLabs](https://elevenlabs.io) |
| Builds 5 vertical scenes | [Kling AI](https://kling.ai/dev) (image → video) |
| Muxes audio, video, captions | [ffmpeg](https://ffmpeg.org) |
| Uploads to YouTube Shorts | YouTube Data API |

Default niche example: **History’s almosts** (near-misses that almost changed everything). Swap the topic for whatever your channel needs.

---

## Requirements

- Node.js 20+
- ffmpeg on your PATH
- ElevenLabs API key
- Kling API key + Image **and** Video resource packs  
  *(a normal Kling membership does not fund the API)*
- YouTube OAuth credentials (for one-click publish)

---

## Quick start

```bash
npm install
npm run dev
```

Install [ffmpeg](https://ffmpeg.org/download.html), then open [http://localhost:3000](http://localhost:3000).

1. **Setup** — paste ElevenLabs, Kling, and YouTube keys; confirm ffmpeg is Ready  
2. **Create** — type a topic → **Generate short**  
3. Wait until **Ready** → **Publish to YouTube**

Full walkthrough (accounts, packs, YouTube OAuth): **[docs/FULL-TUTORIAL.md](docs/FULL-TUTORIAL.md)**

Also see [docs/SETUP.md](docs/SETUP.md) and [docs/PRODUCE.md](docs/PRODUCE.md).

---

## Privacy

Keys and episode data stay local:

- `data/secrets.json` or `.env.local` — API keys  
- `data/episodes/` — episode JSON  
- `data/media/` — voice, scenes, `final.mp4`

Do not commit secrets. Copy `.env.example` if you prefer env vars.

---

## Stack

- Next.js (App Router)
- ElevenLabs TTS
- Kling Open Platform (`api-singapore.klingai.com`)
- ffmpeg
- Optional YouTube upload via `scripts/youtube-upload.mjs`

---

## License

[MIT](LICENSE) · © Hector Garcia
