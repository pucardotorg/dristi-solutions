package com.dristi.njdg_transformer.model;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NJDGTransformRecord {

    @Builder.Default
    private String cino = "";
    @Builder.Default
    private String dateOfFiling = "";
    @Builder.Default
    private String dtRegis = "";
    @Builder.Default
    private String caseType = "";
    @Builder.Default
    private String filNo = "";
    @Builder.Default
    private String filYear = "";
    @Builder.Default
    private String regNo = "";
    @Builder.Default
    private String regYear = "";
    @Builder.Default
    private String dateFirstList = "";
    @Builder.Default
    private String dateNextList = "";
    @Builder.Default
    private String pendDisp = "";
    @Builder.Default
    private String dateOfDecision = "";
    @Builder.Default
    private String dispReason = "";
    @Builder.Default
    private String dispNature = "";
    @Builder.Default
    private String desgname = "";
    @Builder.Default
    private String courtNo = "";
    @Builder.Default
    private String estCode = "";
    @Builder.Default
    private String stateCode = "";
    @Builder.Default
    private String distCode = "";
    @Builder.Default
    private String purposeCode = "";
    @Builder.Default
    private String petName = "";
    @Builder.Default
    private String petAdv = "";
    @Builder.Default
    private String petAdvCd = "";
    @Builder.Default
    private String resName = "";
    @Builder.Default
    private String resAdv = "";
    @Builder.Default
    private String resAdvCd = "";
    @Builder.Default
    private String petAdvBarReg = "";
    @Builder.Default
    private String resAdvBarReg = "";
    @Builder.Default
    private String policeStCode = "";
    @Builder.Default
    private String policeNcode = "";
    @Builder.Default
    private String firNo = "";
    @Builder.Default
    private String policeStation = "";
    @Builder.Default
    private String firYear = "";
    @Builder.Default
    private String dateLastList="";
    @Builder.Default
    private String mainMatterCino = "";

    @Builder.Default
    private List<JsonNode> petExtraParty = new ArrayList<>(); // JSONB array
    @Builder.Default
    private List<JsonNode> resExtraParty = new ArrayList<>(); // JSONB array
    @Builder.Default
    private String petAge = "";
    @Builder.Default
    private String resAge = "";
    @Builder.Default
    private String petAddress = "";
    @Builder.Default
    private String resAddress = "";
    @Builder.Default
    private String jocode = "";
    @Builder.Default
    private String cicriType = "";

    @Builder.Default
    private List<JsonNode> act = new ArrayList<>(); // JSONB array
    @Builder.Default
    private List<JsonNode> historyOfCaseHearing = new ArrayList<>(); // JSONB array
    @Builder.Default
    private List<JsonNode> interimOrder = new ArrayList<>(); // JSONB array
    @Builder.Default
    private List<JsonNode> iaFiling = new ArrayList<>(); // JSONB array
}

