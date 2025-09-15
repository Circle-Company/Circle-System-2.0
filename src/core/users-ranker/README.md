# Sistema de Ranqueamento de Usuários

## Visão Geral

O `UserRanker` é uma classe avançada para ranqueamento de usuários com alta personalização. Ele implementa um algoritmo multi-fatorial que considera múltiplas dimensões para determinar a relevância dos usuários candidatos.

## Características Principais

- **Algoritmo Multi-fatorial**: Considera 10 dimensões diferentes de relevância
- **Personalização Completa**: Pesos e fatores configuráveis
- **Filtros Inteligentes**: Remove candidatos inválidos automaticamente
- **Breakdown Detalhado**: Opção de ver scores individuais por dimensão
- **Configuração Global**: Atualize configurações padrão do sistema
- **Contexto de Recomendação**: Suporte a contexto temporal e espacial

## Dimensões de Ranqueamento

### 1. Distância (25% padrão)
- **Função**: Proximidade geográfica entre usuários
- **Algoritmo**: Função exponencial decrescente
- **Personalização**: Distância máxima configurável

### 2. Seguidores (20% padrão)
- **Função**: Popularidade baseada no número de seguidores
- **Algoritmo**: Normalização sigmóide
- **Personalização**: Faixa mínima e máxima de seguidores

### 3. Verificação (15% padrão)
- **Função**: Boost para usuários verificados
- **Algoritmo**: Score binário (1.0 ou 0.5)
- **Personalização**: Ativar/desativar boost

### 4. Foto de Perfil (10% padrão)
- **Função**: Incentivo para usuários com foto de perfil
- **Algoritmo**: Score binário (1.0 ou 0.3)
- **Personalização**: Não configurável (sempre ativo)

### 5. Peso da Relação (15% padrão)
- **Função**: Histórico de interações entre usuários
- **Algoritmo**: Normalização linear (0-1)
- **Personalização**: Não configurável (baseado em dados)

### 6. Premium (5% padrão)
- **Função**: Boost para usuários premium
- **Algoritmo**: Score binário (1.0 ou 0.5)
- **Personalização**: Ativar/desativar boost

### 7. Seguimento Mútuo (20% padrão)
- **Função**: Priorizar conexões mútuas
- **Algoritmo**: Score binário (1.0 ou 0.0)
- **Personalização**: Ativar/desativar boost

### 8. Te Segue (10% padrão)
- **Função**: Incentivo para usuários que te seguem
- **Algoritmo**: Score binário (0.8 ou 0.0)
- **Personalização**: Ativar/desativar boost

### 9. Você Segue (5% padrão)
- **Função**: Penalização opcional para usuários que você segue
- **Algoritmo**: Score negativo (-0.3 ou 0.0)
- **Personalização**: Ativar/desativar penalização

### 10. Te Bloqueia (-50% padrão)
- **Função**: Penalização severa para usuários que te bloqueiam
- **Algoritmo**: Score negativo (-1.0 ou 0.0)
- **Personalização**: Não configurável (sempre ativo)

## Uso Básico

```typescript
import { UserRanker, UserCandidate } from "./index"

const ranker = new UserRanker()

const candidatos: UserCandidate[] = [
    {
        id: "1",
        username: "joao123",
        name: "João Silva",
        verified: true,
        muted: false,
        blocked: false,
        hasProfilePicture: true,
        totalFollowers: 1500,
        distance: 5.2,
        relationWeight: 0.8,
        isYou: false,
        isPremium: true,
        followYou: true,
        youFollow: false,
        blockYou: false
    }
]

const resultado = await ranker.rankUsers(candidatos)
console.log(resultado)
```

## Personalização de Pesos

```typescript
const opcoes: RankingOptions = {
    weights: {
        distance: 0.4,        // Aumentar importância da distância
        followers: 0.1,       // Diminuir importância dos seguidores
        verification: 0.2,    // Aumentar importância da verificação
        mutualFollow: 0.3     // Aumentar importância do seguimento mútuo
    }
}

const resultado = await ranker.rankUsers(candidatos, opcoes)
```

## Personalização de Fatores

```typescript
const opcoes: RankingOptions = {
    factors: {
        maxDistance: 20,      // Limitar distância máxima
        minFollowers: 100,    // Filtrar usuários com poucos seguidores
        boostVerified: true,  // Priorizar usuários verificados
        boostPremium: true,   // Priorizar usuários premium
        penalizeMuted: false  // Não penalizar usuários silenciados
    }
}

const resultado = await ranker.rankUsers(candidatos, opcoes)
```

## Configuração Global

```typescript
// Atualizar configurações padrão
ranker.updateDefaultWeights({
    distance: 0.3,
    followers: 0.15,
    verification: 0.2,
    mutualFollow: 0.25
})

ranker.updateDefaultFactors({
    maxDistance: 30,
    boostVerified: true,
    boostPremium: true
})

// Verificar configuração atual
const config = ranker.getConfiguration()
console.log(config)

// Resetar para valores padrão
ranker.resetConfiguration()
```

## Breakdown Detalhado

```typescript
const opcoes: RankingOptions = {
    includeBreakdown: true
}

const resultado = await ranker.rankUsers(candidatos, opcoes)

// Cada usuário terá um campo 'breakdown' com scores individuais
resultado.forEach(user => {
    console.log(`${user.username}: ${user.score}`)
    console.log(`  Distância: ${user.breakdown.distanceScore}`)
    console.log(`  Seguidores: ${user.breakdown.followersScore}`)
    console.log(`  Verificação: ${user.breakdown.verificationScore}`)
    // ... outros scores
})
```

## Contexto de Recomendação

```typescript
const opcoes: RankingOptions = {
    context: {
        timeOfDay: 14,        // 2 PM
        dayOfWeek: 1,         // Segunda-feira
        location: "São Paulo",
        device: "mobile",
        requestType: "discovery"
    }
}

const resultado = await ranker.rankUsers(candidatos, opcoes)
```

## Filtros Automáticos

O sistema aplica automaticamente os seguintes filtros:

- **Próprio usuário**: Sempre removido
- **Usuários bloqueados**: Removidos se `penalizeBlocked` estiver ativo
- **Usuários que te bloqueiam**: Sempre removidos
- **Usuários silenciados**: Removidos se `penalizeMuted` estiver ativo
- **Distância excessiva**: Removidos se excederem `maxDistance`
- **Seguidores fora da faixa**: Removidos se estiverem fora de `minFollowers`/`maxFollowers`

## Configurações Padrão

### Pesos Padrão
```typescript
{
    distance: 0.25,
    followers: 0.20,
    verification: 0.15,
    profilePicture: 0.10,
    relationWeight: 0.15,
    premium: 0.05,
    mutualFollow: 0.20,
    followYou: 0.10,
    youFollow: 0.05,
    blockYou: -0.50
}
```

### Fatores Padrão
```typescript
{
    maxDistance: 50,           // km
    minFollowers: 0,
    maxFollowers: 1000000,
    boostVerified: true,
    boostPremium: true,
    penalizeBlocked: true,
    penalizeMuted: true,
    boostMutualFollow: true,
    boostFollowYou: true,
    penalizeYouFollow: false
}
```

## Casos de Uso

### 1. Descoberta de Usuários Próximos
```typescript
const opcoes: RankingOptions = {
    weights: { distance: 0.5, followers: 0.1, verification: 0.1, mutualFollow: 0.3 },
    factors: { maxDistance: 10 }
}
```

### 2. Usuários Populares
```typescript
const opcoes: RankingOptions = {
    weights: { distance: 0.1, followers: 0.4, verification: 0.3, mutualFollow: 0.2 },
    factors: { minFollowers: 1000, boostVerified: true }
}
```

### 3. Conexões Sociais
```typescript
const opcoes: RankingOptions = {
    weights: { distance: 0.2, followers: 0.1, verification: 0.1, mutualFollow: 0.4, followYou: 0.2 },
    factors: { boostMutualFollow: true, boostFollowYou: true }
}
```

## Performance

- **Complexidade**: O(n) onde n é o número de candidatos
- **Filtros**: Aplicados antes do cálculo de scores para otimização
- **Ordenação**: O(n log n) para ordenação final por score
- **Memória**: O(n) para armazenar resultados

## Logs

O sistema gera logs detalhados para monitoramento:
- Inicialização da classe
- Atualizações de configuração
- Processo de ranqueamento
- Erros e exceções

## Exemplos Completos

Consulte o arquivo `examples.ts` para exemplos detalhados de uso em diferentes cenários.
