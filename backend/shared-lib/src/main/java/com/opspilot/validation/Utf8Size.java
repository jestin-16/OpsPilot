package com.opspilot.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.nio.charset.StandardCharsets;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/** BCrypt's limit is measured in UTF-8 bytes, not Java characters. */
@Target(FIELD)
@Retention(RUNTIME)
@Constraint(validatedBy = Utf8Size.Validator.class)
public @interface Utf8Size {
    int max() default 72;
    String message() default "Password must be 72 UTF-8 bytes or fewer";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<Utf8Size, String> {
        private int max;
        @Override public void initialize(Utf8Size constraint) { max = constraint.max(); }
        @Override public boolean isValid(String value, ConstraintValidatorContext context) {
            return value == null || value.getBytes(StandardCharsets.UTF_8).length <= max;
        }
    }
}
