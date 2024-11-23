package com.example.esign;

//import com.itextpdf.kernel.geom.Rectangle;
//import com.itextpdf.kernel.pdf.PdfReader;
//import com.itextpdf.kernel.pdf.StampingProperties;
//import com.itextpdf.signatures.*;

import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.StampingProperties;
import com.itextpdf.signatures.*;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.security.PrivateKey;
import java.security.cert.Certificate;

@Component
//@Scope("session")
public class PdfEmbedder {
    String destFile = null;

    String srcFile = null;
    // HttpSession session = null;
    FileOutputStream fout;
    PdfSigner signer;
    @Autowired
    private XmlSigning xmlSigning;

//    public String pdfSigner(File file, HttpServletRequest request, HttpSession session) {
//
//
//        String hashDocument = null;
//        PdfReader reader;
//        try {
//            String sourcefile = file.getAbsolutePath();
//            System.out.println("Path--->" + sourcefile);
//            destFile = sourcefile.replace(file.getName(), "Signed_Pdf.pdf");
//            request.getSession().setAttribute("fileName", "Signed_Pdf.pdf");
////     destFile=sourcefile.replace(file.getName(), "/Signed_Pdf.pdf");
////     request.getSession().setAttribute("fileName","/Signed_Pdf.pdf");
//            reader = new PdfReader(sourcefile);
//
//            Rectangle cropBox = reader.getCropBox(1);
//            Rectangle rectangle = null;
//            String user = null;
//            rectangle = new Rectangle(cropBox.getLeft(), cropBox.getBottom(), cropBox.getLeft(100), cropBox.getBottom(90));
//            fout = new FileOutputStream(destFile);
//            PdfStamper stamper = PdfStamper.createSignature(reader, fout, '\0', null, true);
//
//            appearance = stamper.getSignatureAppearance();
//            appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);
//            appearance.setAcro6Layers(false);
//            Font font = new Font();
//            font.setSize(6);
//            font.setFamily("Helvetica");
//            font.setStyle("italic");
//            appearance.setLayer2Font(font);
//            Calendar currentDat = Calendar.getInstance();
//            System.out.println("remove 5 min");
//            currentDat.add(currentDat.MINUTE, 5); //Adding Delta Time of 5 Minutes....
//
//            appearance.setSignDate(currentDat);
//
//            if (user == null || user == "null" || user.equals(null) || user.equals("null")) {
//                appearance.setLayer2Text("Signed");
//            } else {
//                appearance.setLayer2Text("Signed by " + user);
//            }
//            appearance.setCertificationLevel(PdfSignatureAppearance.NOT_CERTIFIED);
//
//            appearance.setImage(null);
//            //      appearance.setSignDate(currentDat);
//            appearance.setVisibleSignature(rectangle,
//                    reader.getNumberOfPages(), null);
//
//            int contentEstimated = 8192;
//            HashMap<PdfName, Integer> exc = new HashMap();
//            exc.put(PdfName.CONTENTS, contentEstimated * 2 + 2);
//
//            PdfSignature dic = new PdfSignature(PdfName.ADOBE_PPKLITE,
//                    PdfName.ADBE_PKCS7_DETACHED);
//            dic.setReason(appearance.getReason());
//            dic.setLocation(appearance.getLocation());
//            dic.setDate(new PdfDate(appearance.getSignDate()));
//
//
//            appearance.setCryptoDictionary(dic);
//            //  request.getSession().setAttribute("pdfHash",appearance);
//            appearance.preClose(exc);
//            // fout.close();
//            request.getSession().setAttribute("appearance", appearance);
//            // System.gc();
//            // getting bytes of file
//            InputStream is = appearance.getRangeStream();
//
//            hashDocument = DigestUtils.sha256Hex(is);
//            //session=request.getSession();
//            //session.setAttribute("appearance1",appearance);
//            System.out.println("hex:    " + is.toString());
//        } catch (Exception e) {
//            System.out.println("Error in signing doc.");
//
//        }
//        return hashDocument;
//
//    }

    public static String calculateSha256Hash(String filePath) {
        try (FileInputStream fis = new FileInputStream(new File(filePath))) {
            // Calculate and return the hash as a hex string
            return DigestUtils.sha256Hex(fis);
        } catch (IOException e) {
            System.err.println("Error calculating hash for file: " + filePath);
            e.printStackTrace();
            return null;
        }
    }

//    public String signPdfwithDS(String response, HttpServletRequest request, HttpSession session) {
//        session = request.getSession(false);
//        //PdfSignatureAppearance appearance = (PdfSignatureAppearance)request.getSession().getAttribute("appearance");
//        int contentEstimated = 8192;
//        try {
//            if (request.getSession() == null) {
//                System.out.println("=================session===========");
//            }
//            //   PdfSignatureAppearance appearance = (PdfSignatureAppearance)request.getSession().getAttribute("pdfHash");
//
//            //String esignRespResult = DocSignature;
//            String errorCode = response.substring(response.indexOf("errCode"), response.indexOf("errMsg"));
//            errorCode = errorCode.trim();
//            if (errorCode.contains("NA")) {
//
//                String pkcsResponse = xmlSigning.parseXml(response.trim());
//                byte[] sigbytes = Base64.decodeBase64(pkcsResponse);
//                byte[] paddedSig = new byte[contentEstimated];
//                System.arraycopy(sigbytes, 0, paddedSig, 0, sigbytes.length);
//                PdfDictionary dic2 = new PdfDictionary();
//                dic2.put(PdfName.CONTENTS,
//                        new PdfString(paddedSig).setHexWriting(true));
//                //fout.close();
//                appearance.close(dic2);
//            } else {
//                destFile = "Error";
//            }
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//        System.out.println("Hash after signing :" + calculateSha256Hash(destFile));
//        return destFile;
//    }

    public String generateHash(Resource resource, String sourceFile, String filename) {

        try {
            destFile = sourceFile.replace(filename, "Signed_Pdf.pdf");
            srcFile = sourceFile;
            // Load the original PDF
            PdfReader reader = new PdfReader(srcFile);

            signer = new PdfSigner(reader, new FileOutputStream(destFile), new StampingProperties().useAppendMode());
            System.out.println("hash of dest file :" + calculateSha256Hash(destFile));
            // Create a rectangle for the signature
            Rectangle rect = new Rectangle(36, 748, 200, 100);

            PdfSignatureAppearance appearance = signer.getSignatureAppearance()
                    .setReason("Document signing")
                    .setLocation("Location")
                    .setPageRect(rect)
                    .setPageNumber(1)
                    .setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);

            signer.setFieldName("sig");

            System.out.println("hash of dest file after signature appearance :" + calculateSha256Hash(destFile));


            return calculateSha256Hash(destFile);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }

    public String addVisibleSignature(Certificate[] chain, PrivateKey pk) throws Exception {

        System.out.println("hash of original file :" + calculateSha256Hash(srcFile));

        // Sign the document
        IExternalSignature pks = new PrivateKeySignature(pk, DigestAlgorithms.SHA256, "BC");
        IExternalDigest digest = new BouncyCastleDigest();
        signer.signDetached(digest, pks, chain, null, null, null, 0, PdfSigner.CryptoStandard.CADES);


        System.out.println("Hash after signing :" + calculateSha256Hash(destFile));
        return destFile;
    }

}
