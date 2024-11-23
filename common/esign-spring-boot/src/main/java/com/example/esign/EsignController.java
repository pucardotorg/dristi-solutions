package com.example.esign;

import org.apache.commons.codec.binary.Base64;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.validation.Valid;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.security.PrivateKey;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;

@Controller
public class EsignController {

    @Autowired
    private XmlSigning xmlSigning;

    @Autowired
    private Producer producer;

    @Autowired
    private PdfEmbedder pdfEmbedder;
    @Autowired
    private Encryption encryption;

    @Autowired
    private HttpSession session;

    @Value("${cdac.esign.url}")
    private String cdacEsignUrl;

    @Value("${cdac.esign.aspId}")
    private String aspId;

    @Value("${cdac.esign.responseUrl}")
    private String responseUrl;

    @Value("${cdac.esign.responseType}")
    private String responseType;

    @Value("${email.kafka.topic}")
    private String emailTopic;

    @RequestMapping(value = "/esign-its")
    public String uploadOneFileHandler(Model model) {

        MyUploadForm myUploadForm = new MyUploadForm();
        model.addAttribute("myUploadForm", myUploadForm);
//        System.out.println("**************************************"+session.getId());
        return "uploadOneFile";
    }

    @PostMapping(value = "/esign", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public RequestXmlForm esignRequest(@ModelAttribute @Valid MyUploadForm myUploadForm, Model model, HttpServletRequest request, HttpSession session) {

        // Root Directory.
        String uploadRootPath = request.getServletContext().getRealPath("upload");
        System.out.println("uploadRootPath=" + uploadRootPath);

        File uploadRootDir = new File(uploadRootPath);
        // Create directory if it not exists.
        if (!uploadRootDir.exists()) {
            uploadRootDir.mkdirs();
        }
        MultipartFile fileData = myUploadForm.getFileDatas();
        //
        List<File> uploadedFiles = new ArrayList<File>();
        List<String> failedFiles = new ArrayList<String>();

        String fileHash = "";


        // Client File Name
        String name = fileData.getOriginalFilename();
        System.out.println("Client File Name = " + name);

        if (name != null && name.length() > 0) {
            try {
                // Create the file at server
                File serverFile = new File(uploadRootDir.getAbsolutePath() + File.separator + name);

                BufferedOutputStream stream = new BufferedOutputStream(new FileOutputStream(serverFile));
                stream.write(fileData.getBytes());
                stream.close();
                //
                uploadedFiles.add(serverFile);
                //fileHash = calculateFileHash(uploadRootDir.getAbsolutePath() + File.separator + name);
                fileHash = pdfEmbedder.generateHash(fileData.getResource(), serverFile.getAbsolutePath(), serverFile.getName());

                System.out.println(" hash for siging send to cdac " + fileHash);
                request.getSession().setAttribute("pdfEmbedder", pdfEmbedder);
                System.out.println("Write file: " + serverFile);
            } catch (Exception e) {
                System.out.println("Error Write file: " + name);
                failedFiles.add(name);
            }
        }


        //get data from Form
        String authType = myUploadForm.getAuthType();


        Date now = new Date();
        DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        dateFormat.setTimeZone(TimeZone.getTimeZone("GMT+5:30"));
        //try xml generation
        AspXmlGenerator aspXmlGenerator = new AspXmlGenerator();
        FormXmlDataAsp formXmalDataAsp = new FormXmlDataAsp();
        Random randNum = new Random();
        int randInt = randNum.nextInt();
        formXmalDataAsp.setVer("2.1");
        formXmalDataAsp.setSc("Y");
        formXmalDataAsp.setTs(dateFormat.format(now));
        //formXmalDataAsp.setTxn((myUploadForm.getAadhar() + randInt).replace("-", ""));
        formXmalDataAsp.setTxn(("" + randInt).replace("-", ""));
        formXmalDataAsp.setEkycId("");
        //formXmalDataAsp.setEkycId("1916c708a819a70b098b71f8d95f9936e9b86a90d948107e4b9172d65bceefa5");
        formXmalDataAsp.setEkycIdType("A");
        formXmalDataAsp.setAspId("ESGN-900");
        formXmalDataAsp.setAuthMode(myUploadForm.getAuthType());
        formXmalDataAsp.setResponseSigType("pkcs7");
        //formXmalDataAsp.setResponseUrl("url");
        formXmalDataAsp.setResponseUrl("https://dristi-dev.pucar.org/e-sign-test/finalResponse");

        formXmalDataAsp.setId("1");
        formXmalDataAsp.setHashAlgorithm("SHA256");
        formXmalDataAsp.setDocInfo("My Document");
        formXmalDataAsp.setDocHashHex(fileHash);

        //Get encrypted string/ signed data for xml signature tag
        String strToEncrypt = aspXmlGenerator.generateAspXml(formXmalDataAsp, request);
        String encryptedText = "";
        String xmlData = "";
        try {
//            Encryption encryption = new Encryption();
            PrivateKey rsaPrivateKey = encryption.getPrivateKey("testasp.pem");
            File encrFile = new File(uploadRootDir.getAbsolutePath() + File.separator + "Excrypted.xml");
            String encryptedFile = uploadRootDir.getAbsolutePath() + File.separator + "Excrypted.xml";
            xmlData = xmlSigning.signXmlStringNew(uploadRootDir.getAbsolutePath() + File.separator + "Testing.xml", rsaPrivateKey);
            System.out.println(xmlData);
            aspXmlGenerator.writeToXmlFile(xmlData, uploadRootDir.getAbsolutePath() + File.separator + "Testing.xml");


        } catch (Exception e) {
            System.out.println("Error in Encryption.");
            e.printStackTrace();
            return new RequestXmlForm();
        }

        RequestXmlForm myRequestXmlForm = new RequestXmlForm();
        myRequestXmlForm.setId("");
        myRequestXmlForm.setType(myUploadForm.getAuthType());
        myRequestXmlForm.setDescription("Y");
        myRequestXmlForm.setESignRequest(xmlData);
        myRequestXmlForm.setAspTxnID(("" + randInt).replaceAll("-", ""));
        myRequestXmlForm.setContentType("application/xml");
        myUploadForm.setXml(xmlData);
        return myRequestXmlForm;

    }


    @RequestMapping(value = "/finalResponse", method = RequestMethod.POST)
    public String ReadEspResponse(@RequestParam("eSignResponse") String response, @RequestParam("espTxnID") String espId, RedirectAttributes rdAttr, HttpServletRequest request) throws IOException {
        // HttpSession session = request.getSession(false);
        //PdfEmbedder pdfEmbedder = (PdfEmbedder)request.getSession().getAttribute("pdfEmbedder");
//        System.out.println("**************************************"+session.getId());
        System.out.println("**************************************" + response);

        List<Certificate> certificates = new ArrayList<>();
        String filename = "Error";
        try {
            PrivateKey rsaPrivateKey = encryption.getPrivateKey("testasp.pem");

            String certString = response.substring(response.indexOf("<UserX509Certificate>"), response.indexOf("</UserX509Certificate>"))
                    .replaceAll("<UserX509Certificate>", "").replaceAll("</UserX509Certificate>", "");
            byte[] certBytes = Base64.decodeBase64(certString);
            ByteArrayInputStream stream = new ByteArrayInputStream(certBytes);
            CertificateFactory factory = CertificateFactory.getInstance("X.509");
            Certificate cert = factory.generateCertificate(stream);
            certificates = List.of(cert);
            filename = pdfEmbedder.addVisibleSignature(certificates.toArray(new Certificate[0]), rsaPrivateKey);


        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        System.out.println(" Response--->" + response + "ESP ID" + espId);
        if (filename.equals("Error")) {
            String error = response.substring(response.indexOf("errCode"), response.indexOf("resCode"));
            ModelAndView model = new ModelAndView();
            model.addObject("error", error);
//            System.out.println("**************************************" + session.getId());
            return "errorFile";
        } else {
            return "downloadPdf";
        }
    }

    @RequestMapping("/downloadPdfLocally")
    public void downloadPDFResource(HttpServletRequest request, HttpServletResponse response) throws IOException {
        //If user is not authorized - he should be thrown out from here itself

        //Authorized user will download the file
        String dataDirectory = request.getServletContext().getRealPath("upload");
        Path file = Paths.get(dataDirectory, "Signed_Pdf.pdf");
        if (Files.exists(file)) {
            response.setContentType("application/pdf");
            response.addHeader("Content-Disposition", "attachment; filename=" + "Signed_Pdf.pdf");
            try {
                Files.copy(file, response.getOutputStream());
                response.getOutputStream().flush();
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
    }

}
