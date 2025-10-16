# New Swipe Engine - Arquitetura de Embeddings

## 🏗️ Arquitetura Desacoplada

A `new.swipe.engine` segue princípios de **arquitetura limpa** com **injeção de dependências**.

---

## 📐 Princípios de Design

### 1. Inversão de Dependências
Serviços dependem de **interfaces**, não de implementações concretas.

```typescript
// ✅ BOM (desacoplado)
class ContentEmbeddingGenerator {
    constructor(
        private readonly textService: ITextEmbeddingService,
        private readonly visualService?: IVisualEmbeddingService
    ) {}
}

// ❌ EVITAR (acoplado)
class ContentEmbeddingGenerator {
    private textService = new TextEmbeddingService()  // Hard-coded!
}
```

### 2. Adaptadores
Adaptadores convertem entre domínio e engine.

```typescript
// Adapter: Domínio → Engine
const momentEmbedding: MomentEmbedding = fromDomainMomentEmbedding(
    domain.embedding,
    momentId
)

// Adapter: Engine → Domínio  
const domainEmbedding: DomainMomentEmbedding = toDomainMomentEmbedding(
    engineEmbedding
)
```

### 3. Repositórios Injetados
Não há acesso direto ao banco. Tudo via repositories.

```typescript
interface IUserEmbeddingRepository {
    findByUserId(userId: string): Promise<UserEmbedding | null>
    save(embedding: UserEmbedding): Promise<void>
}

class RecommendationEngine {
    constructor(
        private readonly userEmbeddingRepo: IUserEmbeddingRepository
    ) {}
}
```

---

## 🧩 Componentes

### Content Embedding Generator

**Responsabilidade:** Gerar content embedding com pipeline de 3 componentes

**Dependências Injetadas:**
- `ITextEmbeddingService` (obrigatório)
- `IVisualEmbeddingService` (opcional)
- `ITranscriptionService` (opcional)
- `IAudioExtractor` (opcional)

**Uso:**
```typescript
import { ContentEmbeddingGenerator } from '@/core/new.swipe.engine'
import { TextEmbeddingAdapter } from '@/core/new.swipe.engine'

const textService = new TextEmbeddingAdapter(config.textEmbedding)

const generator = new ContentEmbeddingGenerator(
    config,
    textService,
    transcriptionService,  // opcional
    visualService,         // opcional
    audioExtractor        // opcional
)

const embedding = await generator.generate({
    videoData,
    description,
    hashtags,
    videoMetadata
})
```

### Engagement Calculator

**Responsabilidade:** Calcular engagement vector com features normalizadas

**Sem Dependências** (stateless calculator)

**Uso:**
```typescript
import { EngagementCalculator } from '@/core/new.swipe.engine'

const calculator = new EngagementCalculator()

const result = await calculator.calculate({
    momentId,
    metrics: {
        views: 1000,
        likes: 150,
        // ...
    },
    duration: 30,
    createdAt: new Date()
})
```

### Hybrid Ranker

**Responsabilidade:** Rankear candidatos com score híbrido

**Sem Dependências** (stateless ranker)

**Uso:**
```typescript
import { HybridRanker } from '@/core/new.swipe.engine'

const ranker = new HybridRanker({
    contentWeight: 0.5,
    engagementWeight: 0.3,
    recencyWeight: 0.2
})

const ranked = ranker.rank(userPreferenceEmbedding, candidates)
```

---

## 🔄 Fluxo de Dados

### Criação de Moment

```
MomentService (Application Layer)
    ↓
ContentEmbeddingGenerator (new.swipe.engine)
    ├─ ITextEmbeddingService.generate()
    ├─ IVisualEmbeddingService.generate() [opcional]
    └─ ITranscriptionService.generate() [opcional]
    ↓
Combinar com pesos
    ↓
ContentEmbedding { vector, metadata }
    ↓
MomentRepository.save(moment)
```

### Recomendação

```
RecommendationEngine (new.swipe.engine)
    ↓
1. IUserEmbeddingRepository.findByUserId()
    ↓
2. DBSCANClustering.cluster(contentEmbeddings)
    ↓
3. ClusterMatcher.match(userProfile, clusters)
    ↓
4. CandidateSelector.select(clusters)
    ↓
5. HybridRanker.rank(userEmbedding, candidates)
    ↓
Recommendations[]
```

---

## 📦 Estrutura de Pastas

```
new.swipe.engine/
├── core/
│   ├── embeddings/                  # Adaptadores de embedding
│   │   ├── models.config.ts
│   │   ├── text.embedding.adapter.ts
│   │   ├── visual.embedding.adapter.ts
│   │   ├── transcription.adapter.ts
│   │   └── index.ts
│   ├── services/                    # Serviços de domínio
│   │   ├── content.embedding.generator.ts
│   │   ├── engagement.calculator.ts
│   │   ├── hybrid.ranker.ts
│   │   ├── candidate.selector.ts
│   │   ├── cluster.matcher.ts
│   │   └── ranking.service.ts
│   ├── repositories.ts              # Interfaces de repositórios
│   ├── dbscan.clustering.ts
│   └── recommendation.engine.ts
├── types/
│   ├── embedding.generation.types.ts  # Tipos de embedding
│   ├── embedding.adapters.ts         # Adaptadores domínio
│   ├── cluster.types.ts
│   ├── recommendation.types.ts
│   └── ...
├── utils/
│   ├── normalization.ts              # Funções de normalização
│   └── index.ts
└── index.ts                          # Exports públicos
```

---

## 🎯 Diferenças da Swipe Engine Antiga

### Antiga (Acoplada)
```typescript
// ❌ Dependências hard-coded
class MomentService {
    private embeddingService = new PostEmbeddingService()
    private audioExtractor = new AudioExtractor()
    
    async createMoment(data) {
        const embedding = await this.embeddingService.generate(...)
    }
}
```

### Nova (Desacoplada)
```typescript
// ✅ Injeção de dependências
class ContentEmbeddingGenerator {
    constructor(
        private readonly config: EmbeddingModelsConfig,
        private readonly textService: ITextEmbeddingService,
        private readonly visualService?: IVisualEmbeddingService
    ) {}
    
    async generate(input: ContentEmbeddingInput) {
        const textEmb = await this.textService.generate(input.description)
        // ...
    }
}
```

---

## 🔌 Como Integrar

### No MomentService

```typescript
import {
    ContentEmbeddingGenerator,
    TextEmbeddingAdapter,
    getEmbeddingConfig
} from '@/core/new.swipe.engine'

export class MomentService {
    private contentEmbeddingGenerator: ContentEmbeddingGenerator

    constructor(
        private repository: IMomentRepository,
        // ...
    ) {
        const config = getEmbeddingConfig()
        const textService = new TextEmbeddingAdapter(config.textEmbedding)

        this.contentEmbeddingGenerator = new ContentEmbeddingGenerator(
            config,
            textService
        )
    }

    async createMoment(data: CreateMomentData) {
        // ...
        const embedding = await this.contentEmbeddingGenerator.generate({
            videoData: data.videoData,
            description: data.description || "",
            hashtags: data.hashtags || [],
            videoMetadata: processingResult.videoMetadata
        })

        moment.updateEmbedding(
            JSON.stringify(embedding.vector),
            embedding.dimension,
            embedding.metadata
        )
        // ...
    }
}
```

---

## 🧪 Testabilidade

Com a arquitetura desacoplada, testes são fáceis:

```typescript
// Mock do text service
const mockTextService: ITextEmbeddingService = {
    generate: vi.fn().mockResolvedValue({
        success: true,
        embedding: [0.1, 0.2, 0.3],
        tokenCount: 10,
        processingTime: 100
    }),
    isAvailable: () => true,
    getConfig: () => ({})
}

// Injetar mock
const generator = new ContentEmbeddingGenerator(
    config,
    mockTextService
)

// Testar sem dependências reais
const result = await generator.generate(input)
```

---

## ✨ Benefícios

1. **Testabilidade**
   - Mocks fáceis de criar
   - Sem dependências globais
   - Testes isolados

2. **Flexibilidade**
   - Trocar implementações facilmente
   - Adicionar novos serviços sem modificar código existente
   - Configuração externa

3. **Manutenibilidade**
   - Responsabilidades claras
   - Baixo acoplamento
   - Alto coesão

4. **Escalabilidade**
   - Serviços podem rodar em processos separados
   - Fácil paralelização
   - Caching granular

---

## 📚 Referências

- **Clean Architecture:** https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **Dependency Injection:** https://martinfowler.com/articles/injection.html
- **Interface Segregation:** https://en.wikipedia.org/wiki/Interface_segregation_principle

