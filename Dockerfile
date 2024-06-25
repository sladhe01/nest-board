FROM node:18.17.0

ARG PORT=3000

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE $PORT

CMD [ "npm", "run", "start:dev" ]
