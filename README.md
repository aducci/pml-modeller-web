This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

See `.env.example` for all required environment variables including:
- Database connection
- NextAuth configuration (Google/GitHub OAuth)
- API keys (Anthropic, Stripe)
- Site password gate (optional)

## Deployment

### Vercel Deployment

This project is configured for deployment on [Vercel](https://vercel.com).

**Step 1: Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import the GitHub repository: `aducci/pml-modeller-web`
4. Click "Import"

**Step 2: Configure Environment Variables**
In the Vercel project settings, add environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generated secret (see `.env.example`)
- `NEXTAUTH_URL` - Your production domain
- `GOOGLE_ID` & `GOOGLE_SECRET` - OAuth credentials
- `GITHUB_ID` & `GITHUB_SECRET` - OAuth credentials
- `ANTHROPIC_API_KEY` - LLM API key
- `STRIPE_SECRET_KEY` & `STRIPE_PUBLISHABLE_KEY` - Billing keys
- `SITE_PASSWORD` & `COOKIE_SECRET` - Site gate security (optional)

**Step 3: Deploy**
Vercel automatically deploys on every push to `main` branch.

For custom domain (e.g., provai.com):
1. Go to project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Local Production Build

Test the production build locally:

```bash
npm run build
npm start
```

## Features

- 🔐 Site-wide password gate (optional, for development sites)
- 🔑 NextAuth authentication (Google/GitHub OAuth)
- 💬 AI integration (Anthropic)
- 💳 Stripe billing support
- 📊 Prisma ORM with PostgreSQL
- 🎨 Tailwind CSS styling
- 📱 Responsive design

## Site Password Gate

If `SITE_PASSWORD` is set in environment variables, the entire site will require password authentication before loading.

**Login credentials:**
- Password: Use the value of `SITE_PASSWORD`
- Cookie: Persists for 30 days (HttpOnly, Secure, SameSite=Lax)

**Logout:**
- Visit `/site-lock/logout` to clear access

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Vercel Documentation](https://vercel.com/docs) - deployment and hosting
- [NextAuth.js Documentation](https://next-auth.js.org) - authentication
- [Prisma Documentation](https://www.prisma.io/docs) - database ORM

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
