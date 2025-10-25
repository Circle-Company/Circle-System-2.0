import {
    ModerationEntity,
    ModerationFlagEnum,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "@/domain/moderation"
import {
    BlockType,
    ContentBlockingRequest,
    ContentBlockingResult,
    ModerationEngineConfig,
} from "../types"

import { ModerationRepository } from "../types"

export class ContentBlocker {
    constructor(
        private readonly moderationRepository: ModerationRepository,
        private readonly config: ModerationEngineConfig,
    ) {}

    /**
     * Aplica bloqueio baseado na severidade e tipo de conteúdo
     */
    async blockContent(request: ContentBlockingRequest): Promise<ContentBlockingResult> {
        try {
            const moderation = await this.moderationRepository.findById(request.moderationId)
            if (!moderation) {
                throw new Error(`Moderação não encontrada: ${request.moderationId}`)
            }

            const blockType = this.determineBlockType(moderation, request)
            await this.applyBlock(moderation, blockType, request)

            return {
                success: true,
                moderationId: request.moderationId,
                blockType,
                appliedAt: new Date(),
                reason: request.reason,
                metadata: request.metadata,
            }
        } catch (error) {
            return {
                success: false,
                moderationId: request.moderationId,
                blockType: BlockType.APPROVE,
                appliedAt: new Date(),
                reason: `Erro ao aplicar bloqueio: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                metadata: { error: true },
            }
        }
    }

    /**
     * Aplica bloqueio automático baseado nas regras de configuração
     */
    async applyAutomaticBlocking(moderation: ModerationEntity): Promise<ContentBlockingResult> {
        const blockType = this.determineAutomaticBlockType(moderation)

        if (blockType === BlockType.APPROVE) {
            // Não aplicar bloqueio, apenas retornar resultado
            return {
                success: true,
                moderationId: moderation.id,
                blockType: BlockType.APPROVE,
                appliedAt: new Date(),
                reason: "Conteúdo aprovado automaticamente",
                metadata: { automatic: true },
            }
        }

        const request: ContentBlockingRequest = {
            moderationId: moderation.id,
            reason: this.generateAutomaticReason(moderation, blockType),
            severity: moderation.severity,
            blockType,
            metadata: { automatic: true },
        }

        return this.blockContent(request)
    }

    /**
     * Remove bloqueio de conteúdo
     */
    async unblockContent(moderationId: string): Promise<ContentBlockingResult> {
        try {
            const moderation = await this.moderationRepository.findById(moderationId)
            if (!moderation) {
                throw new Error(`Moderação não encontrada: ${moderationId}`)
            }

            // Atualizar moderação para remover bloqueio
            const updatedModeration = await this.moderationRepository.update(moderationId, {
                status: ModerationStatusEnum.APPROVED,
                isBlocked: false,
                isHidden: false,
                moderatedAt: new Date(),
            })

            return {
                success: true,
                moderationId,
                blockType: BlockType.APPROVE,
                appliedAt: new Date(),
                reason: "Bloqueio removido",
                metadata: { unblocked: true },
            }
        } catch (error) {
            return {
                success: false,
                moderationId,
                blockType: BlockType.APPROVE,
                appliedAt: new Date(),
                reason: `Erro ao remover bloqueio: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                metadata: { error: true },
            }
        }
    }

    /**
     * Determina o tipo de bloqueio baseado na moderação e request
     */
    private determineBlockType(
        moderation: ModerationEntity,
        request: ContentBlockingRequest,
    ): BlockType {
        // Se o request especifica um tipo, usar ele
        if (request.blockType) {
            return request.blockType
        }

        // Determinar baseado apenas na severidade
        switch (moderation.severity) {
            case ModerationSeverityEnum.HIGH:
                return BlockType.BLOCK
            case ModerationSeverityEnum.MEDIUM:
                return BlockType.REVIEW
            case ModerationSeverityEnum.LOW:
            default:
                return BlockType.APPROVE
        }
    }

    /**
     * Determina o tipo de bloqueio automático baseado nas regras
     */
    private determineAutomaticBlockType(moderation: ModerationEntity): BlockType {
        // Verificar flags críticas
        const criticalFlags = moderation.flags.filter(
            (flag) =>
                flag.type === ModerationFlagEnum.STATIC_CONTENT ||
                flag.type === ModerationFlagEnum.SPAM_CONTENT ||
                flag.type === ModerationFlagEnum.BOT_CONTENT,
        )

        if (criticalFlags.length > 0) {
            return BlockType.BLOCK
        }

        // Determinar baseado na severidade
        switch (moderation.severity) {
            case ModerationSeverityEnum.HIGH:
                return BlockType.BLOCK
            case ModerationSeverityEnum.MEDIUM:
                return BlockType.REVIEW
            case ModerationSeverityEnum.LOW:
            default:
                return BlockType.APPROVE
        }
    }

    /**
     * Aplica o bloqueio na moderação
     */
    private async applyBlock(
        moderation: ModerationEntity,
        blockType: BlockType,
        request: ContentBlockingRequest,
    ): Promise<ModerationEntity> {
        let updates: Partial<ModerationEntity> = {
            moderatedAt: new Date(),
        }

        switch (blockType) {
            case BlockType.BLOCK:
                updates = {
                    ...updates,
                    status: ModerationStatusEnum.REJECTED,
                    isBlocked: true,
                    isHidden: true,
                }
                break

            case BlockType.REVIEW:
                updates = {
                    ...updates,
                    status: ModerationStatusEnum.FLAGGED,
                    isBlocked: false,
                    isHidden: false,
                }
                break

            case BlockType.APPROVE:
                updates = {
                    ...updates,
                    status: ModerationStatusEnum.APPROVED,
                    isBlocked: false,
                    isHidden: false,
                }
                break
        }

        return this.moderationRepository.update(moderation.id, updates)
    }

    /**
     * Gera razão automática para bloqueio
     */
    private generateAutomaticReason(moderation: ModerationEntity, blockType: BlockType): string {
        const flags = moderation.flags.map((flag) => flag.type).join(", ")

        switch (blockType) {
            case BlockType.BLOCK:
                return `Conteúdo bloqueado automaticamente: ${flags}`
            case BlockType.REVIEW:
                return `Conteúdo marcado para revisão: ${flags}`
            case BlockType.APPROVE:
                return `Conteúdo aprovado automaticamente`
            default:
                return `Ação automática aplicada`
        }
    }
}
