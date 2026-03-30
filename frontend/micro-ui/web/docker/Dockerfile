# syntax=docker/dockerfile:1
FROM node:14.21.3-alpine AS build
# FROM ghcr.io/egovernments/alpine-node-builder-14:yarn AS build
RUN apk update && apk upgrade
RUN apk add --no-cache git>2.30.0
ARG WORK_DIR
WORKDIR /app
ENV NODE_OPTIONS "--max-old-space-size=8168"

ARG REACT_APP_STATE_LEVEL_TENANT_ID
ENV REACT_APP_STATE_LEVEL_TENANT_ID ${REACT_APP_STATE_LEVEL_TENANT_ID}

COPY ${WORK_DIR} .
RUN ls -lah

# --mount=type=cache persists the Yarn download cache on the build host between
# builds. Packages are not re-downloaded from the internet even when package.json
# changes, cutting install time from ~8 min to under 1 min on warm cache.
RUN --mount=type=cache,target=/root/.yarn \
    cd web/ \
    && ./install-deps.sh \
    && YARN_CACHE_FOLDER=/root/.yarn yarn install \
    && yarn build:webpack

FROM nginx:mainline-alpine
ENV WORK_DIR=/var/web/ui

RUN mkdir -p ${WORK_DIR}

COPY --from=build /app/web/build ${WORK_DIR}/
COPY --from=build /app/web/docker/nginx.conf /etc/nginx/conf.d/default.conf
