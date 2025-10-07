/**
 * Adaptadores para embeddings do domínio
 * Converte embeddings de domínio (string) para formato interno do swipe engine (number[])
 */

import { MomentEmbedding as DomainMomentEmbedding } from "@/domain/moment/types"
import { UserEmbedding as DomainUserEmbedding } from "@/domain/user/types"

// Tipos adaptados para uso interno do swipe engine
export interface UserEmbedding {
    userId: string
    vector: number[]
    dimension: number
    metadata?: {
        interests?: string[]
        lastInteractionAt?: Date
        totalInteractions?: number
        [key: string]: any
    }
    createdAt: Date
    updatedAt: Date
}

export interface MomentEmbedding {
    momentId: string
    vector: number[]
    dimension: number
    metadata?: {
        topics?: string[]
        authorId?: string
        contentLength?: number
        engagementScore?: number
        [key: string]: any
    }
    createdAt: Date
    updatedAt: Date
}

/**
 * Converte embedding de usuário do domínio para formato do swipe engine
 */
export function fromDomainUserEmbedding(
    domainEmbedding: DomainUserEmbedding,
    userId: string,
): UserEmbedding {
    return {
        userId,
        vector:
            typeof domainEmbedding.vector === "string"
                ? JSON.parse(domainEmbedding.vector)
                : domainEmbedding.vector,
        dimension: domainEmbedding.dimension,
        metadata: domainEmbedding.metadata || {},
        createdAt: domainEmbedding.createdAt,
        updatedAt: domainEmbedding.updatedAt,
    }
}

/**
 * Converte embedding de momento do domínio para formato do swipe engine
 */
export function fromDomainMomentEmbedding(
    domainEmbedding: DomainMomentEmbedding,
    momentId: string,
): MomentEmbedding {
    return {
        momentId,
        vector:
            typeof domainEmbedding.vector === "string"
                ? JSON.parse(domainEmbedding.vector)
                : domainEmbedding.vector,
        dimension: domainEmbedding.dimension,
        metadata: domainEmbedding.metadata || {},
        createdAt: domainEmbedding.createdAt,
        updatedAt: domainEmbedding.updatedAt,
    }
}
