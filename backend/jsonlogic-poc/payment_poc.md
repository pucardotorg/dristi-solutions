# JsonLogic + JEXL: Achieving Zero-Downtime Deployment with Configurable Business Logic

## Overview

This document explains how combining **JsonLogic** with **JEXL** enables fully configurable business logic through MDMS, eliminating the need for code deployments when business rules change. This architecture achieves **zero-downtime deployment** for rule updates.

---

## The Core Problem: Hardcoded Business Logic

### Traditional Approach (Requires Deployment)

In traditional systems, complex business logic like fee calculations is **hardcoded in Java services**:

**Example Scenario:** Calculate advocate welfare fees based on the number of advocates representing each litigant.

**Traditional Implementation:**
- Logic written directly in Java service classes
- Fee ranges hardcoded as constants
- Complex loops and conditions embedded in code
- **Any change requires:**
  - Code modification
  - Testing and review
  - Building new artifacts
  - **Scheduled downtime for deployment**
  - Service restart

**Impact:** A simple fee range update (e.g., changing ₹100 to ₹150) requires a full deployment cycle with 15-30 minutes of downtime.

---

## The Solution: MDMS-Driven Configurable Logic

### Architecture Overview

The solution uses a **two-tier approach**:

1. **JsonLogic** - Handles simple, declarative rules and orchestrates the overall logic flow
2. **JEXL Scripts** - Handles complex operations like loops, cross-referencing, and mathematical computations

Both are **configured in MDMS**, not hardcoded in Java.

---

## Understanding JsonLogic Strengths and Limitations

### What JsonLogic Does Well

JsonLogic excels at **simple, declarative rules** that can be expressed in pure JSON:

**Example 1: Simple Conditional Logic**
```
Rule: "If case status is PENDING, charge ₹100, otherwise ₹0"

JsonLogic Expression:
{
  "if": [
    { "==": [{"var": "case.status"}, "PENDING"] },
    100,
    0
  ]
}
```

**Example 2: Basic Arithmetic**
```
Rule: "Add court fee and legal fund"

JsonLogic Expression:
{
  "+": [
    {"var": "params.courtFee"},
    {"var": "params.legalBasicFund"}
  ]
}
```

**When to Use JsonLogic:**
- Simple if/else conditions
- Basic arithmetic (+, -, *, /)
- Direct data extraction from objects
- Comparing values (==, !=, <, >)

---

### What JsonLogic Cannot Do

JsonLogic has **critical limitations** with complex operations:

#### Limitation 1: The "Scope Isolation" Problem

**Scenario:** Count how many advocates represent a specific litigant.

**The Problem:**
- When JsonLogic enters a loop (like `reduce` or `filter`), it **isolates the context**
- Variables from outside the loop become **inaccessible**
- Cannot cross-reference data between nested structures

**Real-World Example:**
```
Data Structure:
- Litigants: [{ individualId: "IND-001" }]
- Representatives: [
    { 
      advocateId: "ADV-001", 
      representing: [{ individualId: "IND-001" }] 
    }
  ]

Goal: Count advocates for litigant "IND-001"

JsonLogic Attempt:
{
  "reduce": [
    {"var": "representatives"},
    {
      // Inside this loop, we CANNOT access the outer litigantId variable!
      // JsonLogic blocks access to parent scope
    }
  ]
}

Result: IMPOSSIBLE in pure JsonLogic
```

#### Limitation 2: No System Functions

JsonLogic lacks:
- **Math utilities**: Cannot use `Math.ceil()`, `Math.floor()`, `Math.round()`
- **Type conversions**: Cannot safely convert strings to numbers with error handling
- **Try-catch**: Cannot handle missing data gracefully
- **Advanced string operations**: Limited string manipulation

**Example:**
```
Need: Round up a decimal fee to nearest whole number
JsonLogic: No built-in ceiling function
Result: Must use JEXL
```

#### Limitation 3: Complex Range Lookups

**Scenario:** Find fee based on value falling within a range.

**Example:**
```
Complaint Amount: ₹6,546,666

Fee Ranges:
- ₹0 to ₹10,000 → ₹200
- ₹10,001 to ₹50,000 → ₹500
- ₹50,001 to ₹100,000 → ₹750
- ₹100,001 to ₹500,000 → ₹1,000
- ₹500,001 to ₹10,000,000 → ₹1,500

JsonLogic Challenge:
- Must iterate through ranges
- Check if value falls between min and max
- Return corresponding fee
- Pure JsonLogic becomes extremely verbose and unreadable
```

---

## How JEXL Solves These Limitations

### JEXL Capabilities

JEXL is a **JavaScript-like expression language** that provides:
- **Full loop support** without scope isolation
- **Access to Java system functions** (Math, String, etc.)
- **Try-catch error handling**
- **Clean, readable syntax** for complex logic

### Example 1: Counting Active Representatives

**Business Rule:** Count how many active advocates represent a specific litigant.

**JEXL Solution:**
```
Input: 
- Representatives array
- Litigant ID to search for

JEXL Logic:
1. Initialize counter to 0
2. Loop through all representatives
3. For each representative:
   - Check if they are active
   - Loop through who they represent
   - If they represent the target litigant, increment counter
4. Return final count

Result: Clean, maintainable logic that handles nested data structures
```

### Example 2: Range-Based Fee Lookup

**Business Rule:** Find the applicable fee based on which range a value falls into.

**JEXL Solution:**
```
Input:
- Array of ranges (each with min, max, fee)
- Value to check (e.g., complaint amount)

JEXL Logic:
1. Loop through each range
2. Check if value >= min AND value <= max
3. If match found, return the fee
4. If no match, return 0

Example Execution:
- Complaint Amount: ₹6,546,666
- Checks ranges sequentially
- Finds match: ₹500,001 to ₹10,000,000
- Returns: ₹1,500
```

### Example 3: Sum Fees Across Multiple Litigants

**Business Rule:** For each litigant, count their advocates, find the applicable fee from a range table, and sum all fees.

**JEXL Solution:**
```
Input:
- Litigants array
- Representatives array
- Fee ranges based on advocate count

JEXL Logic:
1. Initialize total to 0
2. For each litigant:
   a. Count how many advocates represent them
   b. Look up fee based on advocate count in range table
   c. Add fee to total
3. Return total

Example:
- Litigant 1: 1 advocate → ₹100
- Litigant 2: 3 advocates → ₹200
- Total: ₹300
```

---

## The Hybrid Approach: JsonLogic + JEXL

### How They Work Together

**JsonLogic** acts as the **orchestrator**:
- Defines the overall rule structure
- Extracts data from the case object
- Calls custom JEXL operations when needed
- Combines results into final output

**JEXL** acts as the **complex operation handler**:
- Registered as custom operations in JsonLogic
- Executes when JsonLogic encounters operations like `count_active_reps` or `range_lookup`
- Returns results back to JsonLogic

### Flow Example: Advocate Welfare Fee Calculation

**Step 1: JsonLogic Rule (Stored in MDMS)**
```
Rule Definition:
{
  "code": "ADVOCATE_WELFARE_FUND",
  "label": "Advocate Welfare Fund",
  "rule": {
    "sum_advocate_range_fee": [
      {"var": "litigants"},
      {"var": "representatives"},
      {"var": "params.advocateFeeRanges"}
    ]
  }
}
```

**Step 2: JEXL Operation (Stored in MDMS)**
```
Operation Name: "sum_advocate_range_fee"
Operation Logic: JEXL script that:
- Accepts litigants, representatives, and fee ranges
- Counts advocates per litigant
- Looks up fees from ranges
- Returns total sum
```

**Step 3: Execution Flow**
```
1. JsonLogic receives the case data
2. Encounters "sum_advocate_range_fee" operation
3. Extracts: litigants, representatives, advocateFeeRanges
4. Passes data to registered JEXL script
5. JEXL executes complex loop logic
6. Returns result: ₹300
7. JsonLogic includes this in final fee breakdown
```

---

## Zero-Downtime Deployment in Action

### Scenario: Business Wants to Update Fee Ranges

**Current Fee Structure:**
```
Advocate Count Ranges:
- 1-2 advocates: ₹100 per litigant
- 3-5 advocates: ₹200 per litigant
- 6+ advocates: ₹300 per litigant
```

**New Requirement:**
```
Updated Fee Structure:
- 1-2 advocates: ₹150 per litigant (increased)
- 3-5 advocates: ₹250 per litigant (increased)
- 6+ advocates: ₹400 per litigant (increased)
```

### Traditional Approach (With Downtime)

**Steps Required:**
1. Developer modifies Java constants or configuration
2. Code review and approval
3. Unit testing and integration testing
4. Build new JAR/WAR artifacts
5. **Schedule maintenance window**
6. **Stop production services**
7. Deploy new artifacts
8. **Restart services**
9. Verify deployment
10. **Total Downtime: 15-30 minutes**

**Impact:**
- Users cannot file cases during downtime
- Payments interrupted
- Customer complaints
- Revenue loss

### MDMS Approach (Zero Downtime)

**Steps Required:**
1. Admin logs into MDMS portal
2. Updates the fee range configuration:
```
MDMS Update:
{
  "advocateFeeRanges": [
    {"min": 1, "max": 2, "fee": 150},  // Changed from 100
    {"min": 3, "max": 5, "fee": 250},  // Changed from 200
    {"min": 6, "max": 99, "fee": 400}  // Changed from 300
  ]
}
```
3. Saves configuration
4. MDMS cache refreshes (automatic or manual trigger)
5. **Next API request uses new fees immediately**
6. **Total Downtime: 0 seconds**

**Impact:**
- No service interruption
- Instant rule updates
- No deployment pipeline needed
- Business agility achieved

---

## Real-World Example: Complete Fee Calculation

### Input Data

**Case Details:**
```
Case Information:
- Complaint Amount: ₹6,546,666
- Delay Condonation: YES
- Number of Litigants: 1
- Number of Active Advocates: 1
```

### MDMS Configuration

**Fee Parameters:**
```
- Court Fee: ₹100
- Legal Basic Fund: ₹50
- Advocate Clerk Welfare Fund: ₹25
- Delay Condonation Fee: ₹500

Complaint Fee Ranges:
- ₹0 to ₹10,000 → ₹200
- ₹10,001 to ₹50,000 → ₹500
- ₹50,001 to ₹100,000 → ₹750
- ₹100,001 to ₹500,000 → ₹1,000
- ₹500,001 to ₹10,000,000 → ₹1,500

Advocate Fee Ranges (per litigant):
- 1-2 advocates → ₹100
- 3-5 advocates → ₹200
- 6+ advocates → ₹300
```

### Calculation Breakdown

**1. Court Fee**
- Rule: If at least one advocate present, charge ₹100
- Calculation: 1 advocate present → ₹100
- **Result: ₹100**

**2. Legal Basic Fund**
- Rule: If advocate present, charge ₹50
- Calculation: 1 advocate present → ₹50
- **Result: ₹50**

**3. Advocate Clerk Welfare Fund**
- Rule: If advocate present, charge ₹25
- Calculation: 1 advocate present → ₹25
- **Result: ₹25**

**4. Complaint Fee**
- Rule: Based on complaint amount range
- Calculation: ₹6,546,666 falls in ₹500,001-₹10,000,000 range
- **Result: ₹1,500**

**5. Advocate Welfare Fund**
- Rule: Per litigant based on advocate count
- Calculation: 1 litigant with 1 advocate → ₹100
- **Result: ₹100**

**6. Delay Condonation Fee**
- Rule: If delay condonation = YES, charge ₹500
- Calculation: Delay condonation = YES → ₹500
- **Result: ₹500**

**7. Stipend Stamp**
- Rule: Per litigant based on advocate count
- Calculation: 1 litigant with 1 advocate → ₹50
- **Result: ₹50**

### Final Output

```
Fee Breakdown:
{
  "COURT_FEE": 100.0,
  "LEGAL_BENEFIT_FEE": 50.0,
  "ADVOCATE_CLERK_WELFARE_FUND": 25.0,
  "COMPLAINT_FEE": 1500.0,
  "ADVOCATE_WELFARE_FUND": 100.0,
  "DELAY_CONDONATION_FEE": 500.0,
  "STIPEND_STAMP": 50.0,
  "TOTAL": 2325.0
}
```

---

## Key Benefits Summary

### Business Agility
- **Update rules instantly** without code changes
- **Test new fee structures** in staging before production
- **A/B test different fee models** by environment
- **Respond to regulatory changes** within minutes

### Technical Benefits
- **Zero downtime** for rule updates
- **No deployment pipeline** needed for business logic changes
- **Reduced developer workload** - business users can update rules
- **Version control** through MDMS history
- **Rollback capability** - revert to previous configuration instantly

### Operational Benefits
- **No maintenance windows** required
- **No service interruptions**
- **Reduced risk** - no code deployments for rule changes
- **Faster time-to-market** for new fee structures

---

## Comparison Table

| Aspect | Hardcoded Java | JEXL + MDMS |
|--------|----------------|-------------|
| **Rule Changes** | Code modification required | MDMS configuration update |
| **Deployment** | Full CI/CD pipeline | No deployment needed |
| **Downtime** | 15-30 minutes | 0 seconds |
| **Testing** | Full regression suite | Configuration validation |
| **Rollback** | Redeploy previous version | Revert MDMS config |
| **Who Can Update** | Developers only | Business users + Admins |
| **Time to Production** | Hours to days | Minutes |
| **Risk Level** | High (code changes) | Low (config changes) |
| **Complex Loops** | Possible but hardcoded | Configurable via JEXL |
| **Range Updates** | Code constants | MDMS parameters |
| **Business Agility** | Slow | Instant |

---

## Conclusion

By combining **JsonLogic** for orchestration with **JEXL** for complex operations, and storing both in **MDMS**, we achieve:

✅ **Zero-downtime deployment** for business rule changes  
✅ **Complete configurability** without code modifications  
✅ **Business user empowerment** to manage their own rules  
✅ **Reduced operational risk** by eliminating code deployments for logic changes  
✅ **Faster time-to-market** for new business requirements  

This architecture transforms business logic from **static code** into **dynamic configuration**, enabling true business agility while maintaining system stability.
