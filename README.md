# eBay Listing Enrichment System

A rules-driven automation framework for inventory ingestion, enrichment, and controlled eBay publishing. Built as an interactive proposal demo for a $3K+ Upwork contract.

**Live site:** [ldraney.github.io/ebay-enrichment-demo](https://ldraney.github.io/ebay-enrichment-demo/)

## What This Is

An interactive single-page site that demonstrates deep understanding of a client's 7-phase inventory enrichment pipeline and implements the hardest piece — an 8-rule-type Item Specifics engine — as a working, clickable demo with mock data.

Built in one night. No frameworks, no build step.

## The Problem

A US-based automotive e-commerce company needs to:

1. Ingest inventory from Powerlink (SQL) → Google Sheets → Airtable
2. Enrich item-specific metadata using 8 different rule types with AI confidence thresholds
3. Publish controlled listings to eBay with approval gates and physical field locking

The rule engine (Phase 4) is the hard part — this demo proves the logic is understood and executable.

## The 7-Phase Pipeline

```
Phase 1: Powerlink (SQL) → Google Sheets (daily full refresh)
Phase 2: Google Sheets → Airtable Master Parts Table (IPN persistence)
Phase 3: ShipStation API → Airtable (weight/dimensions backfill + lock)
Phase 4: Item Specifics Automation (RULE ENGINE — the core)
Phase 5: Pre-Publish Governance (approval gate, staging table)
Phase 6: Fitment Extraction (HTML parsing, copyright-safe rewrite)
Phase 7: Listing Automation (title/description generation)
```

## Rule Engine — 8 Rule Types

| Rule | Name | Behavior | Destination | Locks? |
|------|------|----------|-------------|--------|
| **F** | Fixed | Known value for prefix. Write + lock immediately | Airtable | Yes |
| **FsV** | Fixed Source → Variable | Pull from Master Table. If missing, write "Does Not Apply" to listing only | Listing | No |
| **VF** | Variable → Fixed | AI determines value. ≥75% confidence → write + lock. Skips dot-number IPNs | Airtable | Yes |
| **V1** | Variable (Listing-Only) | AI sources from inventory/title/condition. Listing only | Listing | No |
| **V2** | Variable (IPN Interpretation) | AI interprets IPN via external lookup. Listing only | Listing | No |
| **VB** | Variable / Blank | Optional. AI fills if confident, else leave blank | Listing | No |
| **VMF** | Variable → Manual → Fixed | AI first. If <75%, escalate to ClickUp. Lock after manual entry | Airtable | After manual |
| **MF** | Manual → Fixed | Always human research. ClickUp task immediately. Lock after entry | Airtable | After manual |

### Key Constraints

- 75% confidence threshold for all AI decisions
- Never overwrite Fixed (F) values
- Never write "Does Not Apply" to Airtable — listing only
- Physical locking = Airtable field protection, not a status flag
- Dot-number IPNs (e.g., 663.xxxx) skip VF rules
- Excluded prefixes (900, 950, 999) are never ingested
- No silent updates, no reprocessing

## Interactive Demo

The site includes a working demo where you can:

1. Select an IPN prefix (116, 663, 663.xxxx, 450, or excluded 900/950/999)
2. Select an Item Specific field
3. Adjust AI confidence with a slider
4. Run the rule engine and watch the decision tree execute
5. See output: value written, destination, lock status, ClickUp escalation

Edge cases are handled — dot-number IPNs, excluded prefixes, low confidence escalation, missing source values.

## Tech Stack

- **HTML5** — single page, semantic structure
- **Tailwind CSS** — CDN, dark theme
- **Mermaid.js** — architecture flowchart + rule engine state machine
- **Vanilla JavaScript** — rule engine logic + interactive UI
- **GitHub Pages** — deployment via GitHub Actions

No build step. No frameworks. No backend.

## Project Structure

```
├── index.html      # Main site (591 lines)
├── demo.js         # Rule engine + UI logic (624 lines)
├── data.js         # Mock data — part types, fixed values, AI responses (291 lines)
├── CLAUDE.md       # Full project spec / SOW documentation
└── .github/
    └── workflows/
        └── deploy.yml   # GitHub Pages deployment
```

## Local Development

Open `index.html` in a browser. That's it.

## License

This is a proposal demo. All logic is simulated with mock data.
