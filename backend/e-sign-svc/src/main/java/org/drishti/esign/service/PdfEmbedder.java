package org.drishti.esign.service;

import com.itextpdf.text.Font;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.*;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.drishti.esign.cipher.Decryption;
import org.drishti.esign.util.ByteArrayMultipartFile;
import org.drishti.esign.util.FileStoreUtil;
import org.drishti.esign.web.models.ESignParameter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Calendar;
import java.util.HashMap;


@Component
@Slf4j
public class PdfEmbedder {

    private final FileStoreUtil fileStoreUtil;


    @Autowired
    Decryption decryption;

    @Autowired
    public PdfEmbedder(FileStoreUtil fileStoreUtil) {
        this.fileStoreUtil = fileStoreUtil;

    }

    public void signPdfWithDSAndReturnMultipartFile(HttpSession session, String response, String txnId) throws IOException {


        try {

            PdfSignatureAppearance appearance = (PdfSignatureAppearance) session.getAttribute(txnId);
            int contentEstimated = 8192;
            String errorCode = response.substring(response.indexOf("errCode"), response.indexOf("errMsg"));
            errorCode = errorCode.trim();
            if (errorCode.contains("NA")) {
                String pkcsResponse = new XmlSigning().parseXml(response.trim());
                byte[] sigbytes = Base64.decodeBase64(pkcsResponse);
                byte[] paddedSig = new byte[contentEstimated];
                System.arraycopy(sigbytes, 0, paddedSig, 0, sigbytes.length);
                PdfDictionary dic2 = new PdfDictionary();
                dic2.put(PdfName.CONTENTS, new PdfString(paddedSig).setHexWriting(true));
                appearance.close(dic2);
            } else {
                log.error("something went wrong on server side");

            }

        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            session.removeAttribute(txnId);
        }
    }

    public String generateHash(Resource resource, ESignParameter eSignParameter, HttpSession session) {

        PdfSignatureAppearance appearance;
        PdfReader reader;


        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            BufferedOutputStream stream = new BufferedOutputStream(bos);
            stream.write(resource.getContentAsByteArray());
            stream.close();

            reader = new PdfReader(bos.toByteArray());

            Rectangle cropBox = reader.getCropBox(1);
            Rectangle rectangle;
            rectangle = new Rectangle(cropBox.getLeft(), cropBox.getBottom(), cropBox.getLeft(100), cropBox.getBottom(90));
            PdfStamper stamper = PdfStamper.createSignature(reader, bos, '\0', null, true);

            appearance = stamper.getSignatureAppearance();
            appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);
            appearance.setAcro6Layers(false);

            Font font = new Font();
            font.setSize(6);
            font.setFamily("Helvetica");
            font.setStyle("italic");
            appearance.setLayer2Font(font);
            Calendar currentDat = Calendar.getInstance();

            appearance.setSignDate(currentDat);
            appearance.setLayer2Text("Digitally Signed");
            appearance.setCertificationLevel(PdfSignatureAppearance.NOT_CERTIFIED);

            appearance.setImage(null);
            appearance.setVisibleSignature(rectangle, reader.getNumberOfPages(), null);

            int contentEstimated = 8192;
            HashMap<PdfName, Integer> exc = new HashMap<>();

            exc.put(PdfName.CONTENTS, contentEstimated * 2 + 2);
            PdfSignature dic = new PdfSignature(PdfName.ADOBE_PPKLITE, PdfName.ADBE_PKCS7_DETACHED);
            dic.setReason(appearance.getReason());
            dic.setLocation(appearance.getLocation());
            dic.setDate(new PdfDate(appearance.getSignDate()));

            appearance.setCryptoDictionary(dic);
            appearance.preClose(exc);

            InputStream is = appearance.getRangeStream();

            MultipartFile byteArrayMultipartFile = new ByteArrayMultipartFile("signed.pdf", is.readAllBytes());
            String fileStoreId = fileStoreUtil.storeFileInFileStore(byteArrayMultipartFile, eSignParameter.getTenantId());
            session.setAttribute(fileStoreId, appearance);
            eSignParameter.setFileStoreId(fileStoreId);

            return DigestUtils.sha256Hex(byteArrayMultipartFile.getInputStream());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String generateHashv2(Resource resource) {
        try (InputStream inputStream = resource.getInputStream()) {
            return DigestUtils.sha256Hex(inputStream);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

}

