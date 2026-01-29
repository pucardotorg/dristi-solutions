FROM node:20.18.0-alpine

ARG WORK_DIR
WORKDIR /app

COPY ${WORK_DIR} .

RUN yarn install

# set your port
ENV PORT 8080
# expose the port to outside world
EXPOSE  8080

# start command as per package.json
CMD ["yarn", "start"]
