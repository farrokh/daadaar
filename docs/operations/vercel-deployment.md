# Vercel Deployment (Frontend)

This guide covers deploying the Next.js frontend to Vercel and wiring it to the AWS App Runner API.

## 1) Create the Vercel Project
- New Project -> Import the GitHub repo.
- Root Directory: `frontend`
- Framework: Next.js (auto-detected)

## 2) Build Settings (Bun)
Use the Vercel overrides in `frontend/vercel.json`:
- Install Command: `bun install`
- Build Command: `bun run build`
- Output Directory: `.next`

## 3) Environment Variables
Set these for **Production** (and **Preview** if you want previews to work):
```bash
NEXT_PUBLIC_API_URL=https://api.daadaar.com/api
NEXT_PUBLIC_APP_URL=https://www.daadaar.com
NEXT_PUBLIC_AWS_S3_BUCKET=daadaar-media-v1-317430950654
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_MOCK_MEDIA_SERVER=false
```

## 4) Custom Domain (Cloudflare DNS)
Add the domain in Vercel first, then update Cloudflare DNS:
- Apex (`daadaar.com`): `A` record -> `76.76.21.21` (DNS only)
- `www`: `CNAME` -> `cname.vercel-dns.com` (DNS only)

If you want `www` to redirect to apex (or vice-versa), set the redirect in Vercel.
Current canonical origin is `https://www.daadaar.com`.

## 5) Backend CORS
Update the App Runner environment variable to allow the frontend origin:
- `FRONTEND_URL=https://www.daadaar.com`

Redeploy App Runner after changing it.

## 6) Verification
```bash
curl -I https://www.daadaar.com
curl https://api.daadaar.com/health
```

If `curl -I https://www.daadaar.com` includes a `server: Vercel` header, the deployment is live.

## 7) Routine Deployment

To deploy updates to production with automated changelog generation:

```bash
# Run from frontend directory
bun run deploy:prod
```

This single command will:
1.  Generate localized updates from git history (using your local API key).
2.  Deploy the updated site to Vercel.
