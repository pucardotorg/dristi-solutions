package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Component
public class MaskUtil {
    public String maskData(String input, String regexPattern) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        Pattern pattern = Pattern.compile(regexPattern);
        Matcher matcher = pattern.matcher(input);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            int length = matcher.group().length();
            String masked = new String(new char[length]).replace('\0', '*');
            matcher.appendReplacement(sb, masked);
        }
        matcher.appendTail(sb);

        return sb.toString();
    }

    public void maskPII(Object obj) {
        if (obj == null) return;

        Field[] fields = obj.getClass().getDeclaredFields();

        for (Field field : fields) {
            field.setAccessible(true);
            try {
                Object value = field.get(obj);
                if (value instanceof String) {
                    String strValue = (String) value;
                    String fieldName = field.getName().toLowerCase();

                    if (fieldName.toLowerCase().contains("email")) {
                        field.set(obj, maskEmail(strValue));
                    } else if (fieldName.toLowerCase().contains("name")) {
                        field.set(obj, maskName(strValue)); // Show first character
                    } else if (fieldName.toLowerCase().contains("mobile") || fieldName.contains("phone")) {
                        field.set(obj, maskMobile(strValue));
                    } else if (fieldName.toLowerCase().contains("aadhar")) {
                        field.set(obj, maskAadhaar(strValue));
                    }
                }
            } catch (Exception e) {
                log.error("Exception occurred while processing field: {} - {}", field.getName(), e.getMessage());
            }
        }
    }

    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;

        String[] parts = email.split("@", 2);
        return parts[0].length() <= 3
                ? "*".repeat(parts[0].length()) + "@" + parts[1]
                : parts[0].substring(0, 3) + "*".repeat(parts[0].length() - 3) + "@" + parts[1];
    }


    public String maskMobile(String mobile) {
        if (mobile == null) return mobile;
        return mobile.substring(0, 2) + "******" + mobile.substring(mobile.length() - 2);
    }

    public String maskAadhaar(String aadhar) {
        if (aadhar == null || aadhar.length() < 12) return aadhar;
        return "********" + aadhar.substring(aadhar.length() - 4);
    }
    public String maskName(String name) {
        if (name == null || name.isEmpty()) return name;

        return Arrays.stream(name.split("\\s+")) // Split by spaces
                .map(word -> word.charAt(0) + "*".repeat(word.length() - 1)) // Keep first letter, mask rest
                .collect(Collectors.joining(" ")); // Join back with spaces
    }
}
