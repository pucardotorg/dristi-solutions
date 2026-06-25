import get from "lodash/get";

const useGetHearingLink = (moduleName = "Hearing", masterName = [{ name: "HearingLink" }]) => {
  return Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), moduleName, masterName, {
    select: (data) => {
      const hearingLinks = get(data, "Hearing.HearingLink", []);
      return hearingLinks[0].link;
    },
  });
};

export default useGetHearingLink;
