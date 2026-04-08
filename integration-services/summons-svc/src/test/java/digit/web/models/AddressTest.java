package digit.web.models;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class AddressTest {

    @Test
    public void shouldFormatAddressWhenAllFieldsPresent() {
        Address address = Address.builder()
                .locality("Locality")
                .city("City")
                .district("District")
                .state("State")
                .pinCode("123456")
                .build();

        String result = address.toString();

        assertEquals("Locality, City, District, State, 123456", result);
    }

    @Test
    public void shouldGracefullyHandleNullFields() {
        Address address = Address.builder()
                .city("City")
                .pinCode("123")
                .build();

        String result = address.toString();

        assertEquals("City, 123", result);
    }
}
