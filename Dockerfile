#Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./ 
COPY tsconfig*.json ./ 

RUN npm install
COPY . .

RUN npm run build

CMD ["npm", "start"]

#Production stage ---------------------------
FROM node:18-alpine AS production

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.env ./

RUN npm install --only=production

RUN ls -la /app

CMD ["npm", "start"]