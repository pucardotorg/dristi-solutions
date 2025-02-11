package notification.repository.rowmapper;

import notification.web.models.Notification;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Component
public class NotificationRowMapper  implements ResultSetExtractor<List<Notification>> {
    @Override
    public List<Notification> extractData(ResultSet rs) throws SQLException, DataAccessException {
        return List.of();
    }
}
