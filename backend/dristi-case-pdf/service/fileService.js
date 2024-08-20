const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const imageToPdf = require('image-to-pdf');
const fs = require('fs');
const path = require('path');

async function fetchDocument(fileStoreId) {
    const url = `https://dristi-kerala-dev.pucar.org/filestore/v1/files/id?tenantId=kl&fileStoreId=${fileStoreId}`;
    
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        const contentType = response.headers['content-type'];

        if (contentType === 'application/pdf') {
            console.log('PDF file detected');
            return response.data;
        } else if (contentType.startsWith('image/')) {
            console.log('Image file detected');

            const imageBytes = Buffer.from(response.data);
            const pdfDoc = await PDFDocument.create();

            let image;
            if (contentType === 'image/jpeg') {
                image = await pdfDoc.embedJpg(imageBytes);
            } else if (contentType === 'image/png') {
                image = await pdfDoc.embedPng(imageBytes);
            } else {
                throw new Error(`Unsupported image format: ${contentType}`);
            }

            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });

            const pdfBytes = await pdfDoc.save();
            return pdfBytes;
        } else {
            throw new Error(`Unsupported content type: ${contentType}`);
        }
    } catch (error) {
        console.error('Error fetching document:', error.message);
        throw error;
    }
}

async function appendPdfPagesWithHeader(existingPdfDoc, fileStoreId, header) {

    const helveticaFont = await existingPdfDoc.embedStandardFont('Helvetica');

    const headerPage = existingPdfDoc.addPage();
    const { width: existingWidth, height: existingHeight } = headerPage.getSize();
    headerPage.drawText(header, {
        x: 50,
        y: existingHeight - 50,
        size: 24,
        font: helveticaFont,
    });

    const documentBytes = await fetchDocument(fileStoreId);
    const fetchedPdfDoc = await PDFDocument.load(documentBytes);
    if (!fetchedPdfDoc) {
        console.error("Failed to load PDF document.");
        return;
    }

    const fetchedPages = fetchedPdfDoc.getPages();
    if (fetchedPages.length === 0) {
        console.error("No pages found in the fetched PDF document.");
        return;
    }

    for (const pageIndex of fetchedPages.map((_, i) => i)) {
        const [copiedPage] = await existingPdfDoc.copyPages(fetchedPdfDoc, [pageIndex]);
        const { width: fetchedWidth, height: fetchedHeight } = copiedPage.getSize();
        const scale = existingWidth / fetchedWidth;
        copiedPage.scale(scale, scale);
        existingPdfDoc.addPage(copiedPage);
    }
}

async function appendComplainantFilesToPDF(pdf, complainants) {
    const existingPdfDoc = await PDFDocument.load(pdf);

    for (let i = 0; i < complainants.length; i++) {
        const complainant = complainants[i];
        if (complainant.companyDetailsFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, complainant.companyDetailsFileStore, `Authoriastion oF Representative Document ${i + 1}`);
        }
    }

    return await existingPdfDoc.save();
}

async function appendRespondentFilesToPDF(pdf, respondents) {
    const existingPdfDoc = await PDFDocument.load(pdf);

    for (let i = 0; i < respondents.length; i++) {
        const respondent = respondents[i];
        if (respondent.inquiryAffidavitFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, respondent.inquiryAffidavitFileStore, `Inquiry Affidavit Document ${i + 1}`);
        }
    }

    return await existingPdfDoc.save();
}

async function appendChequeDetailsToPDF(pdf, chequeDetails) {
    const existingPdfDoc = await PDFDocument.load(pdf);

    for (let i = 0; i < chequeDetails.length; i++) {
        const chequeDetail = chequeDetails[i];

        if (chequeDetail.bouncedChequeFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, chequeDetail.bouncedChequeFileStore, `Bounced Cheque Document ${i + 1}`);
        }
        if (chequeDetail.depositChequeFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, chequeDetail.depositChequeFileStore, `Deposit Cheque Document ${i + 1}`);
        }
        if (chequeDetail.returnMemoFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, chequeDetail.returnMemoFileStore, `Return Memo Document ${i + 1}`);
        }
    }

    return await existingPdfDoc.save();
}

async function appendDebtLiabilityFilesToPDF(pdf, debtLiabilityDetails) {
    const existingPdfDoc = await PDFDocument.load(pdf);

    for (let i = 0; i < debtLiabilityDetails.length; i++) {
        const debtLiability = debtLiabilityDetails[i];
        if (debtLiability.proofOfLiabilityFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, debtLiability.proofOfLiabilityFileStore, `Debt Liability Document ${i + 1}`);
        }
    }

    return await existingPdfDoc.save();
}

async function appendDemandNoticeFilesToPDF(pdf, demandNoticeDetails) {
    const existingPdfDoc = await PDFDocument.load(pdf);

    for (let i = 0; i < demandNoticeDetails.length; i++) {
        const demandNotice = demandNoticeDetails[i];

        if (demandNotice.legalDemandNoticeFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, demandNotice.legalDemandNoticeFileStore, `Demand Notice Document ${i + 1}`);
        }
        if (demandNotice.proofOfDispatchFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, demandNotice.proofOfDispatchFileStore, `Proof of Dispatch Document ${i + 1}`);
        }
        if (demandNotice.proofOfAcknowledgmentFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, demandNotice.proofOfAcknowledgmentFileStore, `Proof of Acknowledgment Document ${i + 1}`);
        }
        if (demandNotice.proofOfReplyFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, demandNotice.proofOfReplyFileStore, `Proof of Reply Document ${i + 1}`);
        }
    }

    return await existingPdfDoc.save();
}

async function appendDelayCondonationFilesToPDF(pdf, delayCondonationDetails) {
    const existingPdfDoc = await PDFDocument.load(pdf);

    for (let i = 0; i < delayCondonationDetails.length; i++) {
        const delayCondonation = delayCondonationDetails[i];
        if (delayCondonation.delayCondonationFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, delayCondonation.delayCondonationFileStore, `Delay Condonation Document ${i + 1}`);
        }
    }

    return await existingPdfDoc.save();
}

async function appendPrayerSwornFilesToPDF(pdf, prayerSwornStatementDetails) {
    const existingPdfDoc = await PDFDocument.load(pdf);

    for (let i = 0; i < prayerSwornStatementDetails.length; i++) {
        const prayerSworn = prayerSwornStatementDetails[i];

        if (prayerSworn.memorandumOfComplaintFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, prayerSworn.memorandumOfComplaintFileStore, `Memorandum of Complaint Document ${i + 1}`);
        }
        if (prayerSworn.prayerForReliefFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, prayerSworn.prayerForReliefFileStore, `Prayer for Relief Document ${i + 1}`);
        }
        if (prayerSworn.swornStatement) {
            await appendPdfPagesWithHeader(existingPdfDoc, prayerSworn.swornStatement, `Sworn Statement Document ${i + 1}`);
        }
    }

    return await existingPdfDoc.save();
}

async function appendAdvocateFilesToPDF(pdf, advocates) {
    const existingPdfDoc = await PDFDocument.load(pdf);

    for (let i = 0; i < advocates.length; i++) {
        const advocate = advocates[i];
        if (advocate.vakalatnamaFileStore) {
            await appendPdfPagesWithHeader(existingPdfDoc, advocate.vakalatnamaFileStore, `Vakalatnama Document ${i + 1}`);
        }
    }

    return await existingPdfDoc.save();
}

module.exports = {
    appendComplainantFilesToPDF,
    appendRespondentFilesToPDF,
    appendChequeDetailsToPDF,
    appendDebtLiabilityFilesToPDF,
    appendDemandNoticeFilesToPDF,
    appendDelayCondonationFilesToPDF,
    appendPrayerSwornFilesToPDF,
    appendAdvocateFilesToPDF
};
