#!/usr/bin/env python3
"""
Script to update Elasticsearch case-search-index with stage and substage from case search API.
"""

import requests
import json
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
ES_HOST = "http://localhost:9200"
ES_USERNAME = <<username>>
ES_PASSWORD = <<password>>
ES_INDEX = "case-search-index"

CASE_SERVICE_HOST = "http://localhost:9090"
CASE_SEARCH_ENDPOINT = "/case/v2/search/details"

# Initialize Elasticsearch client
es = Elasticsearch(
    ES_HOST,
    basic_auth=(ES_USERNAME, ES_PASSWORD),
    verify_certs=False,
    request_timeout=60
)


def get_all_es_documents() -> List[Dict]:
    """
    Fetch all documents from case-search-index using scroll API.
    """
    logger.info(f"Fetching all documents from {ES_INDEX}")
    
    documents = []
    
    # Initial search request with scroll
    response = es.search(
        index=ES_INDEX,
        body={
            "query": {
                "match_all": {}
            },
            "size": 1000
        },
        scroll="2m"
    )
    
    scroll_id = response['_scroll_id']
    hits = response['hits']['hits']
    
    while hits:
        for hit in hits:
            documents.append({
                '_id': hit['_id'],
                '_source': hit['_source']
            })
        
        # Get next batch
        response = es.scroll(
            scroll_id=scroll_id,
            scroll="2m"
        )
        scroll_id = response['_scroll_id']
        hits = response['hits']['hits']
        
        logger.info(f"Fetched {len(documents)} documents so far...")
    
    # Clear scroll
    es.clear_scroll(scroll_id=scroll_id)
    
    logger.info(f"Total documents fetched: {len(documents)}")
    return documents


def search_case_by_filing_number(tenant_id: str, filing_number: str) -> Optional[Dict]:
    """
    Search for a case using the case service API by filing number.
    """
    url = f"{CASE_SERVICE_HOST}{CASE_SEARCH_ENDPOINT}"
    
    payload = {
        "RequestInfo": {
  "apiId": "Rainmaker",
  "authToken": "d76e6b9d-cb4c-411b-977f-a341c7858ad9",
  "userInfo": {
    "id": 357,
    "uuid": "a6a374d5-1a20-4577-9533-8c0f03705b8a",
    "userName": "michaelGeorgeJudge",
    "name": "Michael George",
    "mobileNumber": "8789867544",
    "emailId": "michaelGeorgeJudge@gmail.com",
    "locale": None,
    "type": "SYSTEM",
    "roles": [
      {
        "name": "VIEW_SCHEDULE_HEARING",
        "code": "VIEW_SCHEDULE_HEARING",
        "tenantId": "kl"
      },
      {
        "name": "BAIL_BOND_ESIGN",
        "code": "BAIL_BOND_ESIGN",
        "tenantId": "kl"
      },
      {
        "name": "EVIDENCE_SIGNER",
        "code": "EVIDENCE_SIGNER",
        "tenantId": "kl"
      },
      {
        "name": "APPLICATION_CREATOR",
        "code": "APPLICATION_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_PROCESS_NOTICE",
        "code": "VIEW_PROCESS_NOTICE",
        "tenantId": "kl"
      },
      {
        "name": "PLEA_CREATOR",
        "code": "PLEA_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "EXAMINATION_VIEWER",
        "code": "EXAMINATION_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "SUBMISSION_RESPONDER",
        "code": "SUBMISSION_RESPONDER",
        "tenantId": "kl"
      },
      {
        "name": "EVIDENCE_APPROVER",
        "code": "EVIDENCE_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "TASK_CREATOR",
        "code": "TASK_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_PROCESS_PROCLAMATION",
        "code": "VIEW_PROCESS_PROCLAMATION",
        "tenantId": "kl"
      },
      {
        "name": "PDF_CREATOR",
        "code": "PDF_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "APPLICATION_REJECTOR",
        "code": "APPLICATION_REJECTOR",
        "tenantId": "kl"
      },
      {
        "name": "HEARING_EDITOR",
        "code": "HEARING_EDITOR",
        "tenantId": "kl"
      },
      {
        "name": "PLEA_APPROVER",
        "code": "PLEA_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "ORDER_APPROVER",
        "code": "ORDER_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "SIGN_PROCESS_SUMMONS",
        "code": "SIGN_PROCESS_SUMMONS",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_SIGN_FORMS",
        "code": "VIEW_SIGN_FORMS",
        "tenantId": "kl"
      },
      {
        "name": "EVIDENCE_EDITOR",
        "code": "EVIDENCE_EDITOR",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_PROCESS_MISCELLANEOUS",
        "code": "VIEW_PROCESS_MISCELLANEOUS",
        "tenantId": "kl"
      },
      {
        "name": "SUBMISSION_APPROVER",
        "code": "SUBMISSION_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "DECRYPT_DATA_ROLE",
        "code": "DECRYPT_DATA_ROLE",
        "tenantId": "kl"
      },
      {
        "name": "MEDIATION_CREATOR",
        "code": "MEDIATION_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "MEDIATION_APPROVER",
        "code": "MEDIATION_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_ALL_CASES",
        "code": "VIEW_ALL_CASES",
        "tenantId": "kl"
      },
      {
        "name": "DELAY_CONDONATION_SUBMISSION_CREATOR_ROLE",
        "code": "DELAY_CONDONATION_SUBMISSION_CREATOR_ROLE",
        "tenantId": "kl"
      },
      {
        "name": "SIGN_DIGITALIZED_DOCUMENT_PLEA",
        "code": "SIGN_DIGITALIZED_DOCUMENT_PLEA",
        "tenantId": "kl"
      },
      {
        "name": "HEARING_SCHEDULER",
        "code": "HEARING_SCHEDULER",
        "tenantId": "kl"
      },
      {
        "name": "DIARY_APPROVER",
        "code": "DIARY_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "HEARING_VIEWER",
        "code": "HEARING_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "WORKFLOW_ABANDON",
        "code": "WORKFLOW_ABANDON",
        "tenantId": "kl"
      },
      {
        "name": "CERTIFIED_TRUE_COPY_APPLICATION",
        "code": "CERTIFIED_TRUE_COPY_APPLICATION",
        "tenantId": "kl"
      },
      {
        "name": "CTC_APPLICATION_APPROVER",
        "code": "CTC_APPLICATION_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "DEPOSITION_PUBLISHER",
        "code": "DEPOSITION_PUBLISHER",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_RE_SCHEDULE_APPLICATION",
        "code": "VIEW_RE_SCHEDULE_APPLICATION",
        "tenantId": "kl"
      },
      {
        "name": "PENDING_TASK_SHOW_SUMMON_WARRANT",
        "code": "PENDING_TASK_SHOW_SUMMON_WARRANT",
        "tenantId": "kl"
      },
      {
        "name": "BULK_RESCHEDULE_UPDATE_ACCESS",
        "code": "BULK_RESCHEDULE_UPDATE_ACCESS",
        "tenantId": "kl"
      },
      {
        "name": "ORDER_REASSIGN",
        "code": "ORDER_REASSIGN",
        "tenantId": "kl"
      },
      {
        "name": "DIARY_VIEWER",
        "code": "DIARY_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "SUBMISSION_CREATOR",
        "code": "SUBMISSION_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "Employee",
        "code": "EMPLOYEE",
        "tenantId": "kl"
      },
      {
        "name": "NOTIFICATION_APPROVER",
        "code": "NOTIFICATION_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "CASE_VIEWER",
        "code": "CASE_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_DASHBOARDS",
        "code": "VIEW_DASHBOARDS",
        "tenantId": "kl"
      },
      {
        "name": "ALLOW_SEND_FOR_SIGN_LATER",
        "code": "ALLOW_SEND_FOR_SIGN_LATER",
        "tenantId": "kl"
      },
      {
        "name": "PLEA_VIEWER",
        "code": "PLEA_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "NOTIFICATION_CREATOR",
        "code": "NOTIFICATION_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "HEARING_CREATOR",
        "code": "HEARING_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "EXAMINATION_APPROVER",
        "code": "EXAMINATION_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "JUDGE_ROLE",
        "code": "JUDGE_ROLE",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_SIGN_EVIDENCE",
        "code": "VIEW_SIGN_EVIDENCE",
        "tenantId": "kl"
      },
      {
        "name": "DIGITALIZED_DOCUMENT_ESIGN",
        "code": "DIGITALIZED_DOCUMENT_ESIGN",
        "tenantId": "kl"
      },
      {
        "name": "PENDING_TASK_CONFIRM_BOND_SUBMISSION",
        "code": "PENDING_TASK_CONFIRM_BOND_SUBMISSION",
        "tenantId": "kl"
      },
      {
        "name": "TASK_VIEWER",
        "code": "TASK_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "SIGN_DIGITALIZED_DOCUMENT_MEDIATION",
        "code": "SIGN_DIGITALIZED_DOCUMENT_MEDIATION",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_WITNESS_DEPOSITION",
        "code": "VIEW_WITNESS_DEPOSITION",
        "tenantId": "kl"
      },
      {
        "name": "MEDIATION_VIEWER",
        "code": "MEDIATION_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "ORDER_ESIGN",
        "code": "ORDER_ESIGN",
        "tenantId": "kl"
      },
      {
        "name": "SIGN_PROCESS_NOTICE",
        "code": "SIGN_PROCESS_NOTICE",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_RESCHEDULING_REQUESTS",
        "code": "VIEW_RESCHEDULING_REQUESTS",
        "tenantId": "kl"
      },
      {
        "name": "EXAMINATION_CREATOR",
        "code": "EXAMINATION_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_API_MONITOR",
        "code": "VIEW_API_MONITOR",
        "tenantId": "kl"
      },
      {
        "name": "HEARING_APPROVER",
        "code": "HEARING_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_REGISTER_CASES",
        "code": "VIEW_REGISTER_CASES",
        "tenantId": "kl"
      },
      {
        "name": "ORDER_VIEWER",
        "code": "ORDER_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_SIGN_ORDERS",
        "code": "VIEW_SIGN_ORDERS",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_BULK_RESCHEDULE_HEARINGS",
        "code": "VIEW_BULK_RESCHEDULE_HEARINGS",
        "tenantId": "kl"
      },
      {
        "name": "APPLICATION_APPROVER",
        "code": "APPLICATION_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_PROCESS_ATTACHMENT",
        "code": "VIEW_PROCESS_ATTACHMENT",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_PROCESS_SUMMONS",
        "code": "VIEW_PROCESS_SUMMONS",
        "tenantId": "kl"
      },
      {
        "name": "COURT_ASSIGNED_ROLE",
        "code": "COURT_ASSIGNED_ROLE",
        "tenantId": "kl"
      },
      {
        "name": "ALLOW_ADD_WITNESS",
        "code": "ALLOW_ADD_WITNESS",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_SCHEDULE_HEARING_HOME",
        "code": "VIEW_SCHEDULE_HEARING_HOME",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_PROCESS_WARRANT",
        "code": "VIEW_PROCESS_WARRANT",
        "tenantId": "kl"
      },
      {
        "name": "EVIDENCE_CREATOR",
        "code": "EVIDENCE_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "SIGN_PROCESS_ATTACHMENT",
        "code": "SIGN_PROCESS_ATTACHMENT",
        "tenantId": "kl"
      },
      {
        "name": "SIGN_PROCESS_PROCLAMATION",
        "code": "SIGN_PROCESS_PROCLAMATION",
        "tenantId": "kl"
      },
      {
        "name": "BAIL_BOND_APPROVER",
        "code": "BAIL_BOND_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "PLEA_EDITOR",
        "code": "PLEA_EDITOR",
        "tenantId": "kl"
      },
      {
        "name": "EVIDENCE_ESIGN",
        "code": "EVIDENCE_ESIGN",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_TODAYS_HEARINGS",
        "code": "VIEW_TODAYS_HEARINGS",
        "tenantId": "kl"
      },
      {
        "name": "Workflow Admin",
        "code": "WORKFLOW_ADMIN",
        "tenantId": "kl"
      },
      {
        "name": "SIGN_PROCESS_WARRANT",
        "code": "SIGN_PROCESS_WARRANT",
        "tenantId": "kl"
      },
      {
        "name": "CASE_EDITOR",
        "code": "CASE_EDITOR",
        "tenantId": "kl"
      },
      {
        "name": "PENDING_TASK_ORDER",
        "code": "PENDING_TASK_ORDER",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_DELAY_CONDONATION_APPLICATION",
        "code": "VIEW_DELAY_CONDONATION_APPLICATION",
        "tenantId": "kl"
      },
      {
        "name": "ORDER_DELETE",
        "code": "ORDER_DELETE",
        "tenantId": "kl"
      },
      {
        "name": "PENDING_TASK_SHOW_NOTICE_STATUS",
        "code": "PENDING_TASK_SHOW_NOTICE_STATUS",
        "tenantId": "kl"
      },
      {
        "name": "SIGN_DIGITALIZED_DOCUMENT_EXAMINATION",
        "code": "SIGN_DIGITALIZED_DOCUMENT_EXAMINATION",
        "tenantId": "kl"
      },
      {
        "name": "TASK_EDITOR",
        "code": "TASK_EDITOR",
        "tenantId": "kl"
      },
      {
        "name": "BAIL_BOND_VIEWER",
        "code": "BAIL_BOND_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "DIARY_EDITOR",
        "code": "DIARY_EDITOR",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_SIGN_BAIL_BOND",
        "code": "VIEW_SIGN_BAIL_BOND",
        "tenantId": "kl"
      },
      {
        "name": "ORDER_CREATOR",
        "code": "ORDER_CREATOR",
        "tenantId": "kl"
      },
      {
        "name": "MEDIATION_EDITOR",
        "code": "MEDIATION_EDITOR",
        "tenantId": "kl"
      },
      {
        "name": "CALCULATION_VIEWER",
        "code": "CALCULATION_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "PROCESS_MANAGEMENT_VIEWER",
        "code": "PROCESS_MANAGEMENT_VIEWER",
        "tenantId": "kl"
      },
      {
        "name": "CASE_APPROVER",
        "code": "CASE_APPROVER",
        "tenantId": "kl"
      },
      {
        "name": "EXAMINATION_EDITOR",
        "code": "EXAMINATION_EDITOR",
        "tenantId": "kl"
      },
      {
        "name": "VIEW_OTHERS_APPLICATION",
        "code": "VIEW_OTHERS_APPLICATION",
        "tenantId": "kl"
      }
    ],
    "active": True,
    "tenantId": "kl",
    "permanentCity": None
  },
  "msgId": "1780279565839|en_IN",
  "plainAccessRequest": {}
},
        "criteria": {
            "filingNumber": filing_number
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data.get('cases')
    except Exception as e:
        logger.error(f"Error searching case for filingNumber {filing_number}: {e}")
        return None


def update_elasticsearch_document(doc_id: str, stage: str) -> bool:
    """
    Update a single Elasticsearch document with stage in caseSubStage field.
    """
    try:
        # Get current document
        current_doc = es.get(index=ES_INDEX, id=doc_id)
        source = current_doc['_source']
        
        # Update stage and substage in the nested structure
        if 'Data' in source and 'caseDetails' in source['Data']:
            source['Data']['caseDetails']['caseSubStage'] = stage
            
            # Update the document
            es.index(
                index=ES_INDEX,
                id=doc_id,
                body=source
            )
            logger.info(f"Updated document {doc_id}: substage={stage}")
            return True
        else:
            logger.warning(f"Document {doc_id} has unexpected structure")
            return False
            
    except Exception as e:
        logger.error(f"Error updating document {doc_id}: {e}")
        return False


def process_documents():
    """
    Main function to process all documents.
    """
    # Fetch all documents
    documents = get_all_es_documents()
    
    updated_count = 0
    failed_count = 0
    skipped_count = 0
    
    for doc in documents:
        doc_id = doc['_id']
        source = doc['_source']
        
        try:
            # Extract filing number and tenant ID from document
            if 'Data' not in source or 'caseDetails' not in source['Data']:
                logger.warning(f"Skipping document {doc_id}: missing Data.caseDetails")
                skipped_count += 1
                continue
            
            case_details = source['Data']['caseDetails']
            filing_number = case_details.get('filingNumber')
            tenant_id = case_details.get('tenantId')
            
            if not filing_number or not tenant_id:
                logger.warning(f"Skipping document {doc_id}: missing filingNumber or tenantId")
                skipped_count += 1
                continue
            
            logger.info(f"Processing document {doc_id} (filingNumber: {filing_number})")
            
            # Search for case to get current stage
            case_data = search_case_by_filing_number(tenant_id, filing_number)
            
            if case_data:
                stage = case_data.get('stage')
                
                if stage:
                    # Update Elasticsearch document
                    success = update_elasticsearch_document(doc_id, stage)
                    if success:
                        updated_count += 1
                    else:
                        failed_count += 1
                else:
                    logger.warning(f"No stage found for filingNumber {filing_number}")
                    skipped_count += 1
            else:
                logger.warning(f"No case data found for filingNumber {filing_number}")
                skipped_count += 1
                
        except Exception as e:
            logger.error(f"Error processing document {doc_id}: {e}")
            failed_count += 1
    
    logger.info("=" * 50)
    logger.info("Processing complete!")
    logger.info(f"Updated: {updated_count}")
    logger.info(f"Failed: {failed_count}")
    logger.info(f"Skipped: {skipped_count}")
    logger.info(f"Total: {len(documents)}")
    logger.info("=" * 50)


def bulk_update_documents():
    """
    Alternative approach using bulk API for better performance.
    """
    logger.info(f"Fetching all documents from {ES_INDEX}")
    
    documents = get_all_es_documents()
    
    bulk_actions = []
    updated_count = 0
    failed_count = 0
    skipped_count = 0
    
    for doc in documents:
        doc_id = doc['_id']
        source = doc['_source']
        
        try:
            if 'Data' not in source or 'caseDetails' not in source['Data']:
                skipped_count += 1
                continue
            
            case_details = source['Data']['caseDetails']
            filing_number = case_details.get('filingNumber')
            tenant_id = case_details.get('tenantId')
            
            if not filing_number or not tenant_id:
                skipped_count += 1
                continue
            
            logger.info(f"Processing document {doc_id} (filingNumber: {filing_number})")
            
            # Search for case to get current stage
            case_data = search_case_by_filing_number(tenant_id, filing_number)
            
            if case_data:
                stage = case_data.get('stage')
                
                if stage:
                    # Update the source - only update caseSubStage with stage value
                    source['Data']['caseDetails']['caseSubStage'] = stage
                    
                    # Add to bulk actions
                    bulk_actions.append({
                        "_index": ES_INDEX,
                        "_id": doc_id,
                        "_source": source
                    })
                    updated_count += 1
                else:
                    skipped_count += 1
            else:
                skipped_count += 1
                
        except Exception as e:
            logger.error(f"Error processing document {doc_id}: {e}")
            failed_count += 1
    
    # Perform bulk update
    if bulk_actions:
        logger.info(f"Performing bulk update of {len(bulk_actions)} documents...")
        success, failed = bulk(es, bulk_actions)
        logger.info(f"Bulk update completed: {success} succeeded, {failed} failed")
    
    logger.info("=" * 50)
    logger.info("Processing complete!")
    logger.info(f"Updated: {updated_count}")
    logger.info(f"Failed: {failed_count}")
    logger.info(f"Skipped: {skipped_count}")
    logger.info(f"Total: {len(documents)}")
    logger.info("=" * 50)


if __name__ == "__main__":
    # Choose processing method
    # Use process_documents() for individual updates (safer, slower)
    # Use bulk_update_documents() for bulk updates (faster, but harder to debug)
    
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--bulk":
        logger.info("Using bulk update method")
        bulk_update_documents()
    else:
        logger.info("Using individual update method")
        process_documents()
