# eBay Listing Enrichment Demo — Upwork Proposal

> **Purpose**: Build a pitch site + working rule engine demo to win a $3K+ Upwork contract for a multi-phase inventory enrichment system.

## Context

A US-based automotive e-commerce company needs a senior automation engineer to build a rules-driven listing enrichment and eBay publishing framework. They have a detailed 7-phase SOW. We're building a demo that proves we understand the architecture and can execute the hardest part: the Item Specifics rule engine.

**This is a one-night build. Scope is tight.**

## User Story

**As a** potential client reviewing proposals  
**I want to** see that this contractor understands my complex requirements  
**So that** I can trust them to build my system correctly

## Deliverable

A single GitHub Pages site: `ldraney.github.io/ebay-enrichment-demo/`

The site contains:
1. Architecture diagram (mermaid) showing full 7-phase pipeline
2. Rule engine explanation with state machine visualization
3. Interactive demo where they can test rule logic with mock data
4. "Implementation approach" section showing how I'd tackle this

---

## Architecture Overview (From Client SOW)

### The 7 Phases

```
Phase 1: Powerlink (SQL) → Google Sheets (daily sync, full refresh)
Phase 2: Google Sheets → Airtable Master Parts Table (IPN persistence, category resolution)
Phase 3: ShipStation API → Airtable (weight/dimensions, backfill + lock)
Phase 4: Item Specifics Automation (THE HARD PART - rule engine)
Phase 5: Pre-Publish Governance (approval gate, staging table)
Phase 6: Fitment Extraction (HTML parsing, copyright-safe rewrite)
Phase 7: Listing Automation (title/description generation)
```

### Key Concepts

- **IPN** = Internal Part Number (unique identifier for each part)
- **Master Parts Table** = Airtable table, source of truth for IPN-level data
- **eBay Listings (API) Table** = Staging table for pre-publish review
- **Physical Locking** = Airtable field protection, not just a flag
- **Authority Boundaries** = Strict rules about what writes where

### Data Flow

```
Powerlink (SQL)
    ↓ (daily, full refresh)
Google Sheets (raw inventory)
    ↓ (IPN persistence rules)
Airtable Master Parts Table (source of truth)
    ↓ (enrichment)
Item Specifics Tabs (per part-type)
    ↓ (staging)
eBay Listings (API) Table (pre-publish)
    ↓ (approval gate)
eBay (live)
```

---

## The Rule Engine (Phase 4) — Core Demo

This is what we're building. The client has 8 rule types that govern how Item Specifics get populated.

### Rule Types

| Rule | Name | Behavior |
|------|------|----------|
| **F** | Fixed | Known value for prefix. Write + lock immediately. |
| **FsV** | Fixed Source → Variable | Pull from Master Parts Table (dimensions). If missing, write "Does Not Apply" to listing only. |
| **VF** | Variable → Fixed | AI determines value. If ≥75% confidence, write + lock. Skip dot-number IPNs. |
| **V1** | Variable (Listing-Only) | AI sources from inventory/title/condition. Write to listing only. Never lock. |
| **V2** | Variable (IPN Interpretation) | AI interprets IPN via external lookup. Listing-only. |
| **VB** | Variable / Blank | Optional field. AI fills if confident, else leave blank. Never lock. |
| **VMF** | Variable → Manual → Fixed | AI tries first. If <75% confidence, create ClickUp task. Lock after manual entry. |
| **MF** | Manual → Fixed | Always human research. Create ClickUp task immediately. Lock after entry. |

### Rule Execution Logic

```
For each Item Specific:
1. Check if field is already Fixed (F) → STOP (never overwrite)
2. Look up rule type from Part Type Logic table
3. Execute rule:
   - If AI involved: check confidence threshold (75%)
   - If confident: write value (to Airtable or listing-only depending on rule)
   - If not confident: escalate to ClickUp OR write "Does Not Apply" OR leave blank
4. If writing to Airtable: apply physical field lock
```

### State Machine (Langgraph Mental Model)

```
┌─────────────────────────────────────────────────────────────┐
│                     ITEM SPECIFIC PROCESSOR                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Start] → [Check Fixed?] ──YES──→ [STOP - No Action]       │
│                │                                            │
│               NO                                            │
│                ↓                                            │
│       [Lookup Rule Type]                                    │
│                │                                            │
│    ┌──────────┼──────────┬──────────┬──────────┐           │
│    ↓          ↓          ↓          ↓          ↓           │
│   [F]       [VF]       [VMF]      [MF]      [V1/VB]        │
│    │          │          │          │          │           │
│    ↓          ↓          ↓          ↓          ↓           │
│  Write    AI Check    AI Check   Create    AI Check        │
│    +         │          │       ClickUp       │            │
│  Lock     ≥75%?      ≥75%?        │        ≥75%?          │
│           /    \     /    \       ↓       /    \          │
│         YES    NO  YES    NO   [Wait]   YES    NO         │
│          │      │   │      │      │      │      │         │
│          ↓      │   ↓      ↓      ↓      ↓      ↓         │
│       Write     │ Write  Create  Lock  Write  Blank/      │
│         +       │   +   ClickUp    +     to    DNA        │
│       Lock      │  Lock    │    Write  listing            │
│                 ↓          ↓      │      only             │
│              [STOP]     [Wait]    │                       │
│                            │      │                       │
│                            ↓      ↓                       │
│                    [Manual Entry + Lock]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Site**: HTML + Tailwind CSS (CDN) + Mermaid.js
- **Demo**: Vanilla JS or React (single file)
- **Deployment**: GitHub Pages
- **No backend needed** — mock data, all client-side

---

## Page Structure

### Section 1: Hero
- Headline: "eBay Listing Enrichment System"
- Subhead: "A rules-driven automation framework for inventory ingestion, enrichment, and controlled publishing"
- "I've read your SOW. Here's how I'd build it."

### Section 2: Architecture Overview
- Mermaid diagram of full 7-phase pipeline
- Brief explanation of each phase
- Highlight data authority boundaries

### Section 3: The Rule Engine (Deep Dive)
- Explain why this is the hard part
- Table of all 8 rule types
- State machine diagram (mermaid)
- Key constraints: 75% confidence, physical locking, no silent overwrites

### Section 4: Interactive Demo
- Select an IPN prefix
- Select an Item Specific
- See which rule applies
- Watch the state machine execute
- Output: action taken, value written (or escalated), lock status

**Mock Data:**
- 3-4 IPN prefixes (e.g., 116, 663, 663.xxx, 900)
- 5-6 Item Specifics per prefix
- Pre-defined rules from Part Type Logic
- Simulated AI confidence scores

### Section 5: Implementation Approach
- "Here's what I'd build first" (Phase 2 + 4 foundation)
- How I handle data authority and locking
- My experience with similar systems (Pure Earth Labs reference)
- Timeline estimate

### Section 6: Footer
- Link to GitHub repo
- "Let's discuss your project"

---

## Mock Data Schema

### Part Type Logic (Rule Assignments)
```javascript
const partTypeLogic = {
  "116": {  // Shared prefix - needs category resolution
    "Brand": "F",
    "Manufacturer Part Number": "VF",
    "Interchange Part Number": "F",
    "Fitment Type": "VMF",
    "Warranty": "F",
    "Country of Manufacture": "MF"
  },
  "663": {
    "Brand": "F",
    "Manufacturer Part Number": "VF",
    "Placement on Vehicle": "V1",
    "Fitment Type": "VMF",
    "Weight": "FsV"
  },
  "663.": {  // Dot-number IPN - special handling
    "Brand": "F",
    "Manufacturer Part Number": "VB",  // VF skips dot-numbers
    "Fitment Type": "VMF"
  }
};
```

### Fixed Values (Source of Truth)
```javascript
const fixedValues = {
  "116": {
    "Brand": "ACDelco",
    "Interchange Part Number": "See Fitment",
    "Warranty": "1 Year"
  },
  "663": {
    "Brand": "Dorman",
    "Warranty": "1 Year"
  }
};
```

### Master Parts Table (Mock)
```javascript
const masterPartsTable = {
  "116-5423": {
    ipn: "116-5423",
    prefix: "116",
    category: null,  // Needs resolution
    weight: 2.3,
    dimensions: "8x6x4",
    locked_fields: ["weight", "dimensions"]
  },
  "663-7891": {
    ipn: "663-7891",
    prefix: "663",
    category: "Brake Pads",
    weight: null,  // Needs ShipStation
    dimensions: null,
    locked_fields: []
  }
};
```

---

## Acceptance Criteria

### Architecture Diagram
- [ ] Shows all 7 phases with data flow arrows
- [ ] Clearly marks authority boundaries (what writes where)
- [ ] Identifies Airtable as source of truth
- [ ] Shows ClickUp escalation paths

### Rule Engine Explanation
- [ ] All 8 rule types documented with behavior
- [ ] State machine diagram is accurate to SOW
- [ ] 75% confidence threshold explained
- [ ] Physical locking vs. logical flags distinguished

### Interactive Demo
- [ ] User can select IPN prefix
- [ ] User can select Item Specific
- [ ] Rule type is displayed
- [ ] Execution path is visualized (which branch of state machine)
- [ ] Output shows: value written, destination (Airtable vs listing-only), lock status, ClickUp task created
- [ ] Handles edge cases: dot-number IPNs, excluded prefixes (900, 950, 999)

### Implementation Approach
- [ ] References specific SOW phases
- [ ] Mentions data authority and overwrite prevention
- [ ] Connects to prior experience
- [ ] Realistic timeline

---

## Key SOW Constraints to Honor

1. **Never overwrite Fixed (F) values** — they are authoritative
2. **Physical locking** = Airtable field protection, not a status flag
3. **75% confidence threshold** for all AI decisions
4. **Excluded prefixes**: 900, 950, 999 — never ingest
5. **Dot-number IPNs** (e.g., 663.xxxx) skip VF rules
6. **eBay listings are temporary** — never source of truth
7. **"Does Not Apply"** only written to listing, never Master Parts Table
8. **No silent updates, no reprocessing, no accidental overwrites**

---

## File Structure

```
ebay-enrichment-demo/
├── index.html          # Main pitch site
├── styles.css          # Tailwind customizations (if needed)
├── demo.js             # Rule engine logic + UI interactions
├── data.js             # Mock data (Part Type Logic, Fixed Values, etc.)
├── README.md           # Project overview for GitHub
└── diagrams/           # Mermaid source files (optional, can inline)
```

---

## Success Criteria

This demo succeeds if:

1. **Client sees I read the SOW** — specific references, accurate terminology
2. **Architecture is clear** — they can trace data flow in 30 seconds
3. **Rule engine logic is correct** — matches their 8 rule types exactly
4. **Demo is interactive** — they can click through scenarios
5. **Implementation approach is credible** — realistic, phased, references experience

---

## Time Budget (One Night)

| Task | Time |
|------|------|
| Mermaid diagrams (pipeline + state machine) | 1 hr |
| HTML/Tailwind site structure | 1 hr |
| Rule engine logic (JS) | 2 hr |
| Interactive demo UI | 1.5 hr |
| Mock data + edge cases | 0.5 hr |
| Polish + deploy | 1 hr |
| **Total** | **7 hrs** |

---

## Notes for Claude Code

- Use Tailwind CDN, no build step
- Mermaid.js CDN for diagrams
- Keep it single-page, smooth scroll
- Dark theme preferred (matches my other portfolio pieces)
- Mobile doesn't matter — client is reviewing on desktop
- Deploy to GitHub Pages when ready

---

## Reference: Client's Exact Words

> "If you enjoy clean data models, strict authority boundaries, and lifecycle enforcement, this project will be a good fit."

> "Not looking for 'I'll figure it out as I go'"

> "Generic proposals will be ignored"

This demo is the opposite of generic. Let's build.
