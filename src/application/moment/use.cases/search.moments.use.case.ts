import {
    MomentSearchEngine,
    SearchContext,
    SearchQuery,
    SearchResult,
} from "@/core/moment.search.engine"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface SearchMomentsRequest {
    term: string
    filters?: {
        status?: string[]
        visibility?: string[]
        contentType?: string[]
        dateFrom?: Date
        dateTo?: Date
        location?: {
            latitude: number
            longitude: number
            radius: number
        }
        userId?: string
        excludeUserId?: string
        minLikes?: number
        minViews?: number
        minComments?: number
        hashtags?: string[]
        excludeHashtags?: string[]
        minDuration?: number
        maxDuration?: number
    }
    pagination?: {
        limit?: number
        offset?: number
    }
    sorting?: {
        field: "relevance" | "date" | "likes" | "views" | "comments" | "distance"
        order: "asc" | "desc"
    }
    userId?: string
    userLocation?: {
        latitude: number
        longitude: number
    }
    userPreferences?: {
        languages?: string[]
        interests?: string[]
        blockedUsers?: string[]
        mutedUsers?: string[]
    }
}

export interface SearchMomentsResponse {
    success: boolean
    results?: SearchResult
    error?: string
}

export class SearchMomentsUseCase {
    private readonly searchEngine: MomentSearchEngine

    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {
        this.searchEngine = new MomentSearchEngine()
    }

    async execute(request: SearchMomentsRequest): Promise<SearchMomentsResponse> {
        try {
            // Validar parâmetros obrigatórios
            if (!request.term) {
                return { success: false, error: "Termo de busca é obrigatório" }
            }

            // Validar limites
            if (
                request.pagination?.limit !== undefined &&
                (request.pagination.limit < 1 || request.pagination.limit > 100)
            ) {
                return { success: false, error: "Limite deve estar entre 1 e 100" }
            }

            if (request.pagination?.offset !== undefined && request.pagination.offset < 0) {
                return { success: false, error: "Offset deve ser maior ou igual a 0" }
            }

            // Construir query de busca
            const searchQuery: SearchQuery = {
                term: request.term.trim(),
                filters: request.filters,
                pagination: request.pagination,
                sorting: request.sorting,
            }

            // Construir contexto de busca
            const searchContext: SearchContext = {
                userId: request.userId,
                userLocation: request.userLocation,
                userPreferences: request.userPreferences,
            }

            // Executar busca
            const results = await this.searchEngine.search(searchQuery, searchContext)

            return {
                success: true,
                results,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    /**
     * Obtém sugestões de busca
     */
    async getSuggestions(term: string, userId?: string): Promise<string[]> {
        try {
            if (!term || term.trim().length < 2) {
                return []
            }

            // TODO: Implementar busca de sugestões baseada em:
            // - Hashtags populares
            // - Títulos de momentos
            // - Histórico de buscas do usuário
            // - Tendências atuais

            const mockSuggestions = [
                `${term} tutorial`,
                `${term} dicas`,
                `${term} review`,
                `como usar ${term}`,
                `melhor ${term}`,
                `#${term}`,
                `${term} 2024`,
            ]

            return mockSuggestions.slice(0, 10)
        } catch (error) {
            console.error("Error getting search suggestions:", error)
            return []
        }
    }

    /**
     * Obtém estatísticas de busca
     */
    async getSearchStats(): Promise<any> {
        try {
            return this.searchEngine.getStats()
        } catch (error) {
            console.error("Error getting search stats:", error)
            return null
        }
    }

    /**
     * Busca momentos por hashtag específica
     */
    async searchByHashtag(
        hashtag: string,
        request: Omit<SearchMomentsRequest, "term">,
    ): Promise<SearchMomentsResponse> {
        try {
            // Remover # se presente
            const cleanHashtag = hashtag.startsWith("#") ? hashtag.substring(1) : hashtag

            if (!cleanHashtag) {
                return { success: false, error: "Hashtag é obrigatória" }
            }

            // Construir query específica para hashtag
            const searchQuery: SearchQuery = {
                term: `#${cleanHashtag}`,
                filters: {
                    ...request.filters,
                    hashtags: [cleanHashtag],
                },
                pagination: request.pagination,
                sorting: request.sorting,
            }

            const searchContext: SearchContext = {
                userId: request.userId,
                userLocation: request.userLocation,
                userPreferences: request.userPreferences,
            }

            const results = await this.searchEngine.search(searchQuery, searchContext)

            return {
                success: true,
                results,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    /**
     * Busca momentos por localização
     */
    async searchByLocation(
        latitude: number,
        longitude: number,
        radius: number,
        request: Omit<SearchMomentsRequest, "term">,
    ): Promise<SearchMomentsResponse> {
        try {
            if (latitude == null || longitude == null || radius == null) {
                return { success: false, error: "Latitude, longitude e raio são obrigatórios" }
            }

            if (radius <= 0 || radius > 100) {
                return { success: false, error: "Raio deve estar entre 1 e 100 km" }
            }

            // Construir query específica para localização
            const searchQuery: SearchQuery = {
                term: "momentos próximos",
                filters: {
                    ...request.filters,
                    location: {
                        latitude,
                        longitude,
                        radius,
                    },
                },
                pagination: request.pagination,
                sorting: request.sorting,
            }

            const searchContext: SearchContext = {
                userId: request.userId,
                userLocation: { latitude, longitude },
                userPreferences: request.userPreferences,
            }

            const results = await this.searchEngine.search(searchQuery, searchContext)

            return {
                success: true,
                results,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
