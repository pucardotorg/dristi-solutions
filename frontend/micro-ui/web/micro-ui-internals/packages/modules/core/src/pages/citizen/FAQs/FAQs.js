import { BackButton, Header, Loader } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import FaqComponent from "./FaqComponent";

const FAQsSection = ({ module }) => {
  const { t } = useTranslation();

  const { isLoading, data } = Digit.Hooks.useGetFAQsJSON(Digit.ULBService.getStateId());

  const moduleFaqs = data?.MdmsRes["common-masters"]?.faqs[0]?.[`${module}`].faqs;

  if (isLoading) {
    return <Loader />;
  }
  return (
    <div className="faq-page">
      <BackButton style={{ marginLeft: "unset" }}></BackButton>
      <div style={{ marginBottom: "15px" }}>
        <Header styles={{ marginLeft: "0px", paddingTop: "10px", fontSize: "32px" }}>{t("FAQ_S")}</Header>
      </div>
      <div className="faq-list">
        {moduleFaqs.map((faq, index) => (
          <FaqComponent
            key={`${faq.question}-${index}`}
            question={faq.question}
            answer={faq.answer}
            lastIndex={index === moduleFaqs.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

FAQsSection.propTypes = {
  module: PropTypes.string.isRequired,
};

export default FAQsSection;
