package org.drishti.esign.service;

import com.itextpdf.forms.PdfAcroForm;
import com.itextpdf.forms.fields.PdfSignatureFormField;
import com.itextpdf.text.Font;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.parser.PdfContentStreamProcessor;
import com.itextpdf.text.pdf.security.MakeSignature;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.drishti.esign.config.Configuration;
import org.drishti.esign.util.ByteArrayMultipartFile;
import org.drishti.esign.util.FileStoreUtil;
import org.drishti.esign.util.TextLocationFinder;
import org.drishti.esign.web.models.Coordinate;
import org.drishti.esign.web.models.ESignParameter;
import org.egov.tracer.model.CustomException;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.*;

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
            byte[] sigbytes = org.apache.commons.codec.binary.Base64.decodeBase64(pkcsResponse);
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
        log.info("Method=pdfSignerMultiPageV2 ,Result=InProgress ,filestoreId={}", eSignParameter.getFileStoreId());
        String hashDocument = null;
        try {
            PdfReader reader = new PdfReader(resource.getInputStream());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            PdfStamper stamper = new PdfStamper(reader, baos);

            boolean multiPageSign = Boolean.TRUE.equals(eSignParameter.getMultiPageSigning());
            String baseFieldName = eSignParameter.getSignPlaceHolder() != null ? eSignParameter.getSignPlaceHolder() : SIGNATURE;
            List<Integer> pagesToSign = new ArrayList<>();

            if(multiPageSign){
                if(Boolean.TRUE.equals(eSignParameter.getApplyToAllPages())) {
                    int totalPages = reader.getNumberOfPages();
                    for(int i=1; i<=totalPages; i++) {
                        pagesToSign.add(i);
                    }
                } else {
                    pagesToSign = eSignParameter.getSpecificPages();
                }
            }
            for(Integer pageNumber : pagesToSign) {
                String fieldName = baseFieldName + "_" + pageNumber;

                if(eSignParameter.getPlaceholders() != null && eSignParameter.getPlaceholders().containsKey(pageNumber)) {
                    fieldName = eSignParameter.getPlaceholders().get(pageNumber);
                }
                Rectangle rect = new Rectangle(100, 100, 250, 150); //todo: make configurable
                PdfFormField signatureField = PdfFormField.createSignature(stamper.getWriter());
                signatureField.setFieldName(fieldName);
                signatureField.setWidget(rect, PdfAnnotation.HIGHLIGHT_INVERT);
                signatureField.setFlags(PdfAnnotation.FLAGS_PRINT);
                signatureField.setPage(pageNumber);

                PdfSignatureAppearance appearance = getSignatureAppearance(stamper);
                appearance.setVisibleSignature(rect, pageNumber, fieldName);
                stamper.addAnnotation(signatureField, pageNumber);
            }
            stamper.close();
            reader.close();

            byte[] pdfBytes = baos.toByteArray();

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(pdfBytes);
            hashDocument = java.util.Base64.getEncoder().encodeToString(hashBytes);
        } catch (Exception e) {
            log.info("Method=pdfSignerV2 ,Result=Error ,filestoreId={}", eSignParameter.getFileStoreId());
            log.error("Method=pdfSignerV2, Error:{}", e.toString());
            throw new CustomException("SIGNATURE_PLACEHOLDER_EXCEPTION","Error occurred while creating placeholder");
        }
        return hashDocument;
    }

    @NotNull
    private static PdfSignatureAppearance getSignatureAppearance(PdfStamper stamper) {
        PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
        appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);
        appearance.setAcro6Layers(false);// deprecated
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
        return appearance;
    }

    public String pdfSignerMultiPageV2_1(Resource resource, ESignParameter eSignParameter){
        log.info("Method=pdfSignerMultiPageV2 ,Result=InProgress ,filestoreId={}",
                eSignParameter.getFileStoreId());

        try {
            PdfReader reader = new PdfReader(resource.getInputStream());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            PdfStamper stamper = new PdfStamper(reader, baos);
            boolean multiPageSign = Boolean.TRUE.equals(eSignParameter.getMultiPageSigning());
            String baseFieldName = eSignParameter.getSignPlaceHolder() != null
                    ? eSignParameter.getSignPlaceHolder()
                    : SIGNATURE;

            List<Integer> pagesToSign = new ArrayList<>();

            if (multiPageSign) {
                if (Boolean.TRUE.equals(eSignParameter.getApplyToAllPages())) {
                    int totalPages = reader.getNumberOfPages();
                    for (int i = 1; i <= totalPages; i++) {
                        pagesToSign.add(i);
                    }
                } else if (eSignParameter.getSpecificPages() != null) {
                    pagesToSign.addAll(eSignParameter.getSpecificPages());
                }
            }

            for (Integer pageNumber : pagesToSign) {
                String fieldName = baseFieldName + "_" + pageNumber;

                if (eSignParameter.getPlaceholders() != null &&
                        eSignParameter.getPlaceholders().containsKey(pageNumber)) {
                    fieldName = eSignParameter.getPlaceholders().get(pageNumber);
                }

                Rectangle rect = new Rectangle(100, 100, 250, 150); // TODO make configurable

                PdfFormField signatureField = PdfFormField.createSignature(stamper.getWriter());
                signatureField.setFieldName(fieldName);
                signatureField.setWidget(rect, PdfAnnotation.HIGHLIGHT_INVERT);
                signatureField.setFlags(PdfAnnotation.FLAGS_PRINT);
                signatureField.setPage(pageNumber);

                stamper.addAnnotation(signatureField, pageNumber);
            }

            stamper.close();
            reader.close();

            // 🔐 Generate SHA-256 hash of the final PDF
            byte[] pdfBytes = baos.toByteArray();

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(pdfBytes);

            String hashDocument = Base64.getEncoder().encodeToString(hashBytes);

            log.info("Method=pdfSignerMultiPageV2 ,Result=Success ,filestoreId={}",
                    eSignParameter.getFileStoreId());

            return hashDocument;

        } catch (Exception e) {
            log.info("Method=pdfSignerV2 ,Result=Error ,filestoreId={}", eSignParameter.getFileStoreId());
            log.error("Method=pdfSignerV2, Error:", e);

            throw new CustomException(
                    "SIGNATURE_PLACEHOLDER_EXCEPTION",
                    "Error occurred while creating placeholder"
            );
        }
    }

    public String pdfSignerMultiPageV2_2(Resource resource, ESignParameter eSignParameter){
        log.info("Method=pdfSignerMultiPageV2_2 ,Result=InProgress ,filestoreId={}",
                eSignParameter.getFileStoreId());
        String hashDocument = null;
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            com.itextpdf.kernel.pdf.PdfReader reader = new com.itextpdf.kernel.pdf.PdfReader(resource.getInputStream());
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(baos);
            com.itextpdf.kernel.pdf.PdfDocument pdfDoc = new com.itextpdf.kernel.pdf.PdfDocument(reader, writer);

            PdfAcroForm acroForm = PdfAcroForm.getAcroForm(pdfDoc, true);
            boolean multiPageSign = Boolean.TRUE.equals(eSignParameter.getMultiPageSigning());
            String baseFieldName = eSignParameter.getSignPlaceHolder() != null
                    ? eSignParameter.getSignPlaceHolder()
                    : SIGNATURE;

            List<Integer> pagesToSign = new ArrayList<>();

            if (multiPageSign) {
                if (Boolean.TRUE.equals(eSignParameter.getApplyToAllPages())) {
                    int totalPages = pdfDoc.getNumberOfPages();
                    for (int i = 1; i <= totalPages; i++) {
                        pagesToSign.add(i);
                    }
                } else if (eSignParameter.getSpecificPages() != null) {
                    pagesToSign.addAll(eSignParameter.getSpecificPages());
                }
            }

            for(Integer pageNum : pagesToSign) {
                com.itextpdf.kernel.pdf.PdfPage pdfPage = pdfDoc.getPage(pageNum);

                PdfSignatureFormField signatureFormField =
                        com.itextpdf.forms.fields.PdfFormField
                                .createSignature(pdfDoc,  new com.itextpdf.kernel.geom.Rectangle(100, 100, 250, 150));
                signatureFormField.setFieldName(baseFieldName + "_page_" + pageNum);
                signatureFormField.setPage(pageNum);
                acroForm.addField(signatureFormField, pdfPage);
            }
            pdfDoc.close();
            byte[] pdfBytes = baos.toByteArray();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(pdfBytes);
            hashDocument = Base64.getEncoder().encodeToString(hashBytes);
            log.info("Method=pdfSignerMultiPageV2_2 ,Result=Success ,filestoreId={}",
                    eSignParameter.getFileStoreId());
        } catch (Exception e) {
            log.error("Method=pdfSignerMultiPageV2_2, Error:{}", e.getMessage(), e);
            throw new CustomException("SIGNATURE_PLACEHOLDER_EXCEPTION", "Error occurred while creating placeholder");
        }
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
            byte[] signBytes = Base64.getDecoder().decode(pkcsResponse);
            byte[] paddedSig = new byte[contentEstimated];
            System.arraycopy(signBytes, 0, paddedSig, 0, signBytes.length);
            
            MyExternalSignatureContainer container = new MyExternalSignatureContainer(paddedSig, null, null);

            // Embed signature into the multi-widget field
            // This single operation signs ALL widgets across all pages
            MakeSignature.signDeferred(reader, eSignParameter.getSignPlaceHolder(), baos, container);

            return new ByteArrayMultipartFile(FILE_NAME, baos.toByteArray());

        } catch (Exception e) {
            log.info("Method=signPdfMultiPageWithDSAndReturnMultipartFileV2 ,Result=Error ,filestoreId={}", eSignParameter.getFileStoreId());
            log.error("Method=signPdfMultiPageWithDSAndReturnMultipartFileV2, Error:{}", e.getMessage(), e);
            throw new CustomException("SIGNATURE_EMBED_EXCEPTION", "Error Occurred while embedding multi-page signature");
        } finally {
            log.info("Deleting partially signed pdf in finally block, filestoreId={}", eSignParameter.getFileStoreId());
            fileStoreUtil.deleteFileFromFileStore(eSignParameter.getFileStoreId(), eSignParameter.getTenantId(), false);
            log.info("Method=signPdfMultiPageWithDSAndReturnMultipartFileV2 ,Result=Success ,filestoreId={}", eSignParameter.getFileStoreId());
        }
    }
}
