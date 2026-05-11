# syntax=docker/dockerfile:1
FROM node:22-alpine AS build

RUN apk add --no-cache 'git>2.30.0'

ARG WORK_DIR=.
WORKDIR /app

ENV NODE_OPTIONS "--max-old-space-size=8168 --openssl-legacy-provider"

ARG REACT_APP_STATE_LEVEL_TENANT_ID
ENV REACT_APP_STATE_LEVEL_TENANT_ID ${REACT_APP_STATE_LEVEL_TENANT_ID}

# --- Dependency layer: only invalidated when package.json or yarn.lock changes ---
COPY web/package.json web/yarn.lock web/
COPY web/micro-ui-internals/package.json web/micro-ui-internals/
COPY web/micro-ui-internals/packages/libraries/package.json            web/micro-ui-internals/packages/libraries/
COPY web/micro-ui-internals/packages/react-components/package.json     web/micro-ui-internals/packages/react-components/
COPY web/micro-ui-internals/packages/css/package.json                  web/micro-ui-internals/packages/css/
COPY web/micro-ui-internals/packages/dristi-ui-css-scoped/package.json web/micro-ui-internals/packages/dristi-ui-css-scoped/
COPY web/micro-ui-internals/packages/node-sass-stub/package.json       web/micro-ui-internals/packages/node-sass-stub/
COPY web/micro-ui-internals/packages/modules/hearings/package.json     web/micro-ui-internals/packages/modules/hearings/
COPY web/micro-ui-internals/packages/modules/home/package.json         web/micro-ui-internals/packages/modules/home/
COPY web/micro-ui-internals/packages/modules/submissions/package.json  web/micro-ui-internals/packages/modules/submissions/
COPY web/micro-ui-internals/packages/modules/cases/package.json        web/micro-ui-internals/packages/modules/cases/
COPY web/micro-ui-internals/packages/modules/dristi/package.json       web/micro-ui-internals/packages/modules/dristi/
COPY web/micro-ui-internals/packages/modules/common/package.json       web/micro-ui-internals/packages/modules/common/
COPY web/micro-ui-internals/packages/modules/orders/package.json       web/micro-ui-internals/packages/modules/orders/
COPY web/micro-ui-internals/packages/modules/core/package.json         web/micro-ui-internals/packages/modules/core/

RUN --mount=type=cache,target=/root/.yarn,id=digit-ui-yarn \
    cd web && YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile

# --- Source layer: yarn install is skipped when only source files change ---
COPY . .

RUN cd web && ./install-deps.sh && yarn build:webpack

FROM nginx:mainline-alpine
ENV WORK_DIR=/var/web/ui

RUN mkdir -p ${WORK_DIR}

COPY --from=build /app/web/build ${WORK_DIR}/
COPY --from=build /app/web/docker/nginx.conf /etc/nginx/conf.d/default.conf
