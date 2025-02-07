CREATE TABLE dristi_adiary_activities (
                                     id varchar(36) NOT NULL PRIMARY KEY,
                                     tenant_id varchar(64) NOT NULL,
                                     entry_date int8 NOT NULL,
                                     additional_details jsonb,
                                     created_by varchar(36) NOT NULL,
                                     last_modified_by varchar(36) NOT NULL,
                                     created_time int8 NOT NULL,
                                     last_modified_time int8 NOT NULL,
                                     judge_id varchar(36) NOT NULL,
                                     CONSTRAINT unique_tenantId_entryDate_judgeId UNIQUE (tenant_id, entry_date, judge_id)
);


CREATE INDEX idx_dristi_adiary_activities_judge_tenantid ON dristi_adiary_activities(tenant_id, judge_id);
CREATE INDEX idx_dristi_adiary_activities_tenantid_judgeid_diarydate ON dristi_adiary_activities (tenant_id, judge_id, entry_date);