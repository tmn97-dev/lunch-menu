# Weekly Lunch Menu — GitHub Pages

A minimal site that displays a weekly lunch menu from a JSON file, hosted on GitHub Pages.

## How it works

1. **`menu.json`** holds the structured lunch menu for the week
2. **`index.html`** fetches and renders the menu as a clean, mobile-friendly page
3. **GitHub Pages** serves the site from the `main` branch root

## Workflow: Updating the menu

1. Take a photo of the weekly lunch menu
2. Share it in a Cursor chat — the AI agent will read the image and update `menu.json`
3. Commit and push:
   ```bash
   git add menu.json
   git commit -m "Update menu for week X"
   git push
   ```
4. GitHub Pages auto-deploys — your site updates within a minute or two

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

1. Create a **private** GitHub repo (requires GitHub Pro for Pages on private repos)
2. Push this folder to the repo
3. Go to **Settings → Pages** and set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`
4. Your site will be live at `https://<username>.github.io/<repo-name>/`

## Local preview

Open `index.html` in a browser, or use a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
