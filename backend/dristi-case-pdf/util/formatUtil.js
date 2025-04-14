exports.formatCaseData = (data) => {
  // Modify the data structure to suit the PDF service requirements
  return {
    ...data,
    formattedField: data.someField.toUpperCase(),
  };
};

exports.getUniqueAcronym = (str) => {
  const words = str.replace(/[^a-zA-Z0-9 ]/g, "").split(" ");
  let acronym = words.map((word) => word[0].toUpperCase()).join("");
  if (acronym.length < 2 && words[0]) {
    acronym += words[0].slice(1, 3 - acronym.length).toUpperCase();
  }
  return acronym;
};
