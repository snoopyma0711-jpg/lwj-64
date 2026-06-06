FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN cp vite.config.docker.js vite.config.js && npm run build

EXPOSE 5173

CMD ["npm", "run", "preview"]
