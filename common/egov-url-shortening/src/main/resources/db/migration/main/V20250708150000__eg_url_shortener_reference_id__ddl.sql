ALTER TABLE "eg_url_shortener" ADD COLUMN "reference_id" VARCHAR(128);

ALTER TABLE "eg_url_shortener" RENAME COLUMN "validform" TO "validfrom";
