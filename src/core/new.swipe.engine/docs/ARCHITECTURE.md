# Arquitetura do SwipeEngine

## Visão Geral

O SwipeEngine é um sistema de recomendações avançado que utiliza técnicas de **Machine Learning**, **Clustering** e **Information Retrieval** para gerar feeds personalizados de momentos.

## Princípios Arquiteturais

### 1. Dependency Injection

Todo o sistema é construído com **injeção de dependências** para facilitar testes e manutenção:

```typescript
constructor(
  private readonly userEmbeddingRepository: IUserEmbeddingRepository,
  private readonly momentEmbeddingRepository: IMomentEmbeddingRepository,
  ...
)
```

### 2. Interface Segregation

Cada repositório tem uma interface bem definida e específica:

-   `IUserEmbeddingRepository`
-   `IMomentEmbeddingRepository`
-   `IClusterRepository`
-   `IInteractionRepository`

### 3. Single Responsibility

Cada serviço tem uma responsabilidade clara:

-   **UserEmbeddingService**: Gerencia embeddings de usuários
-   **MomentEmbeddingService**: Gerencia embeddings de momentos
-   **ClusterMatcher**: Encontra clusters relevantes
-   **CandidateSelector**: Seleciona candidatos
-   **RankingService**: Ranqueia e diversifica

### 4. Open/Closed Principle

Sistema aberto para extensão, fechado para modificação:

-   Novos algoritmos de clustering podem ser adicionados
-   Novos critérios de ranking podem ser integrados
-   Novas estratégias de matching podem ser implementadas

## Camadas

### Layer 1: Types & Interfaces

**Propósito**: Definir contratos e estruturas de dados

**Componentes**:

-   `types/`: Tipos TypeScript compartilhados
-   `repositories/`: Interfaces de repositórios

**Responsabilidades**:

-   Definir tipos de dados
-   Estabelecer contratos
-   Documentar estruturas

### Layer 2: Algorithms

**Propósito**: Implementar algoritmos core

**Componentes**:

-   `algorithms/dbscan.clustering.ts`: Algoritmo DBSCAN

**Responsabilidades**:

-   Clustering de embeddings
-   Cálculos matemáticos
-   Otimizações de performance

### Layer 3: Services

**Propósito**: Lógica de negócio e orquestração

**Componentes**:

-   `UserEmbeddingService`: Embeddings de usuário
-   `MomentEmbeddingService`: Embeddings de momento
-   `ClusterMatcher`: Matching de clusters
-   `CandidateSelector`: Seleção de candidatos
-   `RankingService`: Ranking e diversificação

**Responsabilidades**:

-   Processamento de dados
-   Aplicação de regras de negócio
-   Coordenação entre componentes

### Layer 4: Engine

**Propósito**: Orquestração de alto nível

**Componentes**:

-   `RecommendationEngine`: Engine principal

**Responsabilidades**:

-   Coordenar todo o fluxo
-   Gerenciar estado
-   Expor API pública

## Fluxo de Dados

### Geração de Recomendações

```
1. Request → RecommendationEngine
              ↓
2. Buscar/Gerar UserEmbedding
   ├─ UserEmbeddingService
   └─ IUserEmbeddingRepository
              ↓
3. Construir UserProfile
   └─ IInteractionRepository
              ↓
4. Buscar/Gerar Clusters
   ├─ DBSCANClustering
   ├─ MomentEmbeddingService
   └─ IClusterRepository
              ↓
5. Encontrar Clusters Relevantes
   └─ ClusterMatcher
              ↓
6. Selecionar Candidatos
   ├─ CandidateSelector
   ├─ IClusterRepository
   └─ IInteractionRepository
              ↓
7. Ranquear Candidatos
   ├─ RankingService
   ├─ IMomentEmbeddingRepository
   └─ IInteractionRepository
              ↓
8. Response ← Recommendations[]
```

### Processamento de Interação

```
1. Interaction Event
              ↓
2. Salvar Interação
   └─ IInteractionRepository
              ↓
3. Buscar Embedding do Momento
   └─ MomentEmbeddingService
              ↓
4. Atualizar Embedding do Usuário
   ├─ UserEmbeddingService
   └─ IUserEmbeddingRepository
```

## Algoritmos

### DBSCAN Clustering

**Propósito**: Agrupar momentos similares em clusters baseados em densidade

**Vantagens**:

-   Não requer número de clusters pré-definido
-   Detecta e remove ruído
-   Descobre clusters de formas arbitrárias
-   Eficiente para grandes volumes

**Parâmetros**:

-   `epsilon`: Distância máxima entre pontos vizinhos
-   `minPoints`: Número mínimo de pontos para formar cluster
-   `distanceFunction`: Métrica de distância (cosine, euclidean, manhattan)

**Complexidade**: O(n²) no pior caso, O(n log n) com otimizações

### Embedding Generation

**Propósito**: Converter conteúdo em vetores numéricos

**Técnicas**:

1. **Text Hashing**: Hash determinístico de texto
2. **Feature Extraction**: Extração de características
3. **Weighted Combination**: Combinação ponderada de features
4. **L2 Normalization**: Normalização para magnitude unitária

**Dimensões**: 128 (configurável)

### Ranking Multi-Fatorial

**Propósito**: Ordenar candidatos por relevância

**Fatores**:

1. **Relevância (40%)**: Similaridade com perfil
2. **Engajamento (25%)**: Métricas de interação
3. **Novidade (15%)**: Frescor e exploração
4. **Diversidade (10%)**: Variedade de tópicos
5. **Contexto (10%)**: Adequação temporal

**Algoritmo de Diversificação**: MMR (Maximal Marginal Relevance)

```
MMR = λ × Relevance + (1 - λ) × Diversity
```

## Estratégias de Caching

### Embeddings

-   **TTL**: 24 horas
-   **Invalidação**: Após N interações ou por tempo
-   **Update**: Incremental com learning rate

### Clusters

-   **TTL**: 1 semana
-   **Invalidação**: Manual ou agendada
-   **Update**: Re-clustering completo em batch

### Assignments

-   **TTL**: Sincronizado com clusters
-   **Invalidação**: Junto com clusters
-   **Update**: Durante re-clustering

## Otimizações de Performance

### 1. Batch Processing

Processar múltiplos embeddings de uma vez:

```typescript
const embeddings = await repository.findByMomentIds(momentIds)
// vs
for (const id of momentIds) {
    await repository.findByMomentId(id)
}
```

### 2. Candidate Pre-filtering

Filtrar momentos já vistos antes de ranquear:

```typescript
const excludeSet = new Set(interactedMomentIds)
candidates = candidates.filter((c) => !excludeSet.has(c.momentId))
```

### 3. Lazy Clustering

Clusters são gerados apenas quando necessário e cacheados

### 4. Incremental Updates

Embeddings são atualizados incrementalmente ao invés de regenerados:

```typescript
updatedVector = currentVector * (1 - α) + newVector * α
```

## Métricas de Qualidade

### Métricas de Cluster

1. **Silhouette Score**: Qualidade de separação
2. **Davies-Bouldin Index**: Compactação e separação
3. **Intra-cluster Distance**: Coesão interna
4. **Inter-cluster Distance**: Separação entre clusters

### Métricas de Recomendação

1. **Precision@K**: Precisão nos top K
2. **Recall@K**: Recall nos top K
3. **NDCG**: Normalized Discounted Cumulative Gain
4. **Diversity**: Variedade de tópicos
5. **Novelty**: Frequência de conteúdo novo
6. **Coverage**: Cobertura do catálogo

## Escalabilidade

### Horizontal Scaling

-   **Stateless Services**: Todos os serviços são stateless
-   **Load Balancing**: Distribuir requisições entre instâncias
-   **Shared Cache**: Redis/Memcached para embeddings

### Vertical Scaling

-   **Otimização de Queries**: Índices em repositórios
-   **Batch Processing**: Processar em lotes maiores
-   **Parallel Processing**: Processar clusters em paralelo

### Data Partitioning

-   **User Sharding**: Particionar por userId
-   **Cluster Sharding**: Particionar clusters por domínio
-   **Time Partitioning**: Particionar por período temporal

## Testes

### Unit Tests

Testar cada serviço isoladamente com mocks:

```typescript
describe('UserEmbeddingService', () => {
  it('should generate embedding', async () => {
    const mockRepo = { save: jest.fn() }
    const service = new UserEmbeddingService(mockRepo, ...)
    // ...
  })
})
```

### Integration Tests

Testar integração entre componentes:

```typescript
describe('RecommendationEngine', () => {
  it('should generate recommendations', async () => {
    const engine = new RecommendationEngine(realConfig)
    const recs = await engine.getRecommendations(...)
    // ...
  })
})
```

### Performance Tests

Testar performance e escalabilidade:

```typescript
describe("Performance", () => {
    it("should handle 1000 recommendations in < 5s", async () => {
        // ...
    })
})
```

## Monitoramento

### Métricas a Monitorar

1. **Latência**: Tempo de resposta por endpoint
2. **Taxa de Erro**: Erros por minuto
3. **Cache Hit Rate**: Taxa de acerto do cache
4. **Cluster Quality**: Qualidade dos clusters
5. **Engagement Rate**: Taxa de engajamento

### Alertas

1. **High Latency**: > 500ms p95
2. **High Error Rate**: > 1% de erros
3. **Low Cache Hit**: < 70% hit rate
4. **Cluster Degradation**: Quality score < 0.5
5. **Low Engagement**: < 10% click-through rate

## Futuras Melhorias

1. **Deep Learning Embeddings**: Usar modelos pré-treinados (BERT, GPT)
2. **Graph Neural Networks**: Modelar relações sociais
3. **Multi-Armed Bandits**: Exploração vs. Exploração dinâmica
4. **Reinforcement Learning**: Otimização contínua de pesos
5. **Real-time Streaming**: Atualização em tempo real
6. **Federated Learning**: Privacidade preservando aprendizado
