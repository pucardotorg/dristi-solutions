import { useMemo } from "react";

const useSortedMDMSData = (moduleName, masterName, optionsKey, t) => {
  const stateId = Digit.ULBService.getStateId();

  const { data, isLoading, ...rest } = Digit.Hooks.useCustomMDMS(stateId, moduleName, [{ name: masterName }], {
    select: (mdmsData) => mdmsData?.[moduleName]?.[masterName] || [],
  });

  const sortedData = useMemo(() => {
    if (!data) return [];

    return [...data].sort((a, b) => {
      const labelA = t(a?.[optionsKey]) || "";
      const labelB = t(b?.[optionsKey]) || "";
      return labelA.localeCompare(labelB);
    });
  }, [data, t, optionsKey]);

  return { data: sortedData, isLoading,...rest };
};

export default useSortedMDMSData;
