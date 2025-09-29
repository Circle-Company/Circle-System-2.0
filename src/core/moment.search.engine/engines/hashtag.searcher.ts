import { MomentSearchResult, SearchContext, SearchQuery } from "../types"

import { searchRules } from "../config"

export class HashtagSearcher {
    private readonly logger = console

    /**
     * Busca momentos por hashtags específicas
     */
    async search(query: SearchQuery, context?: SearchContext): Promise<MomentSearchResult[]> {
        const startTime = Date.now()

        try {
            // Extrair hashtags do termo de busca
            const hashtags = this.extractHashtags(query.term)

            // Adicionar hashtags dos filtros
            const filterHashtags = query.filters?.hashtags || []
            const allHashtags = [...hashtags, ...filterHashtags]

            if (allHashtags.length === 0) {
                return []
            }

            // Validar hashtags
            if (!this.isValidHashtags(allHashtags)) {
                throw new Error("Hashtags inválidas")
            }

            // Executar busca por hashtags
            const results = await this.executeHashtagSearch({
                hashtags: allHashtags,
                excludeHashtags: query.filters?.excludeHashtags || [],
                filters: query.filters,
                context,
            })

            // Calcular relevância de hashtags
            const scoredResults = results.map((result) => ({
                ...result,
                relevance: {
                    ...result.relevance,
                    breakdown: {
                        ...result.relevance.breakdown,
                        textual: this.calculateHashtagRelevance(result, allHashtags),
                    },
                },
            }))

            // Recalcular score geral
            const finalResults = scoredResults.map((result) => ({
                ...result,
                relevance: {
                    ...result.relevance,
                    score: this.calculateOverallScore(result.relevance.breakdown),
                },
            }))

            const duration = Date.now() - startTime
            this.logger.log(
                `Hashtag search completed in ${duration}ms for hashtags: ${allHashtags.join(", ")}`,
            )

            return finalResults
        } catch (error) {
            this.logger.error("Hashtag search failed:", error)
            throw error
        }
    }

    /**
     * Executa a busca por hashtags no banco de dados
     */
    private async executeHashtagSearch(params: {
        hashtags: string[]
        excludeHashtags: string[]
        filters?: any
        context?: SearchContext
    }): Promise<MomentSearchResult[]> {
        // TODO: Implementar busca real no banco de dados
        // Por enquanto, retorna dados mockados
        return this.getMockHashtagResults(params.hashtags, params.excludeHashtags)
    }

    /**
     * Extrai hashtags do termo de busca
     */
    private extractHashtags(term: string): string[] {
        const hashtagRegex = /#(\w+)/g
        const matches = term.match(hashtagRegex)

        if (!matches) {
            return []
        }

        return matches
            .map((match) => match.substring(1)) // Remove o #
            .filter((hashtag) => hashtag.length > 0)
            .slice(0, searchRules.validation.maxHashtags)
    }

    /**
     * Valida as hashtags
     */
    private isValidHashtags(hashtags: string[]): boolean {
        if (hashtags.length === 0 || hashtags.length > searchRules.validation.maxHashtags) {
            return false
        }

        return hashtags.every(
            (hashtag) =>
                hashtag.length > 0 && hashtag.length <= 50 && /^[a-zA-Z0-9_]+$/.test(hashtag),
        )
    }

    /**
     * Calcula a relevância baseada em hashtags
     */
    private calculateHashtagRelevance(
        result: MomentSearchResult,
        searchHashtags: string[],
    ): number {
        if (searchHashtags.length === 0) {
            return 0
        }

        const normalizedResultHashtags = result.hashtags.map((tag) => tag.toLowerCase())
        const normalizedSearchHashtags = searchHashtags.map((tag) => tag.toLowerCase())

        let matches = 0
        for (const searchHashtag of normalizedSearchHashtags) {
            if (normalizedResultHashtags.includes(searchHashtag)) {
                matches++
            }
        }

        // Score baseado na proporção de hashtags encontradas
        const baseScore = matches / searchHashtags.length

        // Bonus por hashtags populares
        const popularHashtags = ["vlog", "lifestyle", "travel", "food", "music"]
        const popularMatches = normalizedSearchHashtags.filter((tag) =>
            popularHashtags.includes(tag),
        ).length

        const popularityBonus = popularMatches * 0.1

        return Math.min(baseScore + popularityBonus, 1.0)
    }

    /**
     * Calcula o score geral baseado nos componentes
     */
    private calculateOverallScore(breakdown: any): number {
        const weights = {
            textual: 0.4,
            engagement: 0.25,
            recency: 0.2,
            quality: 0.1,
            proximity: 0.05,
        }

        return Object.entries(weights).reduce((score, [key, weight]) => {
            return score + (breakdown[key] || 0) * weight
        }, 0)
    }

    /**
     * Retorna resultados mockados para desenvolvimento
     */
    private getMockHashtagResults(
        hashtags: string[],
        excludeHashtags: string[],
    ): MomentSearchResult[] {
        const mockResults: MomentSearchResult[] = [
            {
                id: "moment_hashtag_1",
                title: `Momento com hashtags: ${hashtags.join(", ")}`,
                description: `Este momento contém as hashtags ${hashtags.join(", ")}`,
                hashtags: hashtags,
                ownerId: "user_1",
                ownerUsername: "user1",
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "PUBLISHED",
                visibility: "PUBLIC",
                metrics: {
                    views: 1200,
                    likes: 60,
                    comments: 30,
                    shares: 12,
                },
                media: {
                    type: "video",
                    duration: 200,
                    thumbnail: "https://example.com/thumb_hashtag1.jpg",
                },
                relevance: {
                    score: 0.9,
                    breakdown: {
                        textual: 1.0, // Match perfeito de hashtags
                        engagement: 0.8,
                        recency: 0.9,
                        quality: 0.8,
                        proximity: 0.5,
                    },
                },
            },
            {
                id: "moment_hashtag_2",
                title: `Outro momento com ${hashtags[0]}`,
                description: `Descrição sobre ${hashtags[0]} e outros tópicos`,
                hashtags: [hashtags[0], "related", "topic"],
                ownerId: "user_2",
                ownerUsername: "user2",
                createdAt: new Date(Date.now() - 7200000), // 2 horas atrás
                updatedAt: new Date(Date.now() - 7200000),
                status: "PUBLISHED",
                visibility: "PUBLIC",
                metrics: {
                    views: 900,
                    likes: 45,
                    comments: 22,
                    shares: 9,
                },
                media: {
                    type: "video",
                    duration: 160,
                    thumbnail: "https://example.com/thumb_hashtag2.jpg",
                },
                relevance: {
                    score: 0.7,
                    breakdown: {
                        textual: 0.8, // Match parcial de hashtags
                        engagement: 0.7,
                        recency: 0.8,
                        quality: 0.7,
                        proximity: 0.4,
                    },
                },
            },
        ]

        // Filtrar resultados que contêm hashtags excluídas
        return mockResults.filter(
            (result) =>
                !excludeHashtags.some((excludeTag) =>
                    result.hashtags.some((tag) => tag.toLowerCase() === excludeTag.toLowerCase()),
                ),
        )
    }
}
