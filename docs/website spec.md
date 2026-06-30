# PML modeller — subscription web app plan
## Architecture, design & go-live strategy

**Goal:** Ship fast, attract early users, and build a foundation that scales to a paid product  
**Stack assumption:** Next.js 14 (App Router), Prisma, Stripe, Vercel

---

## 1. Project structure

```
/app
  /api                  # Serverless route handlers
    /auth               # NextAuth callbacks, session
    /ai                 # AI completion endpoints (streaming)
    /stripe             # Webhook handler, checkout session
    /limits             # Usage check middleware
  /dashboard            # Protected editor pages (auth-gated layout)
    /[projectId]        # Individual diagram editor
    /settings           # Account, billing, usage
  /auth                 # Sign in / sign up pages
  /(marketing)          # Public pages — landing, pricing, docs
    /                   # Landing page
    /pricing            # Pricing tiers
    /docs               # PML reference & tutorials
    /changelog          # Public release notes

/components
  /editor               # PML text editor (CodeMirror or Monaco)
  /preview              # Live rendered model (your layout engine)
  /panel                # View settings slide-up panel
  /ai                   # AI chat sidebar, suggestion overlays
  /ui                   # Shared design system components

/lib
  /db.ts                # Prisma client singleton
  /stripe.ts            # Stripe client, plan config
  /ai.ts                # Anthropic SDK wrapper, prompt templates
  /limits.ts            # Usage gate logic (reads from DB)
  /pml.ts               # PML parser / validator utilities

/prisma
  schema.prisma         # See §3 for schema
```

**Why this structure matters:** The `(marketing)` route group keeps public pages outside the dashboard layout, which means the marketing site has its own visual design and loads with zero auth overhead. This is important for SEO and first-impression load times.

---

## 2. Data model (Prisma schema)

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  image         String?
  createdAt     DateTime       @default(now())
  plan          Plan           @default(FREE)
  stripeId      String?        @unique
  projects      Project[]
  subscription  Subscription?
  usage         UsageRecord[]
}

model Project {
  id          String    @id @default(cuid())
  name        String
  pmlSource   String    @db.Text
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  isPublic    Boolean   @default(false)   // shareable read-only link
  snapshots   Snapshot[]
}

model Snapshot {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  pmlSource   String    @db.Text
  label       String?                      // e.g. "v1.2 - pre-review"
  createdAt   DateTime  @default(now())
}

model Subscription {
  id                 String    @id @default(cuid())
  userId             String    @unique
  user               User      @relation(fields: [userId], references: [id])
  stripeSubId        String    @unique
  stripePriceId      String
  status             SubStatus
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean   @default(false)
}

model UsageRecord {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  type        UsageType                    // AI_CALL, EXPORT, DIAGRAM_RENDER
  createdAt   DateTime  @default(now())
  metadata    Json?
}

enum Plan    { FREE STARTER PRO }
enum SubStatus { ACTIVE PAST_DUE CANCELLED TRIALING }
enum UsageType { AI_CALL EXPORT DIAGRAM_RENDER }
```

**Key design choices:**

- `Snapshot` is separate from `Project` — gives you version history without bloating the main project record. Free tier can have a shallow snapshot limit (e.g. 3); paid tiers get full history.
- `isPublic` on `Project` enables shareable read-only diagram URLs — a powerful viral loop (people share their process diagrams; viewers see your product and sign up).
- `UsageRecord` is an append-only log, not counters. Count by window server-side. This gives you full audit capability and makes plan change retroactive calculations easy.

---

## 3. Pricing tiers

Design principle: **Free tier must be genuinely useful** — not crippled. Annoy people with limits only at the point where they're already invested. The goal right now is adoption, not revenue.

| Feature                               | Free | Starter | Pro       | Enterprise |
| ------------------------------------- | ---- | ------- | --------- | ---------- |
| Price                                 | $0   | $12/mo  | $29/mo    | Custom     |
| Users                                 | Single | Single   | Single    | Unlimited  |
| Diagrams                              | 10   | 50      | Unlimited | Unlimited  |
| AI Assist Sessions                    | 3/mo | 30/mo   | 100/mo    | Unlimited  |
| Export to BPMN                        | 3    | 50      | Unlimited | Unlimited  |
| Export (PNG/SVG)                      | ✓    | ✓       | ✓         | ✓          |
| Shareable Links                       | ✗    | ✓       | ✓         | ✓          |
| Process Interface Navigation          | ✗    | ✓       | ✓         | ✓          |
| Advanced Layout Views                 | ✗    | ✓       | ✓         | ✓          |
| Diagram Layout & View Customisation   | ✗    | ✗       | ✓         | ✓          |
| SSO (SAML 2.0 / OIDC)                 | ✗    | ✗       | ✗         | ✓          |
| SCIM User Provisioning                | ✗    | ✗       | ✗         | ✓          |
| Connect to Your File Storage          | ✗    | ✗       | ✗         | ✓          |
| Data Residency (Files)                | ✗    | ✗       | ✗         | ✓          |
| Private AI (On-Premise or VPC-Routed) | ✗    | ✗       | ✗         | ✓          |
| Custom AI Assist Configuration        | ✗    | ✗       | ✗         | ✓          |
| Audit Log                             | ✗    | ✗       | ✗         | ✓          |
| Custom Branding / White-Label         | ✗    | ✗       | ✗         | ✓          |
| SLA & Uptime Guarantee                | ✗    | ✗       | ✗         | ✓          |
| Dedicated Onboarding                  | ✗    | ✗       | ✗         | ✓          |
| Priority Support                      | ✗    | ✗       | ✓         | Named CSM  |


**Rationale for feature gating:**

- Shareable links are gated because they're the best viral mechanism — you want users to want it
- Process interface navigation (cross-diagram linking) is your most powerful differentiator; gate it at Starter to make the paid upgrade feel meaningful, not punitive
- AI assists are the most obvious metered resource and the easiest for users to understand

**Pricing page design:** Show three cards, Starter highlighted as "Most popular". Include a toggle for monthly/annual (annual = 2 months free). Add a one-line "What you get" beneath each price — not a feature list, a promise. E.g. for Starter: *"For practitioners who model regularly and need to share their work."*

---

## 4. Authentication

Use **NextAuth.js** (Auth.js v5 if starting fresh). Offer:

- **Google OAuth** — lowest friction, highest conversion
- **GitHub OAuth** — your target audience likely has GitHub
- **Magic link email** — fallback for users without either

Do not build username/password authentication for v1. The overhead (password reset flows, security surface area) is not worth it at this stage.

```ts
// /lib/auth.ts — NextAuth config outline
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google, GitHub, Resend],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub }
    })
  },
  adapter: PrismaAdapter(prisma)
})
```

**Practical:** Add a `middleware.ts` at the root that protects `/dashboard` routes. NextAuth's middleware helper does this in three lines.

---

## 5. Stripe integration

### 5.1 Checkout flow

Use **Stripe Checkout** (hosted page) not Elements for v1. It handles SCA, tax, card validation, and failed payment retries out of the box. You save weeks of work.

```
User clicks "Upgrade" → POST /api/stripe/checkout
  → stripe.checkout.sessions.create({ ... })
  → redirect to Stripe-hosted page
  → on success: redirect to /dashboard?upgraded=true
  → webhook fires → update DB
```

### 5.2 Webhook handler

```ts
// /app/api/stripe/webhook/route.ts
// Always verify signature: stripe.webhooks.constructEvent(body, sig, secret)

// Events to handle:
// checkout.session.completed     → create Subscription record, set plan = STARTER/PRO
// customer.subscription.updated  → sync plan changes, period end
// customer.subscription.deleted  → downgrade to FREE, set status = CANCELLED
// invoice.payment_failed         → set status = PAST_DUE, email user
```

**Critical:** Stripe webhooks are your source of truth for subscription state. Never trust client-side redirects to update the plan — the webhook is the only reliable signal.

### 5.3 Customer portal

Enable Stripe's hosted customer portal for plan changes, cancellation, and invoice history. One API call gives you a full billing management UI:

```ts
// POST /api/stripe/portal
const session = await stripe.billingPortal.sessions.create({
  customer: user.stripeId,
  return_url: `${origin}/dashboard/settings`
})
```

---

## 6. Usage limiting

Keep it simple and performant. Check limits at the API route level before executing expensive operations.

```ts
// /lib/limits.ts
const LIMITS = {
  FREE:    { projects: 3,   aiCalls: 10,  snapshots: 3  },
  STARTER: { projects: 20,  aiCalls: 100, snapshots: 10 },
  PRO:     { projects: Infinity, aiCalls: Infinity, snapshots: Infinity }
}

export async function checkLimit(userId: string, type: UsageType) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { projects: true } } }
  })
  // count usage records within current billing window
  // throw LimitExceededError if over — caught by API route
}
```

**UX for limit hits:** Never show a raw error. Show an inline upgrade prompt within the UI — ideally at the exact moment of the blocked action, with a one-click path to the Stripe checkout. "You've used your 10 AI assists this month. Upgrade to Starter for 100/mo."

---

## 7. AI integration

### 7.1 What to build first

Rank by value-to-effort ratio:

1. **PML clean/format** — call the AI to apply clean text layout rules (high value, simple prompt)
2. **"Describe this process"** — natural language summary of the current diagram (great for sharing)
3. **"Suggest improvements"** — identify gaps, missing actors, unclear flows
4. **Natural language to PML** — "Add an exception flow if payment fails" → inserts PML (the killer feature, build this when the above are stable)

### 7.2 Streaming responses

Use the Vercel AI SDK (`ai` package) with the Anthropic provider. Stream completions directly to the client — do not buffer full responses server-side.

```ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(req: Request) {
  // check auth + limits first
  const { messages, pmlContext } = await req.json()
  
  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: PML_SYSTEM_PROMPT,   // your PML spec as context
    messages: [
      { role: 'user', content: `Current PML:\n${pmlContext}\n\n${messages[0].content}` }
    ]
  })
  
  return result.toDataStreamResponse()
}
```

**Your PML specification is the secret weapon here.** Feed the full spec as the system prompt. The AI will produce valid PML because it understands the grammar. Guard this server-side — do not expose the system prompt to clients.

### 7.3 Token cost control

- Cap `max_tokens` at 1500 for most operations (enough for meaningful PML output)
- Log token usage in `UsageRecord.metadata` — you'll want this for cost analysis
- Consider a simple server-side cache: if the same PML with the same instruction has been called in the last 5 minutes, return the cached result

---

## 8. Editor & preview

### 8.1 PML editor

Use **CodeMirror 6** (not Monaco — Monaco is large and overkill for a DSL). Build a custom language mode for PML:

- Syntax highlighting for keywords (`process`, `step`, `actor`, `on`)
- Basic autocompletion for declared actor names and step references
- Error underlines for invalid syntax (wire to your existing parser)
- Vim/Emacs keybinding options (your users will ask)

### 8.2 Live preview sync

Debounce the PML source → render pipeline at ~300ms. This is the right balance between "feels live" and "doesn't choke on every keystroke."

```ts
const debouncedRender = useMemo(
  () => debounce((source: string) => renderPML(source), 300),
  []
)
```

### 8.3 Auto-save

Auto-save the PML source to the DB every 30 seconds if the content has changed. Show a subtle "Saved" / "Saving…" indicator in the top bar. Do not require manual save. Users who lose work never come back.

---

## 9. Public shareable diagrams

When a project's `isPublic` flag is true, expose it at:

```
/share/[projectId]   # read-only rendered model, no editor
```

This page:
- Has no auth requirement
- Renders the diagram using your layout engine
- Shows the process name and a "Made with PML Modeller" footer with a sign-up CTA
- Is statically cached (ISR with short revalidation window)

This is your most powerful acquisition channel. Every shared diagram is a product demo.

---

## 10. Landing page

The marketing site must do one thing: make a competent process modeller think "I need to try this." Structure:

```
Hero        — One sentence. A live animated PML diagram auto-typing beside it.
             "Process modelling that thinks in text."
             [Start free] [See an example →]

Social proof — "Used by teams at [logos or generic: startups, consultancies, ops teams]"
             (Even if early, get 3 pilot users to give a quote before launch)

How it works — 3 steps with a mini demo GIF each
              1. Write PML  2. Model renders live  3. Share or export

Feature grid — 6 cards. Lead with the AI assist and shareable links.

Pricing      — Embedded pricing section (mirrors /pricing page)

Footer CTA   — "Start modelling for free. No credit card required."
```

**The live diagram in the hero is non-negotiable.** Static screenshots will not convert. A 15-second looping animation of someone typing PML and watching the diagram build itself is worth 500 words of copy.

---

## 11. Go-live checklist

### Before launch

- [ ] Stripe webhook endpoint tested in staging (use Stripe CLI to replay events)
- [ ] Usage limits tested — confirm blocked actions show upgrade prompt, not errors
- [ ] Auth flows tested — sign in, sign out, protected route redirect
- [ ] Auto-save tested — confirm no data loss on browser close
- [ ] `robots.txt` and `sitemap.xml` in place for marketing pages
- [ ] OG image set for landing page and share pages (use `next/og` to generate dynamic OG images for shared diagrams — these drive social click-through)
- [ ] Error boundary on the editor — a crash should not lose unsaved PML
- [ ] Rate limiting on AI routes (e.g. `upstash/ratelimit` with Redis) — prevent abuse before limits kick in
- [ ] Privacy policy and terms of service pages (required by Stripe)
- [ ] Stripe test mode → live mode keys swapped

### Launch day

- [ ] Post to relevant communities: Hacker News (Show HN), r/businessanalysis, r/softwarearchitecture, LinkedIn
- [ ] Set up Plausible or PostHog (lightweight, privacy-friendly analytics)
- [ ] Create a simple feedback widget (`/feedback` endpoint → email you) — early users will have opinions, capture them
- [ ] Monitor Stripe dashboard and server logs for the first 2 hours

### Week 1 after launch

- [ ] Email every free user who creates more than 2 diagrams — ask what they're using it for
- [ ] Watch where users hit limits — this tells you what to raise and what to lower
- [ ] Look at which AI prompts are most common — that's your next feature

---

## 12. Practical considerations & additions

### 12.1 Don't build these in v1

- **Teams/orgs** — adds enormous DB complexity (roles, permissions, shared projects). Gate it as a future Pro+ or Enterprise tier.
- **Real-time collaboration** — websockets, conflict resolution, presence. This is a separate product. Ship it when you have users asking for it.
- **Username/password auth** — see §4.
- **Custom domain for share pages** — nice to have, not for launch.
- **Mobile editor** — the PML editor is inherently desktop. Don't optimise for mobile in v1; make the share/preview pages responsive instead.

### 12.2 Things that will save you later

- **Soft deletes** — add `deletedAt DateTime?` to `Project` and `User`. Never hard-delete. You will thank yourself when a user emails asking for a recovered diagram.
- **Idempotency on Stripe webhooks** — Stripe can fire the same event twice. Check if you've already processed an event before applying DB changes.
- **Environment variable validation at startup** — use `zod` to validate all required env vars when the app starts. A missing `STRIPE_SECRET_KEY` should crash loudly on deploy, not silently fail at runtime.
- **Database connection pooling** — use `Prisma Accelerate` or `PgBouncer` from day one if on Vercel. Serverless functions open a new DB connection per invocation; pooling prevents exhaustion under load.

### 12.3 Analytics events to instrument from day one

Use PostHog or a simple custom events table. Track:

- `diagram_created`
- `ai_assist_used` (with type — format, suggest, nl-to-pml)
- `share_link_created`
- `limit_hit` (with limit type and plan)
- `upgrade_prompt_shown` / `upgrade_prompt_clicked`
- `checkout_started` / `checkout_completed`

The upgrade funnel events are the most important. If `upgrade_prompt_shown` is high but `checkout_started` is low, your pricing or messaging is the problem, not your product.

### 12.4 The "made with" footer as a growth loop

Every public share page should have a tasteful but visible "Created with PML Modeller" link in the footer. This is a zero-cost acquisition channel. Suppressing it can be a Pro perk (some users will upgrade just for the white-label option — worth adding to the Pro tier even if you don't build it at launch, as a placeholder you fulfil later).

---

## 13. Tech stack summary

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 App Router | File-based routing, RSC, API routes all in one |
| Database | PostgreSQL (Neon or Supabase) | Serverless-friendly, free tier available |
| ORM | Prisma | Type-safe, great DX, easy migrations |
| Auth | NextAuth.js / Auth.js v5 | OAuth + magic link, Prisma adapter |
| Payments | Stripe Checkout + Portal | Hosted UI, handles SCA, webhooks reliable |
| AI | Vercel AI SDK + Anthropic | Streaming, provider-agnostic abstraction |
| Editor | CodeMirror 6 | Lightweight, extensible, custom language modes |
| Deployment | Vercel | Zero-config Next.js, edge functions, preview deploys |
| Email | Resend | Simple API, good deliverability, free tier |
| Analytics | PostHog | Self-hostable, event tracking, funnels |
| Rate limiting | Upstash Redis | Serverless Redis, `@upstash/ratelimit` is excellent |