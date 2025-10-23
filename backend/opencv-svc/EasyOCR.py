from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import easyocr
import numpy as np
import fitz  # PyMuPDF
import logging

# ----------------------------
# Logger Configuration
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("ocr_quality_checker.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ----------------------------
# FastAPI App
# ----------------------------
app = FastAPI(title="Document Quality Checker API")

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'], gpu=False)

# ----------------------------
# Helper Function
# ----------------------------
def get_average_confidence_from_image_bytes(image_bytes):
    """
    Reads text from image bytes and computes average OCR confidence.
    Returns 0.0 if no text is detected.
    """
    results = reader.readtext(image_bytes)
    scores = [res[2] for res in results]
    avg_conf = float(np.mean(scores)) if scores else 0.0
    return avg_conf

# ----------------------------
# API Endpoint
# ----------------------------
@app.post("/check-document-quality")
async def check_document_quality(
    file: UploadFile = File(...),
    tenantId: str = Form(...),
    filestoreId: str = Form(None),
    threshold: float = Form(0.5)
):
    try:
        # Read file bytes
        file_bytes = await file.read()
        ext = file.filename.split(".")[-1].lower()

        # ----------------------------
        # Handle image files
        # ----------------------------
        if ext in ["png", "jpg", "jpeg"]:
            avg_conf = get_average_confidence_from_image_bytes(file_bytes)
            logger.info(f"Average confidence for image {file.filename}: {avg_conf:.2f}")

            if avg_conf < threshold:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "tenantId": tenantId,
                        "filestoreId": filestoreId,
                        "average_confidence": avg_conf,
                        "status": "POOR",
                        "message": "Document quality is below threshold",
                    },
                )

        # ----------------------------
        # Handle PDF files
        # ----------------------------
        elif ext == "pdf":
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page_confidences = []

            for i, page in enumerate(doc, start=1):
                if i > 3:
                    break
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                avg_conf_page = get_average_confidence_from_image_bytes(img_bytes)
                page_confidences.append(avg_conf_page)
                logger.info(f"Page {i} confidence: {avg_conf_page:.2f}")

            # Overall average confidence
            avg_conf = float(np.mean(page_confidences)) if page_confidences else 0.0

            if avg_conf < threshold:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "tenantId": tenantId,
                        "filestoreId": filestoreId,
                        "average_confidence": avg_conf,
                        "status": "POOR",
                        "message": "One or more pages are below quality threshold",
                        "page_confidences": page_confidences
                    },
                )

        # ----------------------------
        # Unsupported file type
        # ----------------------------
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # ----------------------------
        # Success Response
        # ----------------------------
        return JSONResponse(
            status_code=200,
            content={
                "tenantId": tenantId,
                "filestoreId": filestoreId,
                "average_confidence": avg_conf,
                "status": "ACCEPTABLE",
                "message": "Document passed quality check",
            }
        )

    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ----------------------------
# Main Entry
# ----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("EasyOCR:app", host="0.0.0.0", port=8005, reload=False)
