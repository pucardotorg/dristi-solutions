from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import easyocr
import numpy as np
import tempfile
import os
import logging

# Logger Configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] tenantId=%(tenantId)s filestoreId=%(filestoreId)s avg_conf=%.2f",
    handlers=[
        logging.FileHandler("ocr_quality_checker.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Document Quality Checker API")

reader = easyocr.Reader(['en'], gpu=False)


def get_average_confidence_from_image(image_path):
    """Reads text and computes average OCR confidence."""
    results = reader.readtext(image_path)
    scores = [res[2] for res in results]
    return np.mean(scores) if scores else 0.0


@app.post("/check-document-quality")
async def check_document_quality(
        file: UploadFile = File(...),
        tenantId: str = Form(...),
        filestoreId: str = Form(None),
        threshold: float = Form(0.5)
):
    ext = os.path.splitext(file.filename)[1].lower()
    temp_dir = tempfile.mkdtemp()

    try:
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Handle image files
        if ext in [".png", ".jpg", ".jpeg"]:
            avg_conf = get_average_confidence_from_image(file_path)
            logger.info("", extra={"tenantId": tenantId, "filestoreId": filestoreId, "avg_conf": avg_conf})
            if avg_conf < threshold:
                raise HTTPException(
                    status_code=400,
                    content={
                        "tenantId": tenantId,
                        "filestoreId": filestoreId,
                        "average_confidence": avg_conf,
                        "status": "POOR",
                        "message": "Document quality is below threshold",
                    },
                )

        # Handle PDFs -> page-wise check
        elif ext == ".pdf":
            with open(file_path, "rb") as pdf_file:
                images = convert_from_bytes(pdf_file.read())

            for image in images:
                temp_image_path = os.path.join(temp_dir, "page.png")
                image.save(temp_image_path, "PNG")
                avg_conf = get_average_confidence_from_image(temp_image_path)
                logger.info("", extra={"tenantId": tenantId, "filestoreId": filestoreId, "avg_conf": avg_conf})
                if avg_conf < threshold:
                    raise HTTPException(
                        status_code=400,
                        content={
                            "tenantId": tenantId,
                            "filestoreId": filestoreId,
                            "average_confidence": avg_conf,
                            "status": "POOR",
                            "message": "One or more pages are below quality threshold",
                        },
                    )

        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        return JSONResponse(
            content={
                "tenantId": tenantId,
                "filestoreId": filestoreId,
                "average_confidence": avg_conf,
                "status": "ACCEPTABLE",
                "message": "Document passed quality check",
            }
        )

    finally:
        for root, _, files in os.walk(temp_dir):
            for name in files:
                os.remove(os.path.join(root, name))
        os.rmdir(temp_dir)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("EasyOCR:app", host="0.0.0.0", port=8000, reload=True)
