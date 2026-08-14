# Produce episode (agent bridge)

Generation runs **inside Shorts Studio**.

1. `/setup` → paste ElevenLabs API key + Kling API key
2. `/create` → prompt → Generate
3. Stay on `/library/[id]` until status is `ready`

Pipeline: script → ElevenLabs VO → 5× Kling image → 5× Kling 2.1 image-to-video → ffmpeg mux.
