INSERT INTO EG_ROLE (ID,NAME,DESCRIPTION,CREATEDDATE,CREATEDBY,LASTMODIFIEDBY,LASTMODIFIEDDATE,	VERSION,CODE,TENANTID) 
values(nextval('seq_eg_role'),'TL Admin','Who has a access to Trade License Masters',now(),1,1,now(),0,'TL_ADMIN','default');

	
--rollback delete from eg_role where name = 'TL Admin' and tenantid = 'default';
