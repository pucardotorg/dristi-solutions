package pucar.strategy;

import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

public class InitiatingReschedulingOfHearingDate implements OrderUpdateStrategy {
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

    ///  reference id

        // before publish

        // after publish

        // search hearing (currentOrder.hearingNumber)

        // application need to search using reference id  to calculate available after

        // hearing id  ----- hearing search


        // update hearing  ( action reschedule , starttime = order .addtional details .formdata.newhearingdate ,end time =order .addtional details .formdata.newhearingdate)
        //call this end point

        /*
        /scheduler/hearing/v1/_reschedule
const handleRescheduleHearing = async ({ hearingBookingId, rescheduledRequestId, comments, date }) => {
   await schedulerService.RescheduleHearing(
     {
       RescheduledRequest: [
         {
           rescheduledRequestId: rescheduledRequestId,   currentOrder?.orderNumber;
           hearingBookingId: hearingBookingId,   current.order.hearingNumber
           tenantId: tenantId,
           judgeId: judgeId,
           caseId: filingNumber,
           hearingType: "ADMISSION",
           requesterId: "",
           reason: comments,     currentOrder?.comments
           availableAfter: date,       /// new Date(newApplicationDetails?.additionalDetails?.formdata?.changedHearingDate || currentOrder?.additionalDetails?.formdata?.originalHearingDate).getTime()
           rowVersion: 1,
           suggestedDates: null,
           availableDates: null,
           scheduleDate: null,
         },
       ],
     },
     {}
   );
 };

         */

}
