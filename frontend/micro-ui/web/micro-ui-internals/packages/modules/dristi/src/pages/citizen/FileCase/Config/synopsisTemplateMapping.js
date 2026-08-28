/**
 * Mapping between the Synopsis "Generate Template" fields (as described in the ticket)
 * and the e-filing form data they are picked from.
 *
 * HOW TO READ / EDIT THIS FILE
 * ----------------------------
 * `source`  -> a key of SYNOPSIS_FORM_SOURCES below. It tells the generator which
 *              page's `formdata` array the values are read from.
 * `path`    -> dot path inside a single `formdata[i].data` object.
 *              An EMPTY path ("") means "not mapped yet" and the generated text will
 *              simply print the placeholder ("_____") for that line.
 * `type`    -> how the raw value is rendered:
 *                "text"   - printed as is
 *                "date"   - "YYYY-MM-DD" printed as "15 January 2025"
 *                "amount" - printed as "₹4,50,000"
 *                "option" - dropdown/radio value, prints `name` (falls back to `code`)
 *
 * Sections whose `source` page holds more than one form get numbered headings
 * ("Cheque details 1", "Cheque details 2", ...). With a single form the heading
 * stays unnumbered.
 */

export const SYNOPSIS_MISSING_VALUE_PLACEHOLDER = "_____";

/**
 * Where each logical page lives inside the case object returned by the case search.
 * `section` is either "additionalDetails" or "caseDetails" on the case response.
 */
export const SYNOPSIS_FORM_SOURCES = {
  complainantDetails: { section: "additionalDetails", formKey: "complainantDetails" },
  accusedDetails: { section: "additionalDetails", formKey: "respondentDetails" },
  advocateDetails: { section: "additionalDetails", formKey: "advocateDetails" },
  witnessDetails: { section: "additionalDetails", formKey: "witnessDetails" },
  chequeDetails: { section: "caseDetails", formKey: "chequeDetails" },
  debtLiabilityDetails: { section: "caseDetails", formKey: "debtLiabilityDetails" },
  demandNoticeDetails: { section: "caseDetails", formKey: "demandNoticeDetails" },
  delayApplications: { section: "caseDetails", formKey: "delayApplications" },
};

/**
 * "Parties" block. Each entry collects a list of names across every form of its source
 * page and prints them comma separated on a single line.
 *
 * `listPath`      - optional. When set, the names are read from this array inside
 *                   `formdata[i].data` instead of from `data` itself.
 * `companyName`   - optional. Used instead of first/middle/last when the party is an
 *                   organisation (i.e. when the individual name fields are empty).
 */
export const SYNOPSIS_PARTY_MAPPING = [
  {
    key: "complainantNames",
    label: "SYNOPSIS_LABEL_COMPLAINANT_NAMES",
    defaultLabel: "Complainant Names",
    source: "complainantDetails",
    listPath: "",
    firstName: "firstName",
    middleName: "middleName",
    lastName: "lastName",
    companyName: "complainantCompanyName",
  },
  {
    key: "accusedNames",
    label: "SYNOPSIS_LABEL_ACCUSED_NAMES",
    defaultLabel: "Accused Names",
    source: "accusedDetails",
    listPath: "",
    firstName: "respondentFirstName",
    middleName: "respondentMiddleName",
    lastName: "respondentLastName",
    companyName: "respondentCompanyName",
  },
  {
    key: "complainantAdvocates",
    label: "SYNOPSIS_LABEL_COMPLAINANT_ADVOCATES",
    defaultLabel: "Complainant's Advocates",
    source: "advocateDetails",
    listPath: "multipleAdvocatesAndPip.multipleAdvocateNameDetails",
    firstName: "advocateNameDetails.firstName",
    middleName: "advocateNameDetails.middleName",
    lastName: "advocateNameDetails.lastName",
    companyName: "",
  },
];

/**
 * Ordered list of sections rendered after the "Parties" block.
 *
 * `repeatPerForm: true`  - the section is printed once per form of its source page
 *                          and the heading gets a "1", "2", ... suffix when the page
 *                          has more than one form.
 * `repeatPerForm: false` - printed once; values are read from the first form.
 */
export const SYNOPSIS_SECTION_MAPPING = [
  {
    key: "chequeDetails",
    label: "SYNOPSIS_SECTION_CHEQUE_DETAILS",
    defaultLabel: "Cheque details",
    source: "chequeDetails",
    repeatPerForm: true,
    fields: [
      {
        key: "dateOnCheque",
        label: "SYNOPSIS_LABEL_DATE_ON_CHEQUE",
        defaultLabel: "Date on cheque",
        path: "issuanceDate",
        type: "date",
      },
      {
        key: "chequeAmount",
        label: "SYNOPSIS_LABEL_CHEQUE_AMOUNT",
        defaultLabel: "Amount",
        path: "chequeAmount",
        type: "amount",
      },
      {
        key: "chequeNumber",
        label: "SYNOPSIS_LABEL_CHEQUE_NUMBER",
        defaultLabel: "Cheque number",
        path: "chequeNumber",
        type: "text",
      },
      {
        // Cheque is drawn on the accused's (payer's) bank.
        key: "chequeBankName",
        label: "SYNOPSIS_LABEL_CHEQUE_BANK_NAME",
        defaultLabel: "Bank Name",
        path: "payerBankName",
        type: "text",
      },
      {
        key: "chequeBankBranch",
        label: "SYNOPSIS_LABEL_CHEQUE_BANK_BRANCH",
        defaultLabel: "Bank Branch",
        path: "payerBranchName",
        type: "text",
      },
    ],
  },
  {
    key: "dishonour",
    label: "SYNOPSIS_SECTION_DISHONOUR",
    defaultLabel: "Dishonour",
    source: "chequeDetails",
    repeatPerForm: true,
    fields: [
      {
        key: "dateOfPresentation",
        label: "SYNOPSIS_LABEL_DATE_OF_PRESENTATION",
        defaultLabel: "Date of presentation",
        path: "depositDate",
        type: "date",
      },
      {
        // No "date of return of cheque" field exists on the cheque details form today.
        key: "dateOfReturnOfCheque",
        label: "SYNOPSIS_LABEL_DATE_OF_RETURN_OF_CHEQUE",
        defaultLabel: "Date of Return of Cheque",
        path: "",
        type: "date",
      },
      {
        key: "returnReason",
        label: "SYNOPSIS_LABEL_RETURN_REASON",
        defaultLabel: "Return reason",
        path: "delayReason.reasonForReturnCheque",
        type: "text",
      },
      {
        // Cheque is deposited into the complainant's (payee's) bank.
        key: "complainantBankName",
        label: "SYNOPSIS_LABEL_COMPLAINANT_BANK_NAME",
        defaultLabel: "Bank (Complainant)",
        path: "payeeBankName",
        type: "text",
      },
      {
        key: "complainantBankBranch",
        label: "SYNOPSIS_LABEL_COMPLAINANT_BANK_BRANCH",
        defaultLabel: "Bank Branch (Complainant)",
        path: "payeeBranchName",
        type: "text",
      },
    ],
  },
  {
    key: "demandNotice",
    label: "SYNOPSIS_SECTION_DEMAND_NOTICE",
    defaultLabel: "Demand Notice",
    source: "demandNoticeDetails",
    repeatPerForm: true,
    fields: [
      {
        key: "dateOfDispatch",
        label: "SYNOPSIS_LABEL_DATE_OF_DISPATCH",
        defaultLabel: "Date of dispatch of demand notice",
        path: "dateOfDispatch",
        type: "date",
      },
      {
        // No "mode of service" field exists on the demand notice form today.
        key: "modeOfService",
        label: "SYNOPSIS_LABEL_MODE_OF_SERVICE",
        defaultLabel: "Mode of service",
        path: "",
        type: "text",
      },
      {
        // No "tracking number" field exists on the demand notice form today.
        key: "trackingNumber",
        label: "SYNOPSIS_LABEL_TRACKING_NUMBER",
        defaultLabel: "Tracking number",
        path: "",
        type: "text",
      },
      {
        // No explicit "delivered?" question on the demand notice form today.
        key: "whetherDelivered",
        label: "SYNOPSIS_LABEL_WHETHER_DELIVERED",
        defaultLabel: "Whether delivered?",
        path: "",
        type: "option",
      },
      {
        key: "dateOfDelivery",
        label: "SYNOPSIS_LABEL_DATE_OF_DELIVERY",
        defaultLabel: "Date of delivery",
        path: "dateOfService",
        type: "date",
      },
      {
        key: "hasAccusedReplied",
        label: "SYNOPSIS_LABEL_HAS_ACCUSED_REPLIED",
        defaultLabel: "Has the accused replied to the demand notice?",
        path: "proofOfReply",
        type: "option",
      },
    ],
  },
  {
    key: "causeOfAction",
    label: "SYNOPSIS_SECTION_CAUSE_OF_ACTION",
    defaultLabel: "Cause of Action",
    source: "demandNoticeDetails",
    repeatPerForm: true,
    fields: [
      {
        key: "dateOfCauseOfAction",
        label: "SYNOPSIS_LABEL_DATE_OF_CAUSE_OF_ACTION",
        defaultLabel: "Date of cause of action",
        path: "dateOfAccrual",
        type: "date",
      },
      {
        // No jurisdiction-under-142(2) field exists on any e-filing form today.
        key: "jurisdictionUnder142",
        label: "SYNOPSIS_LABEL_JURISDICTION_142_2",
        defaultLabel: "Jurisdiction invoked under Section 142(2)",
        path: "",
        type: "text",
      },
    ],
  },
  {
    // Standalone question, printed without a section heading.
    key: "otherPendingComplaint",
    label: "",
    defaultLabel: "",
    source: "chequeDetails",
    repeatPerForm: false,
    fields: [
      {
        // No such question exists on any e-filing form today.
        key: "otherPendingComplaint",
        label: "SYNOPSIS_LABEL_OTHER_PENDING_COMPLAINT",
        defaultLabel: "Is there any other cheque dishonour complaint pending between the same parties?",
        path: "",
        type: "text",
      },
    ],
  },
  {
    // Heading only - the applicant writes the prayer themselves.
    key: "prayer",
    label: "SYNOPSIS_SECTION_PRAYER",
    defaultLabel: "Prayer/ Relief sought",
    source: "",
    repeatPerForm: false,
    fields: [],
  },
];

export const SYNOPSIS_PARTIES_SECTION = {
  key: "parties",
  label: "SYNOPSIS_SECTION_PARTIES",
  defaultLabel: "Parties",
};
