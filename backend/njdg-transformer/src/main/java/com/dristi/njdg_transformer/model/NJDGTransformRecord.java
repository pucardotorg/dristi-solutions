package com.dristi.njdg_transformer.model;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NJDGTransformRecord {

    private String cino;
    private String dateOfFiling;
    private String dtRegis;
    private String caseType;
    private String filNo;
    private String filYear;
    private String regNo;
    private String regYear;
    private String dateFirstList;
    private String dateNextList;
    private String pendDisp;
    private String dateOfDecision;
    private String dispReason;
    private String dispNature;
    private String desgname;
    private String courtNo;
    private String estCode;
    private String stateCode;
    private String distCode;
    private String purposeCode;
    private String petName;
    private String petAdv;
    private String petAdvCd;
    private String resName;
    private String resAdv;
    private String resAdvCd;
    private String petAdvBarReg;
    private String resAdvBarReg;
    private String policeStCode;
    private String policeNcode;
    private String firNo;
    private String policeStation;
    private String firYear;
    private LocalDate dateLastList;
    private String mainMatterCino;

    private List<JsonNode> petExtraParty; // JSONB array
    private List<JsonNode> resExtraParty; // JSONB array
    private String petAge;
    private String resAge;
    private String petAddress;
    private String resAddress;
    private String jocode;
    private String cicriType;

    private List<JsonNode> act; // JSONB array
    private List<JsonNode> historyOfCaseHearing; // JSONB array
    private List<JsonNode> interimOrder; // JSONB array
    private List<JsonNode> iaFiling; // JSONB array
}

