/**
 * Rule Engine Demo for eBay Listing Enrichment
 *
 * Implements all 8 rule types with proper state machine logic:
 * F, FsV, VF, V1, V2, VB, VMF, MF
 */

// DOM Elements
let ipnPrefixSelect;
let itemSpecificSelect;
let aiConfidenceSlider;
let confidenceValueDisplay;
let runEngineButton;
let outputPanel;
let executionLog;

// State
let selectedPrefix = null;
let selectedItemSpecific = null;
let simulatedConfidence = 80;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ipnPrefixSelect = document.getElementById('ipnPrefix');
    itemSpecificSelect = document.getElementById('itemSpecific');
    aiConfidenceSlider = document.getElementById('aiConfidence');
    confidenceValueDisplay = document.getElementById('confidenceValue');
    runEngineButton = document.getElementById('runEngine');
    outputPanel = document.getElementById('outputPanel');
    executionLog = document.getElementById('executionLog');

    initializeSelects();
    attachEventListeners();
});

function initializeSelects() {
    // Populate IPN prefix dropdown
    Object.entries(partTypeLogic).forEach(([prefix, data]) => {
        const option = document.createElement('option');
        option.value = prefix;
        if (data.excluded) {
            option.textContent = `${prefix} - ${data.name}`;
            option.classList.add('text-red-400');
        } else {
            option.textContent = `${prefix} - ${data.name}`;
        }
        ipnPrefixSelect.appendChild(option);
    });
}

function attachEventListeners() {
    ipnPrefixSelect.addEventListener('change', handlePrefixChange);
    itemSpecificSelect.addEventListener('change', handleItemSpecificChange);
    aiConfidenceSlider.addEventListener('input', handleConfidenceChange);
    runEngineButton.addEventListener('click', runRuleEngine);
}

function handlePrefixChange(e) {
    selectedPrefix = e.target.value;
    selectedItemSpecific = null;

    // Clear and populate Item Specific dropdown
    itemSpecificSelect.innerHTML = '<option value="">Select an Item Specific...</option>';

    if (!selectedPrefix) {
        itemSpecificSelect.disabled = true;
        runEngineButton.disabled = true;
        return;
    }

    const prefixData = partTypeLogic[selectedPrefix];

    // Handle excluded prefixes
    if (prefixData.excluded) {
        itemSpecificSelect.disabled = true;
        runEngineButton.disabled = true;
        showExcludedWarning(prefixData);
        return;
    }

    // Populate Item Specifics for this prefix
    Object.entries(prefixData.itemSpecifics).forEach(([itemSpecific, ruleType]) => {
        const option = document.createElement('option');
        option.value = itemSpecific;
        option.textContent = `${itemSpecific} (${ruleType})`;
        itemSpecificSelect.appendChild(option);
    });

    itemSpecificSelect.disabled = false;
    clearOutput();
}

function handleItemSpecificChange(e) {
    selectedItemSpecific = e.target.value;
    runEngineButton.disabled = !selectedItemSpecific;
}

function handleConfidenceChange(e) {
    simulatedConfidence = parseInt(e.target.value);
    confidenceValueDisplay.textContent = `${simulatedConfidence}%`;

    // Color code based on threshold
    if (simulatedConfidence >= CONFIDENCE_THRESHOLD) {
        confidenceValueDisplay.classList.remove('text-red-400');
        confidenceValueDisplay.classList.add('text-green-400');
    } else {
        confidenceValueDisplay.classList.remove('text-green-400');
        confidenceValueDisplay.classList.add('text-red-400');
    }
}

function showExcludedWarning(prefixData) {
    outputPanel.innerHTML = `
        <div class="bg-red-900/30 border border-red-600 rounded-lg p-4">
            <div class="flex items-center gap-2 text-red-400 font-semibold mb-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                EXCLUDED PREFIX
            </div>
            <p class="text-gray-400 text-sm">${prefixData.reason}</p>
            <p class="text-gray-500 text-xs mt-2">Prefixes 900, 950, and 999 are never ingested into the system.</p>
        </div>
    `;

    logMessage('ERROR', `Prefix "${selectedPrefix}" is excluded - never ingest`);
}

function clearOutput() {
    outputPanel.innerHTML = `
        <div class="text-gray-500 text-center py-8">
            Select an IPN and Item Specific to see results
        </div>
    `;
}

function logMessage(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        INFO: 'text-blue-400',
        SUCCESS: 'text-green-400',
        WARNING: 'text-yellow-400',
        ERROR: 'text-red-400',
        ACTION: 'text-purple-400'
    };

    const logEntry = document.createElement('div');
    logEntry.innerHTML = `
        <span class="text-gray-600">[${timestamp}]</span>
        <span class="${colors[type] || 'text-gray-400'}">[${type}]</span>
        <span class="text-gray-300">${message}</span>
    `;
    executionLog.appendChild(logEntry);
    executionLog.scrollTop = executionLog.scrollHeight;
}

function clearLog() {
    executionLog.innerHTML = '';
}

// ============================================
// RULE ENGINE CORE
// ============================================

function runRuleEngine() {
    clearLog();

    const prefixData = partTypeLogic[selectedPrefix];
    const ruleTypeCode = prefixData.itemSpecifics[selectedItemSpecific];
    const ruleType = RULE_TYPES[ruleTypeCode];

    logMessage('INFO', `Processing: ${selectedItemSpecific} for prefix ${selectedPrefix}`);
    logMessage('INFO', `Rule Type: ${ruleTypeCode} (${ruleType.name})`);

    // Check if this is a dot-number IPN
    const isDotNumber = prefixData.isDotNumber || false;
    if (isDotNumber) {
        logMessage('WARNING', 'Dot-number IPN detected - special handling applies');
    }

    // Execute the appropriate rule
    let result;
    switch (ruleTypeCode) {
        case 'F':
            result = executeRuleF();
            break;
        case 'FsV':
            result = executeRuleFsV();
            break;
        case 'VF':
            result = executeRuleVF(isDotNumber);
            break;
        case 'V1':
            result = executeRuleV1();
            break;
        case 'V2':
            result = executeRuleV2();
            break;
        case 'VB':
            result = executeRuleVB();
            break;
        case 'VMF':
            result = executeRuleVMF();
            break;
        case 'MF':
            result = executeRuleMF();
            break;
        default:
            logMessage('ERROR', `Unknown rule type: ${ruleTypeCode}`);
            return;
    }

    // Display result
    displayResult(result, ruleType);
}

function executeRuleF() {
    logMessage('ACTION', 'Rule F: Looking up fixed value...');

    const value = fixedValues[selectedPrefix]?.[selectedItemSpecific];

    if (value) {
        logMessage('SUCCESS', `Found fixed value: "${value}"`);
        logMessage('ACTION', 'Writing to Airtable Master Parts Table...');
        logMessage('ACTION', 'Applying physical field lock...');
        logMessage('SUCCESS', 'Field locked successfully');

        return {
            action: 'write_and_lock',
            value: value,
            destination: 'Airtable Master Parts Table',
            locked: true,
            clickUpTask: false
        };
    } else {
        logMessage('ERROR', 'No fixed value defined for this prefix/field combination');
        return {
            action: 'error',
            value: null,
            error: 'Missing fixed value configuration'
        };
    }
}

function executeRuleFsV() {
    logMessage('ACTION', 'Rule FsV: Checking Master Parts Table for source value...');

    // Simulate looking up a value from Master Parts Table
    const mockIpn = Object.keys(masterPartsTable).find(ipn => ipn.startsWith(selectedPrefix.replace('.', '')));
    const record = masterPartsTable[mockIpn];

    // Check if the field has a value in the source
    let sourceValue = null;
    if (selectedItemSpecific === 'Weight' && record?.weight) {
        sourceValue = `${record.weight} lbs`;
    } else if (selectedItemSpecific === 'Dimensions' && record?.dimensions) {
        sourceValue = record.dimensions;
    }

    if (sourceValue) {
        logMessage('SUCCESS', `Found source value: "${sourceValue}"`);
        logMessage('ACTION', 'Writing to eBay Listing (API) Table...');

        return {
            action: 'write_listing',
            value: sourceValue,
            destination: 'eBay Listing (API) Table',
            locked: false,
            clickUpTask: false,
            note: 'Sourced from Master Parts Table'
        };
    } else {
        logMessage('WARNING', 'Source value not found in Master Parts Table');
        logMessage('ACTION', 'Writing "Does Not Apply" to listing only...');

        return {
            action: 'write_dna',
            value: 'Does Not Apply',
            destination: 'eBay Listing (API) Table',
            locked: false,
            clickUpTask: false,
            note: 'Value missing from source - DNA written to listing only (never to Airtable)'
        };
    }
}

function executeRuleVF(isDotNumber) {
    if (isDotNumber) {
        logMessage('WARNING', 'Rule VF: Skipping dot-number IPN');
        logMessage('INFO', 'Dot-number IPNs (.xxxx) are excluded from VF rules per SOW');

        return {
            action: 'skip',
            value: null,
            destination: null,
            locked: false,
            clickUpTask: false,
            note: 'Dot-number IPN - VF rule skipped'
        };
    }

    logMessage('ACTION', 'Rule VF: Running AI classification...');
    logMessage('INFO', `Confidence threshold: ${CONFIDENCE_THRESHOLD}%`);
    logMessage('INFO', `Simulated confidence: ${simulatedConfidence}%`);

    if (simulatedConfidence >= CONFIDENCE_THRESHOLD) {
        const mockValue = generateMockAIValue(selectedItemSpecific);
        logMessage('SUCCESS', `AI confident (${simulatedConfidence}%): "${mockValue}"`);
        logMessage('ACTION', 'Writing to Airtable Master Parts Table...');
        logMessage('ACTION', 'Applying physical field lock...');
        logMessage('SUCCESS', 'Field locked successfully');

        return {
            action: 'write_and_lock',
            value: mockValue,
            destination: 'Airtable Master Parts Table',
            locked: true,
            clickUpTask: false,
            confidence: simulatedConfidence
        };
    } else {
        logMessage('WARNING', `AI confidence too low (${simulatedConfidence}% < ${CONFIDENCE_THRESHOLD}%)`);
        logMessage('INFO', 'No action taken - field remains unset');

        return {
            action: 'skip_low_confidence',
            value: null,
            destination: null,
            locked: false,
            clickUpTask: false,
            confidence: simulatedConfidence,
            note: `Confidence ${simulatedConfidence}% below ${CONFIDENCE_THRESHOLD}% threshold`
        };
    }
}

function executeRuleV1() {
    logMessage('ACTION', 'Rule V1: Running AI classification from inventory/title/condition...');

    const mockValue = generateMockAIValue(selectedItemSpecific);
    logMessage('SUCCESS', `AI determined value: "${mockValue}"`);
    logMessage('ACTION', 'Writing to eBay Listing (API) Table...');
    logMessage('INFO', 'Field will NOT be locked (listing-only value)');

    return {
        action: 'write_listing',
        value: mockValue,
        destination: 'eBay Listing (API) Table',
        locked: false,
        clickUpTask: false,
        note: 'Listing-only value - never persisted to Airtable'
    };
}

function executeRuleV2() {
    logMessage('ACTION', 'Rule V2: Interpreting IPN via external lookup...');

    const mockValue = generateMockAIValue(selectedItemSpecific);
    logMessage('SUCCESS', `External lookup result: "${mockValue}"`);
    logMessage('ACTION', 'Writing to eBay Listing (API) Table...');

    return {
        action: 'write_listing',
        value: mockValue,
        destination: 'eBay Listing (API) Table',
        locked: false,
        clickUpTask: false,
        note: 'IPN interpretation - listing-only'
    };
}

function executeRuleVB() {
    logMessage('ACTION', 'Rule VB: AI attempting optional field...');
    logMessage('INFO', `Simulated confidence: ${simulatedConfidence}%`);

    if (simulatedConfidence >= CONFIDENCE_THRESHOLD) {
        const mockValue = generateMockAIValue(selectedItemSpecific);
        logMessage('SUCCESS', `AI confident (${simulatedConfidence}%): "${mockValue}"`);
        logMessage('ACTION', 'Writing to eBay Listing (API) Table...');

        return {
            action: 'write_listing',
            value: mockValue,
            destination: 'eBay Listing (API) Table',
            locked: false,
            clickUpTask: false,
            confidence: simulatedConfidence,
            note: 'Optional field - filled by AI'
        };
    } else {
        logMessage('INFO', `AI not confident enough (${simulatedConfidence}%)`);
        logMessage('ACTION', 'Leaving field blank (optional field)');

        return {
            action: 'leave_blank',
            value: null,
            destination: null,
            locked: false,
            clickUpTask: false,
            confidence: simulatedConfidence,
            note: 'Optional field left blank - no penalty'
        };
    }
}

function executeRuleVMF() {
    logMessage('ACTION', 'Rule VMF: AI attempting first...');
    logMessage('INFO', `Confidence threshold: ${CONFIDENCE_THRESHOLD}%`);
    logMessage('INFO', `Simulated confidence: ${simulatedConfidence}%`);

    if (simulatedConfidence >= CONFIDENCE_THRESHOLD) {
        const mockValue = generateMockAIValue(selectedItemSpecific);
        logMessage('SUCCESS', `AI confident (${simulatedConfidence}%): "${mockValue}"`);
        logMessage('ACTION', 'Writing to Airtable Master Parts Table...');
        logMessage('ACTION', 'Applying physical field lock...');
        logMessage('SUCCESS', 'Field locked successfully');

        return {
            action: 'write_and_lock',
            value: mockValue,
            destination: 'Airtable Master Parts Table',
            locked: true,
            clickUpTask: false,
            confidence: simulatedConfidence
        };
    } else {
        logMessage('WARNING', `AI confidence too low (${simulatedConfidence}% < ${CONFIDENCE_THRESHOLD}%)`);
        logMessage('ACTION', 'Creating ClickUp task for manual review...');
        logMessage('SUCCESS', 'ClickUp task created: "Review ' + selectedItemSpecific + ' for prefix ' + selectedPrefix + '"');
        logMessage('INFO', 'Awaiting manual entry - field will be locked after human input');

        return {
            action: 'escalate',
            value: null,
            destination: 'ClickUp',
            locked: false,
            clickUpTask: true,
            confidence: simulatedConfidence,
            note: 'Escalated to manual review - will be locked after human entry'
        };
    }
}

function executeRuleMF() {
    logMessage('ACTION', 'Rule MF: Manual-only field - always requires human research');
    logMessage('ACTION', 'Creating ClickUp task immediately...');
    logMessage('SUCCESS', 'ClickUp task created: "Research ' + selectedItemSpecific + ' for prefix ' + selectedPrefix + '"');
    logMessage('INFO', 'Awaiting manual entry - field will be locked after human input');

    return {
        action: 'escalate',
        value: null,
        destination: 'ClickUp',
        locked: false,
        clickUpTask: true,
        note: 'Manual-only field - always requires human research'
    };
}

function generateMockAIValue(itemSpecific) {
    const mockValues = {
        'Manufacturer Part Number': 'MPN-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        'Fitment Type': ['Direct Replacement', 'OEM Replacement', 'Performance Upgrade'][Math.floor(Math.random() * 3)],
        'Placement on Vehicle': ['Front', 'Rear', 'Left', 'Right', 'Front Left', 'Front Right'][Math.floor(Math.random() * 6)],
        'Condition': 'New',
        'Material': ['Ceramic', 'Semi-Metallic', 'Organic'][Math.floor(Math.random() * 3)],
        'Engine Type': ['V6 3.5L', 'V8 5.0L', 'I4 2.0L', 'V8 4.6L'][Math.floor(Math.random() * 4)],
        'Warranty': '1 Year',
        'Weight': (Math.random() * 10 + 0.5).toFixed(1) + ' lbs'
    };

    return mockValues[itemSpecific] || 'AI-Generated-Value';
}

function displayResult(result, ruleType) {
    // Full Tailwind classes (CDN doesn't support dynamic class names)
    const statusStyles = {
        write_and_lock: {
            badge: 'bg-green-900/50 text-green-400 border-green-600',
            border: 'border-green-500'
        },
        write_listing: {
            badge: 'bg-blue-900/50 text-blue-400 border-blue-600',
            border: 'border-blue-500'
        },
        write_dna: {
            badge: 'bg-yellow-900/50 text-yellow-400 border-yellow-600',
            border: 'border-yellow-500'
        },
        skip: {
            badge: 'bg-gray-900/50 text-gray-400 border-gray-600',
            border: 'border-gray-500'
        },
        skip_low_confidence: {
            badge: 'bg-yellow-900/50 text-yellow-400 border-yellow-600',
            border: 'border-yellow-500'
        },
        leave_blank: {
            badge: 'bg-gray-900/50 text-gray-400 border-gray-600',
            border: 'border-gray-500'
        },
        escalate: {
            badge: 'bg-orange-900/50 text-orange-400 border-orange-600',
            border: 'border-orange-500'
        },
        error: {
            badge: 'bg-red-900/50 text-red-400 border-red-600',
            border: 'border-red-500'
        }
    };

    const statusLabels = {
        write_and_lock: 'Written + Locked',
        write_listing: 'Written to Listing',
        write_dna: 'Does Not Apply',
        skip: 'Skipped',
        skip_low_confidence: 'Skipped (Low Confidence)',
        leave_blank: 'Left Blank',
        escalate: 'Escalated to ClickUp',
        error: 'Error'
    };

    const styles = statusStyles[result.action];

    outputPanel.innerHTML = `
        <div class="space-y-4">
            <!-- Status Badge -->
            <div class="flex items-center gap-3">
                <span class="px-3 py-1 rounded-full text-sm font-medium border ${styles.badge}">
                    ${statusLabels[result.action]}
                </span>
                <span class="text-gray-500 text-sm">${ruleType.code}: ${ruleType.name}</span>
            </div>

            <!-- Value -->
            ${result.value ? `
                <div class="bg-dark-600 rounded-lg p-4">
                    <div class="text-gray-400 text-xs uppercase mb-1">Value</div>
                    <div class="text-white text-lg font-mono">${result.value}</div>
                </div>
            ` : ''}

            <!-- Details Grid -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-dark-600 rounded-lg p-3">
                    <div class="text-gray-400 text-xs uppercase mb-1">Destination</div>
                    <div class="text-white text-sm">${result.destination || 'None'}</div>
                </div>
                <div class="bg-dark-600 rounded-lg p-3">
                    <div class="text-gray-400 text-xs uppercase mb-1">Locked</div>
                    <div class="text-sm ${result.locked ? 'text-green-400' : 'text-gray-500'}">
                        ${result.locked ? 'Yes - Physical Lock' : 'No'}
                    </div>
                </div>
                ${result.confidence !== undefined ? `
                    <div class="bg-dark-600 rounded-lg p-3">
                        <div class="text-gray-400 text-xs uppercase mb-1">AI Confidence</div>
                        <div class="text-sm ${result.confidence >= CONFIDENCE_THRESHOLD ? 'text-green-400' : 'text-red-400'}">
                            ${result.confidence}% ${result.confidence >= CONFIDENCE_THRESHOLD ? '(Above threshold)' : '(Below threshold)'}
                        </div>
                    </div>
                ` : ''}
                <div class="bg-dark-600 rounded-lg p-3">
                    <div class="text-gray-400 text-xs uppercase mb-1">ClickUp Task</div>
                    <div class="text-sm ${result.clickUpTask ? 'text-orange-400' : 'text-gray-500'}">
                        ${result.clickUpTask ? 'Created' : 'None'}
                    </div>
                </div>
            </div>

            <!-- Note -->
            ${result.note ? `
                <div class="bg-dark-600/50 rounded-lg p-3 border-l-4 ${styles.border}">
                    <div class="text-gray-400 text-sm">${result.note}</div>
                </div>
            ` : ''}
        </div>
    `;
}
