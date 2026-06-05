import os
import time
import io
import logging
from fastapi import HTTPException
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.exceptions import HttpResponseError

logger = logging.getLogger(__name__)

# Fetch config
AZURE_DI_ENDPOINT = os.getenv("AZURE_DI_ENDPOINT", "https://di-az01-dev-tcagent-agent-01.cognitiveservices.azure.com/")
AZURE_DI_KEY = os.getenv("AZURE_DI_KEY", "")

def parse_document(file_content: bytes, filename: str) -> dict:
    """
    Parse document using Azure Document Intelligence prebuilt-read model.
    """
    logger.info(f"Starting Azure DI processing for file: {filename}")
    
    if not AZURE_DI_KEY:
        logger.warning("AZURE_DI_KEY is missing. Falling back to mock if needed or failing.")
        
    client = DocumentAnalysisClient(
        endpoint=AZURE_DI_ENDPOINT,
        credential=AzureKeyCredential(AZURE_DI_KEY) if AZURE_DI_KEY else AzureKeyCredential("dummy")
    )

    try:
        # Prebuilt-read is good for extracting text from PDFs and images
        poller = client.begin_analyze_document("prebuilt-read", document=file_content)
        result = poller.result()
        
        extracted_text = result.content
        extracted_tables = []
        
        # 'prebuilt-read' might not extract tables with full structure, but let's safely handle if it does
        # Usually prebuilt-layout or prebuilt-document has better table extraction
        if hasattr(result, "tables") and result.tables:
            for i, table in enumerate(result.tables):
                rows_data = []
                # Simple extraction, just putting cell data
                for cell in table.cells:
                    # simplistic representation for MVP
                    rows_data.append({"row": cell.row_index, "col": cell.column_index, "content": cell.content})
                extracted_tables.append({
                    "table_id": i + 1,
                    "cells": rows_data
                })
        
        logger.info(f"Successfully processed {filename} via Azure DI")
        return {
            "filename": filename,
            "text": extracted_text,
            "tables": extracted_tables
        }
        
    except HttpResponseError as e:
        logger.error(f"Azure DI HTTP Error: {e.reason}")
        if e.status_code in (401, 403):
            # Log to Sentry in real-world, raise specific error
            logger.error("Authentication error with Azure DI")
            raise HTTPException(status_code=500, detail="Azure DI Authentication failed")
        elif e.status_code == 400:
            # Format error or invalid request
            raise HTTPException(status_code=400, detail=f"Invalid document format or request: {e.message}")
        else:
            raise HTTPException(status_code=502, detail="External API error")
    except Exception as e:
        logger.error(f"Unexpected error in Azure DI: {e}")
        # Network/Timeout error mapping to 504 or 502
        raise HTTPException(status_code=504, detail="Timeout or Network error communicating with Azure DI")
