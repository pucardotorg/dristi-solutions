package org.egov.user.repository.builder;

import org.egov.user.domain.model.UserSearchCriteria;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class UserTypeQueryBuilderTest {

    private final UserTypeQueryBuilder queryBuilder = new UserTypeQueryBuilder();

    @Test
    public void fuzzyNameIsBoundAsParameterNotConcatenated() {
        UserSearchCriteria criteria = UserSearchCriteria.builder()
                .tenantId("pg")
                .fuzzyLogic(true)
                .name("zzq%' OR '1'='1' -- ")
                .build();
        List<Object> values = new ArrayList<>();

        String query = queryBuilder.getQuery(criteria, values);

        assertTrue(query.contains(" userdata.name like ?"));
        assertFalse(query.contains("OR '1'='1'"));
        assertTrue(values.contains("%zzq%' OR '1'='1' --%"));
    }

    @Test
    public void benignFuzzySearchKeepsLikeSemantics() {
        UserSearchCriteria criteria = UserSearchCriteria.builder()
                .tenantId("pg")
                .fuzzyLogic(true)
                .name("Ravi")
                .build();
        List<Object> values = new ArrayList<>();

        String query = queryBuilder.getQuery(criteria, values);

        assertTrue(query.contains(" userdata.name like ?"));
        assertEquals("%Ravi%", values.get(values.size() - 1));
    }

    @Test
    public void validSortColumnAndDirectionAreApplied() {
        UserSearchCriteria criteria = UserSearchCriteria.builder()
                .tenantId("pg")
                .sort(Collections.singletonList("createddate desc"))
                .build();

        String query = queryBuilder.getQuery(criteria, new ArrayList<>());

        assertTrue(query.endsWith(" ORDER BY userdata.createddate desc"));
    }

    @Test
    public void invalidSortValueFallsBackToDefaultColumn() {
        UserSearchCriteria criteria = UserSearchCriteria.builder()
                .tenantId("pg")
                .sort(Collections.singletonList("name, (SELECT CASE WHEN (1=2) THEN 1 ELSE 1/0 END)"))
                .build();

        String query = queryBuilder.getQuery(criteria, new ArrayList<>());

        assertTrue(query.endsWith(" ORDER BY userdata.name"));
        assertFalse(query.contains("SELECT CASE"));
    }

    @Test
    public void allNonSensitiveSelectColumnsAreSortable() {
        for (String column : new String[] { "id", "uuid", "tenantid", "username", "name", "gender", "type",
                "active", "title", "salutation", "mobilenumber", "alternatemobilenumber", "altcontactnumber",
                "emailid", "locale", "dob", "pwdexpirydate", "version", "guardian", "guardianrelation",
                "accountlocked", "accountlockeddate", "bloodgroup", "identificationmark", "createddate",
                "lastmodifieddate", "createdby", "lastmodifiedby", "haspassword", "passwordpromptdismissed" }) {
            UserSearchCriteria criteria = UserSearchCriteria.builder()
                    .tenantId("pg")
                    .sort(Collections.singletonList(column))
                    .build();
            String query = queryBuilder.getQuery(criteria, new ArrayList<>());
            assertTrue(query.endsWith(" ORDER BY userdata." + column), "expected sortable column: " + column);
        }
    }

    @Test
    public void sensitiveColumnsAreNotSortable() {
        for (String column : new String[] { "password", "pan", "aadhaarnumber", "signature", "photo" }) {
            UserSearchCriteria criteria = UserSearchCriteria.builder()
                    .tenantId("pg")
                    .sort(Collections.singletonList(column))
                    .build();
            String query = queryBuilder.getQuery(criteria, new ArrayList<>());
            assertTrue(query.endsWith(" ORDER BY userdata.name"));
        }
    }

}
