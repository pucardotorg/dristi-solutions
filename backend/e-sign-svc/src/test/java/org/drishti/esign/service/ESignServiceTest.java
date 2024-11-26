package org.drishti.esign.service;

import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.*;
import jakarta.servlet.ServletContext;
import org.drishti.esign.cipher.Encryption;
import org.drishti.esign.util.FileStoreUtil;
import org.drishti.esign.util.XmlFormDataSetter;
import org.drishti.esign.web.models.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.security.PrivateKey;
import java.util.Calendar;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ESignServiceTest {

    @InjectMocks
    private ESignService eSignService;

    @Mock
    private PdfEmbedder pdfEmbedder;

    @Mock
    private XmlSigning xmlSigning;

    @Mock
    private Encryption encryption;

    @Mock
    private XmlFormDataSetter formDataSetter;

    @Mock
    private XmlGenerator xmlGenerator;

    @Mock
    private HttpServletRequest servletRequest;

    @Mock
    private FileStoreUtil fileStoreUtil;

    @Mock
    private ServletContext servletContext;

    private final ESignRequest request = new ESignRequest();
    private Resource resource;
    private PrivateKey privateKey;


    @BeforeEach
    public void setUp() {

        ESignParameter eSignParameter = new ESignParameter();
        eSignParameter.setFileStoreId("12345");
        eSignParameter.setTenantId("tenant1");
        eSignParameter.setPageModule("module1");
        request.setESignParameter(eSignParameter);

        resource = mock(Resource.class);
        privateKey = mock(PrivateKey.class);
    }

    @Test
    void testSerialization() throws Exception {
        PdfReader reader = new PdfReader("C:\\Users\\Haritha\\Downloads\\sample.pdf"); // Replace with an actual PDF file path
        FileOutputStream outputStream = new FileOutputStream("signed_sample.pdf");
        PdfStamper stamper = PdfStamper.createSignature(reader, outputStream, '\0');

        // Step 2: Get PdfSignatureAppearance from PdfStamper
        PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
        appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION);
        appearance.setSignDate(Calendar.getInstance());
        appearance.setLayer2Text("Digitally Signed");
        Font font = new Font();
        font.setSize(12);
        font.setFamily("Helvetica");
        font.setStyle("italic");
        appearance.setLayer2Font(font);
        appearance.setReason("Approval");
        appearance.setLocation("Hyderabad");
        appearance.setCertificationLevel(PdfSignatureAppearance.NOT_CERTIFIED);
        appearance.setVisibleSignature(new Rectangle(100, 100, 200, 200), 1, null);
        appearance.setAcro6Layers(false);
        PdfSignature dic = new PdfSignature(PdfName.ADOBE_PPKLITE, PdfName.ADBE_PKCS7_DETACHED);
        dic.setReason(appearance.getReason());
        dic.setLocation(appearance.getLocation());
        dic.setDate(new PdfDate(appearance.getSignDate()));
        appearance.setCryptoDictionary(dic);


        String originalRenderingMode = appearance.getRenderingMode().toString();
        Calendar originalSignDate = appearance.getSignDate();
        String originalLayer2Text = appearance.getLayer2Text();
        Font originalFont = appearance.getLayer2Font();
        String originalReason = appearance.getReason();
        String originalLocation = appearance.getLocation();
        int originalCertificationLevel = appearance.getCertificationLevel();
        Rectangle originalRect = appearance.getRect();
        boolean originalAcro6Layers = appearance.isAcro6Layers();


        // Serialize to DTO
        PdfSignatureAppearanceDTO dto = serializeAppearance(appearance);

        // Serialize DTO to a file
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("appearance.ser"))) {
            oos.writeObject(dto);
        }

        // Deserialize DTO from file
        PdfSignatureAppearanceDTO deserializedDTO;
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("appearance.ser"))) {
            deserializedDTO = (PdfSignatureAppearanceDTO) ois.readObject();
        }

        assertEquals(originalRenderingMode, deserializedDTO.getRenderingMode(), "Rendering mode mismatch");
        assertEquals(originalSignDate, deserializedDTO.getSignDate(), "Sign date mismatch");
        assertEquals(originalLayer2Text, deserializedDTO.getLayer2Text(), "Layer2 text mismatch");
        assertEquals(originalFont.getSize(), deserializedDTO.getFontSize(), "Font size mismatch");
        assertEquals(originalFont.getFamilyname(), deserializedDTO.getFontFamily(), "Font family mismatch");
        assertEquals(originalFont.getStyle(), deserializedDTO.getFontStyle(), "Font style mismatch");
        assertEquals(originalReason, deserializedDTO.getReason(), "Reason mismatch");
        assertEquals(originalLocation, deserializedDTO.getLocation(), "Location mismatch");
        assertEquals(originalCertificationLevel, deserializedDTO.getCertificationLevel(), "Certification level mismatch");
        assertEquals(originalRect.getLeft(), deserializedDTO.getLlx(), "Rectangle llx mismatch");
        assertEquals(originalRect.getBottom(), deserializedDTO.getLly(), "Rectangle lly mismatch");
        assertEquals(originalRect.getRight(), deserializedDTO.getUrx(), "Rectangle urx mismatch");
        assertEquals(originalRect.getTop(), deserializedDTO.getUry(), "Rectangle ury mismatch");
        assertEquals(originalAcro6Layers, deserializedDTO.isAcro6Layers(), "Acro6Layers flag mismatch");
        applyAppearanceFromDTO(appearance, deserializedDTO);

        // Print deserialized data
        System.out.println("Deserialized Rendering Mode: " + deserializedDTO.getRenderingMode());
        System.out.println("Deserialized Layer2Text: " + deserializedDTO.getLayer2Text());
        System.out.println("Deserialized Reason: " + deserializedDTO.getReason());
        System.out.println("Deserialized Location: " + deserializedDTO.getLocation());
        reader.close();
        outputStream.close();
    }

    static class PdfSignatureAppearanceDTO implements Serializable {
        private static final long serialVersionUID = 1L;

        private String renderingMode;
        private Calendar signDate;
        private String layer2Text;
        private float fontSize;
        private String fontFamily;
        private int fontStyle;
        private String reason;
        private String location;
        private int certificationLevel;
        private Rectangle visibleSignatureRect;
        private boolean acro6Layers;
        private float llx, lly, urx, ury;

        private String cryptoReason;
        private String cryptoLocation;
        private Calendar cryptoDate;

        public String getCryptoReason() {
            return cryptoReason;
        }

        public void setCryptoReason(String cryptoReason) {
            this.cryptoReason = cryptoReason;
        }

        public String getCryptoLocation() {
            return cryptoLocation;
        }

        public void setCryptoLocation(String cryptoLocation) {
            this.cryptoLocation = cryptoLocation;
        }

        public Calendar getCryptoDate() {
            return cryptoDate;
        }

        public void setCryptoDate(Calendar cryptoDate) {
            this.cryptoDate = cryptoDate;
        }


        private byte[] layer2Image; // Serialize image as byte array

        public byte[] getLayer2Image() {
            return layer2Image;
        }

        public void setLayer2Image(byte[] layer2Image) {
            this.layer2Image = layer2Image;
        }


        // Getters and Setters
        public String getRenderingMode() {
            return renderingMode;
        }

        public void setRenderingMode(String renderingMode) {
            this.renderingMode = renderingMode;
        }

        public Calendar getSignDate() {
            return signDate;
        }

        public void setSignDate(Calendar signDate) {
            this.signDate = signDate;
        }

        public String getLayer2Text() {
            return layer2Text;
        }

        public void setLayer2Text(String layer2Text) {
            this.layer2Text = layer2Text;
        }

        public float getFontSize() {
            return fontSize;
        }

        public void setFontSize(float fontSize) {
            this.fontSize = fontSize;
        }

        public String getFontFamily() {
            return fontFamily;
        }

        public void setFontFamily(String fontFamily) {
            this.fontFamily = fontFamily;
        }

        public int getFontStyle() {
            return fontStyle;
        }

        public void setFontStyle(int fontStyle) {
            this.fontStyle = fontStyle;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public int getCertificationLevel() {
            return certificationLevel;
        }

        public void setCertificationLevel(int certificationLevel) {
            this.certificationLevel = certificationLevel;
        }

        public Rectangle getVisibleSignatureRect() {
            return visibleSignatureRect;
        }

        public void setVisibleSignatureRect(Rectangle visibleSignatureRect) {
            this.visibleSignatureRect = visibleSignatureRect;
        }

        public boolean isAcro6Layers() {
            return acro6Layers;
        }

        public void setAcro6Layers(boolean acro6Layers) {
            this.acro6Layers = acro6Layers;
        }

        public float getLlx() {
            return llx;
        }

        public void setLlx(float llx) {
            this.llx = llx;
        }

        public float getLly() {
            return lly;
        }

        public void setLly(float lly) {
            this.lly = lly;
        }

        public float getUrx() {
            return urx;
        }

        public void setUrx(float urx) {
            this.urx = urx;
        }

        public float getUry() {
            return ury;
        }

        public void setUry(float ury) {
            this.ury = ury;
        }
    }

    // Serialize PdfSignatureAppearance to DTO
    public static PdfSignatureAppearanceDTO serializeAppearance(PdfSignatureAppearance appearance) {
        PdfSignatureAppearanceDTO dto = new PdfSignatureAppearanceDTO();
        dto.setRenderingMode(appearance.getRenderingMode().toString());
        dto.setSignDate(appearance.getSignDate());
        dto.setLayer2Text(appearance.getLayer2Text());

        if (appearance.getLayer2Font() != null) {
            dto.setFontSize(appearance.getLayer2Font().getSize());
            dto.setFontFamily(appearance.getLayer2Font().getFamilyname());
            dto.setFontStyle(appearance.getLayer2Font().getStyle());
        }

        dto.setReason(appearance.getReason());
        dto.setLocation(appearance.getLocation());
        dto.setCertificationLevel(appearance.getCertificationLevel());
        Rectangle rect = appearance.getRect();
        if (rect != null) {
            dto.setLlx(rect.getLeft());
            dto.setLly(rect.getBottom());
            dto.setUrx(rect.getRight());
            dto.setUry(rect.getTop());
        }

        PdfDictionary cryptoDictionary = appearance.getCryptoDictionary();
        if (cryptoDictionary != null) {
            dto.setCryptoReason(appearance.getReason());
            dto.setCryptoLocation(appearance.getLocation());
            dto.setCryptoDate(appearance.getSignDate());
        }

        dto.setAcro6Layers(appearance.isAcro6Layers());
        return dto;
    }

    // Deserialize DTO back to PdfSignatureAppearance
    public static void applyAppearanceFromDTO(PdfSignatureAppearance appearance, PdfSignatureAppearanceDTO dto) throws Exception{
        appearance.setRenderingMode(PdfSignatureAppearance.RenderingMode.valueOf(dto.getRenderingMode()));
        appearance.setSignDate(dto.getSignDate());
        appearance.setLayer2Text(dto.getLayer2Text());

        Font font = new Font();
        font.setSize(dto.getFontSize());
        font.setFamily(dto.getFontFamily());
        font.setStyle(dto.getFontStyle());
        appearance.setLayer2Font(font);

        appearance.setReason(dto.getReason());
        appearance.setLocation(dto.getLocation());
        appearance.setCertificationLevel(dto.getCertificationLevel());
        if (dto.getVisibleSignatureRect() != null) {
            Rectangle rect = new Rectangle(dto.getLlx(), dto.getLly(), dto.getUrx(), dto.getUry());
            appearance.setVisibleSignature(rect, 1, null);
            //appearance.setVisibleSignature(dto.getVisibleSignatureRect(), 1, null);
        }
        if (dto.getLayer2Image() != null) {
            Image img = Image.getInstance(dto.getLayer2Image());
            appearance.setImage(img);
        }

        if (dto.getCryptoReason() != null) {
            PdfSignature dic = new PdfSignature(PdfName.ADOBE_PPKLITE, PdfName.ADBE_PKCS7_DETACHED);
            dic.setReason(dto.getCryptoReason());
            dic.setLocation(dto.getCryptoLocation());
            dic.setDate(new PdfDate(dto.getCryptoDate()));
            appearance.setCryptoDictionary(dic);
        }

        appearance.setAcro6Layers(dto.isAcro6Layers());
    }

//    @Test
//    public void signDoc_HappyPath() throws Exception {
//        String fileHash = "fileHash";
//        String strToEncrypt = "strToEncrypt";
//        String signedXml = "signedXml";
//
//        when(fileStoreUtil.fetchFileStoreObjectById(anyString(), anyString())).thenReturn(resource);
//        when(pdfEmbedder.generateHashv2(any(Resource.class))).thenReturn(fileHash);
//        when(formDataSetter.setFormXmlData(any() , any(ESignXmlData.class))).thenReturn(new ESignXmlData());
//        when(xmlGenerator.generateXml(any(ESignXmlData.class))).thenReturn(strToEncrypt);
//        when(encryption.getPrivateKey(anyString())).thenReturn(privateKey);
//        when(servletRequest.getServletContext()).thenReturn(servletContext);
//        when(servletContext.getRealPath(anyString())).thenReturn("upload");
//        when(xmlSigning.signXmlStringNew(anyString(), any(PrivateKey.class))).thenReturn(signedXml);
//
//        ESignXmlForm result = eSignService.signDoc(request);
//
//        assertNotNull(result);
//        verify(xmlGenerator, times(1)).writeToXmlFile(any(), any());
//    }

//    @Test
//    public void signDoc_Exception() throws Exception {
//        when(fileStoreUtil.fetchFileStoreObjectById(anyString(), anyString())).thenReturn(resource);
//        when(pdfEmbedder.generateHashv2(any(Resource.class))).thenReturn("fileHash");
//        when(formDataSetter.setFormXmlData(anyString(), any(ESignXmlData.class))).thenReturn(new ESignXmlData());
//        when(xmlGenerator.generateXml(any(ESignXmlData.class))).thenReturn("strToEncrypt");
//        when(encryption.getPrivateKey(anyString())).thenThrow(new RuntimeException("Test Exception"));
//
//        ESignXmlForm result = eSignService.signDoc(request);
//
//        assertNotNull(result);
//        assertEquals("", result.getESignRequest());
//        assertEquals("application/xml", result.getContentType());
//    }
//
//    @Test
//    public void signDocWithDigitalSignature_HappyPath() throws IOException {
//        SignDocRequest signDocRequest = new SignDocRequest();
//        SignDocParameter signDocParameter = new SignDocParameter();
//        signDocParameter.setFileStoreId("12345");
//        signDocParameter.setTenantId("tenant1");
//        signDocParameter.setResponse("response");
//        signDocRequest.setESignParameter(signDocParameter);
//
//        MultipartFile multipartFile = mock(MultipartFile.class);
//
//        when(fileStoreUtil.fetchFileStoreObjectById(anyString(), anyString())).thenReturn(resource);
////        when(pdfEmbedder.signPdfWithDSAndReturnMultipartFile(any(Resource.class), anyString())).thenReturn(multipartFile);
//        when(fileStoreUtil.storeFileInFileStore(any(MultipartFile.class), anyString())).thenReturn("signedFileStoreId");
//
//        String result = eSignService.signDocWithDigitalSignature(signDocRequest);
//
//        assertNotNull(result);
//        assertEquals("12345", result);
//    }

//    @Test
//    public void signDocWithDigitalSignature_Exception() throws IOException {
//        SignDocRequest signDocRequest = new SignDocRequest();
//        SignDocParameter signDocParameter = new SignDocParameter();
//        signDocParameter.setFileStoreId("12345");
//        signDocParameter.setTenantId("tenant1");
//        signDocParameter.setResponse("response");
//        signDocRequest.setESignParameter(signDocParameter);
//
//        when(fileStoreUtil.fetchFileStoreObjectById(anyString(), anyString())).thenReturn(resource);
////        when(pdfEmbedder.signPdfWithDSAndReturnMultipartFile(any(Resource.class), anyString())).thenThrow(new IOException("Test Exception"));
//
//        assertThrows(RuntimeException.class, () -> {
//            eSignService.signDocWithDigitalSignature(signDocRequest);
//        });
//    }
}
