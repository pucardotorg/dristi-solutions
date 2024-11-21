package com.example.esign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RequestXmlForm {
    public String id;
    public String type;
    public String description;
    public String eSignRequest;
    public String aspTxnID;
    public String contentType;
}
