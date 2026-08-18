package digit.helper;


import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

@Component
public class QueryBuilderHelper {

    public void addClauseIfRequired(StringBuilder query, List<Object> preparedStmtList) {
        if (preparedStmtList.isEmpty()) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }

    public String createQuery(List<String> ids) {
        StringBuilder builder = new StringBuilder();
        int length = ids.size();
        for (int i = 0; i < length; i++) {
            builder.append(" ?");
            if (i != length - 1)
                builder.append(",");
        }
        return builder.toString();
    }


    public void addToPreparedStatement(List<Object> preparedStmtList,List<Integer> preparedStmtArgList, List<String> ids) {
        preparedStmtList.addAll(ids);
        for (int i = 0; i < ids.size(); i++) {
            preparedStmtArgList.add(Types.VARCHAR);
        }
    }


}
