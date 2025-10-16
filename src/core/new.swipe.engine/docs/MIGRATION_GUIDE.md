# Guia de Migração: Old → New Swipe Engine

## 📋 Visão Geral

Este guia mostra como migrar do sistema de embeddings da `swipe.engine` antiga para a `new.swipe.engine` com arquitetura desacoplada.

---

## 🔄 Principais Mudanças

### 1. Injeção de Dependências

**Antiga (Acoplada):**
```typescript
// Services hard-coded dentro da classe
class MomentService {
    private embeddingService = new PostEmbeddingService()
    private audioExtractor = new AudioExtractor()
    
    async createMoment(data) {
        const embedding = await this.embeddingService.generateEmbedding(...)
    }
}
```

**Nova (Desacoplada):**
```typescript
// Dependencies injetadas no construtor
import {
    ContentEmbeddingGenerator,
    TextEmbeddingAdapter,
    getEmbeddingConfig
} from '@/core/new.swipe.engine'

class MomentService {
    private embeddingGenerator: ContentEmbeddingGenerator

    constructor(
        private repository: IMomentRepository,
        // ...
    ) {
        const config = getEmbeddingConfig()
        const textService = new TextEmbeddingAdapter(config.textEmbedding)

        this.embeddingGenerator = new ContentEmbeddingGenerator(
            config,
            textService
        )
    }

    async createMoment(data: CreateMomentData) {
        const embedding = await this.embeddingGenerator.generate({
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
    }
}
```

---

### 2. Interfaces ao Invés de Classes Concretas

**Antiga:**
```typescript
import { TextEmbeddingService } from '@/core/swipe.engine/core/embeddings/text.embedding.service'

const service = new TextEmbeddingService(config)
```

**Nova:**
```typescript
import {
    ITextEmbeddingService,
    TextEmbeddingAdapter
} from '@/core/new.swipe.engine'

// Usa interface, pode trocar implementação
const service: ITextEmbeddingService = new TextEmbeddingAdapter(config)
```

---

### 3. Adaptadores ao Invés de Services Diretos

**Antiga:**
```typescript
import { TranscriptionService } from '@/core/swipe.engine/core/embeddings/transcription.service'
import { VisualEmbeddingService } from '@/core/swipe.engine/core/embeddings/visual.embedding.service'
import { TextEmbeddingService } from '@/core/swipe.engine/core/embeddings/text.embedding.service'
```

**Nova:**
```typescript
import {
    TranscriptionAdapter,
    VisualEmbeddingAdapter,
    TextEmbeddingAdapter
} from '@/core/new.swipe.engine'

// Mesma interface, implementação encapsulada
```

---

### 4. Calculadores Stateless

**Antiga:**
```typescript
class MomentMetricsService {
    async calculateEngagementVector(params) {
        // Lógica embutida no service
        const features = { ... }
        const vector = [ ... ]
        return { vector, features }
    }
}
```

**Nova:**
```typescript
import { EngagementCalculator } from '@/core/new.swipe.engine'

// Stateless calculator (sem estado interno)
const calculator = new EngagementCalculator()

const result = await calculator.calculate({
    momentId,
    metrics,
    duration,
    createdAt
})
```

---

### 5. Ranking Desacoplado

**Antiga:**
```typescript
// Embutido no RecommendationEngine
class RecommendationEngine {
    private rankCandidates(candidates) {
        // Lógica de ranking interna
    }
}
```

**Nova:**
```typescript
import { HybridRanker } from '@/core/new.swipe.engine'

// Ranker independente, configurável
const ranker = new HybridRanker({
    contentWeight: 0.5,
    engagementWeight: 0.3,
    recencyWeight: 0.2
})

const ranked = ranker.rank(queryEmbedding, candidates)
```

---

## 📝 Checklist de Migração

### Passo 1: Atualizar Imports

```typescript
// ❌ ANTIGA
import { PostEmbeddingService } from '@/core/swipe.engine/core/embeddings/post'
import { TranscriptionService } from '@/core/swipe.engine/core/embeddings/transcription.service'

// ✅ NOVA
import {
    ContentEmbeddingGenerator,
    TextEmbeddingAdapter,
    EngagementCalculator,
    HybridRanker
} from '@/core/new.swipe.engine'
```

### Passo 2: Criar Adaptadores no Construtor

```typescript
class MomentService {
    private embeddingGenerator: ContentEmbeddingGenerator

    constructor(/* ... */) {
        const config = getEmbeddingConfig()
        
        // Criar adaptadores
        const textService = new TextEmbeddingAdapter(config.textEmbedding)
        
        // Injetar no generator
        this.embeddingGenerator = new ContentEmbeddingGenerator(
            config,
            textService
        )
    }
}
```

### Passo 3: Usar Generator ao Invés de Service Direto

```typescript
// ❌ ANTIGA
const embedding = await this.embeddingService.generateEmbedding({
    textContent: description,
    tags: hashtags,
    engagementMetrics: metrics,
    authorId,
    createdAt
})

// ✅ NOVA
const embedding = await this.embeddingGenerator.generate({
    videoData,
    description,
    hashtags,
    videoMetadata
})
```

### Passo 4: Usar EngagementCalculator Stateless

```typescript
// ❌ ANTIGA
const result = await this.metricsService.calculateEngagementVector(params)

// ✅ NOVA
const calculator = new EngagementCalculator()
const result = await calculator.calculate(params)
```

### Passo 5: Usar HybridRanker para Ranking

```typescript
// ❌ ANTIGA
const ranked = this.rankingService.rankCandidates(candidates, options)

// ✅ NOVA
const ranker = new HybridRanker(config)
const ranked = ranker.rank(userEmbedding, candidates)
```

---

## 🧪 Testabilidade

### Antiga (Difícil de Testar)
```typescript
// Precisa mockar imports globais
vi.mock('@/core/swipe.engine/core/embeddings/text.embedding.service')

test('should generate embedding', async () => {
    // Difícil: service hard-coded na classe
    const service = new MomentService(...)
})
```

### Nova (Fácil de Testar)
```typescript
// Injeta mocks diretamente
test('should generate embedding', async () => {
    const mockTextService: ITextEmbeddingService = {
        generate: vi.fn().mockResolvedValue({ success: true, embedding: [...] }),
        isAvailable: () => true,
        getConfig: () => ({})
    }

    const generator = new ContentEmbeddingGenerator(
        config,
        mockTextService  // Mock injetado!
    )

    const result = await generator.generate(input)
    expect(mockTextService.generate).toHaveBeenCalled()
})
```

---

## 📦 Módulos Criados na New Swipe Engine

### Core Services
- ✅ `ContentEmbeddingGenerator` - Geração de content embedding
- ✅ `EngagementCalculator` - Cálculo de engagement vector
- ✅ `HybridRanker` - Ranking híbrido

### Adaptadores
- ✅ `TextEmbeddingAdapter` - all-MiniLM
- ✅ `VisualEmbeddingAdapter` - CLIP
- ✅ `TranscriptionAdapter` - Whisper

### Utils
- ✅ `normalization.ts` - Funções de normalização

### Tipos
- ✅ `embedding.generation.types.ts` - Tipos de embedding

### Docs
- ✅ `EMBEDDING_ARCHITECTURE.md` - Arquitetura
- ✅ `MIGRATION_GUIDE.md` - Este guia

---

## 🎯 Exemplo Completo de Migração

### Antes (Antiga Swipe Engine)

```typescript
import { PostEmbeddingService } from '@/core/swipe.engine/core/embeddings/post'
import { AudioExtractor } from '@/core/content.processor/audio.extractor'
import { TranscriptionService } from '@/core/swipe.engine/core/embeddings/transcription.service'

class MomentService {
    private embeddingService = new PostEmbeddingService()
    private audioExtractor = new AudioExtractor()
    private transcriptionService = new TranscriptionService(config.whisper)

    async createMoment(data) {
        // Lógica complexa e acoplada
        const audioResult = await this.audioExtractor.extractAudio(data.videoData)
        const transcription = await this.transcriptionService.transcribe(audioResult.audioData)
        
        const embedding = await this.embeddingService.generateEmbedding({
            textContent: `${data.description} ${transcription.text}`,
            tags: data.hashtags,
            engagementMetrics: {},
            authorId,
            createdAt
        })

        // ...
    }
}
```

### Depois (Nova Swipe Engine)

```typescript
import {
    ContentEmbeddingGenerator,
    TextEmbeddingAdapter,
    getEmbeddingConfig
} from '@/core/new.swipe.engine'

class MomentService {
    private embeddingGenerator: ContentEmbeddingGenerator

    constructor(/* ... */) {
        const config = getEmbeddingConfig()
        const textService = new TextEmbeddingAdapter(config.textEmbedding)

        // Injeção de dependências
        this.embeddingGenerator = new ContentEmbeddingGenerator(
            config,
            textService
        )
    }

    async createMoment(data: CreateMomentData) {
        // Simples e desacoplado
        const embedding = await this.embeddingGenerator.generate({
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

## ✨ Benefícios da Migração

1. **Código Mais Limpo**
   - Menos linhas
   - Responsabilidades claras
   - Fácil de entender

2. **Melhor Testabilidade**
   - Mocks por injeção
   - Sem globals
   - Testes isolados

3. **Maior Flexibilidade**
   - Trocar implementações sem modificar código
   - Adicionar novos serviços facilmente
   - Configuração externa

4. **Manutenção Simplificada**
   - Mudanças localizadas
   - Baixo acoplamento
   - Fácil refactoring

---

## 🚀 Próximos Passos

1. ✅ Migrar imports para new.swipe.engine
2. ✅ Adaptar MomentService para usar injeção de dependências
3. ✅ Atualizar testes para usar mocks injetados
4. ✅ Validar funcionamento em produção
5. [ ] Deprecar old swipe.engine (futuro)

---

**Migração concluída!** 🎉

