package org.pucar.dristi.web.models;

/**
 * Internal holder pairing an e-filed {@link Document} with the evidence artifactType it should be
 * created as during case registration (see CaseService.createRegistrationEvidences).
 */
public record RegistrationEvidenceDocument(Document document, String artifactType) {
}
