from utils import fetch_case_count, logger, migrate_witness_details, fetch_cases_by_offset
from config import INITIAL_OFFSET, BATCH_SIZE


if __name__ == "__main__":
    try:
        case_count = fetch_case_count()
        print(f"Total case count: {case_count}")
        offset = INITIAL_OFFSET

        while offset < case_count:
            print(f"Processing offset: {offset}")
            batch_cases = fetch_cases_by_offset(offset)

            if not batch_cases:
                logger.warning(f"No cases returned for offset {offset}")
            else:
                migrate_witness_details(batch_cases)

            offset += BATCH_SIZE

    except Exception as e:
        logger.error(f"Fatal error during migration: {e}")

# Duplicate mobile number/email id:

# Dev:
# KL-001550-2025, KL-001479-2025, KL-001446-2025, KL-000137-2025, KL-001169-2025,
# KL-000860-2024, KL-000757-2024, KL-000435-2024, KL-000208-2024


# QA:
# KL-001384-2025, KL-001310-2025,KL-001309-2025,KL-001239-2025