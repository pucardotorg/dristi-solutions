package notification.repository.rowmapper;

import lombok.extern.slf4j.Slf4j;
import notification.web.models.NotificationExists;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j

public class NotificationExistsRowMapper implements ResultSetExtractor<List<NotificationExists>> {

    @Override
    public List<NotificationExists> extractData(ResultSet rs) throws SQLException, DataAccessException {
        List<NotificationExists> notifications = new ArrayList<>();

        while (rs.next()) {
            NotificationExists notificationExists = NotificationExists.builder()
                    .id(UUID.fromString(rs.getString("id")))
                    .notificationNumber(rs.getString("notificationNumber"))
                    .notificationType(rs.getString("notificationType"))
                    .exists(rs.getBoolean("exists"))
                    .build();

            notifications.add(notificationExists);
        }

        return notifications;
    }
}

