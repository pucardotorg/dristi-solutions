package com.example.esign;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "Esign")
public class EsignRequest {

    private String aspId;
    private String transactionId;
    private String responseUrl;
    private String hash;
    private String responseType;

    @XmlElement(name = "AspId")
    public String getAspId() {
        return aspId;
    }

    public void setAspId(String aspId) {
        this.aspId = aspId;
    }

    @XmlElement(name = "Txn")
    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    @XmlElement(name = "ResponseUrl")
    public String getResponseUrl() {
        return responseUrl;
    }

    public void setResponseUrl(String responseUrl) {
        this.responseUrl = responseUrl;
    }

    @XmlElement(name = "hash")
    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
    }

    @XmlElement(name = "ResponseType")
    public String getResponseType() {
        return responseType;
    }

    public void setResponseType(String responseType) {
        this.responseType = responseType;
    }
}
