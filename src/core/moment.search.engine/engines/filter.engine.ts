import { MomentSearchResult, SearchContext, SearchFilters } from "../types"

export class FilterEngine {
    private readonly logger = console

    /**
     * Aplica filtros aos resultados de busca
     */
    async filter(
        results: MomentSearchResult[],
        filters: SearchFilters,
        context?: SearchContext,
    ): Promise<MomentSearchResult[]> {
        const startTime = Date.now()

        try {
            let filteredResults = [...results]

            // Aplicar filtros de status
            if (filters.status && filters.status.length > 0) {
                filteredResults = this.filterByStatus(filteredResults, filters.status)
            }

            // Aplicar filtros de visibilidade
            if (filters.visibility && filters.visibility.length > 0) {
                filteredResults = this.filterByVisibility(
                    filteredResults,
                    filters.visibility,
                    context,
                )
            }

            // Aplicar filtros temporais
            if (filters.dateFrom || filters.dateTo) {
                filteredResults = this.filterByDateRange(
                    filteredResults,
                    filters.dateFrom,
                    filters.dateTo,
                )
            }

            // Aplicar filtros de usuário
            if (filters.userId) {
                filteredResults = this.filterByUserId(filteredResults, filters.userId)
            }

            if (filters.excludeUserId) {
                filteredResults = this.filterByExcludeUserId(filteredResults, filters.excludeUserId)
            }

            // Aplicar filtros de qualidade
            if (filters.minLikes || filters.minViews || filters.minComments) {
                filteredResults = this.filterByQuality(filteredResults, {
                    minLikes: filters.minLikes || 0,
                    minViews: filters.minViews || 0,
                    minComments: filters.minComments || 0,
                })
            }

            // Aplicar filtros de hashtag
            if (filters.hashtags && filters.hashtags.length > 0) {
                filteredResults = this.filterByHashtags(filteredResults, filters.hashtags)
            }

            if (filters.excludeHashtags && filters.excludeHashtags.length > 0) {
                filteredResults = this.filterByExcludeHashtags(
                    filteredResults,
                    filters.excludeHashtags,
                )
            }

            // Aplicar filtros de duração
            if (filters.minDuration || filters.maxDuration) {
                filteredResults = this.filterByDuration(
                    filteredResults,
                    filters.minDuration,
                    filters.maxDuration,
                )
            }

            // Aplicar filtros de localização
            if (filters.location) {
                filteredResults = this.filterByLocation(filteredResults, filters.location)
            }

            const duration = Date.now() - startTime
            this.logger.log(
                `Filtering completed in ${duration}ms, ${results.length} -> ${filteredResults.length} results`,
            )

            return filteredResults
        } catch (error) {
            this.logger.error("Filtering failed:", error)
            throw error
        }
    }

    /**
     * Filtra por status
     */
    private filterByStatus(
        results: MomentSearchResult[],
        statuses: string[],
    ): MomentSearchResult[] {
        return results.filter((result) => statuses.includes(result.status))
    }

    /**
     * Filtra por visibilidade
     */
    private filterByVisibility(
        results: MomentSearchResult[],
        visibilities: string[],
        context?: SearchContext,
    ): MomentSearchResult[] {
        return results.filter((result) => {
            if (visibilities.includes(result.visibility)) {
                return true
            }

            // Se o usuário está logado e é o dono do momento, permitir visualização
            if (context?.userId && result.ownerId === context.userId) {
                return true
            }

            return false
        })
    }

    /**
     * Filtra por range de datas
     */
    private filterByDateRange(
        results: MomentSearchResult[],
        dateFrom?: Date,
        dateTo?: Date,
    ): MomentSearchResult[] {
        return results.filter((result) => {
            const createdAt = new Date(result.createdAt)

            if (dateFrom && createdAt < dateFrom) {
                return false
            }

            if (dateTo && createdAt > dateTo) {
                return false
            }

            return true
        })
    }

    /**
     * Filtra por ID do usuário
     */
    private filterByUserId(results: MomentSearchResult[], userId: string): MomentSearchResult[] {
        return results.filter((result) => result.ownerId === userId)
    }

    /**
     * Filtra excluindo ID do usuário
     */
    private filterByExcludeUserId(
        results: MomentSearchResult[],
        excludeUserId: string,
    ): MomentSearchResult[] {
        return results.filter((result) => result.ownerId !== excludeUserId)
    }

    /**
     * Filtra por qualidade (métricas mínimas)
     */
    private filterByQuality(
        results: MomentSearchResult[],
        quality: { minLikes: number; minViews: number; minComments: number },
    ): MomentSearchResult[] {
        return results.filter(
            (result) =>
                result.metrics.likes >= quality.minLikes &&
                result.metrics.views >= quality.minViews &&
                result.metrics.comments >= quality.minComments,
        )
    }

    /**
     * Filtra por hashtags
     */
    private filterByHashtags(
        results: MomentSearchResult[],
        hashtags: string[],
    ): MomentSearchResult[] {
        return results.filter((result) =>
            hashtags.some((hashtag) =>
                result.hashtags.some((tag) => tag.toLowerCase() === hashtag.toLowerCase()),
            ),
        )
    }

    /**
     * Filtra excluindo hashtags
     */
    private filterByExcludeHashtags(
        results: MomentSearchResult[],
        excludeHashtags: string[],
    ): MomentSearchResult[] {
        return results.filter(
            (result) =>
                !excludeHashtags.some((excludeHashtag) =>
                    result.hashtags.some(
                        (tag) => tag.toLowerCase() === excludeHashtag.toLowerCase(),
                    ),
                ),
        )
    }

    /**
     * Filtra por duração
     */
    private filterByDuration(
        results: MomentSearchResult[],
        minDuration?: number,
        maxDuration?: number,
    ): MomentSearchResult[] {
        return results.filter((result) => {
            const duration = result.media.duration || 0

            if (minDuration && duration < minDuration) {
                return false
            }

            if (maxDuration && duration > maxDuration) {
                return false
            }

            return true
        })
    }

    /**
     * Filtra por localização
     */
    private filterByLocation(
        results: MomentSearchResult[],
        location: { latitude: number; longitude: number; radius: number },
    ): MomentSearchResult[] {
        return results.filter((result) => {
            if (!result.location) {
                return false
            }

            const distance = this.calculateDistance(
                location.latitude,
                location.longitude,
                result.location.latitude,
                result.location.longitude,
            )

            return distance <= location.radius
        })
    }

    /**
     * Calcula a distância entre dois pontos usando a fórmula de Haversine
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371 // Raio da Terra em km
        const dLat = this.toRadians(lat2 - lat1)
        const dLon = this.toRadians(lon2 - lon1)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return distance
    }

    /**
     * Converte graus para radianos
     */
    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180)
    }

    /**
     * Aplica filtros padrão
     */
    async applyDefaultFilters(
        results: MomentSearchResult[],
        context?: SearchContext,
    ): Promise<MomentSearchResult[]> {
        const defaultFilters: SearchFilters = {
            status: ["PUBLISHED"],
            visibility: ["PUBLIC", "FOLLOWERS"],
            dateFrom: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), // 2 anos atrás
            minLikes: 0,
            minViews: 0,
            minComments: 0,
        }

        return await this.filter(results, defaultFilters, context)
    }
}
