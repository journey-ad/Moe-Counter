FROM node:16-alpine

WORKDIR /app

COPY . .

RUN yarn install

EXPOSE 3000

CMD ["yarn", "start"]
