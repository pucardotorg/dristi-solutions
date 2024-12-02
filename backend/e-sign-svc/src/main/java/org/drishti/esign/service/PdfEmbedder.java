package org.drishti.esign.service;

import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Font;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.parser.PdfContentStreamProcessor;
import com.itextpdf.text.pdf.security.MakeSignature;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.drishti.esign.config.PdfSignatureAppearanceCache;
import org.drishti.esign.util.ByteArrayMultipartFile;
import org.drishti.esign.util.FileStoreUtil;
import org.drishti.esign.util.TextLocationFinder;
import org.drishti.esign.web.models.Coordinate;
import org.drishti.esign.web.models.ESignParameter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.util.Calendar;
import java.util.HashMap;

import static org.drishti.esign.config.ServiceConstants.*;


@Component
@Slf4j
public class PdfEmbedder {

    private final FileStoreUtil fileStoreUtil;

    @Autowired
    public PdfEmbedder(FileStoreUtil fileStoreUtil) {
        this.fileStoreUtil = fileStoreUtil;
    }


    public MultipartFile signPdfWithDSAndReturnMultipartFile(String filepath, String response, String fileStoreId) throws IOException {

        PdfSignatureAppearance appearance = PdfSignatureAppearanceCache.get(fileStoreId);

        int contentEstimated = 8192;
        String errorCode = response.substring(response.indexOf(ERR_CODE), response.indexOf(ERR_MSG));
        errorCode = errorCode.trim();

        byte[] fileContent = new byte[0];
        if (errorCode.contains("NA")) {

            try {
                String pkcsResponse = new XmlSigning().parseXml(response.trim());
                byte[] sigbytes = Base64.decodeBase64(pkcsResponse);
                byte[] paddedSig = new byte[contentEstimated];
                System.arraycopy(sigbytes, 0, paddedSig, 0, sigbytes.length);
                PdfDictionary dic2 = new PdfDictionary();
                dic2.put(PdfName.CONTENTS,
                        new PdfString(paddedSig).setHexWriting(true));
                appearance.close(dic2);

                fileContent = Files.readAllBytes(Path.of(filepath));


            } catch (Exception ex) {
                throw new RuntimeException(ex);
            } finally {
                File file = new File(filepath);
                file.deleteOnExit();
                PdfSignatureAppearanceCache.remove(fileStoreId);
            }

        } else {
            File file = new File(filepath);
            file.deleteOnExit();
            PdfSignatureAppearanceCache.remove(fileStoreId);
        }

        return new ByteArrayMultipartFile(FILE_NAME, fileContent);
    }


    public String generateHash(Resource resource) {
        try (InputStream inputStream = resource.getInputStream()) {
            return DigestUtils.sha256Hex(inputStream);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }


    private Coordinate findLocationToSign(PdfReader reader, String signaturePlace) {
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
                    coordinate.setX(x - signaturePlace.length() * 5);
                    coordinate.setY(y);
                    coordinate.setFound(true);
                    coordinate.setPageNumber(i);
                    return coordinate;

                }
            }

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return coordinate;
    }


    public String pdfSigner(Resource resource, File destFile, ESignParameter eSignParameter) {

        String signPlaceHolder = eSignParameter.getSignPlaceHolder();


        PdfSignatureAppearance appearance;
        String hashDocument = null;
        PdfReader reader;
        try {
            reader = new PdfReader(resource.getInputStream());
            FileOutputStream fout = new FileOutputStream(destFile);
            PdfStamper stamper = PdfStamper.createSignature(reader, fout, '\0', null, true);
            appearance = stamper.getSignatureAppearance();
            appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);
            appearance.setAcro6Layers(false);

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
            HashMap<PdfName, Integer> exc = new HashMap();
            exc.put(PdfName.CONTENTS, contentEstimated * 2 + 2);
            PdfSignature dic = new PdfSignature(PdfName.ADOBE_PPKLITE,
                    PdfName.ADBE_PKCS7_DETACHED);
            dic.setReason(appearance.getReason());
            dic.setLocation(appearance.getLocation());
            dic.setDate(new PdfDate(appearance.getSignDate()));

            appearance.setCryptoDictionary(dic);
            appearance.preClose(exc);

            PdfSignatureAppearanceCache.put(eSignParameter.getFileStoreId(), appearance);

            InputStream is = appearance.getRangeStream();
            hashDocument = DigestUtils.sha256Hex(is);

        } catch (Exception e) {
            log.error("Something went wrong");
        }
        return hashDocument;
    }

    public MultipartFile signPdfWithDSAndReturnMultipartFileV2(Resource resource, String response, ESignParameter eSignParameter) {
        try {

            PdfReader reader = new PdfReader(resource.getInputStream());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            String pkcsResponse = new XmlSigning().parseXml(response.trim());
            byte[] sigbytes = Base64.decodeBase64(pkcsResponse);
            MyExternalSignatureContainer container = new MyExternalSignatureContainer(sigbytes);

            MakeSignature.signDeferred(reader, eSignParameter.getSignPlaceHolder(), baos, container);

            return new ByteArrayMultipartFile(FILE_NAME, baos.toByteArray());

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    public String pdfSignerV2(Resource resource, ESignParameter eSignParameter) {
        String hashDocument = null;

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
            MyExternalSignatureContainer container = new MyExternalSignatureContainer(new byte[]{0});

            MakeSignature.signExternalContainer(appearance, container, contentEstimated);


            InputStream is = appearance.getRangeStream();
            hashDocument = DigestUtils.sha256Hex(is);

            MultipartFile dummySignedPdf = new ByteArrayMultipartFile(FILE_NAME, baos.toByteArray());

            String dummyFileStoreId = fileStoreUtil.storeFileInFileStore(dummySignedPdf, "kl");

            eSignParameter.setFileStoreId(dummyFileStoreId);
            stamper.close();

        } catch (IOException | GeneralSecurityException | DocumentException e) {
            throw new RuntimeException(e);
        }


        return hashDocument;

    }
}

