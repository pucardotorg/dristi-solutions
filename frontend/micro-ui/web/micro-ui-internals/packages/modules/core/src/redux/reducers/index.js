export const commonReducer = (defaultData) => (state = defaultData, action) => {
  if (action.type === "LANGUAGE_SELECT") {
    return { ...state, selectedLanguage: action.payload };
  }
  return state;
};
