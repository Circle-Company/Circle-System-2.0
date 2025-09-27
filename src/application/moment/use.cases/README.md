# Use Cases - Moments

## Entidade Principal: Moment

O `Moment` é a entidade central do sistema, representando conteúdo de vlog criado pelos usuários. Cada momento contém:

-   **Conteúdo**: Vídeo, áudio, metadados de mídia
-   **Status**: Ciclo de vida (pendente → em análise → publicado → arquivado)
-   **Visibilidade**: Controle de acesso (público, seguidores, privado)
-   **Métricas**: Engajamento, visualizações, performance
-   **Contexto**: Dispositivo, localização, processamento

## Rotas Necessárias

### 📝 Gerenciamento de Moments (Usuário)

```
POST   /moments                      # Criar momento
GET    /moments/:id                  # Buscar momento específico
PUT    /moments/:id                  # Atualizar momento
DELETE /moments/:id                  # Deletar momento (soft delete)

GET    /moments                      # Listar momentos (com filtros)
GET    /users/:userId/moments        # Momentos de um usuário
POST   /moments/:id/publish          # Publicar momento
POST   /moments/:id/archive          # Arquivar momento
PUT    /moments/:id/visibility       # Alterar visibilidade
```

### 👑 Gerenciamento Admin de Moments

```
GET    /admin/moments                # Listar todos os momentos (admin)
GET    /admin/moments/:id            # Ver detalhes completos (admin)
PUT    /admin/moments/:id/status     # Alterar status (admin)
PUT    /admin/moments/:id/block      # Bloquear momento
PUT    /admin/moments/:id/unblock    # Desbloquear momento
DELETE /admin/moments/:id            # Deletar permanentemente (admin)
PUT    /admin/moments/:id/reason     # Definir motivo de bloqueio/rejeição

GET    /admin/moments/pending        # Momentos pendentes de moderação
GET    /admin/moments/blocked        # Momentos bloqueados
GET    /admin/moments/reported       # Momentos reportados
GET    /admin/moments/analytics      # Analytics administrativos
```

### 📊 Gerenciamento de Métricas

```
GET    /moments/:id/metrics          # Métricas de um momento
PUT    /moments/:id/metrics/views    # Incrementar visualizações
PUT    /moments/:id/metrics/like     # Curtir momento
PUT    /moments/:id/metrics/unlike   # Descurtir momento
PUT    /moments/:id/metrics/comment  # Adicionar comentário
PUT    /moments/:id/metrics/report   # Reportar momento

GET    /moments/trending             # Momentos em alta
GET    /moments/analytics            # Analytics gerais
GET    /admin/moments/metrics        # Métricas administrativas
```

### 🔍 Operações de Busca e Descoberta

```
GET    /moments/search?q=termo       # Busca textual
GET    /moments/by-hashtag/:tag      # Por hashtag
GET    /moments/by-location          # Por localização
GET    /moments/recommended          # Recomendações personalizadas
GET    /moments/nearby?lat=&lng=     # Momentos próximos
```

### ⚙️ Operações de Processamento

```
POST   /moments/:id/process          # Iniciar processamento
GET    /moments/:id/processing-status # Status do processamento
POST   /moments/:id/retry-processing # Reprocessar
GET    /admin/moments/processing-queue # Fila de processamento (admin)
```

### 📍 Gerenciamento de Localização (Admin)

```
GET    /admin/moments/locations      # Ver todas as localizações
GET    /admin/moments/locations/:id  # Detalhes de localização
GET    /admin/moments/heatmap        # Mapa de calor de momentos
GET    /admin/moments/locations/stats # Estatísticas por região
```

### 👍 Ações do Usuário

```
POST   /moments/:id/like             # Curtir momento
DELETE /moments/:id/like             # Descurtir momento
GET    /moments/:id/likes            # Ver quem curtiu

POST   /moments/:id/comment          # Comentar no momento
GET    /moments/:id/comments         # Ver comentários
PUT    /moments/:id/comments/:commentId # Editar comentário
DELETE /moments/:id/comments/:commentId # Deletar comentário

POST   /moments/:id/report           # Reportar momento
POST   /moments/:id/share            # Compartilhar momento

GET    /users/:userId/liked-moments  # Momentos curtidos pelo usuário
GET    /users/:userId/saved-moments  # Momentos salvos pelo usuário
GET    /users/:userId/commented-moments # Momentos comentados pelo usuário
```

### 🚨 Moderação e Relatórios

```
GET    /moments/:id/reports          # Ver reports de um momento
GET    /admin/reports                # Todos os reports (admin)
PUT    /admin/reports/:id/resolve    # Resolver report
GET    /admin/moments/moderation-log # Log de moderação
```

## Fluxo Principal

1. **Criação**: Usuário cria momento → Status: `UNDER_REVIEW`
2. **Processamento**: Sistema processa mídia → Status: `PROCESSING`
3. **Publicação**: Momento aprovado → Status: `PUBLISHED`
4. **Engajamento**: Usuários interagem → Métricas atualizadas
5. **Arquivamento**: Momento antigo → Status: `ARCHIVED`

## Notas Técnicas

-   Todos os IDs são `bigint`
-   Soft delete implementado
-   Métricas processadas assincronamente
-   Validação rigorosa de conteúdo (apenas humanos, 9:16 aspect ratio)
-   Sistema de embedding para recomendações
