package org.drishti.esign.service;

import com.itextpdf.text.pdf.PdfSignatureAppearance;
import org.drishti.esign.config.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.concurrent.TimeUnit;

@Service
public class CacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private Configuration config;

    public void save(String id, Object value) {
        redisTemplate.opsForValue().set(id, value, config.getRedisTimeout(), TimeUnit.MINUTES);
    }

    public Object findById(String id) {
        return redisTemplate.opsForValue().get(id);
    }

    public void delete(String id) {
        redisTemplate.delete(id);
    }

    public void save(String key, PdfSignatureAppearance signatureAppearance) {
        try {
            // Serialize PdfSignatureAppearance object to byte array
            ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
            ObjectOutputStream objectStream = new ObjectOutputStream(byteStream);
            objectStream.writeObject(signatureAppearance);
            objectStream.flush();
            byte[] signatureBytes = byteStream.toByteArray();

            // Store the byte array in Redis
            save(key, signatureBytes);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public PdfSignatureAppearance get(String key) {
        byte[] signatureBytes = (byte[]) findById(key);
        if (signatureBytes != null) {
            try {
                // Deserialize the byte array back to PdfSignatureAppearance object
                ByteArrayInputStream byteStream = new ByteArrayInputStream(signatureBytes);
                ObjectInputStream objectStream = new ObjectInputStream(byteStream);
                return (PdfSignatureAppearance) objectStream.readObject();
            } catch (IOException | ClassNotFoundException e) {
                e.printStackTrace();
            }
        }
        return null;  // Return null if not found
    }
}