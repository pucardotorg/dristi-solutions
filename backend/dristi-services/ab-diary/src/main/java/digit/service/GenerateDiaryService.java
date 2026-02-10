package digit.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.util.MdmsUtil;
import digit.web.models.CaseDiary;
import digit.web.models.CaseDiaryGenerateRequest;
import digit.web.models.CourtRoom;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class GenerateDiaryService {

    @Autowired
    private Configuration configuration;

    @Autowired
    private DiaryService diaryService;

    @Autowired
    private UserService userService;

    @Autowired
    private MdmsUtil mdmsUtil;

    @Autowired
    private ObjectMapper objectMapper;

    // This runs everyday at 11:59 PM
    //0 59 23 * * *

    @Scheduled(cron = "#{@scheduleCronExpression}", zone = IST_TIME_ZONE)
    public void generateDiary() {
        log.info("Starting cron job for generating diary");

        try {
            CaseDiaryGenerateRequest generateRequest = new CaseDiaryGenerateRequest();
            RequestInfo requestInfo = createInternalRequestInfo();
            CaseDiary diary = new CaseDiary();
            diary.setDiaryDate(generateDiaryDate());
            diary.setDiaryType(DIARY_TYPE);
            List<String> courtRooms = getActiveCourtRooms();
            diary.setTenantId(configuration.getTenantId());

            // generate for all active court rooms
            courtRooms.forEach(courtRoom -> {
                diary.setCourtId(courtRoom);
                generateRequest.setDiary(diary);
                generateRequest.setRequestInfo(requestInfo);
                diaryService.generateDiary(generateRequest);
            });
        } catch (Exception ex) {
            log.error("Error generating diary :: {}", ex.getMessage());
        }

        log.info("Cron job completed for generating diary");
    }

    private List<String> getActiveCourtRooms() {
        Map<String, Map<String, JSONArray>> courtRooms = mdmsUtil.fetchMdmsData(RequestInfo.builder().build(), configuration.getTenantId(), COMMON_MASTER_MODULE, List.of(COURT_ROOM_MASTER));
        JSONArray jsonArray = courtRooms.get(COMMON_MASTER_MODULE).get(COURT_ROOM_MASTER);
        List<CourtRoom> rooms = objectMapper.convertValue(jsonArray, new TypeReference<List<CourtRoom>>() {
        });
        return rooms.stream().map(CourtRoom::getCode).toList();
    }

    private Long generateDiaryDate() {
        // Get current date
        LocalDate today = LocalDate.now(ZoneId.of(IST_TIME_ZONE));

        // Get 12:00 AM time for today
        ZonedDateTime midnight = today.atStartOfDay(ZoneId.of(IST_TIME_ZONE));

        // Convert to epoch milliseconds
        long epochMillis = midnight.toInstant().toEpochMilli();

        log.info("Epoch Time (Milliseconds) :: {} for date :: {} " , epochMillis,today);
        return epochMillis;
    }

    private RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setType(SYSTEM);
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setTenantId(configuration.getTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }
}