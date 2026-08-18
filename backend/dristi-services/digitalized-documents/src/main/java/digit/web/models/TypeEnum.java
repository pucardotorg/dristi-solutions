package digit.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Type of the document
 */
public enum TypeEnum {

    PLEA,

    EXAMINATION_OF_ACCUSED,

    MEDIATION

}
