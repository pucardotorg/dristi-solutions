const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

router.post(
  "/combine-documents",
  upload.array("documents"),
  async (req, res) => {
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of req.files) {
        const ext = path.extname(file.originalname).toLowerCase();
        const fileData = fs.readFileSync(file.path);

        if (ext === ".pdf") {
          const pdfDoc = await PDFDocument.load(fileData);
          const pages = await mergedPdf.copyPages(
            pdfDoc,
            pdfDoc.getPageIndices()
          );
          pages.forEach((page) => mergedPdf.addPage(page));
        } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
          const img =
            ext === ".png"
              ? await mergedPdf.embedPng(fileData)
              : await mergedPdf.embedJpg(fileData);
          const imgDims = img.scale(1);
          const page = mergedPdf.addPage([imgDims.width, imgDims.height]);
          page.drawImage(img, {
            x: 0,
            y: 0,
            width: imgDims.width,
            height: imgDims.height,
          });
        }

        fs.unlinkSync(file.path); // Clean up files after processing
      }
      const mergedPdfBytes = await mergedPdf.save();
      const finalPdfBuffer = Buffer.from(mergedPdfBytes);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=merged.pdf",
      });
      res.send(finalPdfBuffer);
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
