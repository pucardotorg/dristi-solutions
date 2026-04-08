CREATE TABLE eg_men_events(

  tenantid character varying(256) NOT NULL,
  id character varying(500) NOT NULL,
  source character varying(256),
  eventtype character varying(256),
  name character varying(256),
  description character varying(256),
  status character varying(256),
  postedby character varying(256),
  referenceid character varying(256),
  recepient jsonb,
  eventdetails jsonb,
  actions jsonb,
  createdby character varying(256) NOT NULL,
  createdtime bigint NOT NULL,
  lastmodifiedby character varying(256),
  lastmodifiedtime bigint,
  
  CONSTRAINT pk_eg_men_events PRIMARY KEY (id)
  
);



CREATE TABLE eg_men_recepnt_event_registry(

  recepient character varying(500) NOT NULL,
  eventid character varying(500) NOT NULL
   
);


CREATE TABLE eg_men_user_llt(

  userid character varying(500) NOT NULL,
  lastlogintime bigint NOT NULL,
  
  CONSTRAINT pk_eg_llt PRIMARY KEY (userid)

);

ALTER TABLE eg_men_events RENAME TO eg_usrevents_events;
ALTER TABLE eg_men_recepnt_event_registry RENAME TO eg_usrevents_recepnt_event_registry;
ALTER TABLE eg_men_user_llt RENAME COLUMN lastlogintime TO lastaccesstime;
ALTER TABLE eg_men_user_llt RENAME TO eg_usrevents_user_lat;

ALTER TABLE eg_usrevents_events ADD COLUMN category character varying(256);

ALTER TABLE eg_usrevents_events ALTER COLUMN description TYPE text;

CREATE INDEX on_eventtype ON eg_usrevents_events ("eventtype");
CREATE INDEX on_status ON eg_usrevents_events ("status");
CREATE INDEX on_postedby ON eg_usrevents_events ("postedby");
CREATE INDEX on_tenantid ON eg_usrevents_events ("tenantid");

CREATE INDEX on_recepient ON eg_usrevents_recepnt_event_registry ("recepient");

CREATE INDEX IF NOT EXISTS index_eg_usrevents_events_name ON eg_usrevents_events (name);

CREATE INDEX IF NOT EXISTS index_eg_usrevents_events_referenceid ON eg_usrevents_events (referenceid);