# User Search Engine - Clean Architecture Implementation

Este documento descreve a implementação completa do User Search Engine seguindo os princípios da Clean Architecture.

## 📋 Visão Geral

O User Search Engine é um sistema robusto para busca de usuários que oferece:

-   **Busca por relacionamentos sociais** (usuários relacionados)
-   **Busca de usuários desconhecidos** (sem conexões sociais)
-   **Busca por usuários verificados**
-   **Busca por proximidade geográfica**
-   **Sistema de sugestões inteligentes**
-   **Ranking personalizado baseado em múltiplos fatores**
-   **Cache otimizado para performance**
-   **Métricas e monitoramento completo**
-   **Segurança e rate limiting**

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── domain/
│   └── user.search.engine/
│       ├── entities/                    # Entidades de domínio
│       │   ├── user.search.result.entity.ts
│       │   └── user.search.query.entity.ts
│       ├── repositories/                # Interfaces de repositório
│       │   └── user.search.repository.ts
│       ├── types/                       # Tipos e interfaces
│       │   └── index.ts
│       ├── errors/                      # Erros específicos do domínio
│       │   └── user.search.errors.ts
│       └── index.ts
├── application/
│   └── user.search.engine/
│       ├── use.cases/                   # Casos de uso
│       │   ├── search.users.use.case.ts
│       │   └── get.search.suggestions.use.case.ts
│       ├── services/                    # Serviços de aplicação
│       │   ├── ranking.service.ts
│       │   └── cache.service.ts
│       └── index.ts
├── infra/
│   ├── repository.impl/                 # Implementações de repositório
│   │   └── user.search.repository.impl.ts
│   ├── controllers/                     # Controllers HTTP
│   │   └── user.search.controller.ts
│   ├── routes/                          # Rotas da API
│   │   └── user.search.router.ts
│   └── index.ts
└── core/
    └── user.search.engine/
        └── config/                      # Configurações
            └── search.engine.config.ts
```

## 🔧 Componentes Principais

### 1. Domain Layer (Domínio)

#### Entidades

**UserSearchResult**

-   Representa o resultado de uma busca de usuário
-   Contém todas as informações relevantes para exibição
-   Inclui score de relevância e metadados de busca

**UserSearchQuery**

-   Representa uma consulta de busca
-   Valida critérios de busca
-   Gera chaves de cache
-   Aplica regras de segurança

#### Repositórios

**UserSearchRepositoryInterface**

-   Define contratos para operações de busca
-   Suporte a diferentes estratégias de busca
-   Operações de cache e métricas
-   Validação e rate limiting

### 2. Application Layer (Aplicação)

#### Casos de Uso

**SearchUsersUseCase**

-   Coordena toda a operação de busca
-   Aplica validações de segurança
-   Gerencia cache e rate limiting
-   Registra métricas

**GetSearchSuggestionsUseCase**

-   Gera sugestões inteligentes
-   Combina diferentes fontes de dados
-   Aplica algoritmos de relevância

#### Serviços

**RankingService**

-   Calcula scores de relevância
-   Aplica pesos configuráveis
-   Suporte a diferentes algoritmos de ranking

**CacheService**

-   Gerencia cache em memória e Redis
-   Configurações flexíveis de TTL
-   Estatísticas de performance

### 3. Infrastructure Layer (Infraestrutura)

#### Implementação de Repositório

**UserSearchRepositoryImpl**

-   Implementação concreta usando Sequelize
-   Queries otimizadas para diferentes tipos de busca
-   Suporte a relacionamentos sociais e geolocalização

#### Controllers e Routes

**UserSearchController**

-   Endpoints RESTful para busca
-   Validação de entrada
-   Tratamento de erros
-   Middlewares de segurança

## 🚀 Funcionalidades

### Tipos de Busca

1. **Busca Geral** (`all`)

    - Combina todos os tipos de busca
    - Aplica ranking balanceado
    - Resultados mais diversos

2. **Usuários Relacionados** (`related`)

    - Baseado em conexões sociais
    - Prioriza força do relacionamento
    - Cache de longa duração

3. **Usuários Desconhecidos** (`unknown`)

    - Sem conexões sociais
    - Prioriza proximidade e engajamento
    - Descoberta de novos usuários

4. **Usuários Verificados** (`verified`)

    - Apenas usuários verificados
    - Prioriza qualidade e engajamento
    - Cache de longa duração

5. **Busca por Proximidade** (`nearby`)
    - Baseado em localização geográfica
    - Prioriza distância geográfica
    - Cache de curta duração

### Sistema de Ranking

O sistema de ranking considera múltiplos fatores:

-   **Relevância** (40%): Correspondência do termo de busca
-   **Social** (25%): Relacionamentos e conexões
-   **Engajamento** (20%): Taxa de interação e atividade
-   **Proximidade** (10%): Distância geográfica
-   **Verificação** (3%): Status de verificação
-   **Conteúdo** (2%): Quantidade de conteúdo criado

### Cache Inteligente

-   **Cache em memória** para desenvolvimento
-   **Cache Redis** para produção
-   **TTL configurável** por tipo de operação
-   **Invalidação automática** baseada em eventos
-   **Estatísticas de performance**

### Segurança

-   **Validação de entrada** rigorosa
-   **Sanitização** de termos de busca
-   **Rate limiting** por usuário e IP
-   **Detecção de padrões suspeitos**
-   **Logs de auditoria**

## 📊 Métricas e Monitoramento

### Métricas Coletadas

-   **Performance**: Tempo de resposta, uso de memória, queries de banco
-   **Negócio**: Termos de busca, tipos de busca, comportamento do usuário
-   **Sistema**: Hit rate do cache, taxa de erro, disponibilidade

### Alertas Configuráveis

-   Tempo de resposta alto (> 5s)
-   Taxa de cache hit baixa (< 70%)
-   Taxa de erro alta (> 5%)
-   Uso de memória alto (> 1GB)

## 🔌 API Endpoints

### Busca de Usuários

```http
POST /api/user-search/search
Content-Type: application/json

{
  "searchTerm": "joão",
  "searchType": "all",
  "filters": {
    "includeVerified": true,
    "minFollowers": 100
  },
  "pagination": {
    "limit": 20,
    "offset": 0
  },
  "sorting": {
    "field": "relevance",
    "direction": "desc"
  }
}
```

### Sugestões de Busca

```http
GET /api/user-search/suggestions?term=jo&limit=10&context=discovery
```

### Usuários Relacionados

```http
GET /api/user-search/related?searchTerm=joão&limit=10
```

### Usuários Próximos

```http
GET /api/user-search/nearby?searchTerm=joão&latitude=-23.5505&longitude=-46.6333&radius=50
```

### Estatísticas

```http
GET /api/user-search/stats
```

## ⚙️ Configuração

### Configuração Básica

```typescript
import { getConfig } from "@/core/user.search.engine/config/search.engine.config"

const config = getConfig("production")
```

### Configuração Personalizada

```typescript
import {
    mergeConfigs,
    userSearchEngineConfig,
} from "@/core/user.search.engine/config/search.engine.config"

const customConfig = mergeConfigs(userSearchEngineConfig, {
    ranking: {
        weights: {
            relevance: 0.5,
            social: 0.3,
            engagement: 0.2,
        },
    },
})
```

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm test

# Testes com cobertura
npm run test:coverage

# Testes de integração
npm run test:integration
```

### Estrutura de Testes

-   **Testes de Domínio**: Validação de entidades e regras de negócio
-   **Testes de Aplicação**: Casos de uso e serviços
-   **Testes de Infraestrutura**: Implementações de repositório e controllers
-   **Testes de Integração**: Fluxo completo de busca

## 🚀 Como Usar

### 1. Instalação

```bash
npm install
```

### 2. Configuração do Banco

```bash
npm run migrate
```

### 3. Inicialização

```bash
npm start
```

### 4. Exemplo de Uso

```typescript
import { SearchUsersUseCase } from "@/application/user.search.engine"
import { UserSearchRepositoryImpl } from "@/infra"

// Configuração
const repository = new UserSearchRepositoryImpl(database, config)
const useCase = new SearchUsersUseCase(repository, ...dependencies)

// Busca
const result = await useCase.execute({
    searchTerm: "joão",
    searcherUserId: "123",
    searchType: "all",
})

console.log(result.data?.users)
```

## 📈 Performance

### Otimizações Implementadas

-   **Queries otimizadas** com índices apropriados
-   **Cache multi-camada** (memória + Redis)
-   **Paginação eficiente** com limites configuráveis
-   **Processamento em lotes** para operações em massa
-   **Rate limiting** para prevenir sobrecarga
-   **Métricas em tempo real** para monitoramento

### Benchmarks Esperados

-   **Tempo de resposta**: < 200ms (95º percentil)
-   **Throughput**: > 1000 requisições/segundo
-   **Cache hit rate**: > 80%
-   **Disponibilidade**: > 99.9%

## 🔧 Manutenção

### Logs

-   **Logs estruturados** em JSON
-   **Níveis de log** configuráveis
-   **Correlação de requisições** com IDs únicos
-   **Métricas de performance** integradas

### Monitoramento

-   **Health checks** automáticos
-   **Dashboards** de métricas em tempo real
-   **Alertas** configuráveis
-   **Relatórios** de performance

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, entre em contato através de:

-   Email: suporte@example.com
-   Issues: https://github.com/example/user-search-engine/issues
-   Documentação: https://docs.example.com/user-search-engine
