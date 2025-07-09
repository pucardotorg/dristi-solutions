CREATE TABLE landing_page_notices (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    language VARCHAR(50),
    validTill int8,
    fileStoreId VARCHAR(255),
    noticeNumber VARCHAR(100),
    publishedDate int8 NOT NULL,
    createdBy VARCHAR(100),
    createdTime int8,
    lastModifiedBy VARCHAR(100),
    lastModifiedTime int8
);
