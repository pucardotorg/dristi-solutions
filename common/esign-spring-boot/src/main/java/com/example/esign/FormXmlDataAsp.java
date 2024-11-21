package com.example.esign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FormXmlDataAsp {

    private String ver;
    private String sc;
    private String ts;
    private String txn;
    private String ekycId;
    private String ekycIdType;
    private String aspId;
    private String authMode;
    private String responseSigType;
    private String responseUrl;
    private String id;
    private String hashAlgorithm;
    private String docInfo;
    private String docHashHex;
    private String digSigAsp;
}
