function getDynamicSectionNumber(indexCopy, sectionPosition) {
  return (
    indexCopy.sections
      .slice(0, sectionPosition)
      .filter(
        (s) =>
          s.name !== "titlepage" &&
          Array.isArray(s.lineItems) &&
          s.lineItems.length > 0
      ).length + 1
  );
}

module.exports = {
  getDynamicSectionNumber,
};
