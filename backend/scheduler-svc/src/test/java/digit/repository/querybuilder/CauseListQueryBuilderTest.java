package digit.repository.querybuilder;

import digit.web.models.CauseListSearchCriteria;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class CauseListQueryBuilderTest {

    @InjectMocks
    private CauseListQueryBuilder queryBuilder;

    private List<Object> preparedStmtList;
    private List<Integer> preparedStmtArgsList;

    @BeforeEach
    void setUp() {
        preparedStmtList = new ArrayList<>();
        preparedStmtArgsList = new ArrayList<>();
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetCauseListQuery_AllFields() {
        CauseListSearchCriteria criteria = new CauseListSearchCriteria();
        criteria.setCourtId("court1");
        criteria.setJudgeIds(Arrays.asList("judge1", "judge2"));
        criteria.setCaseIds(Arrays.asList("case1", "case2"));
        criteria.setSearchDate(LocalDate.of(2023, 1, 1));

        String query = queryBuilder.getCauseListQuery(criteria, preparedStmtList, preparedStmtArgsList);

        assertNotNull(query);
        assertEquals(6, preparedStmtList.size());
    }

    @Test
    void testGetCauseListQuery_EmptyCriteria() {
        CauseListSearchCriteria criteria = new CauseListSearchCriteria();

        String query = queryBuilder.getCauseListQuery(criteria, preparedStmtList, preparedStmtArgsList);

        assertNotNull(query);
        assertEquals(1, preparedStmtList.size());
    }

    @Test
    void testGetCauseListQuery_CourtIdOnly() {
        CauseListSearchCriteria criteria = new CauseListSearchCriteria();
        criteria.setCourtId("court1");

        String query = queryBuilder.getCauseListQuery(criteria, preparedStmtList, preparedStmtArgsList);

        assertNotNull(query);
        assertEquals(2, preparedStmtList.size());
    }

    @Test
    void testGetCauseListQuery_JudgeIdsOnly() {
        CauseListSearchCriteria criteria = new CauseListSearchCriteria();
        criteria.setJudgeIds(Arrays.asList("judge1", "judge2"));

        String query = queryBuilder.getCauseListQuery(criteria, preparedStmtList, preparedStmtArgsList);

        assertNotNull(query);
        assertEquals(3, preparedStmtList.size());
    }

    @Test
    void testGetCauseListQuery_CaseIdsOnly() {
        CauseListSearchCriteria criteria = new CauseListSearchCriteria();
        criteria.setCaseIds(Arrays.asList("case1", "case2"));

        String query = queryBuilder.getCauseListQuery(criteria, preparedStmtList, preparedStmtArgsList);

        assertNotNull(query);
        assertEquals(3, preparedStmtList.size());
    }

    @Test
    void testGetCauseListQuery_SearchDateOnly() {
        CauseListSearchCriteria criteria = new CauseListSearchCriteria();
        criteria.setSearchDate(LocalDate.of(2023, 1, 1));

        String query = queryBuilder.getCauseListQuery(criteria, preparedStmtList, preparedStmtArgsList);

        assertNotNull(query);
        assertEquals(1, preparedStmtList.size());
    }
}
