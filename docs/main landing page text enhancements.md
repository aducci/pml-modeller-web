# Main Landing Page — Specification (v2)

> **Status:** Approved for implementation  
> **Date:** 2026-07-01  
> **Based on:** Codebase audit (pml-modeller-web + PML_DSL), PML AI Vision Statement v2, PML Language Spec v2.6, Architecture Alignment Plan  
> **Decisions:** Editorial & structure only — no implementation guidance

---

## Design Direction

- **Brand palette:** Keep current (teal `#156064`, honeydew `#e2fcef`, sandy `#ffb563`, smoky `#a26769`). No dark-mode-first pivot.
- **Color transition:** One gradient accent — applied to the main hero headline only. A single teal→sandy→smoky gradient text on the H1. The rest of the page uses the current solid-color approach.
- **Tone:** Warm, approachable, enterprise-credible. Not dev-tool cold.
- **Section scope:** Full narrative — 7+ sections covering the complete story arc.
- **Hero visual:** Animated 6-step flow pipeline (Describe → PML → Diagram → AI Review → SME Approval → BPMN Export), replacing the current before/after comparison.

---

## Page Structure (ordered)

| # | Section | Purpose |
|---|---------|---------|
| 1 | **Hero** | Hook + animated visual pipeline |
| 2 | **The Problem** | Enterprise modelling is broken |
| 3 | **Meet PML** | Three-card feature intro |
| 4 | **Why Model as Text?** | Split-screen comparison (trad vs PML) |
| 5 | **AI-Assisted Modelling** | Strongest feature — animated flow + bullets |
| 6 | **Quality by Design** | Enterprise selling point — validation showcase |
| 7 | **Enterprise Process Signoff** | Innovative differentiator — workshop-killer |
| 8 | **Multiple Views. One Source of Truth.** | The text-first payoff |
| 9 | **Export to BPMN** | Bridge to legacy tooling |
| 10 | **How It Works** | Three-card options: Write PML / Describe to AI / Collaborate |
| 11 | **Pricing** | Embedded section (mirrors /pricing) |
| 12 | **Final CTA** | Closing statement + action links |

---

## Section 1 — Hero

### Headline

**Model Enterprise Processes at the Speed of Thought**

*(Gradient text: teal → sandy → smoky)*

### Subheading

PML (Process Modelling Language) is an AI-native process language designed specifically for enterprise productivity. Focus on the process itself — not boxes, arrows, and layout.

### Key messaging (foundational, informs all copy)

- PML is designed to model processes at speed
- Very AI compatible — geared to make AI work faster and more efficient on context
- The language self-enforces quality and completeness
- Built around training and knowledge retention

### CTAs

- **Start Modelling** (primary — teal button)
- **View Example** (secondary — outline)
- **Generate with AI** (tertiary — ghost, icon)

### Hero Visual

Animated 6-step pipeline replacing the current before/after comparison:

```
Describe process
      ↓
PML DSL
      ↓
Interactive Diagram
      ↓
AI Review
      ↓
SME Approval
      ↓
BPMN Export
```

Each step is a card that lights up in sequence with a flowing arrow between them. The visual should feel like a clear, confident pipeline — not a product screenshot.

---

## Section 2 — The Problem

### Headline

**Enterprise Process Modelling Is Broken**

### Body

Most enterprise modelling tools force you to spend more time arranging boxes than describing the process.

### Problems (grid of 4-6 cards/points)

- Diagram layout consumes most modelling effort
- Process quality depends on modeller experience
- AI struggles with visual formats
- Knowledge is lost after workshops
- Process sign-off is manual and painful

Tone: honest, slightly provocative. This section exists to make the reader nod and think "yes, that's exactly my problem."

---

## Section 3 — Meet PML

### Headline

**Meet PML**

### Body

PML is a process modelling language designed specifically for enterprise productivity.

### Three cards

| Card | Message |
|------|---------|
| **AI Native** | Built for AI understanding and generation. The language syntax is designed so AI can read, write, and validate processes without ambiguity. |
| **Quality Enforced** | The language itself guides completeness and consistency. Missing actors, undefined flows, and incomplete metadata are surfaced immediately — not during review. |
| **Knowledge Retained** | Processes become maintainable enterprise assets rather than static pictures. Version-controlled, diffable, reviewable — the process outlives the workshop. |

---

## Section 4 — Why Model as Text?

This is the most important differentiator. The message:

> **It's a text specification — AI focused and lean. The tool does all layout and you don't need to worry. But because of this, we have so much freedom for other things: rendering in different views, AI analysis, export to any format.**

### Split-screen visual

| Traditional (left) | PML (right) |
|----|----|
| Visual of boxes/arrows with manual layout pain points | Clean PML code block showing the same process |
| • Manual layout | • Focus on intent |
| • Diagram maintenance | • AI friendly |
| • Difficult for AI | • Source controlled |
| • Limited views | • Multiple renderings |
| | • Automatically laid out |

### Big statement underneath

> **You write the process. We handle the diagram.**

---

## Section 5 — AI-Assisted Modelling

This is the strongest feature. Lead with it visually.

### Large animated flow

```
Describe Process
      ↓
AI Generates PML
      ↓
PML Validates
      ↓
AI Interrogates
      ↓
Diagram Updates Live
      ↓
Enterprise Approval
```

### Supporting points (as cards or icon list)

- **Describe Your Process** — Explain the process in natural language. No syntax required to start.
- **AI Generates PML** — Generate structured enterprise models instantly from plain descriptions.
- **AI Challenges Assumptions** — The AI actively interrogates the process for gaps, inconsistencies, and missing edge cases.
- **Live Visualisation** — See your process rendered in real time as the AI works.

### Secondary messaging

- The PML DSL pushes modelling quality to both the modeller and AI
- Enterprise process approval feature — AI interviews the participants in the process; they refine and sign off automatically

---

## Section 6 — Quality by Design

Enterprise selling point. Instead of saying "the language self-enforces quality," show it.

### Headline

**PML embeds modelling standards directly into the language.**

### Visual

Live validation feedback showing diagnostics:

```
⚠ Missing actor
⚠ Missing exception flow
⚠ Missing approval step
⚠ Undefined business rule
✓ Process complete
```

### Supporting points

- **Mandatory structure** — The grammar requires completeness. Partial models are valid work-in-progress; published models must be complete.
- **Completeness validation** — Real-time diagnostics surface gaps as you type.
- **Enterprise modelling standards** — Built-in compliance with common process frameworks.
- **AI-assisted quality review** — The AI layer reviews for logical consistency, not just syntax.

---

## Section 7 — Enterprise Process Signoff

Genuinely innovative feature. Big headline:

### Headline

**Stop Scheduling Workshops.**

### Flow visual

```
Model Complete
      ↓
Send Deep Link
      ↓
SME Reviews
      ↓
AI Interviews SME
      ↓
Changes Applied
      ↓
Approval Recorded
```

### Features (grid)

- Deep-link reviews — no account required for reviewers
- AI assisted interviews — AI asks targeted questions about the SME's domain
- Approval workflows — structured sign-off with audit trail
- Commentary tracking — threaded feedback on specific nodes
- Approval state visualisation — colour-coded status per element
- Audit history — every change logged and attributable

---

## Section 8 — Multiple Views. One Source of Truth.

The text-first payoff.

### Visual

```
PML Source
     │
     ├── Process View
     ├── Swimlane View
     ├── Capability View
     ├── Journey View
     ├── BPMN Export
     ├── Image Export
     └── Custom Renderers
```

### Body

Because PML models processes as structured knowledge rather than static diagrams, the same process can be rendered in many different ways — each automatically laid out from the same source.

---

## Section 9 — Export to BPMN

### Headline

**Need BPMN? No problem.**

### Body

Build rapidly in PML. Use AI assistance. Refine interactively. Export to standard BPMN when required — with your layout preserved.

### Flow visual

```
PML
  ↓
AI Assisted Refinement
  ↓
Automatic Layout (our algorithm)
  ↓
BPMN Export
```

### Key message

Our layout algorithm is the bridge. The platform gets you to a mature model very fast. Then you export to BPMN format with our layout showing. No manual repositioning needed after export.

---

## Section 10 — How It Works

Three big cards, equal weight.

| Option | Headline | Description |
|--------|----------|-------------|
| **1** | **Write PML** | You write. We render. Full control for power users. |
| **2** | **Describe to AI** | You explain. AI models. Start with natural language, finish with a structured process. |
| **3** | **Collaborate** | Experts review. AI interrogates. Teams approve. End-to-end enterprise workflow. |

---

## Section 11 — Pricing

Embedded pricing section mirroring the `/pricing` page. Three-card grid: Free / Starter ($12/mo) / Pro ($29/mo). Annual toggle. "See full pricing" link to `/pricing`.

---

## Section 12 — Final CTA

### Large statement

> Process knowledge should be written, validated, collaborated on, and generated by AI — not drawn by hand.

### CTAs

- **Start Modelling**
- **View Demo**
- **Read the Language Spec**

---

## Single Biggest Messaging Shift

Change the story from:

> "PML is a process modelling language"

To:

> **PML turns enterprise process modelling from diagram drawing into knowledge engineering.**
