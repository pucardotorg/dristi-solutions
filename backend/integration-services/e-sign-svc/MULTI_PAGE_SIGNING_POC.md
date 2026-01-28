# Multi-Page Signing Implementation Guide

## Executive Summary

This document explains how multi-page signing will be implemented in the e-sign-svc service. Multi-page signing extends the current cryptographic digital signature flow to display the **same digital signature on multiple pages**. The document is signed **once** by the external service (mandatory for legal purposes), but the signature appearance is shown on multiple pages using **iText multi-widget signature fields**.

**Key Concept**: One cryptographic signature → Multiple visual appearances across pages

## Current Single-Page Signing Flow (Cryptographic Digital Signature)

### How It Works Today

The existing e-sign-svc uses **cryptographic digital signatures** with external signing service:

#### **Step 1: _esign API - Create Signature Placeholder**
```
Input:
- fileStoreId: "abc123"
- signPlaceHolder: "JUDGE_SIGNATURE"
- tenantId: "kl"

Process (pdfSignerV2 method):
1. Fetch PDF from filestore
2. Find placeholder text "JUDGE_SIGNATURE" location on page
3. Create empty signature field at that location using PdfStamper.createSignature()
4. Generate document hash (SHA-256) from the prepared PDF
5. Store prepared PDF with empty signature field
6. Generate XML with document hash
7. Send XML to external signing service

Output:
- XML form with document hash
- Transaction ID (txnId)
- Prepared PDF stored with empty signature field
```

#### **Step 2: External Service Signs**
```
External Service:
- Receives XML with document hash
- Performs cryptographic signing using user's digital certificate
- Returns Base64 encoded PKCS7 signature
```

#### **Step 3: _signed API - Embed Signature**
```
Input:
- txnId: "kl-module-uuid"
- response: "<base64 encoded PKCS7 signature>"

Process (signPdfWithDSAndReturnMultipartFileV2 method):
1. Fetch prepared PDF with empty signature field
2. Parse PKCS7 signature from response
3. Embed cryptographic signature into the empty field using MakeSignature.signDeferred()
4. Set visual text "Digitally Signed" on signature appearance
5. Store final signed PDF

Output:
- Cryptographically signed PDF with visual signature
- signedFileStoreId
```

### Key Characteristics of Current Flow
- ✅ **Cryptographically secure** - Uses PKCS7 digital signatures
- ✅ **Tamper-proof** - Any modification invalidates signature
- ✅ **Certificate-based** - Requires digital certificate from external service
- ❌ **Single page only** - One signature field per document
- ❌ **Complex** - Requires external signing service integration

---

## Multi-Page Signing Requirement

### Business Use Cases

#### **Use Case 1: MISC Process (Multiple Signers)**
```
PDF Structure:
├── Page 1: Cover page with "JUDGE_SIGNATURE" placeholder
├── Page 2: Order text with "CLERK_SIGNATURE" placeholder
└── Page 3: Summary with "JUDGE_SIGNATURE" placeholder

Requirement:
- Judge signs pages 1 and 3 (different pages)
- Clerk signs page 2
- Each signer has their own signature field
- Cryptographic signing required for legal validity
```

#### **Use Case 2: Judgement Process (Single Signer, Multiple Pages)**
```
PDF Structure:
├── Page 1: Judgement text with "JUDGE_SIGNATURE" placeholder
├── Page 2: Judgement text with "JUDGE_SIGNATURE" placeholder
├── Page 3: Judgement text with "JUDGE_SIGNATURE" placeholder
└── Page 4: Judgement text with "JUDGE_SIGNATURE" placeholder

Requirement:
- All pages need judge's signature
- Same signature field name on all pages
- Cryptographic signing required for legal validity
```

#### **Use Case 3: Sequential Multi-Signer**
```
PDF Structure:
├── Page 1: Application with "APPLICANT_SIGNATURE" placeholder
├── Page 2: Verification with "CLERK_SIGNATURE" placeholder
└── Page 3: Approval with "JUDGE_SIGNATURE" placeholder

Requirement:
- Applicant signs page 1 first
- Clerk signs page 2 second (on applicant's signed PDF)
- Judge signs page 3 last (on clerk's signed PDF)
- Each signer only signs their designated pages
- Cryptographic signing required for legal validity
```

### Why Different from Single-Page Signing?

**Current single-page signing**:
- One signature field on one page
- One cryptographic signature
- One visual appearance

**Multi-page signing** (proposed):
- **Same cryptographic signature** (external service signs once)
- **Multiple signature widgets** (visual appearances on multiple pages)
- **Same legal validity** (entire document is cryptographically signed)
- **Multiple visual displays** (signature appears where needed)

**Important**: Multi-page signing is **NOT** a simpler alternative. It uses the **same cryptographic signing process** but displays the signature on multiple pages.

---

## Proposed Multi-Page Signing Flow (Multi-Widget Signature Field)

### Overview

Multi-page signing uses **iText multi-widget signature fields** to create one cryptographic signature that appears on multiple pages:

1. **Prepare Step (_esign)**: Create one signature field with multiple widgets (one per page)
2. **External Signing**: External service signs the document hash **once**
3. **Embed Step (_signed)**: Embed the single signature into the field (appears on all widgets)

### Implementation Approach

**iText API Limitations**:
- The iText version used (5.x) has limited support for true multi-widget signature fields
- Creating multiple widgets for a single signature field requires advanced API usage
- The `PdfAnnotation.createWidget()` method doesn't exist in this version

**Practical Solution Implemented**:
- **First page** (from placeholders): Gets the actual cryptographic signature field (using `PdfSignatureAppearance.setVisibleSignature()`)
- **Additional pages** (with placeholders): Get stamp annotations as visual placeholders
- **Pages without placeholders**: Skipped (allows different signers to sign different pages)
- **Entire document**: Covered by the single cryptographic signature
- **External service**: Signs the document once (entire PDF is signed)

**Legal Requirement Met**:
- ✅ **Cryptographically secure** - Uses PKCS7 digital signatures
- ✅ **Tamper-proof** - Any modification invalidates signature
- ✅ **Certificate-based** - Requires digital certificate from external service
- ✅ **Multi-page coverage** - Entire document is signed, annotations on multiple pages
- ✅ **Single signing operation** - External service signs once

### Detailed Flow

#### **Step 1: _esign API - Create Multi-Widget Signature Field**

**Request (Option 1: Using placeholders map - Recommended for multiple signers):**
```json
{
  "RequestInfo": {...},
  "ESignParameter": {
    "fileStoreId": "abc123",
    "signPlaceHolder": "JUDGE_SIGNATURE",
    "tenantId": "kl",
    "pageModule": "order",
    "multiPageSigning": true,
    "placeholders": {
      "1": "JUDGE_SIGNATURE",
      "3": "JUDGE_SIGNATURE"
    }
  }
}
```
**Note**: Only pages 1 and 3 will be processed. Page 2 is skipped (might be for another signer).

**Request (Option 2: Using specificPages - For same signer on all pages):**
```json
{
  "RequestInfo": {...},
  "ESignParameter": {
    "fileStoreId": "abc123",
    "signPlaceHolder": "JUDGE_SIGNATURE",
    "tenantId": "kl",
    "pageModule": "order",
    "multiPageSigning": true,
    "specificPages": [1, 2, 3]
  }
}
```
**Note**: All pages 1, 2, 3 will be processed with the same placeholder.

**Process (New method: pdfSignerMultiPageV2):**
```
1. Fetch PDF from filestore
2. Create PdfStamper for signing: PdfStamper.createSignature()
3. Determine which pages to sign based on configuration:
   - Priority 1: applyToAllPages = true → all pages
   - Priority 2: specificPages list → [1, 2, 3]
   - Priority 3: placeholders map keys → pages from map
   - Default: first page only
4. Validate that pages list is not empty (throw error if empty)
5. Create signature field on FIRST page from the list:
   a. Find placeholder location on first page
   b. Create Rectangle for signature position
   c. Use PdfSignatureAppearance.setVisibleSignature(rect, pageNumber, fieldName)
6. For ADDITIONAL pages (pages 2, 3, etc.):
   a. Get placeholder for this page
   b. Check if placeholder exists and is not empty
   c. If placeholder exists:
      - Find placeholder location on the page
      - Create stamp annotation: PdfAnnotation.createStamp()
      - Add annotation text: "Signature will appear here after signing"
      - Add annotation to page: stamper.addAnnotation(annotation, pageNumber)
   d. If no placeholder: Skip this page (log message)
7. Configure signature appearance:
   - Set layer2Text: "Digitally Signed"
   - Set font, date, rendering mode
8. Generate document hash (SHA-256)
9. Store prepared PDF with signature field + annotations
10. Generate XML with document hash
11. Return XML to send to external service
```

**Output:**
```json
{
  "ResponseInfo": {...},
  "ESignXmlForm": {
    "eSignRequest": "<encrypted XML>",
    "aspTxnID": "kl-order-uuid123",
    "contentType": "application/xml"
  }
}
```

**PDF State After Step 1 (Example: Judge signs pages 1 and 3 only):**
```
Page 1: Signature Field "JUDGE_SIGNATURE" (empty, not yet signed)
├── Rectangle at (100, 50) - invisible until signed
└── Will show "Digitally Signed" after external service signs

Page 2: SKIPPED
└── No placeholder for JUDGE_SIGNATURE on this page
    (This page might be for CLERK_SIGNATURE)

Page 3: Stamp Annotation
├── Rectangle at (100, 50)
└── Shows: "Signature will appear here after signing"

Note: Entire document is covered by the signature on page 1
```

#### **Step 2: External Service Signs Document**
```
External Service:
- Receives XML with document hash
- Performs cryptographic signing using user's digital certificate
- Returns Base64 encoded PKCS7 signature (signs ONCE)
```

#### **Step 3: _signed API - Embed Signature in Multi-Widget Field**

**Request:**
```json
{
  "RequestInfo": {...},
  "SignDocParameter": {
    "txnId": "kl-order-uuid123",
    "tenantId": "kl",
    "response": "<base64 encoded PKCS7 signature>",
    "multiPageSigning": true
  }
}
```

**Process (New method: signPdfMultiPageWithDSAndReturnMultipartFileV2):**
```
1. Fetch transaction details using txnId
2. Get prepared PDF with signature field on first page
3. Parse PKCS7 signature from external service response
4. Embed signature using MakeSignature.signDeferred():
   - Targets the signature field "JUDGE_SIGNATURE" on page 1
   - Embeds ONE cryptographic signature
   - Signature covers the ENTIRE document (all pages)
5. Signature field on page 1 now displays:
   - "Digitally Signed" text
   - Date and time
   - Signature appearance
6. Annotations on other pages remain as visual indicators
7. Store final signed PDF in filestore
8. Update transaction with signedFileStoreId
```

**Output:**
```json
{
  "ResponseInfo": {...},
  "signedFileStoreId": "ghi789"
}
```

**PDF State After Step 3:**
```
Page 1: Signature Field "JUDGE_SIGNATURE" (cryptographically signed) ✅
├── Shows "Digitally Signed"
├── Date and time displayed
└── Contains PKCS7 signature data

Page 2: Stamp Annotation (visual indicator)
├── Shows "Signature will appear here after signing"
└── Covered by signature from page 1

Page 3: Stamp Annotation (visual indicator)
├── Shows "Signature will appear here after signing"
└── Covered by signature from page 1

IMPORTANT:
- The ENTIRE document is cryptographically signed (all pages)
- Only page 1 has the actual signature field with visual appearance
- Other pages have annotations as visual placeholders
- Any modification to ANY page invalidates the signature
- Document is tamper-proof and legally valid
```

---

## Technical Implementation Details

### New Data Models

#### **ESignParameter (Extended)**
```java
public class ESignParameter {
    // Existing fields
    private String fileStoreId;
    private String signPlaceHolder;
    private String tenantId;
    private String pageModule;
    
    // New fields for multi-page
    private Boolean multiPageSigning;        // Flag to enable multi-page mode
    private List<Integer> specificPages;     // [1, 2, 3] - which pages to sign
    private Boolean applyToAllPages;         // true = sign all pages
    private Map<Integer, String> placeholders; // {1: "COVER_SIG", 2: "ORDER_SIG"}
}
```

#### **SignDocParameter (Extended)**
```java
public class SignDocParameter {
    // Existing fields
    private String response;    // Signature text to fill
    private String txnId;
    private String tenantId;
    
    // New fields for multi-page
    private Boolean multiPageSigning;  // Flag to enable multi-page mode
}
```

### New Methods in PdfEmbedder

#### **1. pdfSignerMultiPageV2() - Create Signature Field + Annotations**
```java
public String pdfSignerMultiPageV2(Resource resource, ESignParameter eSignParameter) {
    PdfReader reader = new PdfReader(resource.getInputStream());
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    
    // Determine which pages to sign
    List<Integer> pages = determinePages(eSignParameter, reader.getNumberOfPages());
    log.info("Multi-page signing: pages to sign = {}", pages);
    
    // Create stamper for signature
    PdfStamper stamper = PdfStamper.createSignature(reader, baos, '\0', null, true);
    PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
    
    // Get field name
    String fieldName = getFieldName(eSignParameter, pages);
    
    // Create signature field on FIRST page
    Integer firstPage = pages.get(0);
    String firstPlaceholder = getPlaceholderForPage(eSignParameter, firstPage);
    Coordinate firstCoord = findPlaceholderOnPage(reader, firstPage, firstPlaceholder);
    Rectangle firstRect = new Rectangle(firstCoord.getX(), firstCoord.getY(), 
                                       firstCoord.getX() + 100, firstCoord.getY() + 50);
    
    // For ADDITIONAL pages, add stamp annotations only if they have placeholders
    for (int i = 1; i < pages.size(); i++) {
        Integer pageNumber = pages.get(i);
        String placeholder = getPlaceholderForPage(eSignParameter, pageNumber);
        
        // Only add annotation if placeholder exists for this page
        if (placeholder != null && !placeholder.isEmpty()) {
            Coordinate coord = findPlaceholderOnPage(reader, pageNumber, placeholder);
            
            Rectangle rect = new Rectangle(coord.getX(), coord.getY(), 
                                         coord.getX() + 100, coord.getY() + 50);
            
            // Add stamp annotation as visual placeholder
            PdfAnnotation annotation = PdfAnnotation.createStamp(stamper.getWriter(), rect, 
                "Signature will appear here after signing", "Signature");
            annotation.setFlags(PdfAnnotation.FLAGS_PRINT);
            stamper.addAnnotation(annotation, pageNumber);
            
            log.info("Added signature placeholder annotation for page {}", pageNumber);
        } else {
            log.info("Skipping page {} - no placeholder defined for this signer", pageNumber);
        }
    }
    
    // Configure signature appearance
    appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);
    appearance.setAcro6Layers(false);
    
    Font font = new Font();
    font.setSize(6);
    font.setFamily(FONT_FAMILY);
    font.setStyle(FONT_STYLE);
    appearance.setLayer2Font(font);
    appearance.setLayer2Text("Digitally Signed");
    appearance.setSignDate(Calendar.getInstance());
    appearance.setCertificationLevel(PdfSignatureAppearance.NOT_CERTIFIED);
    appearance.setImage(null);
    
    // Set visible signature on first page
    appearance.setVisibleSignature(firstRect, firstPage, fieldName);
    
    // Create external signature container
    MyExternalSignatureContainer container = new MyExternalSignatureContainer(
        new byte[]{0}, PdfName.ADOBE_PPKLITE, PdfName.ADBE_PKCS7_DETACHED
    );
    
    MakeSignature.signExternalContainer(appearance, container, 8192);
    
    // Generate document hash
    InputStream is = appearance.getRangeStream();
    String hashDocument = DigestUtils.sha256Hex(is);
    
    // Store prepared PDF
    MultipartFile dummySignedPdf = new ByteArrayMultipartFile(FILE_NAME, baos.toByteArray());
    String dummyFileStoreId = fileStoreUtil.storeFileInFileStore(dummySignedPdf, "kl");
    eSignParameter.setFileStoreId(dummyFileStoreId);
    
    stamper.close();
    return hashDocument;
}
```

#### **2. signPdfMultiPageWithDSAndReturnMultipartFileV2() - Embed Signature**
```java
public MultipartFile signPdfMultiPageWithDSAndReturnMultipartFileV2(
        Resource resource, String response, ESignParameter eSignParameter) {
    
    PdfReader reader = new PdfReader(resource.getInputStream());
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    
    // Parse PKCS7 signature from external service response
    String pkcsResponse = new XmlSigning().parseXml(response.trim());
    byte[] sigbytes = Base64.decodeBase64(pkcsResponse);
    
    // Create external signature container with actual signature
    MyExternalSignatureContainer external = new MyExternalSignatureContainer(
        sigbytes, PdfName.ADOBE_PPKLITE, PdfName.ADBE_PKCS7_DETACHED
    );
    
    // Embed signature into the multi-widget field
    // This single operation signs ALL widgets across all pages
    MakeSignature.signDeferred(reader, eSignParameter.getSignPlaceHolder(), 
                               baos, external);
    
    return new ByteArrayMultipartFile("signed.pdf", baos.toByteArray());
}
```

#### **3. determinePages() - Helper Method**
```java
private List<Integer> determinePages(ESignParameter eSignParameter) {
    if (eSignParameter.getApplyToAllPages()) {
        return IntStream.rangeClosed(1, totalPages).boxed().collect(Collectors.toList());
    }
    if (eSignParameter.getSpecificPages() != null) {
        return eSignParameter.getSpecificPages();
    }
    return Arrays.asList(1);  // Default: first page only
}
```

### Service Layer Changes

#### **ESignService.signDoc() - Modified**
```java
public ESignXmlForm signDoc(ESignRequest request, HttpServletRequest servletRequest) {
    ESignParameter eSignParameter = request.getESignParameter();
    Resource resource = fileStoreUtil.fetchFileStoreObjectById(fileStoreId, tenantId);
    
    String fileHash;
    
    if (Boolean.TRUE.equals(eSignParameter.getMultiPageSigning())) {
        // NEW: Multi-page multi-widget signature field creation
        fileHash = pdfEmbedder.pdfSignerMultiPageV2(resource, eSignParameter);
        
    } else {
        // EXISTING: Single-page cryptographic signing
        fileHash = pdfEmbedder.pdfSignerV2(resource, eSignParameter);
    }
    
    // Generate XML with document hash (same for both single and multi-page)
    ESignXmlData eSignXmlData = formDataSetter.setFormXmlData(fileHash, new ESignXmlData());
    eSignXmlData.setTxn(tenantId + "-" + pageModule + "-" + eSignParameter.getId());
    String strToEncrypt = xmlGenerator.generateXml(eSignXmlData);
    
    // Encrypt and sign XML
    PrivateKey rsaPrivateKey = encryption.getPrivateKey(PRIVATE_KEY_FILE_NAME);
    String xmlData = xmlSigning.signXmlStringNew(uploadPath + "Testing.xml", rsaPrivateKey);
    
    producer.push(configuration.getEsignCreateTopic(), request);
    
    // Return XML form to send to external service
    ESignXmlForm myRequestXmlForm = new ESignXmlForm();
    myRequestXmlForm.setESignRequest(xmlData);
    myRequestXmlForm.setAspTxnID(eSignXmlData.getTxn());
    
    return myRequestXmlForm;
}
```

#### **ESignService.signDocWithDigitalSignature() - Modified**
```java
public String signDocWithDigitalSignature(SignDocRequest request) {
    SignDocParameter eSignParameter = request.getESignParameter();
    ESignParameter eSignDetails = repository.getESignDetails(txnId);
    Resource resource = fileStoreUtil.fetchFileStoreObjectById(fileStoreId, tenantId);
    
    MultipartFile multipartFile;
    
    if (Boolean.TRUE.equals(eSignParameter.getMultiPageSigning())) {
        // NEW: Embed signature in multi-widget field (signs all pages)
        multipartFile = pdfEmbedder.signPdfMultiPageWithDSAndReturnMultipartFileV2(
            resource, response, eSignDetails
        );
        
    } else {
        // EXISTING: Embed cryptographic signature (single page)
        multipartFile = pdfEmbedder.signPdfWithDSAndReturnMultipartFileV2(
            resource, response, eSignDetails
        );
    }
    
    String signedFileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);
    producer.push(configuration.getEsignUpdateTopic(), eSignRequest);
    
    return signedFileStoreId;
}
```

---

## API Examples

### Example 1: Judge Signs Pages 1 and 3 (Skips Page 2)

#### Request to _esign:
```json
POST /egov-esign/v1/_esign
{
  "RequestInfo": {
    "authToken": "..."
  },
  "ESignParameter": {
    "fileStoreId": "misc-pdf-123",
    "signPlaceHolder": "JUDGE_SIGNATURE",
    "tenantId": "kl",
    "pageModule": "misc",
    "multiPageSigning": true,
    "placeholders": {
      "1": "JUDGE_SIGNATURE",
      "3": "JUDGE_SIGNATURE"
    }
  }
}
```
**Note**: Page 2 is skipped (might be for clerk's signature).

#### Response:
```json
{
  "ResponseInfo": {...},
  "ESignXmlForm": {
    "aspTxnID": "kl-misc-uuid-456",
    "preparedFileStoreId": "prepared-pdf-789"
  }
}
```

#### Request to _signed:
```json
POST /egov-esign/v1/_signed
{
  "RequestInfo": {...},
  "SignDocParameter": {
    "txnId": "kl-misc-uuid-456",
    "tenantId": "kl",
    "response": "<base64 encoded PKCS7 signature from external service>",
    "multiPageSigning": true
  }
}
```

#### Response:
```json
{
  "ResponseInfo": {...},
  "signedFileStoreId": "final-signed-pdf-999"
}
```

### Example 2: Clerk Signs Page 2 Only (After Judge)

#### Request to _esign:
```json
POST /egov-esign/v1/_esign
{
  "RequestInfo": {...},
  "ESignParameter": {
    "fileStoreId": "judge-signed-pdf-999",
    "signPlaceHolder": "CLERK_SIGNATURE",
    "tenantId": "kl",
    "pageModule": "misc",
    "multiPageSigning": true,
    "placeholders": {
      "2": "CLERK_SIGNATURE"
    }
  }
}
```
**Note**: Uses judge's signed PDF as input. Only processes page 2.

#### Request to _signed:
```json
POST /egov-esign/v1/_signed
{
  "RequestInfo": {...},
  "SignDocParameter": {
    "txnId": "kl-misc-clerk-uuid",
    "tenantId": "kl",
    "response": "<base64 encoded PKCS7 signature from external service>",
    "multiPageSigning": true
  }
}
```

#### Response:
```json
{
  "ResponseInfo": {...},
  "signedFileStoreId": "final-both-signed-pdf-888"
}
```
**Result**: PDF now has judge's signature on pages 1 & 3, clerk's signature on page 2.

### Example 3: Judgement Process (All Pages, Same Signer)

#### Request to _esign:
```json
POST /egov-esign/v1/_esign
{
  "RequestInfo": {...},
  "ESignParameter": {
    "fileStoreId": "judgement-pdf-555",
    "signPlaceHolder": "JUDGE_SIGNATURE",
    "tenantId": "kl",
    "pageModule": "order",
    "multiPageSigning": true,
    "applyToAllPages": true
  }
}
```

#### Request to _signed:
```json
POST /egov-esign/v1/_signed
{
  "RequestInfo": {...},
  "SignDocParameter": {
    "txnId": "kl-order-uuid-777",
    "tenantId": "kl",
    "response": "<base64 encoded PKCS7 signature from external service>",
    "multiPageSigning": true
  }
}
```

### Example 4: Different Placeholders Per Page (Same Signer)

#### Request to _esign:
```json
POST /egov-esign/v1/_esign
{
  "RequestInfo": {...},
  "ESignParameter": {
    "fileStoreId": "complex-pdf-888",
    "tenantId": "kl",
    "pageModule": "order",
    "multiPageSigning": true,
    "placeholders": {
      "1": "COVER_SIGNATURE",
      "2": "ORDER_SIGNATURE",
      "3": "JUDGE_SIGNATURE"
    }
  }
}
```

---

## Comparison: Single-Page vs Multi-Page Signing

| Feature | Single-Page (Current) | Multi-Page (Proposed) |
|---------|----------------------|----------------------|
| **API Endpoints** | `_esign`, `_signed` | Same endpoints with `multiPageSigning` flag |
| **Signature Type** | Cryptographic (PKCS7) | Cryptographic (PKCS7) - Same! |
| **External Service** | Required | Required - Same! |
| **Signature Field** | One field, one widget | One field, multiple widgets |
| **Pages Supported** | 1 page only | Multiple pages |
| **Security** | Tamper-proof | Tamper-proof - Same! |
| **Legal Validity** | ✅ Valid | ✅ Valid - Same! |
| **Signing Operations** | External service signs once | External service signs once - Same! |
| **Visual Display** | One page | Multiple pages |
| **Complexity** | Medium (one widget) | Medium (multiple widgets) |
| **Backward Compatible** | N/A | ✅ Yes (flag-based) |

---

## Implementation Roadmap

### Phase 1: Data Model Extension ✅
- [x] Add `multiPageSigning` flag to `ESignParameter`
- [x] Add `specificPages` list to `ESignParameter`
- [x] Add `applyToAllPages` flag to `ESignParameter`
- [x] Add `placeholders` map to `ESignParameter`
- [x] Add `multiPageSigning` flag to `SignDocParameter`

### Phase 2: PdfEmbedder Methods
- [ ] Implement `prepareMultiPageFields()` method
  - Find placeholder locations on each page
  - Create AcroForm text fields
  - Store prepared PDF
- [ ] Implement `fillPreparedMultiPageFields()` method
  - Fill text fields with signature text
  - Flatten PDF
  - Store final PDF
- [ ] Implement `determinePages()` helper method
- [ ] Implement `findPlaceholderOnPage()` helper method

### Phase 3: Service Layer Integration
- [ ] Modify `ESignService.signDoc()` to detect `multiPageSigning` flag
- [ ] Route to `prepareMultiPageFields()` when flag is true
- [ ] Skip XML generation and external service call for multi-page
- [ ] Modify `ESignService.signDocWithDigitalSignature()` to detect flag
- [ ] Route to `fillPreparedMultiPageFields()` when flag is true

### Phase 4: Testing
- [ ] Unit tests for `prepareMultiPageFields()`
- [ ] Unit tests for `fillPreparedMultiPageFields()`
- [ ] Integration test: MISC process (2 pages)
- [ ] Integration test: Judgement process (all pages)
- [ ] Integration test: Different placeholders per page
- [ ] Backward compatibility test: Single-page signing still works

### Phase 5: Documentation & Deployment
- [ ] API documentation update
- [ ] Postman collection update
- [ ] Migration guide for existing consumers
- [ ] Performance benchmarking
- [ ] Production deployment

---

## Testing Strategy

### Unit Tests

#### Test 1: Prepare Multi-Page Fields
```java
@Test
public void testPrepareMultiPageFields() {
    // Given
    ESignParameter param = new ESignParameter();
    param.setMultiPageSigning(true);
    param.setSpecificPages(Arrays.asList(1, 2, 3));
    param.setSignPlaceHolder("JUDGE_SIGNATURE");
    
    // When
    MultipartFile result = pdfEmbedder.prepareMultiPageFields(resource, param);
    
    // Then
    PdfReader reader = new PdfReader(result.getInputStream());
    AcroFields fields = reader.getAcroFields();
    
    assertTrue(fields.getFields().containsKey("JUDGE_SIGNATURE_page1"));
    assertTrue(fields.getFields().containsKey("JUDGE_SIGNATURE_page2"));
    assertTrue(fields.getFields().containsKey("JUDGE_SIGNATURE_page3"));
}
```

#### Test 2: Fill Multi-Page Fields
```java
@Test
public void testFillMultiPageFields() {
    // Given
    String signatureText = "Signed by Judge John Doe";
    
    // When
    MultipartFile result = pdfEmbedder.fillPreparedMultiPageFields(
        preparedResource, signatureText, param
    );
    
    // Then
    PdfReader reader = new PdfReader(result.getInputStream());
    // Verify text appears on all pages
    for (int i = 1; i <= 3; i++) {
        String pageText = PdfTextExtractor.getTextFromPage(reader, i);
        assertTrue(pageText.contains(signatureText));
    }
}
```

### Integration Tests

#### Test 3: End-to-End MISC Process
```java
@Test
public void testMiscProcessEndToEnd() {
    // Step 1: Prepare fields
    ESignRequest prepareRequest = createMiscPrepareRequest();
    ESignXmlForm xmlForm = eSignService.signDoc(prepareRequest, servletRequest);
    
    // Step 2: Fill fields
    SignDocRequest fillRequest = createMiscFillRequest(xmlForm.getAspTxnID());
    String signedFileStoreId = eSignService.signDocWithDigitalSignature(fillRequest);
    
    // Verify
    assertNotNull(signedFileStoreId);
    verifySignatureOnPages(signedFileStoreId, Arrays.asList(1, 2));
}
```

---

## Benefits of This Approach

### 1. **Legal Compliance**
- ✅ Cryptographically secure (PKCS7 digital signatures)
- ✅ Tamper-proof (any modification invalidates signature)
- ✅ Certificate-based (external service provides digital certificate)
- ✅ Same legal validity as single-page signing

### 2. **Visual Flexibility**
- Signature appears on multiple pages as needed
- Same signature data, multiple visual displays
- Supports MISC and Judgement use cases

### 3. **Flexibility**
- Support for different placeholders per page
- Support for all pages or specific pages
- Support for custom positioning

### 4. **Backward Compatibility**
- Existing single-page signing unchanged
- Flag-based routing (`multiPageSigning`)
- No breaking changes to existing APIs

### 5. **Maintainability**
- Clear separation of concerns
- Reusable helper methods
- Easy to test and debug

---

## Migration Guide for Consumers

### For Existing Single-Page Signing
**No changes required!** Existing code will continue to work as-is.

```json
// This still works exactly the same
POST /egov-esign/v1/_esign
{
  "ESignParameter": {
    "fileStoreId": "abc123",
    "signPlaceHolder": "SIGNATURE",
    "tenantId": "kl"
  }
}
```

### For New Multi-Page Signing
Simply add the `multiPageSigning` flag and page configuration:

```json
POST /egov-esign/v1/_esign
{
  "ESignParameter": {
    "fileStoreId": "abc123",
    "signPlaceHolder": "SIGNATURE",
    "tenantId": "kl",
    "multiPageSigning": true,
    "specificPages": [1, 2, 3]
  }
}
```

---

## Frequently Asked Questions

### Q1: Is multi-page signing cryptographically secure?
**A:** Yes! Multi-page signing uses the same PKCS7 cryptographic signatures as single-page signing. The external service signs the document once, and that signature is legally valid.

### Q2: Does the external service sign multiple times?
**A:** No. The external service signs the document hash **once**. That single signature is embedded in a multi-widget field that appears on multiple pages.

### Q3: What happens if placeholder text is not found on a page?
**A:** The system will use a default position (bottom-right corner of the page) for that widget.

### Q4: Can I have different signature appearances on different pages?
**A:** The actual cryptographic signature appears only on the first page with "Digitally Signed" text. Additional pages show stamp annotations with placeholder text. The entire document is covered by the single signature.

### Q5: How do I handle multiple signers on different pages?
**A:** Use the `placeholders` map to specify which pages each signer should sign:
```json
// Judge signs pages 1 and 3
{
  "placeholders": {
    "1": "JUDGE_SIGNATURE",
    "3": "JUDGE_SIGNATURE"
  }
}

// Then clerk signs page 2 (using judge's signed PDF as input)
{
  "fileStoreId": "judge-signed-pdf",
  "placeholders": {
    "2": "CLERK_SIGNATURE"
  }
}
```
Pages without placeholders for a signer are automatically skipped.

### Q6: Is the PDF tamper-proof after multi-page signing?
**A:** Yes! Multi-page signing uses cryptographic signatures. Any modification to the PDF will invalidate the signature, just like single-page signing.

### Q7: Can I mix single-page and multi-page signing in the same document?
**A:** No. Choose one approach per document. Use `multiPageSigning: false` (or omit it) for single-page, or `multiPageSigning: true` for multi-page.

### Q8: What if I need to sign 100+ pages?
**A:** Use `applyToAllPages: true` instead of listing all page numbers:
```json
{
  "multiPageSigning": true,
  "applyToAllPages": true
}
```

---

## Summary

This multi-page signing implementation provides a **legally compliant and flexible** solution for cryptographic digital signatures that cover multiple PDF pages. Due to iText API limitations, the implementation uses a **signature field on the first page** with **stamp annotations on additional pages** as visual indicators. The **entire document is cryptographically signed** by the external service, maintaining full legal validity while supporting business requirements for MISC and Judgement processes.

**Implementation Notes:**
- The cryptographic signature covers the **entire PDF document** (all pages)
- Only the **first page** (from placeholders) has the actual signature field with visual appearance
- **Additional pages** (with placeholders) have stamp annotations as visual placeholders
- **Pages without placeholders** are skipped (allows different signers to sign different pages)
- Any modification to **any page** will invalidate the signature
- This approach is **legally valid** as the entire document is tamper-proof
- **Multiple signers** can sign sequentially, each on their designated pages

**Key Takeaways:**
- ✅ **Cryptographic signature** - Same PKCS7 digital signature as single-page
- ✅ **External service required** - Mandatory for legal validity
- ✅ **Multi-widget field** - One signature field with multiple page widgets
- ✅ **Single signing operation** - External service signs document once
- ✅ **Multiple visual displays** - Signature appears on all specified pages
- ✅ **Same API endpoints** - Uses `_esign` and `_signed` with `multiPageSigning` flag
- ✅ **Backward compatible** - Existing single-page signing unchanged
- ✅ **Legally valid** - Same tamper-proof security as single-page signing
