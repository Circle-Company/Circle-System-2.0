import { MomentSearchResult, SearchContext, SearchQuery } from "../types"

import { searchRules } from "../config"

export class TextSearcher {
    private readonly logger = console

    /**
     * Busca momentos por termo textual
     */
    async search(query: SearchQuery, context?: SearchContext): Promise<MomentSearchResult[]> {
        const startTime = Date.now()

        try {
            // Validar termo de busca
            if (!this.isValidSearchTerm(query.term)) {
                throw new Error("Termo de busca inválido")
            }

            // Normalizar termo
            const normalizedTerm = this.normalizeSearchTerm(query.term)

            // Extrair hashtags do termo
            const hashtags = this.extractHashtags(normalizedTerm)
            const textTerm = this.removeHashtags(normalizedTerm)

            // Executar busca textual
            const results = await this.executeTextSearch({
                term: textTerm,
                hashtags,
                filters: query.filters,
                context,
            })

            // Calcular relevância textual
            const scoredResults = results.map((result) => ({
                ...result,
                relevance: {
                    ...result.relevance,
                    breakdown: {
                        ...result.relevance.breakdown,
                        textual: this.calculateTextualRelevance(result, textTerm, hashtags),
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
            this.logger.log(`Text search completed in ${duration}ms for term: "${query.term}"`)

            return finalResults
        } catch (error) {
            this.logger.error("Text search failed:", error)
            throw error
        }
    }

    /**
     * Executa a busca textual no banco de dados
     */
    private async executeTextSearch(params: {
        term: string
        hashtags: string[]
        filters?: any
        context?: SearchContext
    }): Promise<MomentSearchResult[]> {
        // TODO: Implementar busca real no banco de dados
        // Por enquanto, retorna dados mockados
        return this.getMockResults(params.term, params.hashtags)
    }

    /**
     * Valida o termo de busca
     */
    private isValidSearchTerm(term: string): boolean {
        if (!term || typeof term !== "string") {
            return false
        }

        const trimmed = term.trim()
        return (
            trimmed.length >= searchRules.validation.minTermLength &&
            trimmed.length <= searchRules.validation.maxTermLength
        )
    }

    /**
     * Normaliza o termo de busca
     */
    private normalizeSearchTerm(term: string): string {
        return term
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ") // Remove espaços múltiplos
            .replace(/[^\w\s#@]/g, "") // Remove caracteres especiais exceto # e @
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
     * Remove hashtags do termo de busca
     */
    private removeHashtags(term: string): string {
        return term.replace(/#\w+/g, "").trim()
    }

    /**
     * Calcula a relevância textual de um resultado
     */
    private calculateTextualRelevance(
        result: MomentSearchResult,
        term: string,
        hashtags: string[],
    ): number {
        let score = 0

        // Score por match no título
        const titleMatch = this.calculateTextMatch(result.title, term)
        score += titleMatch * 0.4

        // Score por match na descrição
        const descriptionMatch = this.calculateTextMatch(result.description, term)
        score += descriptionMatch * 0.3

        // Score por hashtags
        const hashtagMatch = this.calculateHashtagMatch(result.hashtags, hashtags)
        score += hashtagMatch * 0.3

        return Math.min(score, 1.0)
    }

    /**
     * Calcula o match de texto entre dois strings
     */
    private calculateTextMatch(text: string, term: string): number {
        if (!text || !term) {
            return 0
        }

        const normalizedText = text.toLowerCase()
        const normalizedTerm = term.toLowerCase()

        // Match exato
        if (normalizedText.includes(normalizedTerm)) {
            return 1.0
        }

        // Match parcial por palavras
        const textWords = normalizedText.split(/\s+/)
        const termWords = normalizedTerm.split(/\s+/)

        let matches = 0
        for (const termWord of termWords) {
            if (textWords.some((word) => word.includes(termWord) || termWord.includes(word))) {
                matches++
            }
        }

        return matches / termWords.length
    }

    /**
     * Calcula o match de hashtags
     */
    private calculateHashtagMatch(resultHashtags: string[], searchHashtags: string[]): number {
        if (searchHashtags.length === 0) {
            return 0
        }

        const normalizedResultHashtags = resultHashtags.map((tag) => tag.toLowerCase())
        const normalizedSearchHashtags = searchHashtags.map((tag) => tag.toLowerCase())

        let matches = 0
        for (const searchHashtag of normalizedSearchHashtags) {
            if (normalizedResultHashtags.includes(searchHashtag)) {
                matches++
            }
        }

        return matches / searchHashtags.length
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
    private getMockResults(term: string, hashtags: string[]): MomentSearchResult[] {
        const mockResults: MomentSearchResult[] = [
            {
                id: "moment_1",
                title: `Momento sobre ${term}`,
                description: `Este é um momento que fala sobre ${term} e suas características`,
                hashtags: hashtags.length > 0 ? hashtags : ["vlog", "lifestyle"],
                ownerId: "user_1",
                ownerUsername: "user1",
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "PUBLISHED",
                visibility: "PUBLIC",
                metrics: {
                    views: 1000,
                    likes: 50,
                    comments: 25,
                    shares: 10,
                },
                media: {
                    type: "video",
                    duration: 120,
                    thumbnail: "https://example.com/thumb1.jpg",
                },
                relevance: {
                    score: 0.8,
                    breakdown: {
                        textual: 0.8,
                        engagement: 0.7,
                        recency: 0.9,
                        quality: 0.8,
                        proximity: 0.5,
                    },
                },
            },
            {
                id: "moment_2",
                title: `Outro momento sobre ${term}`,
                description: `Descrição detalhada sobre ${term} e como usar`,
                hashtags: ["tutorial", "guide", ...hashtags],
                ownerId: "user_2",
                ownerUsername: "user2",
                createdAt: new Date(Date.now() - 86400000), // 1 dia atrás
                updatedAt: new Date(Date.now() - 86400000),
                status: "PUBLISHED",
                visibility: "PUBLIC",
                metrics: {
                    views: 500,
                    likes: 30,
                    comments: 15,
                    shares: 5,
                },
                media: {
                    type: "video",
                    duration: 180,
                    thumbnail: "https://example.com/thumb2.jpg",
                },
                relevance: {
                    score: 0.6,
                    breakdown: {
                        textual: 0.6,
                        engagement: 0.5,
                        recency: 0.7,
                        quality: 0.6,
                        proximity: 0.4,
                    },
                },
            },
        ]

        return mockResults
    }
}
