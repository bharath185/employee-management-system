# Deploy Steps — Render + Vercel + CockroachDB

## Prerequisites — Create Accounts & Get Tokens

### 1. Render (Backend)
1. Go to https://dashboard.render.com/register
2. Sign up with GitHub or email (free tier, no credit card needed)
3. Go to https://dashboard.render.com/api → **Create API Key**
4. Copy the key — it looks like `rnd_xxxxx`
5. Save as: **RENDER_API_KEY**

### 2. Vercel (Frontend)
1. Go to https://vercel.com/signup
2. Sign up with GitHub or email (free tier)
3. Go to https://vercel.com/account/tokens → **Create Token**
4. Copy the token — it looks like `xxxxx`
5. Save as: **VERCEL_TOKEN**
6. Also note your **Vercel account ID** from https://vercel.com/account

### 3. Give me
- RENDER_API_KEY
- VERCEL_TOKEN
- VERCEL_ACCOUNT_ID
- (Optional) GitHub repo URL if you want the code pushed first

---

## What I'll Do Once I Have Tokens

### Files already updated:
- `render.yaml` — Render backend config
- `vercel.json` — Vercel SPA config
- `application.properties` — CockroachDB as datasource
- `environment.prod.ts` — API URL placeholder

### Deployment flow:
1. Push code to GitHub (if repo exists)
2. Create Render Blueprint → deploy backend
3. Create Vercel project → deploy frontend
4. Wire everything together
