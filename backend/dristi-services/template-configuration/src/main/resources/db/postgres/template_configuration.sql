-- Table: public.template_configuration

-- DROP TABLE IF EXISTS public.template_configuration;

CREATE TABLE IF NOT EXISTS public.template_configuration
(
    id character varying(64) COLLATE pg_catalog."default" NOT NULL,
    tenantid character varying(64) COLLATE pg_catalog."default" NOT NULL,
    filingnumber character varying(64) COLLATE pg_catalog."default",
    courtid character varying(64) COLLATE pg_catalog."default",
    isactive boolean DEFAULT true,
    processtitle character varying(255) COLLATE pg_catalog."default",
    iscoverletterrequired boolean DEFAULT false,
    addressee text COLLATE pg_catalog."default",
    ordertext text COLLATE pg_catalog."default",
    coverlettertext text COLLATE pg_catalog."default",
    createdby character varying(64) COLLATE pg_catalog."default",
    createdtime bigint,
    lastmodifiedby character varying(64) COLLATE pg_catalog."default",
    lastmodifiedtime bigint,
    CONSTRAINT template_configuration_pkey PRIMARY KEY (id, tenantid)
)

TABLESPACE pg_default;

-- Index: idx_template_configuration_tenantid

CREATE INDEX IF NOT EXISTS idx_template_configuration_tenantid
    ON public.template_configuration USING btree
    (tenantid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Index: idx_template_configuration_filingnumber

CREATE INDEX IF NOT EXISTS idx_template_configuration_filingnumber
    ON public.template_configuration USING btree
    (filingnumber COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Index: idx_template_configuration_courtid

CREATE INDEX IF NOT EXISTS idx_template_configuration_courtid
    ON public.template_configuration USING btree
    (courtid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Index: idx_template_configuration_isactive

CREATE INDEX IF NOT EXISTS idx_template_configuration_isactive
    ON public.template_configuration USING btree
    (isactive ASC NULLS LAST)
    TABLESPACE pg_default;

-- Index: idx_template_configuration_createdtime

CREATE INDEX IF NOT EXISTS idx_template_configuration_createdtime
    ON public.template_configuration USING btree
    (createdtime DESC NULLS LAST)
    TABLESPACE pg_default;
