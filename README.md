# IBM CRM App

A basic CRM application for managing **Leads**, **Opportunities**, and **Clients** — built with React 19 + IBM Carbon Design System, backed by Supabase (PostgreSQL + Auth), deployed via Netlify CI/CD.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, IBM Carbon Design System (`@carbon/react`) |
| Backend | Supabase (PostgreSQL + RLS + Auth) |
| Auth | Google OAuth via Supabase Auth |
| CI/CD | Netlify (auto-deploy on push to `main`) |

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project (free tier at supabase.com)
- Google OAuth credentials pointing to your Supabase callback URL

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your Supabase values
cp .env.example .env

# 3. Run the SQL migration in your Supabase SQL Editor
#    File: supabase/migration.sql

# 4. Start the dev server
npm start
```

Opens at http://localhost:3000

### Environment Variables

| Variable | Description |
|---|---|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Deployment (Netlify)

1. Push to GitHub
2. Connect repo to Netlify (`koljaatwork` team)
3. Add the two env vars in Netlify Site Settings → Environment Variables
4. Add the Netlify URL to Supabase Auth → URL Configuration → Redirect URLs
5. Every push to `main` auto-deploys

Build command: `npm run build` | Publish directory: `build`
