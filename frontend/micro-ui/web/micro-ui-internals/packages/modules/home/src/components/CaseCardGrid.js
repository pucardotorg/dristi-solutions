import React from "react";
import _ from "lodash";
import { Loader } from "@egovernments/digit-ui-react-components";
import CaseCard from "./CaseCard";

// state and dispatch are passed directly as props by InboxSearchComposer,
// avoiding any cross-bundle InboxContext identity mismatch.
const CaseCardGrid = ({ config, data, isLoading, isFetching, additionalConfig, state, dispatch }) => {
  const resultsKey = config?.resultsJsonPath || "caseList";
  const rawList = _.get(data, resultsKey, []);
  const caseList = Array.isArray(rawList) ? [...rawList].reverse() : [];

  const limit = state?.tableForm?.limit || 10;
  const offset = state?.tableForm?.offset || 0;
  const totalCount = data?.totalCount || caseList.length;
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit);

  const goNext = () =>
    dispatch({ type: "tableForm", state: { limit, offset: offset + limit } });

  const goPrev = () =>
    dispatch({ type: "tableForm", state: { limit, offset: Math.max(0, offset - limit) } });

  const handleCardClick = (caseItem) =>
    additionalConfig?.resultsTable?.onClickRow?.({ original: caseItem });

  if (isLoading || isFetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "40px 0" }}>
        <Loader />
      </div>
    );
  }

  if (!data) return null;

  if (caseList.length === 0) {
    return (
      <div className="no-data-found">
        <span className="error-msg">No cases found.</span>
      </div>
    );
  }

  return (
    <div className="case-card-grid-wrapper">
      <div className="case-card-grid">
        {caseList.map((caseItem) => (
          <CaseCard
            key={caseItem?.id || caseItem?.filingNumber}
            caseItem={caseItem}
            onClick={() => handleCardClick(caseItem)}
          />
        ))}
      </div>

      {totalCount > limit && (
        <div className="case-card-grid__pagination">
          <button
            className="case-card-grid__page-btn"
            onClick={goPrev}
            disabled={offset === 0}
          >
            ‹ Prev
          </button>
          <span className="case-card-grid__page-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            className="case-card-grid__page-btn"
            onClick={goNext}
            disabled={offset + limit >= totalCount}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
};

export default CaseCardGrid;
