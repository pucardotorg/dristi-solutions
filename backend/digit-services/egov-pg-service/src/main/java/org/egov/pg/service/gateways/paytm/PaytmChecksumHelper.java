package org.egov.pg.service.gateways.paytm;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.TreeMap;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

final class PaytmChecksumHelper {

    private static final String AES_CBC_PKCS5 = "AES/CBC/PKCS5Padding";
    private static final String AES = "AES";
    private static final String IV = "@@@@&&&&####$$$$";
    private static final String SALT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int SALT_LENGTH = 4;

    private PaytmChecksumHelper() {
    }

    static String generateChecksum(String merchantKey, TreeMap<String, String> params) throws GeneralSecurityException {
        String payload = buildPayload(params);
        String salt = randomSalt();
        String finalString = payload + "|" + salt;
        String hash = sha256(finalString) + salt;
        return encrypt(hash, merchantKey);
    }

    private static String buildPayload(TreeMap<String, String> params) {
        StringBuilder builder = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String value = entry.getValue() == null ? "" : entry.getValue();
            if (containsForbidden(value)) {
                value = "";
            }
            if (!first) {
                builder.append('|');
            }
            builder.append(value);
            first = false;
        }
        return builder.toString();
    }

    private static boolean containsForbidden(String value) {
        return value.contains("REFUND") || value.contains("|");
    }

    private static String randomSalt() {
        SecureRandom random = new SecureRandom();
        StringBuilder builder = new StringBuilder(SALT_LENGTH);
        for (int i = 0; i < SALT_LENGTH; i++) {
            builder.append(SALT_CHARS.charAt(random.nextInt(SALT_CHARS.length())));
        }
        return builder.toString();
    }

    private static String sha256(String input) throws GeneralSecurityException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder(hash.length * 2);
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    private static String encrypt(String value, String key) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(AES_CBC_PKCS5);
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), AES);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, new IvParameterSpec(IV.getBytes(StandardCharsets.UTF_8)));
        return Base64.getEncoder().encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }
}