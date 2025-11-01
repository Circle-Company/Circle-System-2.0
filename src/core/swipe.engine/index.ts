/**
 * SwipeEngine v2 - Motor de recomendação baseado em embeddings
 *
 * Exportação principal para o motor de recomendação do Circle
 * que usa o algoritmo DBSCAN para clustering e geração de recomendações.
 */

import { Recommendation, RecommendationOptions } from "@/core/swipe.engine/core/recommendation"

import InteractionEvent from "@/infra/models/swipe.engine/interaction.event.model"
import PostCluster from "@/infra/models/swipe.engine/post.cluster.model"
import PostClusterRank from "@/infra/models/swipe.engine/post.cluster.rank.model"
import PostEmbedding from "@/infra/models/moment/moment.embedding.model"
import { RecommendationEngine } from "@/core/swipe.engine/core/recommendation/rec.engine"
import UserEmbedding from "@/infra/models/user/user.embedding.model"
import UserInteractionHistory from "@/infra/models/user/user.interaction.history.model"
import UserInteractionSummary from "@/infra/models/swipe.engine/user.interaction.summary.model"
import { connection } from "@/infra/database"

export class SwipeEngine {
    public recommender: RecommendationEngine

    constructor() {
        this.recommender = new RecommendationEngine()
    }

    public async getRecommendations(
        userId: string,
        limit: number = 10,
        options: RecommendationOptions = {},
    ): Promise<Recommendation[]> {
        return this.recommender.getRecommendations(userId, limit, options)
    }
}
// Inicialização
export const initializeModels = () => {
    // Inicializar modelos
    UserEmbedding.initialize(connection)
    PostEmbedding.initialize(connection)
    PostCluster.initialize(connection)
    PostClusterRank.initialize(connection)
    InteractionEvent.initialize(connection)
    UserInteractionHistory.initialize(connection)
    UserInteractionSummary.initialize(connection)

    // Associações
    UserEmbedding.associate(connection.models)
    PostEmbedding.associate(connection.models)
    PostCluster.associate(connection.models)
    PostClusterRank.associate(connection.models)
    UserInteractionHistory.associate(connection.models)
    UserInteractionSummary.associate(connection.models)
    InteractionEvent.associate(connection.models)
}
