FROM node:20

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all
COPY . .

# Create folder uploads (id not exist)
RUN mkdir -p uploads/profiles uploads/reports
COPY data/database.db /app/data/database.db
COPY uploads /app/uploads

EXPOSE 3001

CMD ["node", "server.mjs"]
