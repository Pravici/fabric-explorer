FROM node:12-alpine as API

RUN apk --no-cache add python make g++
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY ts*.json ./
COPY src/ ./src/
RUN npm run build
RUN npm prune --production


FROM node:12-alpine as APP

RUN apk --no-cache add python make g++ git
WORKDIR /usr/src/app

COPY app/package*.json ./
RUN npm ci

COPY app/ts*.json ./
COPY app/src/ ./src/
COPY src/types.ts /usr/src/src/types.ts
COPY app/angular.json angular.json
COPY app/browserslist browserslist
RUN npm run build

FROM node:12-alpine

WORKDIR /usr/src/app

# API files
COPY --from=API /usr/src/app/node_modules node_modules
COPY --from=API /usr/src/app/dist dist
COPY --from=API /usr/src/app/package.json package.json
COPY --from=API /usr/src/app/package-lock.json package-lock.json

# APP files
COPY --from=APP /usr/src/app/dist/ static/

ENV NODE_ENV production
ENV PORT 4200
ENV NO_COLOR true

EXPOSE 4200

COPY version.json version.json

CMD [ "npm", "start" ]
