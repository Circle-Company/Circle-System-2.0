#Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Instalar FFmpeg e dependências necessárias para Alpine Linux
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

# Copiar arquivos de dependências
COPY package*.json ./ 
COPY tsconfig*.json ./
COPY tsc-alias.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte e scripts de build
COPY src ./src
COPY scripts ./scripts

# Executar build (compila TypeScript e corrige paths)
RUN npm run build

#Production stage ---------------------------
FROM node:18-alpine AS production

WORKDIR /app

# Instalar FFmpeg e wget para Alpine Linux
RUN apk add --no-cache ffmpeg wget

# Copiar apenas o necessário do build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules

# Criar diretórios necessários
RUN mkdir -p uploads/videos uploads/thumbnails models/huggingface

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["npm", "start"]