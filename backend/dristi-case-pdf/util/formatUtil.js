exports.formatCaseData = (data) => {
  // Modify the data structure to suit the PDF service requirements
  return {
    ...data,
    formattedField: data.someField.toUpperCase(),
  };
};

exports.getUniqueAcronym = (str) => {
  if (!str) return "";

  // Clean and split string into words, filtering out empty strings
  const words = str
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean);

  // Map first character of each word to uppercase
  let acronym = words.map((word) => word[0].toUpperCase()).join("");

  // Add more letters from the first word if acronym is too short
  if (acronym.length < 2 && words[0]) {
    acronym += words[0].slice(1, 3 - acronym.length).toUpperCase();
  }
  return acronym;
};
