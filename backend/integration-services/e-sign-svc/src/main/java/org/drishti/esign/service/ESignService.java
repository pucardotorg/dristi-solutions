package org.drishti.esign.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.text.pdf.PdfReader;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.drishti.esign.cipher.Encryption;
import org.drishti.esign.config.Configuration;
import org.drishti.esign.kafka.Producer;
import org.drishti.esign.repository.EsignRequestRepository;
import org.drishti.esign.util.FileStoreUtil;
import org.drishti.esign.util.XmlFormDataSetter;
import org.drishti.esign.web.models.*;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.security.PrivateKey;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.drishti.esign.config.ServiceConstants.PRIVATE_KEY_FILE_NAME;
import static org.drishti.esign.config.ServiceConstants.STATUS_PENDING;
import static org.drishti.esign.config.ServiceConstants.STATUS_SUCCESS;
import static org.drishti.esign.config.ServiceConstants.STATUS_FAILURE;


@Service
@Slf4j
public class ESignService {


    private final PdfEmbedder pdfEmbedder;
    private final XmlSigning xmlSigning;
    private final Encryption encryption;
    private final XmlFormDataSetter formDataSetter;
    private final XmlGenerator xmlGenerator;
    private final FileStoreUtil fileStoreUtil;
    private final Producer producer;
    private final Configuration configuration;
    private final ObjectMapper objectMapper;

    private final EsignRequestRepository repository;

    @Autowired
    public ESignService(PdfEmbedder pdfEmbedder, XmlSigning xmlSigning, Encryption encryption, XmlFormDataSetter formDataSetter, XmlGenerator xmlGenerator, FileStoreUtil fileStoreUtil, Producer producer, Configuration configuration, EsignRequestRepository repository, ObjectMapper objectMapper) {
        this.pdfEmbedder = pdfEmbedder;
        this.xmlSigning = xmlSigning;
        this.encryption = encryption;
        this.formDataSetter = formDataSetter;
        this.xmlGenerator = xmlGenerator;
        this.fileStoreUtil = fileStoreUtil;
        this.producer = producer;
        this.configuration = configuration;
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public ESignXmlForm signDoc(ESignRequest request, HttpServletRequest servletRequest) {

        log.info("Method=signDoc ,Result=Inprogress");
        // Root Directory.
        String uploadRootPath = servletRequest.getServletContext().getRealPath("upload");
        File uploadRootDir = new File(uploadRootPath);
        if (!uploadRootDir.exists()) {
            uploadRootDir.mkdirs();
        }


        ESignParameter eSignParameter = request.getESignParameter();
        eSignParameter.setId(UUID.randomUUID().toString());
        String fileStoreId = eSignParameter.getFileStoreId();
        String tenantId = eSignParameter.getTenantId();
        String pageModule = eSignParameter.getPageModule();
        Resource resource = fileStoreUtil.fetchFileStoreObjectById(fileStoreId, eSignParameter.getTenantId());
        String fileHash = pdfEmbedder.pdfSignerV2(resource, eSignParameter);

        ESignXmlData eSignXmlData = formDataSetter.setFormXmlData(fileHash, new ESignXmlData());
        eSignXmlData.setTxn(tenantId + "-" + pageModule + "-" + eSignParameter.getId());
        String strToEncrypt = xmlGenerator.generateXml(eSignXmlData);  // this method is writing in testing.xml
        log.info(strToEncrypt);
        String xmlData = "";

        try {
            log.info("Method=signDoc ,Result=Inprogress, private key and xml data");
            PrivateKey rsaPrivateKey = encryption.getPrivateKey(PRIVATE_KEY_FILE_NAME);
            xmlData = xmlSigning.signXmlStringNew(servletRequest.getServletContext().getRealPath("upload") + File.separator + "Testing.xml", rsaPrivateKey);
            log.info(xmlData);
            xmlGenerator.writeToXmlFile(xmlData, servletRequest.getServletContext().getRealPath("upload") + File.separator + "Testing.xml");
        } catch (Exception e) {
            log.error("Method=signDoc ,Result=Error, private key and xml data");
            log.error("Method=signDoc, Error:{}", e.toString());
            // Set status to FAILURE on error
            eSignParameter.setStatus(STATUS_FAILURE);
            throw new CustomException("E_SIGN_EXCEPTION", "Exception Occurred while generating the request");

        }

        setAuditDetails(eSignParameter, request.getRequestInfo());

        eSignParameter.setStatus(STATUS_PENDING);
        producer.push(configuration.getEsignCreateTopic(), request);

        ESignXmlForm myRequestXmlForm = new ESignXmlForm();
        myRequestXmlForm.setId("");
        myRequestXmlForm.setType("A");
        myRequestXmlForm.setDescription("Y");
        myRequestXmlForm.setESignRequest(xmlData);
        myRequestXmlForm.setAspTxnID(eSignXmlData.getTxn());
        myRequestXmlForm.setContentType("application/xml");
        
        eSignParameter.setRequestBlob(myRequestXmlForm);
        
        log.info("Method=signDoc ,Result=Success");

        return myRequestXmlForm;

    }

    private void setAuditDetails(ESignParameter eSignParameter, @Valid RequestInfo requestInfo) {
        eSignParameter.setAuditDetails(AuditDetails.builder()
                .createdBy(requestInfo.getUserInfo().getUuid())
                .createdTime(System.currentTimeMillis())
                .lastModifiedBy(requestInfo.getUserInfo().getUuid())
                .lastModifiedTime(System.currentTimeMillis()).
                build());
    }

    public String signDocWithDigitalSignature(SignDocRequest request) {

        log.info("Method=signDocWithDigitalSignature ,Result=InProgress");

        SignDocParameter eSignParameter = request.getESignParameter();

        String txnId = eSignParameter.getTxnId();
        ESignParameter eSignDetails = repository.getESignDetails(txnId);
        String fileStoreId = eSignDetails.getFileStoreId();
        String tenantId = eSignParameter.getTenantId();
        String response = eSignParameter.getResponse();

        try {
            log.info("Method=signDocWithDigitalSignature ,Result=InProgress, filestoreId:{},tenantId:{}", fileStoreId, tenantId);
            Resource resource = fileStoreUtil.fetchFileStoreObjectById(fileStoreId, tenantId);

            // Save response blob and update status
            eSignDetails.setResponseBlob(eSignParameter);
            eSignDetails.setStatus(STATUS_SUCCESS);

            MultipartFile multipartFile;
            multipartFile = pdfEmbedder.signPdfWithDSAndReturnMultipartFileV2(resource, response, eSignDetails);
            String signedFileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);

            eSignDetails.setSignedFileStoreId(signedFileStoreId);
            eSignDetails.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
            ESignRequest eSignRequest = ESignRequest.builder()
                    .eSignParameter(eSignDetails).requestInfo(request.getRequestInfo()).build();

            producer.push(configuration.getEsignUpdateTopic(), eSignRequest);

            log.info("Method=signDocWithDigitalSignature ,Result=Success");
            return signedFileStoreId;
        } catch (Exception e) {
            log.error("Method=signDocWithDigitalSignature ,Result=Error, Error:{}", e.toString());
                                        // Update status to FAILURE on error
            eSignDetails.setResponseBlob(eSignParameter);
            eSignDetails.setStatus(STATUS_FAILURE);
            eSignDetails.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
            
            // Still push the update to record the failure
            ESignRequest eSignRequest = ESignRequest.builder()
                    .eSignParameter(eSignDetails).requestInfo(request.getRequestInfo()).build();
            producer.push(configuration.getEsignUpdateTopic(), eSignRequest);
            
            throw new CustomException("E_SIGN_FAILURE", "E-signature process failed: " + e.getMessage());
        }
    }


    public List<Coordinate> getLocation(@Valid CoordinateRequest request) {
        log.info("Method=getLocation ,Result=InProgress");
        List<Coordinate> response = new ArrayList<>();
        for (CoordinateCriteria criterion : request.getCriteria()) {
            String fileStoreId = criterion.getFileStoreId();
            String tenantId = criterion.getTenantId();
            Resource resource = fileStoreUtil.fetchFileStoreObjectById(fileStoreId, tenantId);

            try {
                Coordinate coordinate = pdfEmbedder.findLocationToSign(new PdfReader(resource.getInputStream()), criterion.getPlaceholder());
                coordinate.setFileStoreId(fileStoreId);
                coordinate.setTenantId(tenantId);

                response.add(coordinate);
            } catch (Exception e) {
                log.error("Method=getLocation, Error:{}", e.toString());
                throw new CustomException("LOCATION_FIND_EXCEPTION", "Error Occurred while searching for location");
            }

        }
        log.info("Method=getLocation ,Result=Success");
        return response;

    }
}
