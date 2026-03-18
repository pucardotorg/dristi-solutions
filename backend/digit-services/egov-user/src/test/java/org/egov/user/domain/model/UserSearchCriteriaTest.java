package org.egov.user.domain.model;

import org.egov.user.domain.exception.InvalidUserSearchCriteriaException;
import org.junit.jupiter.api.Test;

// FIX: Updated to JUnit 5 Assertions
import static org.junit.jupiter.api.Assertions.assertThrows;

public class UserSearchCriteriaTest {

    @Test
    public void test_should_not_throw_exception_when_search_criteria_is_valid() {
        final UserSearchCriteria searchCriteria = UserSearchCriteria.builder()
                .tenantId("tenantId")
                .userName("greenfish424")
                .build();

        // This should pass without any exception
        searchCriteria.validate(true);
    }

    @Test
    public void test_should_throw_exception_when_tenant_id_is_not_present() {
        final UserSearchCriteria searchCriteria = UserSearchCriteria.builder()
                .tenantId(null)
                .build();

        // FIX: Replacement for @Test(expected = ...)
        assertThrows(InvalidUserSearchCriteriaException.class, () -> {
            searchCriteria.validate(true);
        });
    }
}