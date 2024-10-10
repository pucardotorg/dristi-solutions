const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");

router.post(
  "/combine-documents",
  upload.array("documents"),
  async (req, res) => {
    try {
      const files = req.files;
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const pdfBytes = fs.readFileSync(file.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(
          pdfDoc,
          pdfDoc.getPageIndices()
        );
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const finalPdfBuffer = Buffer.from(mergedPdfBytes);
      files.forEach((file) => fs.unlinkSync(file.path));

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=merged.pdf",
      });
      res.send(finalPdfBuffer);
      files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error(`Error deleting file ${file.path}:`, err);
          } else {
            console.log(`Deleted file: ${file.path}`);
          }
        });
      });
    } catch (error) {
      console.error("Error during PDF merging:", error); // Log the error for debugging

      res.status(500).json({
        message: "Error creating merged PDF",
        error: error.message,
      });
    }
  }
);

module.exports = router;
