import _ from "lodash";

const useGetHearingLink = (moduleName = "Hearing", masterName = [{ name: "HearingLink" }]) => {
  return Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), moduleName, masterName, {
    select: (data) => {
      const hearingLinks = _.get(data, "Hearing.HearingLink", []);
      return hearingLinks[0].link;
    },
  });
};

export default useGetHearingLink;
