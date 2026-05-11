# syntax=docker/dockerfile:1
FROM node:22-alpine AS build

RUN apk add --no-cache 'git>2.30.0' python3 make g++ && \
    ln -sf /usr/bin/python3 /usr/bin/python

ARG WORK_DIR=.
WORKDIR /app

ENV NODE_OPTIONS "--max-old-space-size=8168 --openssl-legacy-provider"

ARG REACT_APP_STATE_LEVEL_TENANT_ID
ENV REACT_APP_STATE_LEVEL_TENANT_ID ${REACT_APP_STATE_LEVEL_TENANT_ID}

# --- Dependency layer: only invalidated when package.json or yarn.lock changes ---
COPY ${WORK_DIR}/web/package.json ${WORK_DIR}/web/yarn.lock web/
COPY ${WORK_DIR}/web/micro-ui-internals/package.json web/micro-ui-internals/
COPY ${WORK_DIR}/web/micro-ui-internals/packages/css/package.json                  web/micro-ui-internals/packages/css/
COPY ${WORK_DIR}/web/micro-ui-internals/packages/modules/hearings/package.json     web/micro-ui-internals/packages/modules/hearings/
COPY ${WORK_DIR}/web/micro-ui-internals/packages/modules/home/package.json         web/micro-ui-internals/packages/modules/home/
COPY ${WORK_DIR}/web/micro-ui-internals/packages/modules/submissions/package.json  web/micro-ui-internals/packages/modules/submissions/
COPY ${WORK_DIR}/web/micro-ui-internals/packages/modules/cases/package.json        web/micro-ui-internals/packages/modules/cases/
COPY ${WORK_DIR}/web/micro-ui-internals/packages/modules/dristi/package.json       web/micro-ui-internals/packages/modules/dristi/
COPY ${WORK_DIR}/web/micro-ui-internals/packages/modules/common/package.json       web/micro-ui-internals/packages/modules/common/
COPY ${WORK_DIR}/web/micro-ui-internals/packages/modules/orders/package.json       web/micro-ui-internals/packages/modules/orders/
COPY ${WORK_DIR}/web/micro-ui-internals/packages/modules/core/package.json         web/micro-ui-internals/packages/modules/core/

RUN --mount=type=cache,target=/root/.yarn,id=digit-ui-yarn \
    cd web && YARN_CACHE_FOLDER=/root/.yarn yarn install

# --- Source layer: yarn install is skipped when only source files change ---
COPY ${WORK_DIR} .

RUN cd web && ./install-deps.sh && yarn build:webpack

FROM nginx:mainline-alpine
ENV WORK_DIR=/var/web/ui

RUN mkdir -p ${WORK_DIR}

COPY --from=build /app/web/build ${WORK_DIR}/
COPY --from=build /app/web/docker/nginx.conf /etc/nginx/conf.d/default.conf
