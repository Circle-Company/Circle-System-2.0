# Motor de Busca de Momentos

## Visão Geral

O motor de busca de momentos é um sistema especializado para encontrar e ranquear momentos baseado em termos de busca, hashtags, localização e outros critérios. Ele utiliza algoritmos de busca textual, filtros avançados e ranking personalizado para entregar resultados relevantes.

## Arquitetura

### Componentes Principais

1. **SearchEngine** - Motor principal que coordena toda a busca
2. **TextSearcher** - Busca textual em títulos, descrições e hashtags
3. **LocationSearcher** - Busca por proximidade geográfica
4. **HashtagSearcher** - Busca específica por hashtags
5. **RankingEngine** - Algoritmo de ranking dos resultados
6. **FilterEngine** - Filtros de conteúdo, status e visibilidade

### Fluxo de Busca

```
Query → SearchEngine → [TextSearcher, LocationSearcher, HashtagSearcher] → FilterEngine → RankingEngine → Results
```

## Tipos de Busca Suportados

### 1. Busca Textual

-   **Campos**: Título, descrição, hashtags
-   **Algoritmo**: Full-text search com relevância
-   **Filtros**: Idioma, data, status

### 2. Busca por Hashtag

-   **Formato**: `#hashtag` ou `hashtag`
-   **Algoritmo**: Match exato + similaridade
-   **Filtros**: Popularidade, data

### 3. Busca por Localização

-   **Parâmetros**: Latitude, longitude, raio
-   **Algoritmo**: Haversine distance
-   **Filtros**: Visibilidade, status

### 4. Busca Combinada

-   **Combinação**: Texto + localização + hashtags
-   **Algoritmo**: Score ponderado
-   **Filtros**: Todos os disponíveis

## Algoritmo de Ranking

### Fatores de Relevância

1. **Relevância Textual** (40%)

    - Match exato no título
    - Match parcial na descrição
    - Presença de hashtags

2. **Engajamento** (25%)

    - Número de curtidas
    - Número de comentários
    - Taxa de visualização

3. **Recência** (20%)

    - Data de criação
    - Última atualização
    - Decaimento temporal

4. **Qualidade** (10%)

    - Status de verificação
    - Qualidade do conteúdo
    - Completude dos metadados

5. **Proximidade** (5%)
    - Distância geográfica
    - Conexões sociais
    - Preferências do usuário

### Fórmula de Score

```
Score = (Relevância × 0.4) + (Engajamento × 0.25) + (Recência × 0.2) + (Qualidade × 0.1) + (Proximidade × 0.05)
```

## Configurações

### Parâmetros de Busca

-   **Limite de resultados**: 20 (padrão), máximo 100
-   **Timeout**: 5 segundos
-   **Cache**: 10 minutos
-   **Paginação**: Offset + limit

### Filtros Padrão

-   **Status**: Apenas momentos publicados
-   **Visibilidade**: Públicos + seguidores (se aplicável)
-   **Idioma**: Baseado no usuário
-   **Data**: Últimos 2 anos

## Performance

### Otimizações

-   **Índices**: Full-text, geográfico, temporal
-   **Cache**: Redis para queries frequentes
-   **Paginação**: Cursor-based para grandes datasets
-   **Paralelização**: Buscas independentes em paralelo

### Métricas

-   **Tempo de resposta**: < 200ms (95% das queries)
-   **Precisão**: > 85% (relevância dos resultados)
-   **Cobertura**: > 95% (momentos indexados)

## Extensibilidade

### Novos Tipos de Busca

-   Busca por áudio (transcrição)
-   Busca por imagem (tags visuais)
-   Busca semântica (embedding)

### Novos Filtros

-   Faixa etária do criador
-   Tipo de dispositivo
-   Qualidade de vídeo
-   Duração do conteúdo

## Integração

### Dependências

-   **Database**: PostgreSQL com extensões full-text
-   **Cache**: Redis
-   **Indexing**: Elasticsearch (opcional)
-   **Geolocation**: PostGIS

### APIs

-   **Input**: Query string, filtros, paginação
-   **Output**: Lista ranqueada de momentos
-   **Metadata**: Total, tempo de busca, sugestões
