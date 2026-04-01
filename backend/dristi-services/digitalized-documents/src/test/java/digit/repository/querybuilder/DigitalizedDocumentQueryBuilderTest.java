package digit.repository.querybuilder;

import digit.web.models.DigitalizedDocumentSearchCriteria;
import digit.web.models.Order;
import digit.web.models.Pagination;
import digit.web.models.TypeEnum;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DigitalizedDocumentQueryBuilderTest {

    private DigitalizedDocumentQueryBuilder queryBuilder;

    @BeforeEach
    void setUp() {
        queryBuilder = new DigitalizedDocumentQueryBuilder();
    }

    @Test
    void testGetTotalCountQuery_WrapsBaseQuery() {
        String base = "SELECT * FROM digitalized_document dd WHERE dd.tenant_id = ?";
        String result = queryBuilder.getTotalCountQuery(base);
        assertEquals("SELECT COUNT(*) FROM (" + base + ") total_result", result);
    }

    @Test
    void testAddPaginationQuery_AppendsLimitOffsetAndBindsParams() {
        String base = "SELECT * FROM digitalized_document dd";
        Pagination pagination = Pagination.builder().limit(10d).offSet(5d).build();
        List<Object> ps = new ArrayList<>();
        List<Integer> argTypes = new ArrayList<>();

        String result = queryBuilder.addPaginationQuery(base, pagination, ps, argTypes);

        assertEquals(base + " LIMIT ? OFFSET ?", result);
        assertEquals(2, ps.size());
        assertEquals(10d, ps.get(0));
        assertEquals(5d, ps.get(1));
        assertEquals(2, argTypes.size());
        assertEquals(Types.DOUBLE, argTypes.get(0));
        assertEquals(Types.DOUBLE, argTypes.get(1));
    }

    @Test
    void testAddOrderByQuery_DefaultWhenPaginationInvalid_NullPagination() {
        String base = "SELECT * FROM digitalized_document dd";
        String result = queryBuilder.addOrderByQuery(base, null);
        assertEquals(base + " ORDER BY dd.created_time DESC ", result);
    }

    @Test
    void testAddOrderByQuery_DefaultWhenSortOrOrderMissing() {
        String base = "SELECT * FROM digitalized_document dd";
        Pagination p1 = Pagination.builder().sortBy(null).order(null).build();
        String r1 = queryBuilder.addOrderByQuery(base, p1);
        assertEquals(base + " ORDER BY dd.created_time DESC ", r1);

        Pagination p2 = Pagination.builder().sortBy("created_time").order(null).build();
        String r2 = queryBuilder.addOrderByQuery(base, p2);
        assertEquals(base + " ORDER BY dd.created_time DESC ", r2);
    }

    @Test
    void testAddOrderByQuery_WithValidPagination_UsesProvidedSortAndOrder() {
        String base = "SELECT * FROM digitalized_document dd";
        Pagination pagination = Pagination.builder()
                .sortBy("created_time")
                .order(Order.ASC)
                .build();
        String result = queryBuilder.addOrderByQuery(base, pagination);
        assertEquals(base + " ORDER BY dd.created_time ASC ", result);
    }

    @Test
    void testGetDigitalizedDocumentSearchQuery_BuildsWhereAndParams() {
        DigitalizedDocumentSearchCriteria criteria = DigitalizedDocumentSearchCriteria.builder()
                .id("ID1")
                .documentNumber("DOC-1")
                .type(TypeEnum.PLEA)
                .tenantId("tenant1")
                .caseId("CASE-1")
                .caseFilingNumber("CF-1")
                .build();

        List<Object> ps = new ArrayList<>();
        List<Integer> types = new ArrayList<>();

        String query = queryBuilder.getDigitalizedDocumentSearchQuery(criteria, ps, types);

        assertTrue(query.startsWith("SELECT dd.id as id"));
        assertTrue(query.contains(" FROM digitalized_document dd"));
        assertTrue(query.contains(" WHERE "));
        assertTrue(query.contains("dd.id = ?"));
        assertTrue(query.contains("dd.document_number = ?"));
        assertTrue(query.contains("dd.type = ?"));
        assertTrue(query.contains("dd.tenant_id = ?"));
        assertTrue(query.contains("dd.case_id = ?"));
        assertTrue(query.contains("dd.case_filing_number = ?"));

        // Ensure parameters are in expected order
        assertEquals(6, ps.size());
        assertEquals("ID1", ps.get(0));
        assertEquals("DOC-1", ps.get(1));
        assertEquals("PLEA", ps.get(2));
        assertEquals("tenant1", ps.get(3));
        assertEquals("CASE-1", ps.get(4));
        assertEquals("CF-1", ps.get(5));

        assertEquals(6, types.size());
        types.forEach(t -> assertEquals(Types.VARCHAR, t));
    }

    @Test
    void testGetDigitalizedDocumentSearchQuery_WhenCriteriaNull_ThrowsCustomException() {
        List<Object> ps = new ArrayList<>();
        List<Integer> types = new ArrayList<>();
        CustomException ex = assertThrows(CustomException.class, () ->
                queryBuilder.getDigitalizedDocumentSearchQuery(null, ps, types));
        assertEquals("DIGITALIZED_DOCUMENT_SEARCH_QUERY_EXCEPTION", ex.getCode());
    }

    @Test
    void testGetDigitalizedDocumentExistQuery_BuildsWhereAndParams() {
        DigitalizedDocumentSearchCriteria criteria = DigitalizedDocumentSearchCriteria.builder()
                .id("ID1")
                .documentNumber("DOC-1")
                .type(TypeEnum.MEDIATION)
                .tenantId("tenant1")
                .build();

        List<Object> ps = new ArrayList<>();
        List<Integer> types = new ArrayList<>();

        String query = queryBuilder.getDigitalizedDocumentExistQuery(criteria, ps, types);

        assertTrue(query.startsWith("SELECT COUNT(*) FROM digitalized_document dd"));
        assertTrue(query.contains(" WHERE "));
        assertTrue(query.contains("dd.id = ?"));
        assertTrue(query.contains("dd.document_number = ?"));
        assertTrue(query.contains("dd.type = ?"));
        assertTrue(query.contains("dd.tenant_id = ?"));

        assertEquals(4, ps.size());
        assertEquals("ID1", ps.get(0));
        assertEquals("DOC-1", ps.get(1));
        assertEquals("MEDIATION", ps.get(2));
        assertEquals("tenant1", ps.get(3));

        assertEquals(4, types.size());
        types.forEach(t -> assertEquals(Types.VARCHAR, t));
    }
}
