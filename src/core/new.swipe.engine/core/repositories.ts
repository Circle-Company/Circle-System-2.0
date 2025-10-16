/**
 * Exportação central de todas as interfaces de repositórios
 * Usa as interfaces nativas dos domínios
 */

export type { IClusterRepository } from "@/domain/cluster"
export type { IMomentEmbeddingRepository } from "@/domain/moment"
export type {
    IInteractionRepository,
    IUserEmbeddingRepository,
    DomainUserInteraction as UserInteraction,
} from "@/domain/user"
