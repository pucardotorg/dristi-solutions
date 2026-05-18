/**
 * Receipt / success-modal defaults shared by post-channel summon payment flows
 * (`PaymentForSummonModal`, `PaymentForSummonModalSMSAndEmail`). RPAD uses a
 * different template in `PaymentForRPADModal`.
 */
export const submitModalInfoPostPayment = {
  header: "CS_HEADER_FOR_SUMMON_POST",
  subHeader: "CS_SUBHEADER_TEXT_FOR_Summon_POST",
  caseInfo: [
    {
      key: "Case Number",
      value: "FSM-2019-04-23-898898",
    },
  ],
  isArrow: false,
  showTable: true,
};
