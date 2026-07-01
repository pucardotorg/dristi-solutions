package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.repository.querybuilder.TemplateConfigurationQueryBuilder;
import org.pucar.dristi.repository.rowmapper.*;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Repository
public class TemplateConfigurationRepository {

    private TemplateConfigurationQueryBuilder queryBuilder;

    private JdbcTemplate jdbcTemplate;

    private TemplateConfigurationRowMapper rowMapper;

    @Autowired
    public TemplateConfigurationRepository(TemplateConfigurationQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, TemplateConfigurationRowMapper rowMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
    }

    public List<TemplateConfiguration> getTemplateConfigurations(TemplateConfigurationCriteria criteria, Pagination pagination) {

        try {
            List<TemplateConfiguration> templateConfigurationList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();
            String templateQuery = "";
            templateQuery = queryBuilder.getTemplateConfigurationSearchQuery(criteria,preparedStmtList,preparedStmtArgList);

            templateQuery = queryBuilder.addOrderByQuery(templateQuery, pagination);
            log.info("Final template query :: {}", templateQuery);

            if(pagination !=  null) {
                Integer totalRecords = getTotalCountTemplateConfigurations(templateQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                pagination.setTotalCount(Double.valueOf(totalRecords));
                templateQuery = queryBuilder.addPaginationQuery(templateQuery, pagination, preparedStmtList, preparedStmtArgList);
            }
            if(preparedStmtList.size()!=preparedStmtArgList.size()){
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(),preparedStmtArgList.size());
                throw new CustomException(TEMPLATE_SEARCH_EXCEPTION, "Arg and ArgType size mismatch");
            }
            List<TemplateConfiguration> list = jdbcTemplate.query(templateQuery, preparedStmtList.toArray(),preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
            log.info("DB template list :: {}", list);
            if (list != null) {
                templateConfigurationList.addAll(list);
            }

            List<String> ids = new ArrayList<>();
            for (TemplateConfiguration order : templateConfigurationList) {
                ids.add(order.getId().toString());
            }
            if (ids.isEmpty()) {
                return templateConfigurationList;
            }
            return templateConfigurationList;
        }
        catch (CustomException e){
            log.error("Custom Exception while fetching template list :: {}",e.toString());
            throw e;
        }
        catch (Exception e){
            log.error("Error while fetching template list :: {}",e.toString());
            throw new CustomException(TEMPLATE_SEARCH_EXCEPTION,"Error while fetching template list: "+e.getMessage());
        }
    }

    public Integer getTotalCountTemplateConfigurations(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }

}