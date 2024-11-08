// Required imports
const {
    search_pdf,
    create_file // New utility
  } = require("../api"); // Using imports as per the initial setup
  const { PDFDocument, rgb } = require("pdf-lib");
  const axios = require("axios");
  const fs = require("fs");
  const path = require("path");
  
  // Mock design data for MDMS
  const caseBundleDesignMock = [
    {
      section_name: "Case Cover Page",
      isEnabled: true,
      title: "Case Cover Page",
      hasHeader: false,
      hasFooter: true,
      name: "titlepage",
      doctype: null,
      docketpagerequired: "no",
      sorton: null,
      isactive: "yes"
    },
    {
      section_name: "Case History",
      isEnabled: true,
      title: "Case History",
      hasHeader: false,
      hasFooter: false,
      name: "adiary",
      doctype: null,
      docketpagerequired: "no",
      sorton: null,
      isactive: "no"
    },
    {
      section_name: "Pending Applications",
      isEnabled: true,
      title: "Pending Applications",
      hasHeader: true,
      hasFooter: true,
      name: "pendingapplications",
      doctype: "applicationNumber",
      docketpagerequired: "yes",
      sorton: "applicationNumber",
      isactive: "yes"
    },
    {
      section_name: "Objections",
      isEnabled: true,
      title: "Objections against Applications",
      hasHeader: true,
      hasFooter: true,
      name: "pendingapplications",
      doctype: "With associated application",
      docketpagerequired: "yes",
      sorton: "applicationNumber",
      isactive: "yes"
    },
    {
      section_name: "Complaint",
      isEnabled: true,
      title: "Complaint",
      hasHeader: false,
      hasFooter: true,
      name: "complainant",
      doctype: null,
      docketpagerequired: "yes",
      sorton: null,
      isactive: "yes"
    }
  ];
  
  // Main function to build case PDF bundle
  async function buildCasePdf(caseNumber, index, requestInfo) {
    try {
      // Add RequestInfo validation
      if (!requestInfo || !requestInfo.authToken) {
        throw new Error("RequestInfo with valid authToken is required.");
      }
  
      // Todo- Get caseBundleDesign from MDMS V2
      const caseBundleDesign = caseBundleDesignMock;
  
      if (!caseBundleDesign || caseBundleDesign.length === 0) {
        throw new Error("No case bundle design found in MDMS.");
      }
  
      // Initialize a new PDF document for the merged bundle
      const mergedPdf = await PDFDocument.create();
      console.log("Starting PDF merge");
  
      // Step 19-21: Iterate over each section in the index and process
      for (const section of index.sections) {
        const sectionConfig = caseBundleDesign.find(
          (design) => design.name === section.name && design.isEnabled
        );
  
        if (!sectionConfig) continue; // Skip if section config not found or not enabled
  
        for (const item of section.lineItems) {
          if (sectionConfig.isEnabled && !item.createPDF) {
            // Step 23-25: Retrieve and log the PDF URL for each item in the section
            const pdfResponse = await search_pdf("kl", item.fileStoreId, requestInfo);
            console.log("PDF response for search is", pdfResponse.data);
  
            if (pdfResponse.status === 200 && pdfResponse.data[item.fileStoreId]) {
              // Extract the PDF URL from the response data
              const pdfUrl = pdfResponse.data[item.fileStoreId];
  
              try {
                // Fetch the PDF data from the URL
                const pdfFetchResponse = await axios.get(pdfUrl, {
                  responseType: "arraybuffer",
                  headers: { "auth-token": requestInfo.authToken } // Add authToken for authentication
                });
                const pdfData = pdfFetchResponse.data;
  
                // Load the PDF document
                const itemPdf = await PDFDocument.load(pdfData);
                console.log("Loaded PDF document");
  
                // Add caseNumber as a header to each page of the individual PDF
                const pages = itemPdf.getPages();
                for (const page of pages) {
                  const { width, height } = page.getSize();
                  page.drawText(`${caseNumber}`, {
                    x: width / 2 - 50, // Center the text
                    y: height - 30, // Position near the top
                    size: 12,
                    color: rgb(0, 0, 0),
                  });
                }
  
                // Copy pages from the modified individual PDF into the merged PDF
                const modifiedPages = await mergedPdf.copyPages(itemPdf, itemPdf.getPageIndices());
                modifiedPages.forEach((page) => mergedPdf.addPage(page));
              } catch (pdfFetchError) {
                console.log(`Failed to fetch or load PDF for URL: ${pdfUrl}`, pdfFetchError.message);
              }
            } else {
              console.log(`Failed to fetch PDF for fileStoreId: ${item.fileStoreId}`);
            }
          } else {
            // Logic for when createPdf is true goes here
          }
        }
      }
  
      // Ensure the case-bundles directory exists
      const directoryPath = path.join(__dirname, "../case-bundles");
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }
  
      // Add page numbers as footers
      const mergedPages = mergedPdf.getPages();
      mergedPages.forEach((page, index) => {
        const { width } = page.getSize();
        const pageNumber = index + 1; // Page numbers are 1-based
        page.drawText(`${pageNumber}`, {
          x: width - 100, // Position near the right side
          y: 30, // Position near the bottom
          size: 10,
          color: rgb(0, 0, 0),
        });
      });
  
      // Save the final merged PDF
      const pdfBytes = await mergedPdf.save();
      const filePath = path.join(directoryPath, `${caseNumber}-bundle.pdf`);
      fs.writeFileSync(filePath, pdfBytes);
  
      // Save to filestore using the new utility
      const tenantId = index.tenantId; 
      const fileStoreResponse = await create_file(filePath, tenantId, "test", "gotcha", requestInfo);
      console.log("Filestore response is", fileStoreResponse.data);
      const fileStoreId = fileStoreResponse?.data?.files?.[0].fileStoreId;
      console.log(`Case bundle saved to file store with ID: ${fileStoreId}`);
  
      fs.unlinkSync(filePath);
      console.log(`Temporary file ${filePath} deleted from local storage.`);
  
      return fileStoreId;
    } catch (error) {
      console.error("Error processing case bundle:", error.message);
    }
  }
  
  module.exports = buildCasePdf;
  