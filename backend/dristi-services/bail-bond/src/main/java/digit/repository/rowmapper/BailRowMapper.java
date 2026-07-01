package digit.repository.rowmapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.*;

@Slf4j
@Component
public class BailRowMapper implements ResultSetExtractor<List<Bail>> {

    private final ObjectMapper objectMapper;

    @Autowired
    public BailRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public List<Bail> extractData(ResultSet rs) {
        Map<String, Bail> bailMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                String id = rs.getString("id");

                Bail bail = bailMap.get(id);
                if (bail == null) {
                    AuditDetails auditDetails = AuditDetails.builder()
                            .createdBy(rs.getString("bailCreatedBy"))
                            .createdTime(rs.getLong("bailCreatedTime"))
                            .lastModifiedBy(rs.getString("bailLastModifiedBy"))
                            .lastModifiedTime(rs.getLong("bailLastModifiedTime"))
                            .build();

                    bail = Bail.builder()
                            .id(id)
                            .tenantId(rs.getString("bailTenantId"))
                            .caseId(rs.getString("caseId"))
                            .bailAmount(rs.getDouble("bailAmount"))
                            .bailType(Bail.BailTypeEnum.fromValue(rs.getString("bailType")))
                            .litigantId(rs.getString("litigantId"))
                            .litigantName(rs.getString("litigantName"))
                            .litigantFatherName(rs.getString("litigantFatherName"))
                            .litigantSigned(rs.getBoolean("litigantSigned"))
                            .litigantMobileNumber(rs.getString("litigantMobileNumber"))
                            .shortenedURL(rs.getString("shortenedUrl"))
                            .status(rs.getString("bailStatus"))
                            .courtId(rs.getString("courtId"))
                            .caseTitle(rs.getString("caseTitle"))
                            .caseNumber(rs.getString("caseNumber"))
                            .cnrNumber(rs.getString("cnrNumber"))
                            .filingNumber(rs.getString("filingNumber"))
                            .caseType(Bail.CaseTypeEnum.fromValue(rs.getString("caseType")))
                            .bailId(rs.getString("bailId"))
                            .isActive(rs.getBoolean("bailIsActive"))
                            .auditDetails(auditDetails)
                            .asUser(rs.getString("as_user"))
                            .documents(new ArrayList<>())
                            .sureties(new ArrayList<>())
                            .build();

                    // Set additionalDetails
                    PGobject pgObj = (PGobject) rs.getObject("bailAdditionalDetails");
                    if (pgObj != null) {
                        bail.setAdditionalDetails(objectMapper.readTree(pgObj.getValue()));
                    }

                    bailMap.put(id, bail);
                }

                // ⬇️ Add Bail Document
                String bailDocId = rs.getString("bailDocId");
                if (bailDocId != null) {
                    AuditDetails bailDocAuditDetails = AuditDetails.builder()
                            .createdBy(rs.getString("bailDocCreatedBy"))
                            .lastModifiedBy(rs.getString("bailDocLastModifiedBy"))
                            .createdTime(rs.getLong("bailDocCreatedTime"))
                            .lastModifiedTime(rs.getLong("bailDocLastModifiedTime"))
                            .build();

                    Document bailDoc = Document.builder()
                            .id(rs.getString("bailDocId"))
                            .tenantId(rs.getString("bailDocTenantId"))
                            .fileStore(rs.getString("bailDocFilestoreId"))
                            .documentUid(rs.getString("bailDocUid"))
                            .documentName(rs.getString("bailDocName"))
                            .documentType(rs.getString("bailDocType"))
                            .isActive(rs.getBoolean("bailDocIsActive"))
                            .auditDetails(bailDocAuditDetails)
                            .build();

                    PGobject bailDocDetails = (PGobject) rs.getObject("bailDocAdditionalDetails");
                    if (bailDocDetails != null) {
                        bailDoc.setAdditionalDetails(objectMapper.readTree(bailDocDetails.getValue()));
                    }

                    if (bail.getDocuments().stream().noneMatch(d -> d.getId().equals(bailDocId))) {
                        bail.getDocuments().add(bailDoc);
                    }
                }

                // ⬇️ Add Surety and its document
                String suretyId = rs.getString("suretyId");

                if (suretyId != null) {
                    // Check if surety is already added to the bail
                    Optional<Surety> existingSurety = bail.getSureties().stream()
                            .filter(s -> s.getId().equals(suretyId))
                            .findFirst();

                    Surety surety;

                    if (existingSurety.isPresent()) {
                        surety = existingSurety.get();
                    } else {
                        surety = Surety.builder()
                                .id(suretyId)
                                .tenantId(rs.getString("suretyTenantId"))
                                .index(rs.getInt("index"))
                                .name(rs.getString("suretyName"))
                                .fatherName(rs.getString("suretyFatherName"))
                                .mobileNumber(rs.getString("suretyMobile"))
                                .email(rs.getString("suretyEmail"))
                                .hasSigned(rs.getBoolean("suretySigned"))
                                .isApproved(rs.getObject("suretyApproved") != null ? rs.getBoolean("suretyApproved") : null)
                                .isActive(rs.getObject("suretyIsActive") != null ? rs.getBoolean("suretyIsActive") : null)
                                .documents(new ArrayList<>())
                                .build();

                        PGobject suretyAddress = (PGobject) rs.getObject("suretyAddress");
                        if (suretyAddress != null) {
                            surety.setAddress(objectMapper.readTree(suretyAddress.getValue()));
                        }

                        PGobject suretyAdditionalDetails = (PGobject) rs.getObject("suretyAdditionalDetails");
                        if (suretyAdditionalDetails != null) {
                            surety.setAdditionalDetails(objectMapper.readTree(suretyAdditionalDetails.getValue()));
                        }


                        bail.getSureties().add(surety);
                    }

                    // Add surety document if present
                    String suretyDocId = rs.getString("suretyDocId");
                    if (suretyDocId != null) {
                        AuditDetails suretyDocAuditDetails = AuditDetails.builder()
                                .createdBy(rs.getString("suretyDocCreatedBy"))
                                .lastModifiedBy(rs.getString("suretyDocLastModifiedBy"))
                                .createdTime(rs.getLong("suretyDocCreatedTime"))
                                .lastModifiedTime(rs.getLong("suretyDocLastModifiedTime"))
                                .build();

                        Document suretyDoc = Document.builder()
                                .id(rs.getString("suretyDocId"))
                                .tenantId(rs.getString("suretyDocTenantId"))
                                .fileStore(rs.getString("suretyDocFilestoreId"))
                                .documentUid(rs.getString("suretyDocUid"))
                                .documentName(rs.getString("suretyDocName"))
                                .documentType(rs.getString("suretyDocType"))
                                .isActive(rs.getBoolean("suretyDocIsActive"))
                                .auditDetails(suretyDocAuditDetails)
                                .build();

                        PGobject suretyDocDetails = (PGobject) rs.getObject("suretyDocAdditionalDetails");
                        if (suretyDocDetails != null) {
                            suretyDoc.setAdditionalDetails(objectMapper.readTree(suretyDocDetails.getValue()));
                        }


                        if (surety.getDocuments().stream().noneMatch(d -> d.getId().equals(suretyDocId))) {
                            surety.getDocuments().add(suretyDoc);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("❌ Error occurred while processing Bail ResultSet: {}", e.getMessage(), e);
            throw new CustomException("ROW_MAPPER_EXCEPTION", "Error in BailRowMapper: " + e.getMessage());
        }

        return new ArrayList<>(bailMap.values());
    }
}
