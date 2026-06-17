FROM node:22-alpine

WORKDIR /server

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
