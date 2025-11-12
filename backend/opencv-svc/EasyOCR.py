from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import easyocr
import numpy as np
import fitz  # PyMuPDF
import logging
import asyncpg
import aiohttp
import asyncio
import json
import tempfile
import os

# ----------------------------
# Environment Defaults
# ----------------------------
os.environ.setdefault("DB_USER", "postgres")
os.environ.setdefault("DB_PASSWORD", "beehyv@123")
os.environ.setdefault("DB_NAME", "pucar-solutions-dev-db")
os.environ.setdefault("DB_HOST", "178.236.185.122")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("FILESTORE_HOST", "http://localhost:8080")
os.environ.setdefault("FILESTORE_ENDPOINT", "/filestore/v1/files")

# ----------------------------
# Logger Configuration
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("ocr_quality_checker.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# ----------------------------
# Database Configuration
# ----------------------------
DB_CONFIG = {
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
    "host": os.environ["DB_HOST"],
    "port": os.environ["DB_PORT"]
}

FILESTORE_HOST = os.environ["FILESTORE_HOST"]
FILESTORE_ENDPOINT = os.environ["FILESTORE_ENDPOINT"]

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
            message VARCHAR(64),
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


async def insert_ocr_record(tenant_id, filestore_id, case_id, filing_number,
                            avg_conf, status, message, extracted_json, document_path):
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        await conn.execute("""
            INSERT INTO ocr_data (
                tenant_id, filestore_id, case_id, filing_number, 
                average_confidence, status, message, extracted_data, document_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
        """, tenant_id, filestore_id, case_id, filing_number, avg_conf,
             status, message, json.dumps(extracted_json), document_path)
        await conn.close()
        logger.info(f"✅ Inserted OCR record for filestore_id={filestore_id}")
    except Exception as e:
        logger.error(f"❌ DB insert failed for filestore_id={filestore_id}: {e}")


# ----------------------------
# File Fetch from FileStore
# ----------------------------
async def fetch_file_from_filestore(file_store_id: str, tenant_id: str) -> str:
    """Fetch file from filestore, save locally, and return the file path."""
    if not file_store_id:
        raise ValueError("File store ID cannot be empty")

    url = f"{FILESTORE_HOST}{FILESTORE_ENDPOINT}/id?tenantId={tenant_id}&fileStoreId={file_store_id}"
    logger.info(f"📡 Fetching file from URL: {url}")

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                text = await response.text()
                raise Exception(f"❌ Failed to fetch file: {response.status} - {text}")

            # Read file bytes
            file_bytes = await response.read()

            # Determine file extension (if any)
            content_type = response.headers.get("Content-Type", "").lower()
            ext = ""
            if "pdf" in content_type:
                ext = ".pdf"
            elif "png" in content_type:
                ext = ".png"
            elif "jpeg" in content_type or "jpg" in content_type:
                ext = ".jpg"

            # Create a temp file
            temp_fd, temp_path = tempfile.mkstemp(suffix=ext)
            os.close(temp_fd)  # Close the file descriptor

            # Write file bytes to temp file
            with open(temp_path, "wb") as f:
                f.write(file_bytes)

            logger.info(f"✅ File saved temporarily: {temp_path} ({len(file_bytes)} bytes)")

            return temp_path


# ----------------------------
# OCR Helper
# ----------------------------
def extract_text_confidence(image_bytes):
    results = reader.readtext(image_bytes)
    words = [{"text": res[1], "score": float(res[2])} for res in results]
    scores = [r["score"] for r in words]
    avg_conf = float(np.mean(scores)) if scores else 0.0
    return avg_conf, {"words": words}


# ----------------------------
# Request Model
# ----------------------------
class DocumentInfo(BaseModel):
    filestoreId: str
    documentPath: Optional[str] = None


class RequestInfoModel(BaseModel):
    apiId: Optional[str] = None
    userInfo: Optional[dict] = None


class DocumentQualityRequest(BaseModel):
    tenantId: str
    caseId: str
    filingNumber: str
    documents: List[DocumentInfo]
    RequestInfo: Optional[RequestInfoModel] = None


# ----------------------------
# Main Endpoint
# ----------------------------
@app.post("/opencv/check-document-quality")
async def check_document_quality(req: DocumentQualityRequest):
    try:
        results = []

        for doc in req.documents:
            logger.info(f"📥 Processing filestoreId={doc.filestoreId}")
            file_path = await fetch_file_from_filestore(doc.filestoreId, req.tenantId)

            ext = os.path.splitext(file_path)[1].lower()

            # Image
            if ext in [".png", ".jpg", ".jpeg"]:
                with open(file_path, "rb") as f:
                    avg_conf, extracted_data = extract_text_confidence(f.read())

            # PDF
            elif ext == ".pdf":
                doc_pdf = fitz.open(file_path)
                confs, words = [], []
                for page in doc_pdf:
                    pix = page.get_pixmap(dpi=150)
                    avg_page, page_data = extract_text_confidence(pix.tobytes("png"))
                    confs.append(avg_page)
                    words.extend(page_data["words"])
                avg_conf = float(np.mean(confs)) if confs else 0.0
                extracted_data = {"words": words}

            else:
                raise HTTPException(status_code=400, detail="Unsupported file type")

            # Determine quality
            status = "ACCEPTABLE" if avg_conf >= 0.5 else "POOR"
            message = "Document passed quality check" if status == "ACCEPTABLE" else "Document quality below threshold"

            await insert_ocr_record(req.tenantId, doc.filestoreId, req.caseId, req.filingNumber,
                                    avg_conf, status, message, extracted_data, doc.documentPath)

            results.append({
                "filestoreId": doc.filestoreId,
                "average_confidence": avg_conf,
                "status": status,
                "message": message,
                "extracted_data": extracted_data
            })

            os.remove(file_path)

        return JSONResponse(content={"results": results})

    except Exception as e:
        logger.exception("❌ Error in OCR processing")
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------
# Main Entry
# ----------------------------
if __name__ == "__main__":
    import uvicorn
    asyncio.run(init_db())
    uvicorn.run("EasyOCR:app", host="0.0.0.0", port=8005, reload=True)
