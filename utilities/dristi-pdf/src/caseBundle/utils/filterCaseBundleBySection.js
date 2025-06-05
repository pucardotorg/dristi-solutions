/**
 *
 * @param {import("./buildCasePdf").CaseBundleMaster[]} caseBundleMasterData
 * @param {string} sectionName
 * @returns
 */
function filterCaseBundleBySection(caseBundleMasterData, sectionName) {
  return caseBundleMasterData.filter(
    (indexItem) =>
      indexItem.name === sectionName && indexItem.isactive === "yes"
  );
}

module.exports = {
  filterCaseBundleBySection,
};
