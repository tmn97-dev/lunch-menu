# Weekly Lunch Menu — GitHub Pages / Vercel

A minimal site that displays a weekly lunch menu from a JSON file. You can update the menu by uploading a photo: an AI agent interprets the image and commits the new `menu.json` to the repo.

## How it works

1. **`menu.json`** holds the structured lunch menu for the week
2. **`index.html`** fetches and renders the menu and provides an **upload** flow: choose an image → AI interprets it → backend commits and pushes to GitHub
3. Host either on **GitHub Pages** (static only) or **Vercel** (static + API so upload works from the same origin)

## Workflow: Updating the menu

**Option A — Upload from the site (automated)**  
1. Deploy the app to Vercel (see below) and set env vars.  
2. Open the site, use **«Oppdater meny fra bilde»**, select a photo of the weekly menu.  
3. The backend calls OpenAI to extract the menu, then uses the GitHub API to update `menu.json` and push.  
4. If you use GitHub Pages for the same repo, it will auto-deploy; if you use Vercel, the updated `menu.json` is in the repo and you can point GitHub Pages at it or keep using Vercel.

**Option B — Manual (Cursor + git)**  
1. Take a photo of the weekly lunch menu.  
2. Share it in a Cursor chat — the AI agent will read the image and update `menu.json`.  
3. Commit and push:
   ```bash
   git add menu.json
   git commit -m "Update menu for week X"
   git push
   ```
4. GitHub Pages (or Vercel) auto-deploys — your site updates within a minute or two.

## JSON schema

```json
{
  "week": "2026-W09",
  "restaurant": "Office Cafeteria",
  "lastUpdated": "2026-02-23",
  "days": [
    {
      "day": "Monday",
      "date": "2026-02-23",
      "items": [
        {
          "name": "Dish Name",
          "description": "Optional description",
          "tags": ["vegetarian", "gluten-free"],
          "price": "12.50"
        }
      ]
    }
  ]
}
```

## Setup

### Static only (GitHub Pages)

1. Create a GitHub repo and push this folder.
2. Go to **Settings → Pages** and set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Site will be at `https://<username>.github.io/<repo-name>/`. The upload button will only work if you point it at a deployed API (see below).

### Full flow: upload → AI → commit (Vercel)

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com) and deploy.
3. In the Vercel project, go to **Settings → Environment Variables** and add:
   - **`OPENAI_API_KEY`** — OpenAI API key (for GPT-4o vision).
   - **`GITHUB_TOKEN`** — Personal Access Token (or fine-grained token) with `contents: write` on this repo.
   - **`GITHUB_REPO`** — `owner/repo` (e.g. `myuser/lunch-menu`).
4. Redeploy so the API picks up the env vars. The site and the upload API are then on the same origin (e.g. `https://lunch-menu-xxx.vercel.app`), so the uploader works without extra config.

If you keep the static site on **GitHub Pages** and only deploy the API to Vercel, set the API base URL before the main script so the uploader calls your Vercel app:

```html
<script>window.LUNCH_MENU_API = "https://your-api.vercel.app";</script>
```

Then the upload request goes to that URL (CORS is allowed by the API).

## Local preview

Open `index.html` in a browser, or use a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. The upload button will only work when the page is served from the same origin as the API (e.g. full app on Vercel) or when `LUNCH_MENU_API` points to a deployed API.
