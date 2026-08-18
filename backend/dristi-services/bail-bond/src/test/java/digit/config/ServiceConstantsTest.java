package digit.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class ServiceConstantsTest {

    @Test
    void testSomeKeyConstants() {
        assertThat(ServiceConstants.EXTERNAL_SERVICE_EXCEPTION)
                .isEqualTo("External Service threw an Exception: ");

        assertThat(ServiceConstants.DOB_FORMAT_Y_M_D)
                .isEqualTo("yyyy-MM-dd");

        assertThat(ServiceConstants.SUCCESSFUL)
                .isEqualTo("successful");

        assertThat(ServiceConstants.BAIL_BOND_PDF_NAME)
                .isEqualTo("BailBond.pdf");

        assertThat(ServiceConstants.ADVOCATE_ROLE)
                .isEqualTo("ADVOCATE_ROLE");

        assertThat(ServiceConstants.DATE_PATTERN)
                .isEqualTo("dd.MM.yyyy");
    }
}
