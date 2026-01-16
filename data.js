/**
 * Mock Data for eBay Listing Enrichment Demo
 *
 * This simulates the actual data structures that would exist in:
 * - Airtable Master Parts Table
 * - Part Type Logic tables
 * - Fixed Values lookup
 */

// Rule type definitions with metadata
const RULE_TYPES = {
    F: {
        code: 'F',
        name: 'Fixed',
        description: 'Known value for prefix. Write + lock immediately.',
        destination: 'airtable',
        locks: true,
        usesAI: false,
        color: 'green'
    },
    FsV: {
        code: 'FsV',
        name: 'Fixed Source → Variable',
        description: 'Pull from Master Parts Table. If missing, write "Does Not Apply" to listing only.',
        destination: 'listing',
        locks: false,
        usesAI: false,
        color: 'blue'
    },
    VF: {
        code: 'VF',
        name: 'Variable → Fixed',
        description: 'AI determines value. If ≥75% confidence, write + lock. Skip dot-number IPNs.',
        destination: 'airtable',
        locks: true,
        usesAI: true,
        skipDotNumbers: true,
        color: 'yellow'
    },
    V1: {
        code: 'V1',
        name: 'Variable (Listing-Only)',
        description: 'AI sources from inventory/title/condition. Write to listing only. Never lock.',
        destination: 'listing',
        locks: false,
        usesAI: true,
        color: 'purple'
    },
    V2: {
        code: 'V2',
        name: 'Variable (IPN Interpretation)',
        description: 'AI interprets IPN via external lookup. Listing only.',
        destination: 'listing',
        locks: false,
        usesAI: true,
        color: 'purple'
    },
    VB: {
        code: 'VB',
        name: 'Variable / Blank',
        description: 'Optional field. AI fills if confident, else leave blank. Never lock.',
        destination: 'listing',
        locks: false,
        usesAI: true,
        optional: true,
        color: 'gray'
    },
    VMF: {
        code: 'VMF',
        name: 'Variable → Manual → Fixed',
        description: 'AI tries first. If <75% confidence, create ClickUp task. Lock after manual entry.',
        destination: 'airtable',
        locks: true,
        usesAI: true,
        escalates: true,
        color: 'orange'
    },
    MF: {
        code: 'MF',
        name: 'Manual → Fixed',
        description: 'Always human research. Create ClickUp task immediately. Lock after entry.',
        destination: 'airtable',
        locks: true,
        usesAI: false,
        escalates: true,
        alwaysManual: true,
        color: 'red'
    }
};

// Part Type Logic - Rule assignments per prefix and Item Specific
const partTypeLogic = {
    "116": {
        name: "Shared Prefix (Category Resolution Required)",
        category: null,
        itemSpecifics: {
            "Brand": "F",
            "Manufacturer Part Number": "VF",
            "Interchange Part Number": "F",
            "Fitment Type": "VMF",
            "Warranty": "F",
            "Country of Manufacture": "MF",
            "Placement on Vehicle": "V1"
        }
    },
    "663": {
        name: "Brake Components",
        category: "Brake Pads",
        itemSpecifics: {
            "Brand": "F",
            "Manufacturer Part Number": "VF",
            "Placement on Vehicle": "V1",
            "Fitment Type": "VMF",
            "Weight": "FsV",
            "Condition": "V1",
            "Material": "VB"
        }
    },
    "663.": {
        name: "Dot-Number IPN (Special Handling)",
        category: "Brake Components - Variant",
        isDotNumber: true,
        itemSpecifics: {
            "Brand": "F",
            "Manufacturer Part Number": "VB",  // VF skips dot-numbers, falls to VB
            "Fitment Type": "VMF",
            "Placement on Vehicle": "V1",
            "Condition": "V1"
        }
    },
    "450": {
        name: "Engine Components",
        category: "Engine Parts",
        itemSpecifics: {
            "Brand": "F",
            "Manufacturer Part Number": "VF",
            "Engine Type": "V2",
            "Fitment Type": "VMF",
            "OE Spec": "MF",
            "Warranty": "F"
        }
    },
    "900": {
        name: "EXCLUDED - Never Ingest",
        excluded: true,
        reason: "Excluded prefix per SOW",
        itemSpecifics: {}
    },
    "950": {
        name: "EXCLUDED - Never Ingest",
        excluded: true,
        reason: "Excluded prefix per SOW",
        itemSpecifics: {}
    },
    "999": {
        name: "EXCLUDED - Never Ingest",
        excluded: true,
        reason: "Excluded prefix per SOW",
        itemSpecifics: {}
    }
};

// Fixed values - source of truth for F-type rules
const fixedValues = {
    "116": {
        "Brand": "ACDelco",
        "Interchange Part Number": "See Fitment",
        "Warranty": "1 Year"
    },
    "663": {
        "Brand": "Dorman",
        "Warranty": "1 Year"
    },
    "663.": {
        "Brand": "Dorman"
    },
    "450": {
        "Brand": "Motorcraft",
        "Warranty": "2 Years"
    }
};

// Mock Master Parts Table records
const masterPartsTable = {
    "116-5423": {
        ipn: "116-5423",
        prefix: "116",
        title: "ACDelco Professional Brake Pad Set",
        category: null,  // Needs resolution
        weight: 2.3,
        dimensions: "8x6x4",
        lockedFields: ["weight", "dimensions"],
        itemSpecifics: {
            "Brand": { value: "ACDelco", locked: true },
            "Interchange Part Number": { value: "See Fitment", locked: true }
        }
    },
    "663-7891": {
        ipn: "663-7891",
        prefix: "663",
        title: "Dorman Front Brake Pad Kit",
        category: "Brake Pads",
        weight: null,  // Needs ShipStation
        dimensions: null,
        lockedFields: [],
        itemSpecifics: {
            "Brand": { value: "Dorman", locked: true }
        }
    },
    "663.1234": {
        ipn: "663.1234",
        prefix: "663.",
        title: "Dorman Brake Pad Variant",
        category: "Brake Pads",
        weight: 1.8,
        dimensions: "6x5x3",
        lockedFields: ["weight"],
        itemSpecifics: {
            "Brand": { value: "Dorman", locked: true }
        }
    },
    "450-9012": {
        ipn: "450-9012",
        prefix: "450",
        title: "Motorcraft Engine Mount",
        category: "Engine Parts",
        weight: 5.2,
        dimensions: "10x8x6",
        lockedFields: ["weight", "dimensions"],
        itemSpecifics: {
            "Brand": { value: "Motorcraft", locked: true },
            "Warranty": { value: "2 Years", locked: true }
        }
    }
};

// Simulated AI responses for various Item Specifics
const aiResponses = {
    "Manufacturer Part Number": {
        "116-5423": { value: "18046785", confidence: 92 },
        "663-7891": { value: "D1092", confidence: 88 },
        "663.1234": { value: "D1092-A", confidence: 45 },  // Low confidence for dot-number
        "450-9012": { value: "YC2Z-6038-BA", confidence: 95 }
    },
    "Fitment Type": {
        "116-5423": { value: "Direct Replacement", confidence: 78 },
        "663-7891": { value: "Direct Replacement", confidence: 82 },
        "663.1234": { value: "Performance Upgrade", confidence: 65 },
        "450-9012": { value: "OEM Replacement", confidence: 91 }
    },
    "Placement on Vehicle": {
        "116-5423": { value: "Front", confidence: 85 },
        "663-7891": { value: "Front Left", confidence: 79 },
        "663.1234": { value: "Front", confidence: 72 },
        "450-9012": { value: "Engine Bay", confidence: 88 }
    },
    "Condition": {
        "116-5423": { value: "New", confidence: 99 },
        "663-7891": { value: "New", confidence: 99 },
        "663.1234": { value: "New", confidence: 99 },
        "450-9012": { value: "New", confidence: 99 }
    },
    "Material": {
        "663-7891": { value: "Ceramic", confidence: 71 },
        "663.1234": { value: "Semi-Metallic", confidence: 55 }
    },
    "Engine Type": {
        "450-9012": { value: "V8 4.6L", confidence: 86 }
    },
    "Country of Manufacture": {
        "116-5423": { value: null, confidence: 0 },  // Always manual
        "663-7891": { value: null, confidence: 0 },
        "450-9012": { value: null, confidence: 0 }
    },
    "OE Spec": {
        "450-9012": { value: null, confidence: 0 }  // Always manual
    }
};

// Confidence threshold
const CONFIDENCE_THRESHOLD = 75;

// Export for use in demo.js
if (typeof window !== 'undefined') {
    window.RULE_TYPES = RULE_TYPES;
    window.partTypeLogic = partTypeLogic;
    window.fixedValues = fixedValues;
    window.masterPartsTable = masterPartsTable;
    window.aiResponses = aiResponses;
    window.CONFIDENCE_THRESHOLD = CONFIDENCE_THRESHOLD;
}
