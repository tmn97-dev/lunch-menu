# Debugging the upload API locally

## 1. Run the app locally with Vercel

From the project root, with env vars in `.env.local`:

```bash
npx vercel dev
```

This serves the site (e.g. http://localhost:3000) and runs the API at `/api/upload-and-update`. **All `console.log` / `console.error` from the API appear in this terminal.**

## 2. See where it fails

The API logs steps with the prefix `[upload-and-update]`:

| Log message | Meaning |
|-------------|--------|
| `Env OK, parsing body…` | Env vars loaded, parsing POST body |
| `Body OK, calling Gemini…` | Image present, calling Google Gemini |
| `Gemini error:` / `Empty AI response:` | Gemini returned an error or empty text |
| `AI parse failed:` | Response wasn’t valid JSON or threw |
| `Gemini OK, menu parsed` | Menu JSON extracted successfully |
| `Updating GitHub…` | Sending update to GitHub |
| `GitHub update failed:` | GitHub API error (token, repo, permissions) |
| `Done.` | Success |

**Last line you see** = where it stopped. The next step is where it failed.

## 3. Test from the UI

1. Run `npx vercel dev`.
2. Open http://localhost:3000 (or the URL Vercel prints).
3. Choose an image and click “Last opp og oppdater”.
4. Watch the **same terminal** for `[upload-and-update]` lines.

## 4. Test with curl (no image)

To only check “env + route” without a real image:

```bash
curl -X POST http://localhost:3000/api/upload-and-update \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,iVBORw0KGgo="}'
```

You should see either “Body must include image” (validation) or a Gemini/API error. The terminal will show which step ran.

## 5. Env vars for local dev

Create `.env.local` in the project root (see `.env.example`):

- `GEMINI_API_KEY` – from https://aistudio.google.com/apikey  
- `GITHUB_TOKEN` – GitHub personal access token with `repo`  
- `GITHUB_REPO` – e.g. `your-username/lunch-menu`  

Restart `vercel dev` after changing `.env.local`.
