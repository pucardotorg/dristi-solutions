DROP  TABLE IF EXISTS message;
DROP  SEQUENCE IF EXISTS SEQ_MESSAGE;

CREATE TABLE message (
	id bigint not null primary key,
	locale varchar(255) not null,
	code varchar(255) not null,
	message varchar(500) not null,
	tenantid character varying(256) not null,
	constraint unique_message_entry unique (locale, code, tenantid)
);

Create sequence SEQ_MESSAGE;

CREATE INDEX message_locale_tenant ON message (locale, tenantid);

ALTER TABLE message ADD COLUMN module varchar(255) NOT NULL DEFAULT 'default';
ALTER TABLE message ALTER COLUMN module DROP DEFAULT;
ALTER TABLE message DROP CONSTRAINT unique_message_entry;
ALTER TABLE message ADD	CONSTRAINT unique_message_entry unique (tenantid, locale, module, code);

ALTER TABLE message ADD COLUMN createdby bigint NOT NULL DEFAULT 1;
ALTER TABLE message ALTER COLUMN createdby DROP DEFAULT;
ALTER TABLE message ADD COLUMN createddate timestamp NOT NULL DEFAULT now();
ALTER TABLE message ADD COLUMN lastmodifiedby bigint;
ALTER TABLE message ADD COLUMN lastmodifieddate timestamp;

ALTER TABLE message ALTER COLUMN id TYPE varchar(512);

ALTER TABLE message ALTER COLUMN message TYPE varchar(1000);