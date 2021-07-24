FROM node:16 AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:16

WORKDIR /app
COPY --from=build /app .
COPY . .

EXPOSE 3000
CMD ["node", "./build"]
