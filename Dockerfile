FROM node:14 AS builder

WORKDIR /src
COPY . /src

RUN yarn install
RUN yarn build

FROM node:14

ENV NODE_ENV=production
WORKDIR /bot

COPY --from=builder /src/lib /bot/lib
COPY --from=builder /src/package*.json /bot
COPY --from=builder /src/yarn.lock /bot/yarn.lock
COPY --from=builder /src/config /bot/config

RUN yarn install

VOLUME /bot/config

CMD ["node", "lib/index.js"]
