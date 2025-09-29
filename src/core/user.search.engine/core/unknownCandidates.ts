import Coordinate from "@models/user/coordinate-model"
import { FindedCandidatesProps } from "../types"
import { Op } from "sequelize"
import ProfilePicture from "@models/user/profilepicture-model"
import { SearchEngine } from "./searchEngine"
import Statistic from "@models/user/statistic-model"
import User from "@models/user/user-model"

export class unknownCandidates extends SearchEngine {
    constructor(searchEngine: SearchEngine) {
        // Chama o construtor da classe pai com os parâmetros necessários
        super({
            searchTerm: searchEngine.searchTerm,
            user: searchEngine.user,
        })
    }

    private async find(): Promise<FindedCandidatesProps[]> {
        const startTime = performance.now()

        const users = await User.findAll({
            attributes: ["id", "username", "verifyed", "muted", "name", "blocked"],
            where: {
                ...this.filterSearchParams(),
                id: {
                    [Op.not]: this.user.id,
                },
            },
            include: [
                {
                    model: Coordinate,
                    as: "coordinates",
                    attributes: ["latitude", "longitude"],
                },
                {
                    model: Statistic,
                    as: "statistics",
                    attributes: ["total_followers_num"],
                },
                {
                    model: ProfilePicture,
                    as: "profile_pictures",
                    attributes: ["tiny_resolution"],
                },
            ],
            limit: this.rules.candidates.maxUnknown,
        })

        const result = users.map((user) => ({
            user: {
                username: user.username,
                user_id: user.id,
            },
            weight: 0,
            is_premium: false,
        }))

        // Registra duração se métricas habilitadas
        if (this.isMetricsEnabled()) {
            const duration = performance.now() - startTime
            this.getMetricsInstance().recordDuration("unknownSearchDuration", duration)
        }

        return result
    }

    async process(): Promise<any[]> {
        const finded_candidates = await this.find()

        // Garante que o HydrationService está inicializado
        if (!this.hydratation) {
            await this.initializeHydrationService()
        }

        const hidrated_candidates = await this.hydratation.process(finded_candidates, "unknown")
        return this.rank(hidrated_candidates, "unknown")
    }
}
