import { MomentSearchResult, SearchContext, SearchQuery } from "../types"

import { searchRules } from "../config"

export class LocationSearcher {
    private readonly logger = console

    /**
     * Busca momentos por proximidade geográfica
     */
    async search(query: SearchQuery, context?: SearchContext): Promise<MomentSearchResult[]> {
        const startTime = Date.now()

        try {
            // Verificar se há filtros de localização
            if (!query.filters?.location) {
                return []
            }

            const location = query.filters.location

            // Validar parâmetros de localização
            if (!this.isValidLocation(location)) {
                throw new Error("Parâmetros de localização inválidos")
            }

            // Executar busca por localização
            const results = await this.executeLocationSearch({
                latitude: location.latitude,
                longitude: location.longitude,
                radius: location.radius,
                filters: query.filters,
                context,
            })

            // Calcular distâncias e relevância de proximidade
            const scoredResults = results.map((result) => ({
                ...result,
                distance: this.calculateDistance(
                    location.latitude,
                    location.longitude,
                    result.location?.latitude || 0,
                    result.location?.longitude || 0,
                ),
                relevance: {
                    ...result.relevance,
                    breakdown: {
                        ...result.relevance.breakdown,
                        proximity: this.calculateProximityRelevance(
                            result,
                            location.latitude,
                            location.longitude,
                            location.radius,
                        ),
                    },
                },
            }))

            // Filtrar por raio
            const filteredResults = scoredResults.filter(
                (result) => result.distance && result.distance <= location.radius,
            )

            // Recalcular score geral
            const finalResults = filteredResults.map((result) => ({
                ...result,
                relevance: {
                    ...result.relevance,
                    score: this.calculateOverallScore(result.relevance.breakdown),
                },
            }))

            const duration = Date.now() - startTime
            this.logger.log(
                `Location search completed in ${duration}ms for location: ${location.latitude}, ${location.longitude}`,
            )

            return finalResults
        } catch (error) {
            this.logger.error("Location search failed:", error)
            throw error
        }
    }

    /**
     * Executa a busca por localização no banco de dados
     */
    private async executeLocationSearch(params: {
        latitude: number
        longitude: number
        radius: number
        filters?: any
        context?: SearchContext
    }): Promise<MomentSearchResult[]> {
        // TODO: Implementar busca real no banco de dados usando PostGIS
        // Por enquanto, retorna dados mockados
        return this.getMockLocationResults(params.latitude, params.longitude, params.radius)
    }

    /**
     * Valida os parâmetros de localização
     */
    private isValidLocation(location: {
        latitude: number
        longitude: number
        radius: number
    }): boolean {
        return (
            location.latitude >= -90 &&
            location.latitude <= 90 &&
            location.longitude >= -180 &&
            location.longitude <= 180 &&
            location.radius > 0 &&
            location.radius <= searchRules.validation.maxRadius
        )
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
     * Calcula a relevância de proximidade
     */
    private calculateProximityRelevance(
        result: MomentSearchResult,
        searchLat: number,
        searchLon: number,
        radius: number,
    ): number {
        if (!result.location) {
            return 0
        }

        const distance = this.calculateDistance(
            searchLat,
            searchLon,
            result.location.latitude,
            result.location.longitude,
        )

        // Score baseado na distância (quanto mais próximo, maior o score)
        if (distance <= radius * 0.1) {
            return 1.0 // Muito próximo
        } else if (distance <= radius * 0.3) {
            return 0.8 // Próximo
        } else if (distance <= radius * 0.6) {
            return 0.6 // Moderadamente próximo
        } else if (distance <= radius) {
            return 0.4 // Dentro do raio
        } else {
            return 0 // Fora do raio
        }
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
    private getMockLocationResults(
        latitude: number,
        longitude: number,
        radius: number,
    ): MomentSearchResult[] {
        const mockResults: MomentSearchResult[] = [
            {
                id: "moment_location_1",
                title: "Momento próximo à localização",
                description: "Este momento foi criado próximo à sua localização",
                hashtags: ["local", "nearby"],
                ownerId: "user_1",
                ownerUsername: "user1",
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "PUBLISHED",
                visibility: "PUBLIC",
                location: {
                    latitude: latitude + 0.001, // ~100m de distância
                    longitude: longitude + 0.001,
                    address: "Endereço próximo",
                },
                metrics: {
                    views: 800,
                    likes: 40,
                    comments: 20,
                    shares: 8,
                },
                media: {
                    type: "video",
                    duration: 90,
                    thumbnail: "https://example.com/thumb_location1.jpg",
                },
                relevance: {
                    score: 0.7,
                    breakdown: {
                        textual: 0.5,
                        engagement: 0.6,
                        recency: 0.8,
                        quality: 0.7,
                        proximity: 0.9,
                    },
                },
            },
            {
                id: "moment_location_2",
                title: "Outro momento na região",
                description: "Mais um momento criado na mesma região",
                hashtags: ["regional", "community"],
                ownerId: "user_2",
                ownerUsername: "user2",
                createdAt: new Date(Date.now() - 3600000), // 1 hora atrás
                updatedAt: new Date(Date.now() - 3600000),
                status: "PUBLISHED",
                visibility: "PUBLIC",
                location: {
                    latitude: latitude - 0.002, // ~200m de distância
                    longitude: longitude + 0.002,
                    address: "Outro endereço próximo",
                },
                metrics: {
                    views: 600,
                    likes: 35,
                    comments: 18,
                    shares: 6,
                },
                media: {
                    type: "video",
                    duration: 150,
                    thumbnail: "https://example.com/thumb_location2.jpg",
                },
                relevance: {
                    score: 0.6,
                    breakdown: {
                        textual: 0.4,
                        engagement: 0.5,
                        recency: 0.7,
                        quality: 0.6,
                        proximity: 0.8,
                    },
                },
            },
        ]

        return mockResults
    }
}
