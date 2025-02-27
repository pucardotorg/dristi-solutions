export const cleanName = (name) => {
    if (!name) return "";
  
    return name
      ?.split(" ")
      ?.filter(
        (word) => word && !["undefined", "null"]?.includes(word.toLowerCase())
      ) 
      ?.join(" ");
  };