package org.drishti.esign.service;

import com.itextpdf.text.pdf.PdfSignatureAppearance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class PdfSignatureService {

    private final CacheService cacheService;

    @Autowired
    public PdfSignatureService(CacheService cacheService) {
        this.cacheService = cacheService;
    }

    public void storePdfSignatureAppearance(PdfSignatureAppearance signatureAppearance, String key) throws IOException {
        // Serialize only necessary properties of PdfSignatureAppearance to a Map or a custom object
//        Map<String, Object> signatureData = Map.of(
//                "signatureName", signatureAppearance.getFieldName(),
//                "signatureLocation", signatureAppearance.getLocation(),
//                "signatureReason", signatureAppearance.getReason()
//        );
        Map<String ,Object>signatureData= new HashMap<>();
        signatureData.put( "signatureName", signatureAppearance.getFieldName());
        signatureData.put("signatureLocation", signatureAppearance.getLocation());
        signatureData.put( "signatureReason", signatureAppearance.getReason());


        // Serialize the Map to byte array
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try (ObjectOutputStream objectOutputStream = new ObjectOutputStream(byteArrayOutputStream)) {
            objectOutputStream.writeObject(signatureData);
        }

        // Convert byte array to Base64 string
        String base64SignatureAppearance = Base64.getEncoder().encodeToString(byteArrayOutputStream.toByteArray());

        // Store the Base64 string in Redis with a unique key
        cacheService.save(key,base64SignatureAppearance);
    }

    public Map<String, Object> retrievePdfSignatureAppearance(String key) throws IOException, ClassNotFoundException {
        // Retrieve the Base64 string from Redis
        String base64SignatureAppearance = cacheService.findById(key).toString();

        if (base64SignatureAppearance == null) {
            return null; // Handle accordingly
        }

        // Convert Base64 string back to byte array
        byte[] bytes = Base64.getDecoder().decode(base64SignatureAppearance);

        // Deserialize the byte array back to a Map
        try (ObjectInputStream objectInputStream = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            return (Map<String, Object>) objectInputStream.readObject();
        }
    }
}

