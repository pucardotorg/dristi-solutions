package com.example.esign;

import org.apache.commons.codec.binary.Base64;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;

import javax.crypto.Cipher;
import javax.servlet.ServletContext;
import java.io.*;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;


@Component
public class Encryption {

    @Value("${testasp.pem.location}")
    private String testaspPemLocation;

    // Load the file



    @Autowired
    private ResourceLoader resourceLoader;

    private String getKey(String filename) throws IOException {
        // Read key from file
        String strKeyPEM = "";
        Resource resource = resourceLoader.getResource("classpath:"+filename);
        InputStream is = resource.getInputStream();

        BufferedReader br = new BufferedReader(new InputStreamReader(is));
        String line;
        while ((line = br.readLine()) != null) {
            strKeyPEM += line + "\n";
        }
        br.close();
        return strKeyPEM;
    }

    /**
     * Constructs a private key (RSA) from the given file
     *
     * @param filename PEM Private Key
     * @return RSA Private Key
     * @throws IOException
     * @throws GeneralSecurityException
     */
    //public  RSAPrivateKey getPrivateKey(String filename) throws IOException, GeneralSecurityException {
    public PrivateKey getPrivateKey(String filename) throws IOException, GeneralSecurityException {
        String privateKeyPEM = getKey(filename);
        return getPrivateKeyFromString(privateKeyPEM);
    }

    /**
     * Constructs a private key (RSA) from the given string
     *
     * @param key PEM Private Key
     * @return RSA Private Key
     * @throws IOException
     * @throws GeneralSecurityException
     */
    public PrivateKey getPrivateKeyFromString(String key) throws IOException, GeneralSecurityException {
        String privateKeyPEM = key;


        privateKeyPEM = privateKeyPEM.substring(31, privateKeyPEM.indexOf("\n-----END RSA PRIVATE KEY-----"));

        privateKeyPEM = privateKeyPEM.trim();
        java.security.Security.addProvider(
                new org.bouncycastle.jce.provider.BouncyCastleProvider()
        );
        // Base64 decode data
        byte[] encoded = Base64.decodeBase64(privateKeyPEM);
        PKCS8EncodedKeySpec spec =
                new PKCS8EncodedKeySpec(encoded);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(spec);
    }

    /**
     * Constructs a public key (RSA) from the given file
     *
     * @param filename PEM Public Key
     * @return RSA Public Key
     * @throws IOException
     * @throws GeneralSecurityException
     */
    public PublicKey getPublicKey(String filename) throws IOException, GeneralSecurityException {
        String publicKeyPEM = getKey(filename);
        return getPublicKeyFromString(publicKeyPEM);
    }

    /**
     * Constructs a public key (RSA) from the given string
     *
     * @param key PEM Public Key
     * @return RSA Public Key
     * @throws IOException
     * @throws GeneralSecurityException
     */
    public PublicKey getPublicKeyFromString(String key) throws IOException, GeneralSecurityException {
        String publicKeyPEM = key;

        publicKeyPEM = publicKeyPEM.substring(28, publicKeyPEM.indexOf("\n-----END CERTIFICATE-----"));
        System.out.println(publicKeyPEM);
        // Base64 decode data
        publicKeyPEM = publicKeyPEM.trim();
        java.security.Security.addProvider(
                new org.bouncycastle.jce.provider.BouncyCastleProvider()
        );
        byte[] encoded = Base64.decodeBase64(publicKeyPEM);

        X509EncodedKeySpec spec =
                new X509EncodedKeySpec(encoded);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePublic(spec);
    }

    /**
     * @param privateKey
     * @param message
     * @return
     * @throws NoSuchAlgorithmException
     * @throws InvalidKeyException
     * @throws SignatureException
     * @throws UnsupportedEncodingException
     */
    public String sign(PrivateKey privateKey, String message) throws NoSuchAlgorithmException, InvalidKeyException, SignatureException, UnsupportedEncodingException {
        Signature sign = Signature.getInstance("SHA1withRSA");
        sign.initSign(privateKey);
        sign.update(message.getBytes("UTF-8"));
        return new String(Base64.encodeBase64(sign.sign()), "UTF-8");
    }

    /**
     * @param publicKey
     * @param message
     * @param signature
     * @return
     * @throws SignatureException
     * @throws NoSuchAlgorithmException
     * @throws UnsupportedEncodingException
     * @throws InvalidKeyException
     */
    public boolean verify(PublicKey publicKey, String message, String signature) throws SignatureException, NoSuchAlgorithmException, UnsupportedEncodingException, InvalidKeyException {
        Signature sign = Signature.getInstance("SHA1withRSA");
        sign.initVerify(publicKey);
        sign.update(message.getBytes("UTF-8"));
        return sign.verify(Base64.decodeBase64(signature.getBytes("UTF-8")));
    }

    /**
     * Encrypts the text with the public key (RSA)
     *
     * @param rawText   Text to be encrypted
     * @param publicKey
     * @return
     * @throws IOException
     * @throws GeneralSecurityException
     */
    public String encrypt(String rawText, PrivateKey privateKey) throws IOException, GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.ENCRYPT_MODE, privateKey);
        return Base64.encodeBase64String(cipher.doFinal(rawText.getBytes("UTF-8")));
    }

    public String encrypt1(Document doc, PrivateKey privateKey) throws IOException, GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.ENCRYPT_MODE, privateKey);
        return Base64.encodeBase64String(cipher.doFinal(doc.toString().getBytes("UTF-8")));
    }

    /**
     * Decrypts the text with the private key (RSA)
     *
     * @param cipherText Text to be decrypted
     * @param privateKey
     * @return Decrypted text (Base64 encoded)
     * @throws IOException
     * @throws GeneralSecurityException
     */
    public String decrypt(String cipherText, PublicKey publicKey) throws IOException, GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.DECRYPT_MODE, publicKey);
        return new String(cipher.doFinal(Base64.decodeBase64(cipherText)), "UTF-8");
    }
}
