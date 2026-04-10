# Trash Impact Lifestyle Quiz

A static, deployable quiz website about lifestyle decisions that affect how much trash people produce.

## What is included

- 10 mixed question types:
   - multiple choice
   - estimation questions
   - sorting/ranking questions
   - bin classification challenges
- Country slider for recycling rules: Netherlands or Belgium
- Immediate answer feedback with explanations and richer visual reactions
- Score summary with practical improvement tips
- Mobile-friendly and desktop-friendly single-page UI
- Ready for Render static deployment

## Run locally

You need any static file server (because `fetch` is used for `questions.json`).

### Option 1: Python

```bash
python -m http.server 5500
```

Then open: `http://localhost:5500`

### Option 2: VS Code Live Server extension

Open `index.html` with Live Server.

## Deploy on Render (Static Site)

### Quick deploy via dashboard

1. Push this repo to GitHub.
2. In Render, create a new **Static Site**.
3. Connect your repository.
4. Configure:
   - Build Command: leave empty
   - Publish Directory: `.`
5. Deploy.

### Deploy via Blueprint

This repo includes `render.yaml`, so you can deploy as a Render Blueprint if preferred.

## Tech stack

- HTML
- CSS
- Vanilla JavaScript
- JSON for quiz data

## Notes

- This is frontend-only: perfect for individual play and small/medium internal usage.
- If you later want a shared leaderboard, user accounts, or analytics, add a backend + database.
- Bin rules can vary by municipality; this quiz uses a practical workplace-friendly default mapping for NL and BE.
