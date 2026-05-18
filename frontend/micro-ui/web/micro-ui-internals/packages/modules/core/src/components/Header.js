import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import { Loader } from "@egovernments/digit-ui-react-components";

const Header = ({ tenantsData }) => {
  const { data: storeData, isLoading } = Digit.Hooks.useStore.getInitData();
  const { stateInfo } = storeData || {};
  const { t } = useTranslation();

  if (isLoading) return <Loader />;
  return (
    <div className="bannerHeader">
      <img className="bannerLogo" src={stateInfo?.logoUrl} alt="" />
      <p>{t(tenantsData?.[0]?.state)}</p>
    </div>
  );
};

Header.propTypes = {
  tenantsData: PropTypes.arrayOf(PropTypes.any),
};

export default Header;
