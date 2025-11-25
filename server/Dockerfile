FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Copia tutto tranne la cartella test
COPY . .
RUN rm -rf test

# Creiamo la cartella uploads (se non esiste)
RUN mkdir -p uploads/profiles uploads/reports

EXPOSE 3001

CMD ["node", "server.mjs"]
