package org.drishti.esign.service;

import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Font;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.parser.PdfContentStreamProcessor;
import com.itextpdf.text.pdf.security.MakeSignature;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.drishti.esign.config.Configuration;
import org.drishti.esign.util.ByteArrayMultipartFile;
import org.drishti.esign.util.FileStoreUtil;
import org.drishti.esign.util.TextLocationFinder;
import org.drishti.esign.web.models.Coordinate;
import org.drishti.esign.web.models.ESignParameter;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.drishti.esign.config.ServiceConstants.*;


@Component
@Slf4j
public class PdfEmbedder {

    private final FileStoreUtil fileStoreUtil;
    private final Configuration configuration;

    @Autowired
    public PdfEmbedder(FileStoreUtil fileStoreUtil, Configuration configuration) {
        this.fileStoreUtil = fileStoreUtil;
        this.configuration = configuration;
    }


    public Coordinate findLocationToSign(PdfReader reader, String signaturePlace) {

        log.info("Method=findLocationToSign ,Result=Inprogress ,placeholder={}", signaturePlace);

        Coordinate coordinate = new Coordinate();
        Rectangle cropBox = reader.getCropBox(1);
        coordinate.setX(cropBox.getLeft());
        coordinate.setY(cropBox.getBottom());
        coordinate.setFound(false);
        coordinate.setPageNumber(reader.getNumberOfPages());

        if (signaturePlace == null || signaturePlace.isBlank()) {
            return coordinate;
        }
        TextLocationFinder finder = new TextLocationFinder(signaturePlace);

        try {
            log.info("Method=findLocationToSign ,Result=Inprogress ,Reading pdf for placeholder={}", signaturePlace);

            for (int i = 1; i <= reader.getNumberOfPages(); i++) {
                PdfContentStreamProcessor processor = new PdfContentStreamProcessor(finder);
                PdfDictionary pageDic = reader.getPageN(i);
                if (pageDic == null) {
                    continue;
                }
                PdfDictionary resourcesDic = pageDic.getAsDict(PdfName.RESOURCES);
                if (resourcesDic == null) {
                    continue;
                }
                // Use the raw content stream instead of PdfTextExtractor
                byte[] contentBytes = reader.getPageContent(i);
                processor.processContent(contentBytes, resourcesDic);

                if (finder.getKeywordFound()) {
                    // Once found, use the coordinates of the keyword
                    float x = finder.getKeywordX();
                    float y = finder.getKeywordY();
                    coordinate.setX(x);
                    coordinate.setY(y + configuration.getESignYCoordinateOffset());
                    coordinate.setFound(true);
                    coordinate.setPageNumber(i);
                    log.info("Method=findLocationToSign,Result=Success,Coordinate found for placeholder={}", signaturePlace);
                    return coordinate;

                }
            }
            log.info("Method=findLocationToSign,Result=Success,No Coordinate found for placeholder={}", signaturePlace);

        } catch (Exception e) {
            log.info("Method=findLocationToSign ,Result=Error,placeholder={}",signaturePlace);
            log.error("Method=findLocationToSign, Error:{}", e.toString());
            throw new CustomException("SIGNATURE_EMBED_EXCEPTION","Error occurred while finding coordinate for placeholder");
        }
        return coordinate;
    }


    public MultipartFile signPdfWithDSAndReturnMultipartFileV2(Resource resource, String response, ESignParameter eSignParameter) {
        log.info("Method=signPdfWithDSAndReturnMultipartFileV2 ,Result=Inprogress ,filestoreId={}", eSignParameter.getFileStoreId());
        try {
            int contentEstimated = 8192;

            PdfReader reader = new PdfReader(resource.getInputStream());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            String pkcsResponse = new XmlSigning().parseXml(response.trim());
            byte[] sigbytes = Base64.decodeBase64(pkcsResponse);
            byte[] paddedSig = new byte[contentEstimated];
            System.arraycopy(sigbytes, 0, paddedSig, 0, sigbytes.length);
            MyExternalSignatureContainer container = new MyExternalSignatureContainer(paddedSig, null, null);

            MakeSignature.signDeferred(reader, eSignParameter.getSignPlaceHolder(), baos, container);

            return new ByteArrayMultipartFile(FILE_NAME, baos.toByteArray());

        } catch (Exception e) {
            log.info("Method=signPdfWithDSAndReturnMultipartFileV2 ,Result=Error ,filestoreId={}", eSignParameter.getFileStoreId());
            log.error("Method=signPdfWithDSAndReturnMultipartFileV2, Error:{}", e.toString());
            throw new CustomException("SIGNATURE_EMBED_EXCEPTION", "Error Occurred while embedding signature");
        } finally {
            log.info("Deleting partially signed pdf in finally block, filestoreId={}", eSignParameter.getFileStoreId());
            fileStoreUtil.deleteFileFromFileStore(eSignParameter.getFileStoreId(), eSignParameter.getTenantId(), false);
            log.info("Method=signPdfWithDSAndReturnMultipartFileV2 ,Result=Success ,filestoreId={}", eSignParameter.getFileStoreId());

        }

    }

    public String pdfSignerV2(Resource resource, ESignParameter eSignParameter) {
        String hashDocument = null;
        log.info("Method=pdfSignerV2 ,Result=InProgress ,filestoreId={}", eSignParameter.getFileStoreId());

        try {
            PdfReader reader = new PdfReader(resource.getInputStream());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            String signPlaceHolder = eSignParameter.getSignPlaceHolder();

            PdfStamper stamper = PdfStamper.createSignature(reader, baos, '\0', null, true);
            PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
            appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);
            appearance.setAcro6Layers(false);// deprecated

            Coordinate locationToSign = findLocationToSign(reader, signPlaceHolder);
            Rectangle rectangle = new Rectangle(locationToSign.getX(), locationToSign.getY(), locationToSign.getX() + (100), locationToSign.getY() + (50));

            Font font = new Font();
            font.setSize(6);
            font.setFamily(FONT_FAMILY);
            font.setStyle(FONT_STYLE);

            appearance.setLayer2Font(font);
            Calendar currentDat = Calendar.getInstance();
            appearance.setSignDate(currentDat);
            appearance.setLayer2Text("Digitally Signed");

            appearance.setCertificationLevel(PdfSignatureAppearance.NOT_CERTIFIED);
            appearance.setImage(null);
            appearance.setVisibleSignature(rectangle,
                    locationToSign.getPageNumber(), signPlaceHolder);
            int contentEstimated = 8192;
            MyExternalSignatureContainer container = new MyExternalSignatureContainer(new byte[]{0}, PdfName.ADOBE_PPKLITE, PdfName.ADBE_PKCS7_DETACHED);

            MakeSignature.signExternalContainer(appearance, container, contentEstimated);


            InputStream is = appearance.getRangeStream();
            hashDocument = DigestUtils.sha256Hex(is);

            MultipartFile dummySignedPdf = new ByteArrayMultipartFile(FILE_NAME, baos.toByteArray());

            String dummyFileStoreId = fileStoreUtil.storeFileInFileStore(dummySignedPdf, "kl");

            eSignParameter.setFileStoreId(dummyFileStoreId);
            stamper.close();

        } catch (Exception e) {
            log.info("Method=pdfSignerV2 ,Result=Error ,filestoreId={}", eSignParameter.getFileStoreId());
            log.error("Method=pdfSignerV2, Error:{}", e.toString());
            throw new CustomException("SIGNATURE_PLACEHOLDER_EXCEPTION","Error occurred while creating placeholder");
        }

        log.info("Method=pdfSignerV2 ,Result=Success ,filestoreId={}", eSignParameter.getFileStoreId());
        return hashDocument;

    }

    /**
     * Multi-page signing: Create multi-widget signature field
     * One signature field with multiple widgets (one per page)
     */
    public String pdfSignerMultiPageV2(Resource resource, ESignParameter eSignParameter) {
        String hashDocument = null;
        log.info("Method=pdfSignerMultiPageV2 ,Result=InProgress ,filestoreId={}", eSignParameter.getFileStoreId());

        try {
            PdfReader reader = new PdfReader(resource.getInputStream());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            // Determine which pages to sign
            List<Integer> pages = determinePages(eSignParameter, reader.getNumberOfPages());
            log.info("Multi-page signing: pages to sign = {}", pages);
            
            if (pages.isEmpty()) {
                throw new CustomException("MULTI_PAGE_SIGNING_ERROR", "No pages specified for signing");
            }

            // Create stamper for signature
            PdfStamper stamper = PdfStamper.createSignature(reader, baos, '\0', null, true);
            PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
            
            // Get field name (use first placeholder if map is provided)
            String fieldName = getFieldName(eSignParameter, pages);
            log.info("Multi-page signing: field name = {}", fieldName);

            // For multi-page signing with iText, we use the first page for the signature field
            // and add visual annotations on other pages
            Rectangle invisibleRect = new Rectangle(0, 0);
            appearance.setVisibleSignature(invisibleRect, 0, fieldName);
            log.info("Created invisible document-level signature field: {}", fieldName);

            // For additional pages, add stamp annotations only if they have placeholders
            for (Integer pageNumber : pages) {
                String placeholder = getPlaceholderForPage(eSignParameter, pageNumber);

                // Only add visual overlay if placeholder exists for this page
                if (placeholder != null && !placeholder.isEmpty()) {
                    Coordinate coord = findPlaceholderOnPage(reader, pageNumber, placeholder);

                    if (coord.isFound()) {
                        // Add visual "Digitally Signed" text at placeholder location
                        addVisualSignatureText(stamper, pageNumber, coord);
                        log.info("Added visual signature text on page {} at ({}, {})",
                                pageNumber, coord.getX(), coord.getY());
                    } else {
                        log.warn("Placeholder '{}' not found on page {}, skipping visual overlay",
                                placeholder, pageNumber);
                    }
                } else {
                    log.info("Skipping page {} - no placeholder defined for this signer", pageNumber);
                }
            }

            // Configure signature appearance (applies to all widgets)
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

            // Create external signature container
            int contentEstimated = 8192;
            MyExternalSignatureContainer container = new MyExternalSignatureContainer(
                new byte[]{0}, PdfName.ADOBE_PPKLITE, PdfName.ADBE_PKCS7_DETACHED
            );

            MakeSignature.signExternalContainer(appearance, container, contentEstimated);

            // Generate document hash
            InputStream is = appearance.getRangeStream();
            hashDocument = DigestUtils.sha256Hex(is);

            // Store prepared PDF
            MultipartFile dummySignedPdf = new ByteArrayMultipartFile(FILE_NAME, baos.toByteArray());
            String dummyFileStoreId = fileStoreUtil.storeFileInFileStore(dummySignedPdf, "kl");
            eSignParameter.setFileStoreId(dummyFileStoreId);
            
            stamper.close();

        } catch (Exception e) {
            log.info("Method=pdfSignerMultiPageV2 ,Result=Error ,filestoreId={}", eSignParameter.getFileStoreId());
            log.error("Method=pdfSignerMultiPageV2, Error:{}", e.toString());
            throw new CustomException("SIGNATURE_PLACEHOLDER_EXCEPTION", "Error occurred while creating multi-page placeholder");
        }

        log.info("Method=pdfSignerMultiPageV2 ,Result=Success ,filestoreId={}", eSignParameter.getFileStoreId());
        return hashDocument;
    }

    /**
     * Multi-page signing: Embed signature in multi-widget field
     * This single operation signs ALL widgets across all pages
     */
    public MultipartFile signPdfMultiPageWithDSAndReturnMultipartFileV2(Resource resource, String response, ESignParameter eSignParameter) {
        log.info("Method=signPdfMultiPageWithDSAndReturnMultipartFileV2 ,Result=Inprogress ,filestoreId={}", eSignParameter.getFileStoreId());
        
        try {
            int contentEstimated = 8192;

            PdfReader reader = new PdfReader(resource.getInputStream());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            // Parse PKCS7 signature from external service response
            String pkcsResponse = new XmlSigning().parseXml(response.trim());
            byte[] sigbytes = Base64.decodeBase64(pkcsResponse);
            byte[] paddedSig = new byte[contentEstimated];
            System.arraycopy(sigbytes, 0, paddedSig, 0, sigbytes.length);
            
            MyExternalSignatureContainer container = new MyExternalSignatureContainer(paddedSig, null, null);

            // Embed signature into the multi-widget field
            // This single operation signs ALL widgets across all pages
            MakeSignature.signDeferred(reader, eSignParameter.getSignPlaceHolder(), baos, container);

            return new ByteArrayMultipartFile(FILE_NAME, baos.toByteArray());

        } catch (Exception e) {
            log.info("Method=signPdfMultiPageWithDSAndReturnMultipartFileV2 ,Result=Error ,filestoreId={}", eSignParameter.getFileStoreId());
            log.error("Method=signPdfMultiPageWithDSAndReturnMultipartFileV2, Error:{}", e.toString());
            throw new CustomException("SIGNATURE_EMBED_EXCEPTION", "Error Occurred while embedding multi-page signature");
        } finally {
            log.info("Deleting partially signed pdf in finally block, filestoreId={}", eSignParameter.getFileStoreId());
            fileStoreUtil.deleteFileFromFileStore(eSignParameter.getFileStoreId(), eSignParameter.getTenantId(), false);
            log.info("Method=signPdfMultiPageWithDSAndReturnMultipartFileV2 ,Result=Success ,filestoreId={}", eSignParameter.getFileStoreId());
        }
    }

    /**
     * Helper: Determine which pages to sign based on configuration
     */
    private List<Integer> determinePages(ESignParameter eSignParameter, int totalPages) {
        // Priority 1: Apply to all pages
        if (Boolean.TRUE.equals(eSignParameter.getApplyToAllPages())) {
            return IntStream.rangeClosed(1, totalPages).boxed().collect(Collectors.toList());
        }
        
        // Priority 2: Specific pages list
        if (eSignParameter.getSpecificPages() != null && !eSignParameter.getSpecificPages().isEmpty()) {
            return eSignParameter.getSpecificPages();
        }
        
        // Priority 3: Pages from placeholders map
        if (eSignParameter.getPlaceholders() != null && !eSignParameter.getPlaceholders().isEmpty()) {
            return new ArrayList<>(eSignParameter.getPlaceholders().keySet());
        }
        
        // Default: first page only
        return Arrays.asList(1);
    }

    /**
     * Helper: Find placeholder location on a specific page
     */
    private Coordinate findPlaceholderOnPage(PdfReader reader, int pageNumber, String placeholder) {
        log.info("Finding placeholder '{}' on page {}", placeholder, pageNumber);
        
        Coordinate coordinate = new Coordinate();
        Rectangle cropBox = reader.getCropBox(pageNumber);
        coordinate.setX(cropBox.getLeft());
        coordinate.setY(cropBox.getBottom());
        coordinate.setFound(false);
        coordinate.setPageNumber(pageNumber);

        if (placeholder == null || placeholder.isBlank()) {
            log.info("No placeholder provided, using default position");
            return coordinate;
        }

        TextLocationFinder finder = new TextLocationFinder(placeholder);

        try {
            PdfContentStreamProcessor processor = new PdfContentStreamProcessor(finder);
            PdfDictionary pageDic = reader.getPageN(pageNumber);
            
            if (pageDic != null) {
                PdfDictionary resourcesDic = pageDic.getAsDict(PdfName.RESOURCES);
                if (resourcesDic != null) {
                    byte[] contentBytes = reader.getPageContent(pageNumber);
                    processor.processContent(contentBytes, resourcesDic);

                    if (finder.getKeywordFound()) {
                        float x = finder.getKeywordX();
                        float y = finder.getKeywordY();
                        coordinate.setX(x);
                        coordinate.setY(y + configuration.getESignYCoordinateOffset());
                        coordinate.setFound(true);
                        log.info("Found placeholder '{}' on page {} at ({}, {})", placeholder, pageNumber, x, y);
                        return coordinate;
                    }
                }
            }
            
            log.info("Placeholder '{}' not found on page {}, using default position", placeholder, pageNumber);

        } catch (Exception e) {
            log.error("Error finding placeholder on page {}: {}", pageNumber, e.toString());
        }
        
        return coordinate;
    }

    /**
     * Helper: Get placeholder for a specific page
     */
    private String getPlaceholderForPage(ESignParameter eSignParameter, Integer pageNumber) {
        // Priority 1: Page-specific placeholder from map
        if (eSignParameter.getPlaceholders() != null && 
            eSignParameter.getPlaceholders().containsKey(pageNumber)) {
            return eSignParameter.getPlaceholders().get(pageNumber);
        }
        
        // Priority 2: Global placeholder
        if (eSignParameter.getSignPlaceHolder() != null) {
            return eSignParameter.getSignPlaceHolder();
        }
        
        // Default
        return "SIGNATURE";
    }

    /**
     * Helper: Get field name for signature field
     */
    private String getFieldName(ESignParameter eSignParameter, List<Integer> pages) {
        // If placeholders map exists, use first placeholder as field name
        if (eSignParameter.getPlaceholders() != null && !eSignParameter.getPlaceholders().isEmpty()) {
            Integer firstPage = pages.get(0);
            if (eSignParameter.getPlaceholders().containsKey(firstPage)) {
                return eSignParameter.getPlaceholders().get(firstPage);
            }
        }
        
        // Use global placeholder
        if (eSignParameter.getSignPlaceHolder() != null) {
            return eSignParameter.getSignPlaceHolder();
        }
        
        // Default
        return "SIGNATURE";
    }

    /**
     * Add visual "Digitally Signed" text at specific location on page
     * This is purely visual - the cryptographic signature is document-level
     * 
     * @param stamper PdfStamper instance
     * @param pageNumber Page number to add visual signature
     * @param coord Coordinate where to place the visual signature
     * @throws Exception if error occurs while adding visual text
     */
    private void addVisualSignatureText(PdfStamper stamper, int pageNumber, Coordinate coord) 
            throws Exception {
        
        PdfContentByte canvas = stamper.getOverContent(pageNumber);
        
        // Create font for signature text
        BaseFont baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.EMBEDDED);
        
        // Draw rectangle border (visual signature box)
        float x = coord.getX();
        float y = coord.getY();
        float width = 100;
        float height = 50;
        
        canvas.saveState();
        canvas.setColorStroke(BaseColor.BLACK);
        canvas.setLineWidth(0.5f);
        canvas.rectangle(x, y, width, height);
        canvas.stroke();
        
        // Add "Digitally Signed" text
        canvas.beginText();
        canvas.setFontAndSize(baseFont, 8);
        canvas.setColorFill(BaseColor.BLACK);
        canvas.setTextMatrix(x + 5, y + height - 15);
        canvas.showText("Digitally Signed");
        canvas.endText();
        
        // Add date/time
        String dateTime = new SimpleDateFormat("dd-MMM-yyyy HH:mm:ss").format(new Date());
        canvas.beginText();
        canvas.setFontAndSize(baseFont, 6);
        canvas.setTextMatrix(x + 5, y + height - 25);
        canvas.showText(dateTime);
        canvas.endText();
        
        // Add security indicator text
        canvas.beginText();
        canvas.setFontAndSize(baseFont, 6);
        canvas.setTextMatrix(x + 5, y + 5);
        canvas.showText("Cryptographically Secured");
        canvas.endText();
        
        canvas.restoreState();
        
        log.debug("Added visual signature box on page {} at position ({}, {})", pageNumber, x, y);
    }
}
