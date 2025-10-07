# Integração de Embeddings com o Domínio

Este documento explica como os serviços de embedding do Swipe Engine integram-se com os embeddings nativos das entidades de domínio.

## Arquitetura

Os embeddings são armazenados em dois formatos:

1. **Formato de Domínio**: `string` (vetor serializado em JSON)

    - Usado pelas entidades `User` e `Moment`
    - Persistido no banco de dados
    - Exemplo: `"[0.1, 0.2, 0.3, ...]"`

2. **Formato do Swipe Engine**: `number[]` (array de números)
    - Usado internamente pelos algoritmos de recomendação
    - Facilita cálculos matemáticos (similaridade, clustering, etc.)
    - Exemplo: `[0.1, 0.2, 0.3, ...]`

## Serviços de Conversão

### MomentEmbeddingService

Métodos estáticos para conversão de embeddings de momentos:

```typescript
import { MomentEmbeddingService } from '@/core/new.swipe.engine'
import { Moment } from '@/domain/moment/entities'

// 1. Converter embedding de domínio para swipe engine
const moment: Moment = /* ... */
const domainEmbedding = moment.embedding
const swipeEmbedding = MomentEmbeddingService.fromDomainEmbedding(
    domainEmbedding,
    moment.id
)

// 2. Converter embedding de swipe engine para domínio
const momentEmbedding = /* resultado de generateEmbedding() */
const domainEmbedding = MomentEmbeddingService.toDomainEmbedding(momentEmbedding)

// 3. Parsear vetor serializado
const vector: number[] = MomentEmbeddingService.parseDomainEmbedding(domainEmbedding)

// 4. Serializar vetor
const serialized: string = MomentEmbeddingService.serializeToDomainEmbedding(vector)
```

### UserEmbeddingService

Métodos estáticos para conversão de embeddings de usuários:

```typescript
import { UserEmbeddingService } from '@/core/new.swipe.engine'
import { User } from '@/domain/user/entities'

// 1. Converter embedding de domínio para swipe engine
const user: User = /* ... */
const domainEmbedding = user.embedding
if (domainEmbedding) {
    const swipeEmbedding = UserEmbeddingService.fromDomainEmbedding(
        domainEmbedding,
        user.id
    )
}

// 2. Converter embedding de swipe engine para domínio
const userEmbedding = /* resultado de generateEmbedding() */
const domainEmbedding = UserEmbeddingService.toDomainEmbedding(userEmbedding)

// 3. Parsear vetor serializado
const vector: number[] = UserEmbeddingService.parseDomainEmbedding(domainEmbedding)

// 4. Serializar vetor
const serialized: string = UserEmbeddingService.serializeToDomainEmbedding(vector)
```

## Fluxo de Trabalho Recomendado

### 1. Geração de Embedding para Novo Momento

```typescript
// Na aplicação (use case)
import { MomentEmbeddingService } from "@/core/new.swipe.engine"
import { Moment } from "@/domain/moment/entities"

async function createMomentWithEmbedding(momentData: any) {
    // 1. Criar momento
    const moment = new Moment(momentData)

    // 2. Gerar embedding usando o serviço
    const embeddingService = new MomentEmbeddingService(momentEmbeddingRepository, embeddingParams)

    const swipeEmbedding = await embeddingService.generateEmbedding(moment.id, {
        textContent: moment.description,
        tags: moment.hashtags,
        topics: extractTopics(moment),
        metadata: {
            authorId: moment.ownerId,
            contentLength: moment.content.duration,
        },
    })

    // 3. Converter para formato de domínio
    const domainEmbedding = MomentEmbeddingService.toDomainEmbedding(swipeEmbedding)

    // 4. Atualizar momento com embedding
    moment.updateEmbedding(domainEmbedding)

    // 5. Persistir
    await momentRepository.save(moment)
}
```

### 2. Atualização de Embedding de Usuário

```typescript
// Na aplicação (use case)
import { UserEmbeddingService } from "@/core/new.swipe.engine"
import { User } from "@/domain/user/entities"

async function updateUserEmbeddingFromInteraction(userId: string, interaction: any) {
    // 1. Buscar usuário
    const user = await userRepository.findById(userId)

    // 2. Gerar/atualizar embedding usando o serviço
    const embeddingService = new UserEmbeddingService(
        userEmbeddingRepository,
        interactionRepository,
        embeddingParams,
    )

    const swipeEmbedding = await embeddingService.generateEmbedding(userId)

    // 3. Converter para formato de domínio
    const domainEmbedding = UserEmbeddingService.toDomainEmbedding(swipeEmbedding)

    // 4. Atualizar usuário com embedding
    user.updateEmbedding(domainEmbedding)

    // 5. Persistir
    await userRepository.save(user)
}
```

### 3. Uso em Recomendações

```typescript
// No RecommendationEngine
import {
    MomentEmbeddingService,
    UserEmbeddingService,
    RecommendationEngine,
} from "@/core/new.swipe.engine"

async function getRecommendations(userId: string) {
    // 1. Buscar usuário e momento
    const user = await userRepository.findById(userId)
    const moments = await momentRepository.findPublished()

    // 2. Converter embeddings de domínio para swipe engine
    const userEmbedding = user.embedding
        ? UserEmbeddingService.fromDomainEmbedding(user.embedding, user.id)
        : null

    const momentEmbeddings = moments.map((moment) =>
        MomentEmbeddingService.fromDomainEmbedding(moment.embedding, moment.id),
    )

    // 3. Usar engine para recomendações
    const engine = createRecommendationEngine(config)
    const recommendations = await engine.getRecommendations({
        userId,
        limit: 20,
        // ... outras opções
    })

    return recommendations
}
```

## Vantagens desta Abordagem

1. **Separação de Responsabilidades**

    - Domínio: Armazena embeddings como strings (formato de persistência)
    - Swipe Engine: Trabalha com arrays numéricos (formato de processamento)

2. **Flexibilidade**

    - Fácil migração para outros formatos de serialização
    - Possibilidade de compressão dos embeddings no banco

3. **Performance**

    - Conversões são feitas apenas quando necessário
    - Cálculos matemáticos são otimizados com arrays

4. **Manutenibilidade**
    - Métodos estáticos centralizados
    - Fácil de testar e documentar
    - Type-safe com TypeScript

## Notas Importantes

1. **Validação**: Os métodos de conversão incluem tratamento de erros para vetores malformados
2. **Dimensionalidade**: A dimensão do vetor é preservada em ambos os formatos
3. **Metadata**: Informações adicionais são mantidas em ambos os formatos
4. **Timestamps**: As datas de criação e atualização são preservadas

## Próximos Passos

-   [ ] Implementar compressão de vetores para economia de espaço
-   [ ] Adicionar cache de embeddings em memória
-   [ ] Criar índices de busca vetorial no banco de dados
-   [ ] Implementar versionamento de embeddings
