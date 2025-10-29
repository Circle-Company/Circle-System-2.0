# Setup do Banco de Dados para Comentários

Este documento descreve como configurar o banco de dados para suportar o sistema completo de comentários.

## Estrutura de Campos

A tabela `moment_comments` agora suporta todos os campos definidos em `CommentEntity`:

### Campos Básicos
- `id` (BIGINT): ID único do comentário
- `moment_id` (BIGINT): Referência ao momento
- `user_id` (BIGINT): Referência ao usuário autor
- `content` (TEXT): Conteúdo do comentário
- `parent_id` (BIGINT, nullable): Referência ao comentário pai (para respostas)

### Status e Visibilidade
- `status` (ENUM): Estado do comentário
  - `active`, `hidden`, `deleted`, `flagged`, `under_review`, `approved`, `rejected`
- `visibility` (ENUM): Visibilidade do comentário
  - `public`, `followers_only`, `private`, `hidden`
- `category` (ENUM): Categoria do comentário
  - Positivas: `positive`, `supportive`, `constructive`, `informative`, `funny`, `creative`
  - Neutras: `neutral`, `question`, `clarification`, `off_topic`
  - Negativas: `negative`, `spam`, `harassment`, `hate_speech`, `inappropriate`, `misleading`, `trolling`, `advertising`
  - Técnicas: `technical_issue`, `feature_request`, `bug_report`

### Análise de Sentimento
- `sentiment` (ENUM): `positive`, `negative`, `neutral`
- `sentiment_score` (FLOAT): Score numérico do sentimento

### Moderação
- `moderation_status` (ENUM): `pending`, `approved`, `rejected` (campo legado, mantido para compatibilidade)
- `moderation_flags` (JSONB): Array de flags de moderação
- `severity` (ENUM): `low`, `medium`, `high`, `critical`
- `moderation_score` (FLOAT): Score de moderação (0-100)
- `is_moderated` (BOOLEAN): Se foi moderado
- `moderated_at` (DATE, nullable): Data da moderação
- `moderated_by` (STRING, nullable): ID do moderador

### Métricas
- `likes_count` (INTEGER): Número de curtidas
- `replies_count` (INTEGER): Número de respostas
- `reports_count` (INTEGER): Número de denúncias
- `views_count` (INTEGER): Número de visualizações

### Metadados
- `mentions` (ARRAY[STRING]): Array de menções (@usuario)
- `hashtags` (ARRAY[STRING]): Array de hashtags (#tag)
- `metadata` (JSONB): Metadados adicionais em formato JSON

### Controle
- `deleted` (BOOLEAN): Flag de deleção (legado)
- `deleted_at` (DATE, nullable): Data da deleção
- `created_at` (DATE): Data de criação
- `updated_at` (DATE): Data da última atualização

## Migrations

### Migration Inicial
**Arquivo**: `20250928200231-create-moment-comments-table.js`

Cria a estrutura básica da tabela com campos essenciais e índices iniciais.

### Migration de Campos Completos
**Arquivo**: `20250129000001-add-comment-fields.js`

Adiciona todos os campos necessários para o sistema completo de comentários:
- Campos de status e visibilidade
- Sistema de categorização
- Campos de moderação completos
- Métricas de engajamento
- Arrays de menções e hashtags
- Metadados em JSONB

## Como Executar

### 1. Verificar Configuração do Banco

Certifique-se de que o PostgreSQL está rodando e configurado em `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=circle_system
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
```

### 2. Executar Migrations

```bash
# Executar todas as migrations pendentes
npm run migrate

# Ou usando sequelize-cli diretamente
npx sequelize-cli db:migrate
```

### 3. Verificar Status

```bash
# Ver migrations executadas
npx sequelize-cli db:migrate:status
```

### 4. Rollback (se necessário)

```bash
# Desfazer última migration
npx sequelize-cli db:migrate:undo

# Desfazer migration específica
npx sequelize-cli db:migrate:undo:all --to 20250928200231-create-moment-comments-table.js
```

## Índices Criados

Para otimizar consultas, os seguintes índices foram criados:

- `moment_comments_moment_id`: Busca por momento
- `moment_comments_moment_deleted_created`: Busca por momento com filtro de deleção e ordenação
- `moment_comments_user_id`: Busca por usuário
- `moment_comments_parent_id`: Busca de respostas
- `moment_comments_parent_deleted`: Busca de respostas não deletadas
- `moment_comments_created_at`: Ordenação temporal
- `moment_comments_moderation_status`: Filtro por status de moderação
- `moment_comments_status`: Filtro por status do comentário
- `moment_comments_category`: Filtro por categoria
- `moment_comments_visibility`: Filtro por visibilidade
- `moment_comments_is_moderated`: Filtro por moderação
- `moment_comments_severity`: Filtro por severidade
- `moment_comments_likes_count`: Ordenação por popularidade
- `moment_comments_mentions`: Busca por menções (GIN index)
- `moment_comments_hashtags`: Busca por hashtags (GIN index)

## Modelo Sequelize

O modelo `MomentComment` foi atualizado para incluir:

- Todos os campos da migration
- Tipos TypeScript apropriados
- Método `toEntity()` para converter para entidade de domínio
- Associações com `Moment`, `User` e self-reference para respostas

## Testando

Após executar as migrations, você pode testar a criação de um comentário:

```bash
curl --location 'http://localhost:3000/moments/690606903847288833/comments' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer SEU_TOKEN' \
--data '{
    "content": "O melhor de todos🔥🔥🔥🔥"
}'
```

## Troubleshooting

### Erro: "column does not exist"
Execute as migrations: `npm run migrate`

### Erro: "enum value not valid"
Verifique se a migration `20250129000001-add-comment-fields.js` foi executada.

### Performance lenta em buscas
Verifique se todos os índices foram criados corretamente:

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'moment_comments';
```

## Próximos Passos

1. Execute as migrations no banco de dados
2. Reinicie a aplicação
3. Teste o endpoint de criação de comentários
4. Verifique logs para garantir que não há erros de mapeamento

