import { useQuery } from "react-query";
import { sampleService } from "./services/sampleService";
import { searchTestResultData } from "./services/searchTestResultData";

export const useIndividualView = ({t,individualId,tenantId,config={} }) =>{
  return useQuery(["Individual Details"], () => searchTestResultData({ t, individualId, tenantId }), config);
};


