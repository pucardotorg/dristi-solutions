import React from "react";
import HomeHeader from "../../components/HomeHeader";
import { useTranslation } from "react-i18next";

const MainHomeScreen = () => {
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <HomeHeader t={t} />
    </React.Fragment>
  );
};

export default MainHomeScreen;
