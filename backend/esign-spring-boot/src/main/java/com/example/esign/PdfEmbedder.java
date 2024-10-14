package com.example.esign;

import com.itextpdf.text.Font;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.PdfSignatureAppearance.RenderingMode;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.Calendar;
import java.util.HashMap;

@Component
//@Scope("session")
public class PdfEmbedder {
    @Autowired
    private XmlSigning xmlSigning;
    String destFile = null;
    // HttpSession session = null;
    FileOutputStream fout;

    PdfSignatureAppearance appearance;

    public String pdfSigner(File file, HttpServletRequest request, HttpSession session) {


        String hashDocument = null;
        PdfReader reader;
        try {
            String sourcefile = file.getAbsolutePath();
            System.out.println("Path--->" + sourcefile);
            destFile = sourcefile.replace(file.getName(), "Signed_Pdf.pdf");
            request.getSession().setAttribute("fileName", "Signed_Pdf.pdf");
//     destFile=sourcefile.replace(file.getName(), "/Signed_Pdf.pdf");
//     request.getSession().setAttribute("fileName","/Signed_Pdf.pdf");
            reader = new PdfReader(sourcefile);

            Rectangle cropBox = reader.getCropBox(1);
            Rectangle rectangle = null;
            String user = null;
            rectangle = new Rectangle(cropBox.getLeft(), cropBox.getBottom(), cropBox.getLeft(100), cropBox.getBottom(90));
            fout = new FileOutputStream(destFile);
            PdfStamper stamper = PdfStamper.createSignature(reader, fout, '\0', null, true);

            appearance = stamper.getSignatureAppearance();
            appearance.setRenderingMode(RenderingMode.DESCRIPTION);
            appearance.setAcro6Layers(false);
            Font font = new Font();
            font.setSize(6);
            font.setFamily("Helvetica");
            font.setStyle("italic");
            appearance.setLayer2Font(font);
            Calendar currentDat = Calendar.getInstance();
            System.out.println("remove 5 min");
            currentDat.add(currentDat.MINUTE, 5); //Adding Delta Time of 5 Minutes....

            appearance.setSignDate(currentDat);

            if (user == null || user == "null" || user.equals(null) || user.equals("null")) {
                appearance.setLayer2Text("Signed");
            } else {
                appearance.setLayer2Text("Signed by " + user);
            }
            appearance.setCertificationLevel(PdfSignatureAppearance.NOT_CERTIFIED);

            appearance.setImage(null);
            //      appearance.setSignDate(currentDat);
            appearance.setVisibleSignature(rectangle,
                    reader.getNumberOfPages(), null);

            int contentEstimated = 8192;
            HashMap<PdfName, Integer> exc = new HashMap();
            exc.put(PdfName.CONTENTS, contentEstimated * 2 + 2);

            PdfSignature dic = new PdfSignature(PdfName.ADOBE_PPKLITE,
                    PdfName.ADBE_PKCS7_DETACHED);
            dic.setReason(appearance.getReason());
            dic.setLocation(appearance.getLocation());
            dic.setDate(new PdfDate(appearance.getSignDate()));


            appearance.setCryptoDictionary(dic);
            //  request.getSession().setAttribute("pdfHash",appearance);
            appearance.preClose(exc);
            // fout.close();
            request.getSession().setAttribute("appearance", appearance);
            // System.gc();
            // getting bytes of file
            InputStream is = appearance.getRangeStream();

            hashDocument = DigestUtils.sha256Hex(is);
            //session=request.getSession();
            //session.setAttribute("appearance1",appearance);
            System.out.println("hex:    " + is.toString());
        } catch (Exception e) {
            System.out.println("Error in signing doc.");

        }
        return hashDocument;

    }

    public String signPdfwithDS(String response, HttpServletRequest request, HttpSession session) {
        session = request.getSession(false);
        //PdfSignatureAppearance appearance = (PdfSignatureAppearance)request.getSession().getAttribute("appearance");
        int contentEstimated = 8192;
        try {
            if (request.getSession() == null) {
                System.out.println("=================session===========");
            }
            //   PdfSignatureAppearance appearance = (PdfSignatureAppearance)request.getSession().getAttribute("pdfHash");

            //String esignRespResult = DocSignature;
            String errorCode = response.substring(response.indexOf("errCode"), response.indexOf("errMsg"));
            errorCode = errorCode.trim();
            if (errorCode.contains("NA")) {
                String pkcsResponse = xmlSigning.parseXml(response.trim());
                byte[] sigbytes = Base64.decodeBase64(pkcsResponse);
                byte[] paddedSig = new byte[contentEstimated];
                System.arraycopy(sigbytes, 0, paddedSig, 0, sigbytes.length);
                PdfDictionary dic2 = new PdfDictionary();
                dic2.put(PdfName.CONTENTS,
                        new PdfString(paddedSig).setHexWriting(true));
                //fout.close();
                appearance.close(dic2);
            } else {
                destFile = "Error";
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return destFile;
    }

}
