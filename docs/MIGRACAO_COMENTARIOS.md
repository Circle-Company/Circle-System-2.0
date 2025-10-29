# Migração - Sistema de Comentários

## Resumo das Alterações

As seguintes alterações foram realizadas para alinhar a entidade `Comment` com a tabela `moment_comments` do banco de dados:

### Campos Removidos

1. **`status`** - Removido da entidade e da tabela
   - Motivo: Simplificação do modelo. O status é gerenciado pelo campo `deleted_at`
   - Impacto: Métodos que dependiam de status foram ajustados

2. **`category`** - Removido da entidade e da tabela
   - Motivo: Categorização automática removida para simplificar o modelo
   - Impacto: Método `categorizeContent()` foi removido

### Campos da Tabela `moment_comments`

#### Campos Básicos
- `id` (BIGINT)
- `moment_id` (BIGINT)
- `user_id` (BIGINT)
- `content` (TEXT)
- `parent_id` (BIGINT, nullable)

#### Visibilidade e Sentimento
- `visibility` (ENUM: 'public', 'followers_only')
- `sentiment` (ENUM: 'positive', 'negative', 'neutral')
- `sentiment_score` (FLOAT)

#### Moderação
- `moderation_status` (ENUM: 'pending', 'approved', 'rejected')
- `moderation_flags` (JSONB)
- `severity` (ENUM: 'low', 'medium', 'high', 'critical')
- `moderation_score` (FLOAT)
- `is_moderated` (BOOLEAN)
- `moderated_at` (DATE, nullable)
- `moderated_by` (STRING, nullable)

#### Métricas
- `likes_count` (INTEGER)
- `replies_count` (INTEGER)
- `reports_count` (INTEGER)
- `views_count` (INTEGER)

#### Metadados
- `mentions` (ARRAY[STRING])
- `hashtags` (ARRAY[STRING])
- `metadata` (JSONB)

#### Controle
- `deleted` (BOOLEAN)
- `deleted_at` (DATE, nullable)
- `created_at` (DATE)
- `updated_at` (DATE)

### Mudanças na Entidade

#### Métodos Removidos
- `hide()` - Uso de `deletedAt` para ocultar
- `markForReview()` - Simplificado

#### Métodos Modificados
- `delete()` - Agora usa apenas `deletedAt`
- `reject()` - Deleta o comentário
- `canViewComment()` - Verifica `deletedAt` ao invés de status
- `canEditComment()` - Verifica `deletedAt` ao invés de status
- `toEntity()` - Remove campos `status` e `category`
- `fromEntity()` - Remove campos `status` e `category`

#### Lógica de Análise
- `analyzeContent()` - Removido
- `categorizeContent()` - Removido  
- Mantém apenas `analyzeSentiment()` para análise de sentimento

### Migration

**Arquivo**: `src/infra/database/migrations/20250928200231-create-moment-comments-table.js`

Esta migration cria a tabela com todos os campos necessários. Não é necessário executar migrations adicionais.

### Como Executar

1. **Executar a migration**:
```bash
npm run migrate
```

2. **Verificar a tabela criada**:
```sql
\d moment_comments
```

3. **Reiniciar a aplicação** para carregar o novo modelo

### Compatibilidade

Os campos removidos (`status` e `category`) eram utilizados para:
- Controlar estado do comentário (ativo, deletado, oculto) → substituído por `deletedAt`
- Categorizar automaticamente o comentário → funcionalidade removida

**Nota**: Caso precise de categorização no futuro, ela pode ser implementada em um serviço separado sem alterar a estrutura da tabela.

### Próximos Passos

1. ✅ Executar a migration
2. ✅ Atualizar modelo Sequelize
3. ✅ Testar criação de comentários
4. ⏳ Implementar testes unitários
5. ⏳ Documentar API

