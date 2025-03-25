package pucar.strategy;

import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

public class SetBailTerms implements OrderUpdateStrategy {
    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public boolean supportsCommon() {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }


    // application details from application service
        // case details from case service   filing number
        // before publishing order

        //nothing

        //after publishing order

        //botd
        //close pending task Manual_ordernumber
        //new pending task for submit bail document

        // required field
        // status = create submission
        // name  sumbit_bail_document
        //entity type == bail document
        // reference number == manual_assignee UUId _ order number
        // assigned --- order additonal details

        //cnr number ---- order
        // filing number --- order

        // iscompleted --- false



}
