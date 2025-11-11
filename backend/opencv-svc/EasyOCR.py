from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import easyocr
import numpy as np
import fitz  # PyMuPDF
import logging
import asyncpg
import asyncio
import json

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
# Database Configuration
# ----------------------------
DB_CONFIG = {
    "user": "postgres",
    "password": "beehyv@123",
    "database": "pucar-solutions-dev-db",
    "host": "178.236.185.122",
    "port": "5432"
}

# ----------------------------
# FastAPI App
# ----------------------------
app = FastAPI(title="Document Quality Checker API")
reader = easyocr.Reader(['en'], gpu=False)

# ----------------------------
# Database Setup
# ----------------------------
async def init_db():
    conn = await asyncpg.connect(**DB_CONFIG)
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS ocr_data (
            id SERIAL PRIMARY KEY,
            tenant_id VARCHAR(64) NOT NULL,
            filestore_id VARCHAR(128) NOT NULL,
            case_id VARCHAR(128),
            filing_number VARCHAR(128),
            average_confidence NUMERIC(5,2),
            status VARCHAR(32),
            message VARCHAR(32),
            extracted_data JSONB,
            document_path TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    await conn.close()
    logger.info("✅ Database and table ready.")


@app.on_event("startup")
async def startup_event():
    await init_db()


async def insert_ocr_record(tenant_id, filestore_id, case_id, filing_number, avg_conf, status, message, extracted_json, document_path):
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        await conn.execute("""
            INSERT INTO ocr_data (
                tenant_id, filestore_id, case_id, filing_number, 
                average_confidence, status, message, extracted_data, document_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
        """, tenant_id, filestore_id, case_id, filing_number, avg_conf, status, message, json.dumps(extracted_json), document_path)
        await conn.close()
        logger.info(f"✅ OCR data inserted for filestore_id={filestore_id}")
    except Exception as e:
        logger.error(f"❌ Failed to insert OCR record: {e}")


# ----------------------------
# Helper Function
# ----------------------------
def get_text_and_confidence(image_bytes):
    """
    Reads text from image bytes and returns:
    - average_confidence (float)
    - extracted_json (list of words + confidence)
    """
    results = reader.readtext(image_bytes)
    words_data = [{"text": res[1], "confidence": res[2]} for res in results]
    scores = [res[2] for res in results]
    avg_conf = float(np.mean(scores)) if scores else 0.0
    return avg_conf, {"words": words_data}


# ----------------------------
# API Endpoint
# ----------------------------
@app.post("/check-document-quality")
async def check_document_quality(
    file: UploadFile = File(...),
    tenantId: str = Form(...),
    filestoreId: str = Form(...),
    caseId: str = Form(),
    filingNumber: str = Form(),
    documentPath: str = Form(),
    threshold: float = Form(0.5)
):
    try:
        file_bytes = await file.read()
        ext = file.filename.split(".")[-1].lower()
        avg_conf = 0.0
        extracted_data = {"words": []}

        # ----------------------------
        # Handle Image
        # ----------------------------
        if ext in ["png", "jpg", "jpeg"]:
            avg_conf, extracted_data = get_text_and_confidence(file_bytes)
            logger.info(f"🖼 Image {file.filename} avg_conf={avg_conf:.2f}")

        # ----------------------------
        # Handle PDF
        # ----------------------------
        elif ext == "pdf":
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page_confidences = []
            all_words = []

            for i, page in enumerate(doc, start=1):
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                avg_conf_page, page_data = get_text_and_confidence(img_bytes)
                page_confidences.append(avg_conf_page)
                all_words.extend(page_data["words"])
                logger.info(f"📄 Page {i} confidence: {avg_conf_page:.2f}")

            avg_conf = float(np.mean(page_confidences)) if page_confidences else 0.0
            extracted_data = {"words": all_words}

        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # ----------------------------
        # Determine status & message
        # ----------------------------
        status = "ACCEPTABLE" if avg_conf >= threshold else "POOR"
        message = "Document passed quality check" if status == "ACCEPTABLE" else "Document quality is below threshold"

        # ----------------------------
        # Insert into DB
        # ----------------------------
        await insert_ocr_record(tenantId, filestoreId, caseId, filingNumber, avg_conf, status, message, extracted_data, documentPath)

        # ----------------------------
        # Response
        # ----------------------------
        return JSONResponse(
            status_code=200 if status == "ACCEPTABLE" else 400,
            content={
                "tenantId": tenantId,
                "filestoreId": filestoreId,
                "caseId": caseId,
                "filingNumber": filingNumber,
                "documentPath": documentPath,
                "average_confidence": avg_conf,
                "status": status,
                "message": message
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
    asyncio.run(init_db())  # ensure DB exists before server starts
    uvicorn.run("EasyOCR:app", host="0.0.0.0", port=8005, reload=False)
