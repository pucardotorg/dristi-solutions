package org.drishti.esign.service;

import com.itextpdf.text.pdf.PdfDictionary;
import com.itextpdf.text.pdf.security.ExternalSignatureContainer;

import java.io.InputStream;
import java.security.GeneralSecurityException;

public class MyExternalSignatureContainer implements ExternalSignatureContainer {


    private final byte[] signatureBytes;

    public MyExternalSignatureContainer(byte[] signatureBytes) {
        this.signatureBytes = signatureBytes;
    }

    @Override
    public byte[] sign(InputStream inputStream) throws GeneralSecurityException {
        return signatureBytes;
    }

    @Override
    public void modifySigningDictionary(PdfDictionary pdfDictionary) {

    }
}
