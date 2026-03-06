import { AdvocateDataContext } from "@egovernments/digit-ui-module-core";
import { useContext, useMemo } from "react";

// In case of citizen login, we need to extract the user id of the user on behalf of whom the junior advocate/clerk is viewing/doing actions from UI.
// For other citizens like litigant/POA, we need to return the same uuid.
// For advocates/clerks, we need to return the uuid of the senior office advocate selected from home dropdown.
const useGetAuthorizedUuid = (currentLoggedInUserUuid) => {
  const { AdvocateData } = useContext(AdvocateDataContext);

  return useMemo(() => {
    if (!currentLoggedInUserUuid) return currentLoggedInUserUuid;

    // This means logged in user is not an advocate or clerk, so return same uuid
    if (!AdvocateData?.uuid) return currentLoggedInUserUuid;

    //This means logged in user is Advocate but selected himself/herself from home dropdown.
    if (AdvocateData.uuid === currentLoggedInUserUuid) return currentLoggedInUserUuid;

    //This means logged in user is Clerk/junior advocate and has selected some senior office advocate from home dropdown.
    return AdvocateData.uuid;
  }, [currentLoggedInUserUuid, AdvocateData]);
};

export default useGetAuthorizedUuid;
