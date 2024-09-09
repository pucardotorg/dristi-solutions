package org.pucar.dristi.repository.rowMapper;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.Order;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.*;

@Component
@Slf4j
public class JudgementRowMapper implements ResultSetExtractor<List<Order>> {

    public List<Order> extractData(ResultSet rs) {
        Map<String, Order> orderMap = new LinkedHashMap<>();
        try {
            while (rs.next()) {
                Order order = Order.builder()
                        .id(UUID.fromString(rs.getString("id")))
                        .tenantId(rs.getString("tenantid"))
                        .filingNumber(rs.getString("filingnumber"))
                        .cnrNumber(rs.getString("cnrnumber"))
                        .applicationNumber(stringToList(rs.getString("applicationnumber")))
                        .hearingNumber(rs.getString("hearingnumber"))
                        .orderNumber(rs.getString("ordernumber"))
                        .linkedOrderNumber(rs.getString("linkedordernumber"))
                        .createdDate(rs.getLong("createddate"))
                        .orderType(rs.getString("ordertype"))
                        .orderCategory(rs.getString("ordercategory"))
                        .status(rs.getString("status"))
                        .comments(rs.getString("comments"))
                        .isActive(rs.getBoolean("isactive"))
                        .additionalDetails(rs.getString("additionaldetails"))
                        .build();
                orderMap.put(order.getFilingNumber(), order);
            }
            return orderMap.values().stream().toList();
        }
        catch (Exception e) {
            log.error("Error while mapping judgement row: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public List<String> stringToList(String str){
        List<String> list = new ArrayList<>();
        if(str!=null){
            StringTokenizer st = new StringTokenizer(str,",");
            while (st.hasMoreTokens()) {
                list.add(st.nextToken());
            }
        }

        return list;
    }


}
