package digit.web.controllers;

import digit.service.CauseListService;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class CauseListApiControllerTest {

    @Mock
    private CauseListService causeListService;


    @InjectMocks
    private CauseListApiController causeListApiController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testViewCauseList() {
        CauseListSearchRequest searchRequest = new CauseListSearchRequest();
        CauseList causeList = new CauseList();
        List<CauseList> causeLists = Collections.singletonList(causeList);
        when(causeListService.viewCauseListForTomorrow(any(CauseListSearchRequest.class))).thenReturn(causeLists);

        ResponseEntity<CauseListResponse> responseEntity = causeListApiController.viewCauseList(searchRequest);

        assertEquals(HttpStatus.CREATED, responseEntity.getStatusCode());
        assertEquals(1, responseEntity.getBody().getCauseList().size());
        assertEquals(causeList, responseEntity.getBody().getCauseList().get(0));
    }

    @Test
    void testDownloadCauseList() {
        CauseListSearchRequest searchRequest = new CauseListSearchRequest();
        ByteArrayResource resource = new ByteArrayResource(new byte[]{});
        when(causeListService.downloadCauseListForTomorrow(any(CauseListSearchRequest.class))).thenReturn(resource);

        ResponseEntity<Object> responseEntity = causeListApiController.downloadCauseList(searchRequest);

        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(MediaType.APPLICATION_PDF, responseEntity.getHeaders().getContentType());
        assertEquals("attachment; filename=\"causelist" + LocalDate.now().plusDays(1).toString() + ".pdf\"", responseEntity.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
        assertEquals(resource, responseEntity.getBody());
    }

    @Test
    void testRecentCauseList_shouldReturnRecentCauseListResponse() {
        // Given
        RecentCauseListSearchCriteria criteria = RecentCauseListSearchCriteria.builder()
                .courtId("COURT001")
                .build();

        RequestInfo requestInfo = RequestInfo.builder()
                .userInfo(User.builder().uuid("user-123").build())
                .build();

        RecentCauseListSearchRequest request = RecentCauseListSearchRequest.builder()
                .recentCauseListSearchCriteria(criteria)
                .requestInfo(requestInfo)
                .build();

        RecentCauseList recent1 = RecentCauseList.builder().fileStoreId("fs1").build();
        RecentCauseList recent2 = RecentCauseList.builder().fileStoreId("fs2").build();

        List<RecentCauseList> resultList = List.of(recent1, recent2);

        when(causeListService.getRecentCauseList(any())).thenReturn(resultList);

        // When
        ResponseEntity<Object> response = causeListApiController.recentCauseList(request);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(RecentCauseListResponse.class, response.getBody());

        RecentCauseListResponse actualResponse = (RecentCauseListResponse) response.getBody();
        assertNotNull(actualResponse.getResponseInfo());
        assertEquals(2, actualResponse.getRecentCauseList().size());
        assertEquals("fs1", actualResponse.getRecentCauseList().get(0).getFileStoreId());
        assertEquals("fs2", actualResponse.getRecentCauseList().get(1).getFileStoreId());
    }

}
