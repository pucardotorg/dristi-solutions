package org.egov.user.web.contract.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = SafeHtmlValidator.class)
@Documented
public @interface SafeHtml {
    String message() default "Potential XSS detected: Input contains unsafe HTML content";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}