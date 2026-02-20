import argparse
from utils import logger, migrate_witness_details, fetch_case_by_filing_number

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("filing_number", help="Filing number to fetch and update")
    args = parser.parse_args()

    filing_number = args.filing_number

    print(f"Fetching case for filing number: {filing_number}")
    case = fetch_case_by_filing_number(filing_number)

    if not case:
        logger.warning(f"No case found for filing number {filing_number}")
    else:
        migrate_witness_details([case])
