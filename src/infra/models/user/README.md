# Modelos de Usuário

## UserStatistics Model

O modelo `UserStatistics` foi projetado para armazenar métricas profissionais e técnicas sobre usuários na rede social, permitindo análise rápida de performance e comportamento.

### Métricas Disponíveis

#### 📊 Métricas de Engajamento

-   `total_likes_received`: Total de likes recebidos
-   `total_views_received`: Total de visualizações recebidas
-   `total_shares_received`: Total de compartilhamentos recebidos
-   `total_comments_received`: Total de comentários recebidos

#### 📝 Métricas de Conteúdo

-   `total_memories_created`: Total de memórias criadas
-   `total_moments_created`: Total de momentos criados

#### 🤝 Métricas de Interação

-   `total_likes_given`: Total de likes dados
-   `total_comments_given`: Total de comentários dados
-   `total_shares_given`: Total de compartilhamentos dados
-   `total_follows_given`: Total de seguidores dados
-   `total_reports_given`: Total de reports dados

#### 👥 Métricas de Rede Social

-   `total_followers`: Total de seguidores
-   `total_following`: Total de pessoas que o usuário segue
-   `total_relations`: Total de relações

#### 📈 Métricas de Retenção

-   `days_active_last_30`: Dias ativos nos últimos 30 dias
-   `days_active_last_7`: Dias ativos nos últimos 7 dias
-   `last_active_date`: Data da última atividade
-   `current_streak_days`: Sequência atual de dias ativos
-   `longest_streak_days`: Maior sequência de dias ativos

#### ⏱️ Métricas de Tempo

-   `total_session_time_minutes`: Tempo total de sessão em minutos
-   `average_session_duration_minutes`: Duração média de sessão
-   `total_time_spent_minutes`: Tempo total gasto na plataforma

#### 🎯 Métricas de Qualidade

-   `engagement_rate`: Taxa de engajamento (0-1)
-   `reach_rate`: Taxa de alcance (0-1)
-   `moments_quality_score`: Score de qualidade dos momentos (0-1)

#### 📊 Métricas de Crescimento

-   `moments_published_growth_rate_30d`: Taxa de crescimento de momentos publicados (30 dias)
-   `memories_published_growth_rate_30d`: Taxa de crescimento de memórias publicadas (30 dias)
-   `follower_growth_rate_30d`: Taxa de crescimento de seguidores (30 dias)
-   `engagement_growth_rate_30d`: Taxa de crescimento de engajamento (30 dias)
-   `interactions_growth_rate_30d`: Taxa de crescimento de interações (30 dias)

#### 🎭 Métricas de Comportamento

-   `memories_per_day_average`: Média de memórias por dia
-   `moments_per_day_average`: Média de momentos por dia
-   `interactions_per_day_average`: Média de interações por dia
-   `peak_activity_hour`: Hora de pico de atividade (0-23)
-   `preferred_content_type`: Tipo de conteúdo preferido

### Métodos Úteis

#### Cálculos Automáticos

```typescript
// Calcular taxa de engajamento
const engagementRate = userStats.calculateEngagementRate()

// Calcular taxa de alcance
const reachRate = userStats.calculateReachRate()

// Calcular coeficiente viral
const viralCoeff = userStats.calculateViralCoefficient()

// Calcular score de qualidade dos momentos
const qualityScore = userStats.calculateMomentsQualityScore()
```

#### Atualizações de Métricas

```typescript
// Atualizar métricas de engajamento
await userStats.updateEngagementMetrics(
    likesReceived: 5,
    viewsReceived: 100,
    sharesReceived: 2,
    commentsReceived: 3
)

// Atualizar métricas de conteúdo
await userStats.updateContentMetrics(
    memoriesCreated: 1,
    momentsCreated: 2
)

// Atualizar métricas sociais
await userStats.updateSocialMetrics(
    followersChange: 10,
    followingChange: 5
)

// Atualizar métricas de atividade
await userStats.updateActivityMetrics(sessionTimeMinutes: 30)
```

#### Resumo de Métricas

```typescript
// Obter resumo completo das métricas
const summary = userStats.getMetricsSummary()
console.log(summary.engagement.rate)
console.log(summary.content.qualityScore)
console.log(summary.social.followers)
console.log(summary.retention.currentStreak)
```

### Uso Recomendado

1. **Atualização em Tempo Real**: Use os métodos `update*Metrics()` sempre que houver interações
2. **Cálculos Periódicos**: Execute cálculos de métricas complexas em background jobs
3. **Cache de Resultados**: Armazene métricas calculadas para consultas rápidas
4. **Índices de Banco**: Crie índices nas colunas mais consultadas (followers, engagement_rate, etc.)

### Performance

-   Todas as métricas são otimizadas para consultas rápidas
-   Valores padrão são definidos para evitar NULLs
-   Timestamps de atualização permitem controle de cache
-   Métricas calculadas são armazenadas para evitar recálculos

### Exemplo de Implementação

```typescript
// Ao receber um like
await userStats.updateEngagementMetrics(likesReceived: 1)

// Ao criar uma memória ou momento
await userStats.updateContentMetrics(memoriesCreated: 1, momentsCreated: 0)

// Ao seguir alguém
await userStats.updateSocialMetrics(followersChange: 1)

// Ao finalizar uma sessão
await userStats.updateActivityMetrics(sessionTimeMinutes: 15)

// Obter métricas para dashboard
const metrics = userStats.getMetricsSummary()
```

Este modelo fornece uma base sólida para análise de usuários e tomada de decisões baseadas em dados na rede social.
