# Docker - Circle System

## 📋 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+

## 🚀 Como usar

### 1. Build da imagem

```bash
docker-compose build
```

### 2. Iniciar serviços

```bash
docker-compose up -d
```

### 3. Verificar logs

```bash
docker-compose logs -f api
```

### 4. Parar serviços

```bash
docker-compose down
```

## 🏗️ Arquitetura Multi-Stage

### Build Stage
- **Base**: `node:18-alpine`
- **Dependências**: FFmpeg, Python3, Make, G++
- **Processo**: 
  1. Instala dependências com `npm ci`
  2. Compila TypeScript
  3. Corrige paths com `tsc-alias`

### Production Stage
- **Base**: `node:18-alpine`
- **Dependências**: FFmpeg, wget
- **Otimizações**:
  - Apenas arquivos necessários copiados
  - `node_modules` otimizado
  - Diretórios de upload criados
  - Health check configurado

## 📦 Volumes

- `postgres_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis
- `uploads_data`: Vídeos e thumbnails
- `models_data`: Modelos de ML

## 🔍 Health Checks

### API
- **Endpoint**: `http://localhost:3000/health`
- **Intervalo**: 30s
- **Timeout**: 10s
- **Start Period**: 40s
- **Retries**: 3

### Redis
- **Comando**: `redis-cli ping`
- **Intervalo**: 5s
- **Timeout**: 3s
- **Retries**: 5

## 🌐 Portas

- **API**: 3000
- **PostgreSQL**: 5422 (host) → 5432 (container)
- **Redis**: 6379

## 🔧 Variáveis de Ambiente

### Obrigatórias
- `DB_HOST`: postgres
- `DB_PORT`: 5432
- `DB_USER`: admin
- `DB_PASSWORD`: admin
- `DB_NAME`: circle_db
- `REDIS_HOST`: redis
- `REDIS_PORT`: 6379

### Opcionais
- `NODE_ENV`: production
- `PORT`: 3000
- `HOST`: 0.0.0.0
- `RATE_LIMIT`: 1000
- `RATE_LIMIT_TIME_WINDOW`: 60000

## 🐛 Troubleshooting

### Container não inicia
```bash
docker-compose logs api
docker-compose ps
```

### Rebuild completo
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Acessar container
```bash
docker exec -it circle-system sh
```

### Verificar FFmpeg
```bash
docker exec circle-system ffmpeg -version
```

## 📊 Monitoramento

### Status dos containers
```bash
docker-compose ps
```

### Health status
```bash
docker inspect --format='{{.State.Health.Status}}' circle-system
```

### Uso de recursos
```bash
docker stats circle-system
```

## 🔐 Segurança

- ✅ Multi-stage build (reduz superfície de ataque)
- ✅ Alpine Linux (imagem mínima)
- ✅ Não executa como root (TODO: adicionar USER)
- ✅ `.dockerignore` configurado
- ✅ Health checks ativos
- ✅ Restart policy configurada

## 📝 Notas

1. O `.env` é opcional no container (variáveis já definidas no `docker-compose.yml`)
2. FFmpeg é instalado em ambos os stages para processamento de vídeo
3. Volumes nomeados garantem persistência de dados
4. Health checks garantem disponibilidade antes de receber tráfego

