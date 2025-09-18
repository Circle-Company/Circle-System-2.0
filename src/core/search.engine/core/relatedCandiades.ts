import { FindedCandidatesProps, RelatedUserProps } from "../types"

import { InternalServerError } from "@errors/index"
import { Op } from "sequelize"
import Relation from "@models/user/relation-model"
import { SearchEngine } from "./searchEngine"
import User from "@models/user/user-model"

export class relatedCandidates extends SearchEngine {
    private static cache: Map<string, { data: FindedCandidatesProps[]; timestamp: number }> =
        new Map()
    private static readonly CACHE_EXPIRATION_MS = 10000 // 10 segundos

    constructor(searchEngine: SearchEngine) {
        // Chama o construtor da classe pai com os parâmetros necessários
        super({
            searchTerm: searchEngine.searchTerm,
            user: searchEngine.user,
        })
    }

    /**
     * Gera uma chave única para o cache baseada no user_id
     */
    private getCacheKey(): string {
        return `related_candidates_${this.user.id}`
    }

    /**
     * Verifica se o cache está válido (não expirado)
     */
    private isCacheValid(cacheEntry: {
        data: FindedCandidatesProps[]
        timestamp: number
    }): boolean {
        const now = Date.now()
        return now - cacheEntry.timestamp < relatedCandidates.CACHE_EXPIRATION_MS
    }

    /**
     * Obtém dados do cache se válido
     */
    private getFromCache(): FindedCandidatesProps[] | null {
        const cacheKey = this.getCacheKey()
        const cacheEntry = relatedCandidates.cache.get(cacheKey)

        if (cacheEntry && this.isCacheValid(cacheEntry)) {
            // Registra cache hit se métricas habilitadas
            if (this.isMetricsEnabled()) {
                this.getMetricsInstance().recordCount("cacheHits", 1)
            }
            return cacheEntry.data
        }

        if (cacheEntry) {
            relatedCandidates.cache.delete(cacheKey)
        }

        // Registra cache miss se métricas habilitadas
        if (this.isMetricsEnabled()) {
            this.getMetricsInstance().recordCount("cacheMisses", 1)
        }

        return null
    }

    /**
     * Salva dados no cache
     */
    private saveToCache(data: FindedCandidatesProps[]): void {
        const cacheKey = this.getCacheKey()
        relatedCandidates.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
        })
    }

    /**
     * Limpa o cache para um usuário específico
     */
    public static clearCacheForUser(userId: string): void {
        const cacheKey = `related_candidates_${userId}`
        relatedCandidates.cache.delete(cacheKey)
    }

    /**
     * Limpa todo o cache
     */
    public static clearAllCache(): void {
        relatedCandidates.cache.clear()
    }

    private async find(): Promise<FindedCandidatesProps[]> {
        const startTime = performance.now()

        try {
            // Verifica se há dados válidos no cache
            const cachedData = this.getFromCache()
            if (cachedData) {
                // Registra duração de cache hit se métricas habilitadas
                if (this.isMetricsEnabled()) {
                    const duration = performance.now() - startTime
                    this.getMetricsInstance().recordDuration("relatedSearchDuration", duration)
                }
                return cachedData
            }

            // Uma única consulta com JOIN para buscar relations e users
            const relationsWithUsers = await Relation.findAll({
                attributes: ["related_user_id", "weight"],
                limit: this.rules.candidates.maxRelated,
                order: [["weight", "DESC"]],
                where: {
                    user_id: this.user.id,
                    weight: {
                        [Op.gte]: this.rules.candidates.minRelationWeight,
                    },
                    related_user_id: {
                        [Op.not]: this.user.id,
                    },
                },
                include: [
                    {
                        model: User,
                        as: "related_user", // Assumindo que existe essa associação
                        attributes: ["id", "username"],
                        required: true, // INNER JOIN para garantir que o usuário existe
                    },
                ],
            })

            // Mapeia os resultados diretamente
            const validCandidates = relationsWithUsers.map((relation: any) => {
                if (!relation.relatedUser) {
                    throw new InternalServerError({
                        message: "Can't find related user.",
                    })
                }

                return {
                    user: {
                        username: relation.relatedUser.username,
                        user_id: relation.relatedUser.id,
                    },
                    weight: relation.weight,
                    is_premium: false,
                }
            })

            // Salva no cache
            this.saveToCache(validCandidates)

            // Registra duração de cache miss se métricas habilitadas
            if (this.isMetricsEnabled()) {
                const duration = performance.now() - startTime
                this.getMetricsInstance().recordDuration("relatedSearchDuration", duration)
            }

            return validCandidates
        } catch (error) {
            console.error("Error in find_search_candidates:", error)
            throw error
        }
    }

    private filter(candidates: FindedCandidatesProps[]) {
        const idsSet = new Set<bigint>()
        const uniqueUsers: RelatedUserProps[] = []

        // Remove usuários duplicados
        for (const user of candidates) {
            if (!idsSet.has(user.user.user_id)) {
                idsSet.add(user.user.user_id)
                uniqueUsers.push(user)
            }
        }

        let candidates_without_duplication = uniqueUsers
        let filtered_premium_candidates = candidates_without_duplication.filter(
            (item) => item.is_premium
        )
        let filtered_non_premium_candidates = candidates_without_duplication.filter(
            (item) => !item.is_premium
        )

        if (filtered_premium_candidates.length > this.rules.candidates.maxPremium) {
            const top_premium_candidates = filtered_premium_candidates.sort(
                (a, b) => b.weight - a.weight
            )
            filtered_premium_candidates = top_premium_candidates.slice(
                0,
                this.rules.candidates.maxPremium
            )
        }

        const filtered_candidates = [
            ...filtered_premium_candidates,
            ...filtered_non_premium_candidates,
        ]
        const sorted_filtered_candidates = filtered_candidates.sort((a, b) => b.weight - a.weight)
        const filtered_candidates_with_search_term = sorted_filtered_candidates.filter((item) =>
            item.user.username.includes(this.searchTerm)
        )

        const finalResult = filtered_candidates_with_search_term.slice(0, this.rules.results.max)

        return finalResult
    }

    async process() {
        const finded_candidates = await this.find()
        const filtered_candidates = this.filter(finded_candidates)

        // Garante que o HydrationService está inicializado
        if (!this.hydratation) {
            await this.initializeHydrationService()
        }

        const hidrated_candidates = await this.hydratation.process(filtered_candidates, "related")
        return this.rank(hidrated_candidates, "related")
    }
}
