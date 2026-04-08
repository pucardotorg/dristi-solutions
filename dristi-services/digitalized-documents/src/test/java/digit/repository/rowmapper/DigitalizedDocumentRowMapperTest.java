package digit.repository.rowmapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.DigitalizedDocument;
import digit.web.models.Document;
import digit.web.models.TypeEnum;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.util.PGobject;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DigitalizedDocumentRowMapperTest {

    private DigitalizedDocumentRowMapper rowMapper;

    @BeforeEach
    void setUp() {
        rowMapper = new DigitalizedDocumentRowMapper(new ObjectMapper());
    }

    @Test
    void extractData_MapsSingleRow_WithJsonFields() throws Exception {
        ResultSet rs = mock(ResultSet.class);

        // One row only
        when(rs.next()).thenReturn(true, false);

        when(rs.getString("id")).thenReturn("uuid-1");
        when(rs.getString("type")).thenReturn("PLEA");
        when(rs.getString("document_number")).thenReturn("DOC-1");
        when(rs.getString("case_id")).thenReturn("CASE-1");
        when(rs.getString("case_filing_number")).thenReturn("CF-1");
        when(rs.getString("status")).thenReturn("IN_PROGRESS");
        when(rs.getString("tenant_id")).thenReturn("t1");
        when(rs.getString("court_id")).thenReturn("court");
        when(rs.getString("order_item_id")).thenReturn("item1");
        when(rs.getString("order_number")).thenReturn("order-1");

        when(rs.getString("created_by")).thenReturn("creator");
        when(rs.getLong("created_time")).thenReturn(123L);
        when(rs.getString("last_modified_by")).thenReturn("modifier");
        when(rs.getLong("last_modified_time")).thenReturn(0L);
        when(rs.wasNull()).thenReturn(true); // last_modified_time was null

        // Prepare JSONB fields via PGobject
        PGobject plea = pgjson("{}");
        PGobject eoa = pgjson("{}");
        PGobject mediation = pgjson("{}");
        PGobject addl = pgjson("{\"key\":\"val\"}");
        PGobject docs = pgjson("[{\"id\":\"d1\",\"fileStore\":\"fs1\",\"isActive\":true}]");

        when(rs.getObject("plea_details")).thenReturn(plea);
        when(rs.getObject("examination_of_accused_details")).thenReturn(eoa);
        when(rs.getObject("mediation_details")).thenReturn(mediation);
        when(rs.getObject("additional_details")).thenReturn(addl);
        when(rs.getObject("documents")).thenReturn(docs);

        List<DigitalizedDocument> out = rowMapper.extractData(rs);

        assertEquals(1, out.size());
        DigitalizedDocument d = out.get(0);
        assertEquals("uuid-1", d.getId());
        assertEquals(TypeEnum.PLEA, d.getType());
        assertEquals("DOC-1", d.getDocumentNumber());
        assertEquals("CASE-1", d.getCaseId());
        assertEquals("CF-1", d.getCaseFilingNumber());
        assertEquals("t1", d.getTenantId());
        assertEquals("court", d.getCourtId());
        assertEquals("item1", d.getOrderItemId());
        assertEquals("order-1", d.getOrderNumber());

        assertNotNull(d.getAuditDetails());
        assertEquals("creator", d.getAuditDetails().getCreatedBy());
        assertEquals(123L, d.getAuditDetails().getCreatedTime());
        assertEquals("modifier", d.getAuditDetails().getLastModifiedBy());
        assertNull(d.getAuditDetails().getLastModifiedTime()); // due to wasNull()

        // additionalDetails
        assertNotNull(d.getAdditionalDetails());
        assertEquals("val", ((Map<?,?>) d.getAdditionalDetails()).get("key"));

        // documents
        assertNotNull(d.getDocuments());
        assertEquals(1, d.getDocuments().size());
        Document doc = d.getDocuments().get(0);
        assertEquals("d1", doc.getId());
        assertEquals("fs1", doc.getFileStore());
        assertTrue(Boolean.TRUE.equals(doc.getIsActive()));
    }

    @Test
    void extractData_WithNullJsonFields_DoesNotFail() throws Exception {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, false);

        when(rs.getString("id")).thenReturn("uuid-2");
        when(rs.getString("type")).thenReturn("MEDIATION");
        when(rs.getString("document_number")).thenReturn("DOC-2");
        when(rs.getString("case_id")).thenReturn("C2");
        when(rs.getString("case_filing_number")).thenReturn("CF2");
        when(rs.getString("status")).thenReturn("NEW");
        when(rs.getString("tenant_id")).thenReturn("t2");
        when(rs.getString("court_id")).thenReturn("court2");
        when(rs.getString("order_item_id")).thenReturn(null);
        when(rs.getString("order_number")).thenReturn(null);

        when(rs.getString("created_by")).thenReturn("c2");
        when(rs.getLong("created_time")).thenReturn(222L);
        when(rs.getString("last_modified_by")).thenReturn(null);
        when(rs.getLong("last_modified_time")).thenReturn(0L);
        when(rs.wasNull()).thenReturn(true);

        // All JSONB fields null
        when(rs.getObject(anyString())).thenReturn(null);

        List<DigitalizedDocument> out = rowMapper.extractData(rs);
        assertEquals(1, out.size());
        assertEquals("uuid-2", out.get(0).getId());
        assertNull(out.get(0).getDocuments());
        assertNull(out.get(0).getAdditionalDetails());
    }

    @Test
    void extractData_WhenResultSetThrows_WrapsInCustomException() throws Exception {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenThrow(new SQLException("boom"));

        CustomException ex = assertThrows(CustomException.class, () -> rowMapper.extractData(rs));
        assertEquals("ROW_MAPPER_EXCEPTION", ex.getCode());
    }

    private static PGobject pgjson(String json) throws SQLException {
        PGobject o = new PGobject();
        o.setType("jsonb");
        o.setValue(json);
        return o;
    }
}
