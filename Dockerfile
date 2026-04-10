# base image
FROM node:20 AS base

WORKDIR /mst-certificate

ARG PORT

RUN npm install pm2 --location=global

COPY package.json .
COPY package-lock.json .

ENV HUSKY=0

RUN npm install

RUN apt-get update && \
    apt-get install -y \
    chromium \
    libx11-xcb1 libxcomposite1 libxdamage1 libxi6 libxtst6 \
    libnss3 libxrandr2 libatk1.0-0 libxss1 libgconf-2-4 \
    libgtk-3-0 --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set environment variable for Puppeteer or Playwright to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set environment variable to skip Chromium download by Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY . .

EXPOSE ${PORT}

# development image
FROM base AS mst-certificate-dev

CMD ["npm", "run", "start:dev"]

# production image
FROM base AS mst-certificate

RUN npm run build

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
