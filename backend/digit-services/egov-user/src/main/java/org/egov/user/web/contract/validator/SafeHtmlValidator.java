package org.egov.user.web.contract.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class SafeHtmlValidator implements ConstraintValidator<SafeHtml, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true;
        }
        return Jsoup.isValid(value, Safelist.none());
    }
}