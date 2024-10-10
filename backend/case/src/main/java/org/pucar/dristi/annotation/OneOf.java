package org.pucar.dristi.annotation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import org.pucar.dristi.validators.OneOfValidator;

import java.lang.annotation.*;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = OneOfValidator.class)
@Documented
public @interface OneOf {

    String message() default "One of caseId, filingNumber, or cnrNumber must be provided";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
