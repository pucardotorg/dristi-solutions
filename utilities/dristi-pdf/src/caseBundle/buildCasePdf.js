// Required imports
const {
    search_mdms,
    search_pdf,
    create_pdf,
    create_file // New utility
  } = require("../api"); // Using imports as per the initial setup
  const { PDFDocument } = require("pdf-lib");
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
  async function buildCasePdf(caseNumber, index) {
    try {
      // Step 17: Retrieve MDMS configuration
      const caseBundleDesign = caseBundleDesignMock;
  
      if (!caseBundleDesign || caseBundleDesign.length === 0) {
        throw new Error("No case bundle design found in MDMS.");
      }
  
      // Initialize a new PDF document
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
            const pdfResponse = await search_pdf("kl", item.fileStoreId);
            console.log("PDF response for search is", pdfResponse.data);
  
            if (pdfResponse.status === 200 && pdfResponse.data[item.fileStoreId]) {
              // Extract the PDF URL from the response data
              const pdfUrl = pdfResponse.data[item.fileStoreId];
  
              try {
                // Fetch the PDF data from the URL
                const pdfFetchResponse = await axios.get(pdfUrl, {
                  responseType: 'arraybuffer'
                });
                const pdfData = pdfFetchResponse.data;
  
                // Load the PDF document
                const itemPdf = await PDFDocument.load(pdfData);
                console.log("Loaded PDF document", itemPdf);
  
                // Copy pages from the loaded PDF into the merged PDF
                const pages = await mergedPdf.copyPages(itemPdf, itemPdf.getPageIndices());
                pages.forEach((page) => mergedPdf.addPage(page));
  
              } catch (pdfFetchError) {
                console.log(`Failed to fetch or load PDF for URL: ${pdfUrl}`, pdfFetchError.message);
              }
            } else {
              console.log(`Failed to fetch PDF for fileStoreId: ${item.fileStoreId}`);
            }
          }
          else{
            //logic for when createPdf is true goes here
          }
        }
      }
  
      // Ensure the case-bundles directory exists
      const directoryPath = path.join(__dirname, "../case-bundles");
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }
  
      // Save the final merged PDF
      const pdfBytes = await mergedPdf.save();
      const filePath = path.join(directoryPath, `${caseNumber}-bundle.pdf`);
      fs.writeFileSync(filePath, pdfBytes);
  
      const fileContent = fs.readFileSync(filePath);
      const currentDate = Date.now();
      
      // Save to filestore using the new utility
      const tenantId = "kl"; // Assuming tenantId is available in index
      const fileStoreResponse = await create_file(filePath, tenantId, "test", "gotcha");
      console.log("Filestore response is", fileStoreResponse.data);
      const fileStoreId = fileStoreResponse?.data?.files?.[0].fileStoreId;
      console.log(`Case bundle saved to file store with ID: ${fileStoreId}`);
      return fileStoreId;
  
    } catch (error) {
      console.error("Error processing case bundle:", error.message);
    }
  }
  
  module.exports = buildCasePdf;
  