package digit.repository.rowmapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.Bail;
import digit.web.models.Document;
import digit.web.models.Surety;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.postgresql.util.PGobject;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BailRowMapperTest {

    private ObjectMapper objectMapper;
    private BailRowMapper bailRowMapper;
    private ResultSet rs;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        bailRowMapper = new BailRowMapper(objectMapper);
        rs = mock(ResultSet.class);
    }

    @Test
    void testExtractData_WithSingleRowNoDocumentsOrSureties() throws Exception {
        when(rs.next()).thenReturn(true, false);
        when(rs.getString("id")).thenReturn("bail1");
        when(rs.getString("bailCreatedBy")).thenReturn("creator");
        when(rs.getLong("bailCreatedTime")).thenReturn(123456L);
        when(rs.getString("bailLastModifiedBy")).thenReturn("modifier");
        when(rs.getLong("bailLastModifiedTime")).thenReturn(123457L);
        when(rs.getString("bailTenantId")).thenReturn("tenant1");
        when(rs.getString("caseId")).thenReturn("case123");
        when(rs.getDouble("bailAmount")).thenReturn(5000.0);
        when(rs.getString("bailType")).thenReturn("TYPE1");  // Ensure BailTypeEnum has this value or mock accordingly
        when(rs.getString("litigantId")).thenReturn("litigant1");
        when(rs.getString("litigantName")).thenReturn("John Doe");
        when(rs.getString("litigantFatherName")).thenReturn("Father Name");
        when(rs.getBoolean("litigantSigned")).thenReturn(true);
        when(rs.getString("litigantMobileNumber")).thenReturn("1234567890");
        when(rs.getString("shortenedUrl")).thenReturn("http://short.url");
        when(rs.getString("bailStatus")).thenReturn("ACTIVE");
        when(rs.getString("courtId")).thenReturn("court1");
        when(rs.getString("caseTitle")).thenReturn("Case Title");
        when(rs.getString("caseNumber")).thenReturn("1234");
        when(rs.getString("cnrNumber")).thenReturn("cnr123");
        when(rs.getString("filingNumber")).thenReturn("filing123");
        when(rs.getString("caseType")).thenReturn("CRIMINAL");
        when(rs.getString("bailId")).thenReturn("bailid1");
        when(rs.getBoolean("bailIsActive")).thenReturn(true);

        when(rs.getObject("bailAdditionalDetails")).thenReturn(null);
        when(rs.getString("bailDocId")).thenReturn(null);
        when(rs.getString("suretyId")).thenReturn(null);

        List<Bail> bailList = bailRowMapper.extractData(rs);

        assertNotNull(bailList);
        assertEquals(1, bailList.size());

        Bail bail = bailList.get(0);
        assertEquals("bail1", bail.getId());
        assertEquals(0, bail.getDocuments().size());
        assertEquals(0, bail.getSureties().size());
    }

    @Test
    void testExtractData_WithBailDocument() throws Exception {
        when(rs.next()).thenReturn(true, false);

        when(rs.getString("id")).thenReturn("bail1");
        // (Set required Bail fields here, as above)
        when(rs.getString("bailCreatedBy")).thenReturn("creator");
        when(rs.getLong("bailCreatedTime")).thenReturn(123456L);
        when(rs.getString("bailLastModifiedBy")).thenReturn("modifier");
        when(rs.getLong("bailLastModifiedTime")).thenReturn(123457L);
        when(rs.getString("bailTenantId")).thenReturn("tenant1");
        when(rs.getString("caseId")).thenReturn("case123");
        when(rs.getDouble("bailAmount")).thenReturn(5000.0);
        when(rs.getString("bailType")).thenReturn("TYPE1");
        when(rs.getString("litigantId")).thenReturn("litigant1");
        when(rs.getString("litigantName")).thenReturn("John Doe");
        when(rs.getString("litigantFatherName")).thenReturn("Father Name");
        when(rs.getBoolean("litigantSigned")).thenReturn(true);
        when(rs.getString("litigantMobileNumber")).thenReturn("1234567890");
        when(rs.getString("shortenedUrl")).thenReturn("http://short.url");
        when(rs.getString("bailStatus")).thenReturn("ACTIVE");
        when(rs.getString("courtId")).thenReturn("court1");
        when(rs.getString("caseTitle")).thenReturn("Case Title");
        when(rs.getString("caseNumber")).thenReturn("1234");
        when(rs.getString("cnrNumber")).thenReturn("cnr123");
        when(rs.getString("filingNumber")).thenReturn("filing123");
        when(rs.getString("caseType")).thenReturn("CRIMINAL");
        when(rs.getString("bailId")).thenReturn("bailid1");
        when(rs.getBoolean("bailIsActive")).thenReturn(true);

        when(rs.getObject("bailAdditionalDetails")).thenReturn(null);

        // Bail document present
        when(rs.getString("bailDocId")).thenReturn("doc1");
        when(rs.getString("bailDocCreatedBy")).thenReturn("doccreator");
        when(rs.getString("bailDocLastModifiedBy")).thenReturn("docmodifier");
        when(rs.getLong("bailDocCreatedTime")).thenReturn(111111L);
        when(rs.getLong("bailDocLastModifiedTime")).thenReturn(111112L);
        when(rs.getString("bailDocTenantId")).thenReturn("tenant1");
        when(rs.getString("bailDocFilestoreId")).thenReturn("filestore1");
        when(rs.getString("bailDocUid")).thenReturn("uid1");
        when(rs.getString("bailDocName")).thenReturn("document1");
        when(rs.getString("bailDocType")).thenReturn("TYPE1");
        when(rs.getBoolean("bailDocIsActive")).thenReturn(true);
        when(rs.getObject("bailDocAdditionalDetails")).thenReturn(null);

        // No surety
        when(rs.getString("suretyId")).thenReturn(null);

        List<Bail> bailList = bailRowMapper.extractData(rs);
        assertNotNull(bailList);
        assertEquals(1, bailList.size());

        Bail bail = bailList.get(0);
        assertEquals(1, bail.getDocuments().size());

        Document document = bail.getDocuments().get(0);
        assertEquals("doc1", document.getId());
        assertEquals("document1", document.getDocumentName());
    }

    @Test
    void testExtractData_WithSuretyAndSuretyDocument() throws Exception {
        when(rs.next()).thenReturn(true, false);

        // Setup Bail fields as before
        when(rs.getString("id")).thenReturn("bail1");
        when(rs.getString("bailCreatedBy")).thenReturn("creator");
        when(rs.getLong("bailCreatedTime")).thenReturn(123456L);
        when(rs.getString("bailLastModifiedBy")).thenReturn("modifier");
        when(rs.getLong("bailLastModifiedTime")).thenReturn(123457L);
        when(rs.getString("bailTenantId")).thenReturn("tenant1");
        when(rs.getString("caseId")).thenReturn("case123");
        when(rs.getDouble("bailAmount")).thenReturn(5000.0);
        when(rs.getString("bailType")).thenReturn("TYPE1");
        when(rs.getString("litigantId")).thenReturn("litigant1");
        when(rs.getString("litigantName")).thenReturn("John Doe");
        when(rs.getString("litigantFatherName")).thenReturn("Father Name");
        when(rs.getBoolean("litigantSigned")).thenReturn(true);
        when(rs.getString("litigantMobileNumber")).thenReturn("1234567890");
        when(rs.getString("shortenedUrl")).thenReturn("http://short.url");
        when(rs.getString("bailStatus")).thenReturn("ACTIVE");
        when(rs.getString("courtId")).thenReturn("court1");
        when(rs.getString("caseTitle")).thenReturn("Case Title");
        when(rs.getString("caseNumber")).thenReturn("1234");
        when(rs.getString("cnrNumber")).thenReturn("cnr123");
        when(rs.getString("filingNumber")).thenReturn("filing123");
        when(rs.getString("caseType")).thenReturn("CRIMINAL");
        when(rs.getString("bailId")).thenReturn("bailid1");
        when(rs.getBoolean("bailIsActive")).thenReturn(true);

        when(rs.getObject("bailAdditionalDetails")).thenReturn(null);
        when(rs.getString("bailDocId")).thenReturn(null);

        // Surety present
        when(rs.getString("suretyId")).thenReturn("surety1");
        when(rs.getString("suretyTenantId")).thenReturn("tenant1");
        when(rs.getString("suretyName")).thenReturn("Surety Name");
        when(rs.getString("suretyFatherName")).thenReturn("Surety Father");
        when(rs.getString("suretyMobile")).thenReturn("9876543210");
        when(rs.getString("suretyEmail")).thenReturn("surety@example.com");
        when(rs.getBoolean("suretySigned")).thenReturn(true);
        when(rs.getObject("suretyApproved")).thenReturn(true);
        when(rs.getObject("suretyIsActive")).thenReturn(true);
        when(rs.getObject("suretyAddress")).thenReturn(null);
        when(rs.getObject("suretyAdditionalDetails")).thenReturn(null);

        // Surety document present
        when(rs.getString("suretyDocId")).thenReturn("sdoc1");
        when(rs.getString("suretyDocCreatedBy")).thenReturn("sdcreator");
        when(rs.getString("suretyDocLastModifiedBy")).thenReturn("sdmodifier");
        when(rs.getLong("suretyDocCreatedTime")).thenReturn(222222L);
        when(rs.getLong("suretyDocLastModifiedTime")).thenReturn(222223L);
        when(rs.getString("suretyDocTenantId")).thenReturn("tenant1");
        when(rs.getString("suretyDocFilestoreId")).thenReturn("filestore2");
        when(rs.getString("suretyDocUid")).thenReturn("suid1");
        when(rs.getString("suretyDocName")).thenReturn("suretydoc");
        when(rs.getString("suretyDocType")).thenReturn("TYPE2");
        when(rs.getBoolean("suretyDocIsActive")).thenReturn(true);
        when(rs.getObject("suretyDocAdditionalDetails")).thenReturn(null);

        List<Bail> bailList = bailRowMapper.extractData(rs);

        assertNotNull(bailList);
        assertEquals(1, bailList.size());

        Bail bail = bailList.get(0);
        assertEquals(1, bail.getSureties().size());

        Surety surety = bail.getSureties().get(0);
        assertEquals("surety1", surety.getId());
        assertEquals(1, surety.getDocuments().size());

        Document suretyDoc = surety.getDocuments().get(0);
        assertEquals("sdoc1", suretyDoc.getId());
        assertEquals("suretydoc", suretyDoc.getDocumentName());
    }

    @Test
    void testExtractData_ExceptionHandling() throws Exception {
        when(rs.next()).thenThrow(new SQLException("Simulated DB error"));

        CustomException ex = assertThrows(CustomException.class, () -> bailRowMapper.extractData(rs));
        assertTrue(ex.getMessage().contains("Error in BailRowMapper"));
    }
}

