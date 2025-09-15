/**
 * Exportação central dos serviços de embedding
 */

import { PostEmbeddingService } from "./post"
import { UserEmbeddingService } from "./user"

export * from "./post"
export * from "./user"

// Interface simplificada para agrupar os serviços
export interface EmbeddingServices {
    userEmbeddingService: UserEmbeddingService
    postEmbeddingService: PostEmbeddingService
}
