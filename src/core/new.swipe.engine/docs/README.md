# SwipeEngine - Sistema de Recomendação de Momentos

Sistema avançado de recomendações baseado em clustering e embeddings para feed de momentos.

## Arquitetura

O sistema segue princípios de **Clean Architecture** com **injeção de dependências** para máximo desacoplamento:

```
┌─────────────────────────────────────────┐
│      RecommendationEngine (Core)        │
├─────────────────────────────────────────┤
│  • Orquestra todo o fluxo                │
│  • Gerencia serviços                     │
│  • Coordena recomendações                │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│           Services Layer                 │
├─────────────────────────────────────────┤
│  • UserEmbeddingService                  │
│  • MomentEmbeddingService                │
│  • ClusterMatcher                        │
│  • CandidateSelector                     │
│  • RankingService                        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│        Algorithms Layer                  │
├─────────────────────────────────────────┤
│  • DBSCANClustering                      │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      Repository Interfaces               │
├─────────────────────────────────────────┤
│  • IUserEmbeddingRepository              │
│  • IMomentEmbeddingRepository            │
│  • IClusterRepository                    │
│  • IInteractionRepository                │
└─────────────────────────────────────────┘
```

## Fluxo de Recomendação

1. **Embedding do Usuário**: Gera ou busca o vetor de embedding do usuário baseado em seu histórico
2. **Perfil do Usuário**: Constrói perfil com interesses e preferências
3. **Clustering**: Busca ou gera clusters de momentos similares
4. **Matching**: Encontra clusters relevantes para o usuário
5. **Seleção de Candidatos**: Seleciona momentos dos clusters relevantes
6. **Ranking**: Ranqueia candidatos com múltiplos critérios
7. **Diversificação**: Aplica algoritmo MMR para diversificar resultados

## Componentes Principais

### RecommendationEngine

Engine principal que orquestra todo o processo de recomendação.

```typescript
const engine = new RecommendationEngine(config)

const recommendations = await engine.getRecommendations({
    userId: "user123",
    limit: 20,
    context: {
        timeOfDay: 18,
        dayOfWeek: 5,
    },
})
```

### UserEmbeddingService

Gerencia embeddings de usuários com atualização incremental.

**Features:**

-   Geração de embedding baseada em histórico de interações
-   Atualização incremental após cada interação
-   Cache com verificação de idade
-   Extração automática de interesses

### MomentEmbeddingService

Gerencia embeddings de momentos.

**Features:**

-   Geração de embedding de texto e tags
-   Combinação ponderada de features
-   Busca de momentos similares
-   Cálculo de similaridade de cosseno

### DBSCANClustering

Implementação do algoritmo DBSCAN para clustering baseado em densidade.

**Parâmetros:**

-   `epsilon`: Raio de vizinhança (default: 0.3)
-   `minPoints`: Pontos mínimos para cluster (default: 5)
-   `distanceFunction`: euclidean | cosine | manhattan

**Vantagens:**

-   Não requer número de clusters pré-definido
-   Detecta ruído automaticamente
-   Descobre clusters de forma arbitrária

### ClusterMatcher

Encontra clusters relevantes para um usuário.

**Estratégias:**

1. **Embedding-based**: Similaridade de cosseno com centroide
2. **Profile-based**: Match de interesses com tópicos
3. **Default**: Clusters populares

**Boosts Contextuais:**

-   Hora do dia
-   Dia da semana

### CandidateSelector

Seleciona candidatos de momentos dos clusters.

**Features:**

-   Exclusão de momentos já vistos
-   Distribuição balanceada entre clusters
-   Limite de janela temporal
-   Remoção de duplicatas

### RankingService

Ranqueia candidatos com múltiplos critérios.

**Scores Calculados:**

1. **Relevância** (40%): Similaridade com perfil do usuário
2. **Engajamento** (25%): Métricas de engajamento do momento
3. **Novidade** (15%): Frescor do conteúdo e tópicos novos
4. **Diversidade** (10%): Variedade de tópicos
5. **Contexto** (10%): Adequação ao contexto (hora, dia)

**Diversificação:**

-   Algoritmo MMR (Maximal Marginal Relevance)
-   Balanceia relevância e diversidade
-   Evita feed monótono

## Uso

### 1. Configurar Repositórios

Implemente as interfaces de repositório:

```typescript
class UserEmbeddingRepository implements IUserEmbeddingRepository {
    async findByUserId(userId: string): Promise<UserEmbedding | null> {
        // Implementação com banco de dados
    }

    async save(embedding: UserEmbedding): Promise<UserEmbedding> {
        // Implementação com banco de dados
    }

    // ... outros métodos
}
```

### 2. Criar Engine

```typescript
import { createRecommendationEngine } from "./core/new.swipe.engine"

const engine = createRecommendationEngine({
    repositories: {
        userEmbedding: new UserEmbeddingRepository(),
        momentEmbedding: new MomentEmbeddingRepository(),
        cluster: new ClusterRepository(),
        interaction: new InteractionRepository(),
    },
    params: {
        embedding: {
            timeWindows: {
                recentEmbeddingUpdate: 24 * 60 * 60 * 1000, // 24 horas
                interactionHistory: 30 * 24 * 60 * 60 * 1000, // 30 dias
            },
            dimensions: {
                embedding: 128,
                interactionHistory: 50,
                contentPreferences: 20,
                socialFeatures: 30,
            },
            // ... outros parâmetros
        },
        ranking: {
            weights: {
                relevance: 0.4,
                engagement: 0.25,
                novelty: 0.15,
                diversity: 0.1,
                context: 0.1,
            },
            diversityLevel: 0.4,
            // ... outros parâmetros
        },
        // ... outros parâmetros
    },
})
```

### 3. Gerar Recomendações

```typescript
const recommendations = await engine.getRecommendations({
  userId: 'user123',
  limit: 20,
  excludeMomentIds: ['moment1', 'moment2'],
  context: {
    timeOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    location: 'BR',
    device: 'mobile'
  }
})

// Resultado
[
  {
    momentId: 'moment123',
    score: 0.95,
    reason: 'Highly relevant to your interests',
    cluster: { id: 'cluster_1' },
    metadata: {
      relevanceScore: 0.9,
      noveltyScore: 0.8,
      diversityScore: 0.7
    }
  },
  // ...
]
```

### 4. Processar Interações

```typescript
// Após usuário interagir com momento
await engine.processInteraction("user123", "moment456", "like")

// Atualiza embedding do usuário automaticamente
```

### 5. Adicionar Novos Momentos

```typescript
await engine.addMoment("moment789", {
    textContent: "Descrição do momento",
    tags: ["viagem", "praia"],
    topics: ["turismo", "lazer"],
    authorId: "author123",
})

// Gera embedding e re-clusteriza automaticamente
```

## Parâmetros de Configuração

### Embedding Parameters

```typescript
{
  timeWindows: {
    recentEmbeddingUpdate: number,  // Tempo para considerar embedding atualizado
    interactionHistory: number,      // Janela de histórico de interações
  },
  dimensions: {
    embedding: number,               // Dimensão dos vetores
    interactionHistory: number,
    contentPreferences: number,
    socialFeatures: number,
  },
  weights: {
    content: { text, tags, engagement },
    interactions: { view, like, comment, share, save, default },
    update: { default }
  }
}
```

### Ranking Parameters

```typescript
{
  weights: {
    relevance: number,    // Peso de relevância (0-1)
    engagement: number,   // Peso de engajamento (0-1)
    novelty: number,      // Peso de novidade (0-1)
    diversity: number,    // Peso de diversidade (0-1)
    context: number       // Peso contextual (0-1)
  },
  diversityLevel: number, // Nível de diversificação (0-1)
  noveltyLevel: number    // Nível de novidade (0-1)
}
```

### DBSCAN Parameters

```typescript
{
  epsilon: number,           // Raio de vizinhança
  minPoints: number,         // Pontos mínimos para cluster
  distanceFunction: string,  // 'euclidean' | 'cosine' | 'manhattan'
}
```

## Boas Práticas

1. **Cache de Clusters**: Re-clusterize periodicamente (ex: diariamente) ao invés de a cada requisição
2. **Batch Updates**: Atualize embeddings em batch para melhor performance
3. **Monitoramento**: Track métricas como diversidade, novidade e engajamento
4. **A/B Testing**: Teste diferentes pesos e parâmetros
5. **Feedback Loop**: Use métricas de engajamento para ajustar parâmetros

## Performance

-   **Geração de Recomendações**: ~50-200ms para 20 recomendações
-   **Clustering**: ~1-5s para 10k momentos
-   **Atualização de Embedding**: ~10-50ms

## Extensibilidade

O sistema é facilmente extensível:

1. **Novos Algoritmos de Clustering**: Implemente interface comum
2. **Novos Critérios de Ranking**: Adicione scores no RankingService
3. **Novos Tipos de Embedding**: Extend EmbeddingService
4. **Novas Fontes de Dados**: Implemente interfaces de repositório

## Licença

MIT
