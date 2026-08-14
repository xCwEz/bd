# Shorts Studio — Get your first Short on YouTube

Type a topic, hit Generate, then Publish. After a one-time setup, you don’t need CapCut or a manual upload every time.

```
ONE TIME                          EVERY SHORT
─────────                         ───────────
Install Node + ffmpeg             Create → type topic
Get ElevenLabs key                Generate short → wait for Ready
Get Kling key + Image/Video packs Publish to YouTube
Connect YouTube (3 fields)
Paste all on Setup
```

---

## 1. Install (once)

### Node.js

1. Install the **LTS** version from [nodejs.org](https://nodejs.org)
2. Open a new terminal and run:

```bash
node -v
npm -v
```

Both should print version numbers.

### ffmpeg

This stitches your voice and scenes into one video.

**Windows:**

```bash
winget install ffmpeg
```

Open a **new** terminal, then check:

```bash
ffmpeg -version
```

**Mac:** `brew install ffmpeg`  
**Linux:** `sudo apt install ffmpeg`

### Start Shorts Studio

In the project folder:

```bash
npm install
npm run dev
```

Leave that terminal running and open [http://localhost:3000](http://localhost:3000).

---

## 2. Connect your accounts (once)

Open **Setup** in the sidebar. You want all four items **Ready**:

| Item | What it does |
|------|----------------|
| ElevenLabs | Narration voice |
| Kling | AI images + motion |
| ffmpeg | Builds the final MP4 |
| YouTube | Turns on **Publish to YouTube** |

### ElevenLabs (voice) — about 2 minutes

1. Create an API key at [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)
2. Paste it on **Setup** → **Save**
3. Voice ID is optional (default Rachel works)

### Kling (images + video) — about 10 minutes

A normal Kling membership does **not** pay for the API. You need developer packs.

1. Create an API key at [kling.ai/dev/api-key](https://kling.ai/dev/api-key) (copy it once)
2. At [kling.ai/dev/pricing](https://kling.ai/dev/pricing), buy a small **Image** pack **and** a small **Video** pack
3. Paste the key on **Setup** → **Save Kling API key**

If Generate says “Not enough Kling API units,” check **Expense Center → Quotas / Resource Packages** (not Order History).

### YouTube — about 15 minutes

Do this once. After that, publishing is one button.

#### Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or pick one), e.g. `Shorts Studio`
3. Enable [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com)

#### OAuth client

OAuth Playground needs a **Web application** client (not Desktop, not an API key).

1. Go to **APIs & Services → Credentials**
2. Configure the consent screen if asked (External is fine for your own channel; add yourself as a **Test user** while it’s in Testing)
3. **Create credentials → OAuth client ID**
4. Application type: **Web application**
5. Under **Authorized redirect URIs**, add exactly:  
   `https://developers.google.com/oauthplayground`
6. Create → copy **Client ID** and **Client Secret**

If you already made a Desktop client, either edit it (if Google lets you add redirect URIs) or create a new **Web application** client with that redirect URI.

#### Refresh token

1. Open [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Click the gear (⚙️) → enable **Use your own OAuth credentials**  
   Paste the **Web** Client ID + Client Secret → Close  
   *(If you skip this step, Google uses Playground’s own app and you’ll get errors with your project.)*
3. Under **YouTube Data API v3**, select:  
   `https://www.googleapis.com/auth/youtube.upload`
4. **Authorize APIs** → sign in with the Google account for your YouTube channel → Allow
5. **Exchange authorization code for tokens**
6. Copy the **Refresh token**

If you see `Error 400: redirect_uri_mismatch`, the Web client is missing  
`https://developers.google.com/oauthplayground` under Authorized redirect URIs — add it, wait a minute, try again.

#### Paste into Setup

On **Setup** → YouTube:

- Client ID  
- Client Secret  
- Refresh Token  

Save. YouTube should show **Ready**.

---

## 3. Make and publish your first Short

With Setup fully Ready:

1. Go to **Create**
2. Enter a topic (e.g. `The telegram that almost started WW3`)
3. Click **Generate short**
4. Stay on the episode page until status is **Ready**

While you wait, the app writes the script, narrates it, builds five scenes, and stitches everything into a vertical Short with captions. This can take several minutes — don’t close the tab or stop `npm run dev`.

**Preview:** play the phone preview on the left. If it’s black, hard-refresh (`Ctrl+Shift+R`) and press play, or use **Open / download video**.

**Publish:**

1. Click **Publish to YouTube**
2. Wait until upload finishes
3. Open YouTube Studio — your Short is there  
4. Default privacy is **unlisted** — review it, then set to **Public** when you’re ready  

Title, caption, and `#Shorts` go up with the video.

From then on: **Create → Generate → Publish to YouTube.**

---

## Everyday checklist

```
[ ] npm run dev  (if the studio isn’t already running)
[ ] Create → type topic → Generate short
[ ] Wait for Ready
[ ] Publish to YouTube
[ ] (Optional) In YouTube Studio: unlisted → public
```

You only need to top up Kling when units run out. For TikTok or Reels, download the same MP4 and upload in those apps.

---

## Cost per Short (rough)

| Service | What you use |
|---------|----------------|
| Kling | About 5 images + 5×5s video clips (Image + Video packs) |
| ElevenLabs | About 45–60 seconds of speech |
| YouTube | Free upload to your channel |

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| Publish button disabled | Finish the YouTube section on Setup (all three fields) |
| YouTube upload failed | Make a new refresh token in OAuth Playground; confirm you’re a consent-screen test user; confirm the API is enabled |
| “Not enough Kling API units” | Buy Image **and** Video packs; check Quotas |
| ffmpeg Missing | Reinstall ffmpeg, fix PATH, open a new terminal, restart `npm run dev` |
| Player black but Ready | Hard refresh + play, or download the MP4 |
| Generate stuck | Keep the episode page open; check Kling units; check the terminal for errors |

---

## Useful links

- Studio: http://localhost:3000  
- ElevenLabs keys: https://elevenlabs.io/app/settings/api-keys  
- Kling API key: https://kling.ai/dev/api-key  
- Kling packs: https://kling.ai/dev/pricing  
- YouTube Data API: https://console.cloud.google.com/apis/library/youtube.googleapis.com  
- OAuth Playground: https://developers.google.com/oauthplayground/  
- ffmpeg: https://ffmpeg.org/download.html  

Your keys stay on your computer (`data/secrets.json` or `.env.local`). Don’t share them or commit them to git.

Built by [Hector Garcia](https://hexgarcia.com) · [@hex.gar](https://www.instagram.com/hex.gar/)
