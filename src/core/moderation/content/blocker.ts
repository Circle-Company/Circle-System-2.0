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
            const result = await this.applyBlock(moderation, blockType, request)

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
                blockType: BlockType.WARN,
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

        if (blockType === BlockType.WARN) {
            // Não aplicar bloqueio, apenas retornar resultado
            return {
                success: true,
                moderationId: moderation.id,
                blockType: BlockType.WARN,
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
                blockType: BlockType.WARN,
                appliedAt: new Date(),
                reason: "Bloqueio removido",
                metadata: { unblocked: true },
            }
        } catch (error) {
            return {
                success: false,
                moderationId,
                blockType: BlockType.WARN,
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
        if (request.blockType !== BlockType.WARN) {
            return request.blockType
        }

        // Determinar baseado na severidade
        switch (moderation.severity) {
            case ModerationSeverityEnum.HIGH:
                return BlockType.HARD_BLOCK
            case ModerationSeverityEnum.MEDIUM:
                return BlockType.SOFT_BLOCK
            case ModerationSeverityEnum.LOW:
                return BlockType.FLAG
            default:
                return BlockType.WARN
        }
    }

    /**
     * Determina o tipo de bloqueio automático baseado nas regras
     */
    private determineAutomaticBlockType(moderation: ModerationEntity): BlockType {
        // Verificar se deve bloquear automaticamente
        if (!this.config.blocking.autoBlock) {
            return BlockType.WARN
        }

        // Verificar flags críticas
        const criticalFlags = moderation.flags.filter(
            (flag) =>
                flag.type === ModerationFlagEnum.AI_CONTENT ||
                flag.type === ModerationFlagEnum.SPAM_CONTENT ||
                flag.type === ModerationFlagEnum.BOT_CONTENT,
        )

        if (criticalFlags.length > 0) {
            return BlockType.HARD_BLOCK
        }

        // Verificar severidade
        switch (moderation.severity) {
            case ModerationSeverityEnum.HIGH:
                return this.config.blocking.autoBlock ? BlockType.HARD_BLOCK : BlockType.FLAG
            case ModerationSeverityEnum.MEDIUM:
                return this.config.blocking.autoHide ? BlockType.HIDE : BlockType.FLAG
            case ModerationSeverityEnum.LOW:
                return this.config.blocking.autoFlag ? BlockType.FLAG : BlockType.WARN
            default:
                return BlockType.WARN
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
            case BlockType.HARD_BLOCK:
                updates = {
                    ...updates,
                    status: ModerationStatusEnum.REJECTED,
                    isBlocked: true,
                    isHidden: true,
                }
                break

            case BlockType.SOFT_BLOCK:
                updates = {
                    ...updates,
                    status: ModerationStatusEnum.REJECTED,
                    isBlocked: true,
                    isHidden: false,
                }
                break

            case BlockType.HIDE:
                updates = {
                    ...updates,
                    status: ModerationStatusEnum.FLAGGED,
                    isBlocked: false,
                    isHidden: true,
                }
                break

            case BlockType.FLAG:
                updates = {
                    ...updates,
                    status: ModerationStatusEnum.FLAGGED,
                    isBlocked: false,
                    isHidden: false,
                }
                break

            case BlockType.WARN:
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
            case BlockType.HARD_BLOCK:
                return `Bloqueio automático: Conteúdo inapropriado detectado (${flags})`
            case BlockType.SOFT_BLOCK:
                return `Bloqueio temporário: Conteúdo suspeito detectado (${flags})`
            case BlockType.HIDE:
                return `Conteúdo ocultado: Qualidade baixa ou suspeito (${flags})`
            case BlockType.FLAG:
                return `Conteúdo marcado para revisão: ${flags}`
            case BlockType.WARN:
                return `Conteúdo aprovado automaticamente`
            default:
                return `Ação automática aplicada`
        }
    }

    /**
     * Verifica se o conteúdo deve ser bloqueado baseado nas regras
     */
    shouldBlock(moderation: ModerationEntity): boolean {
        // Verificar flags críticas
        const criticalFlags = moderation.flags.filter(
            (flag) =>
                flag.type === ModerationFlagEnum.AI_CONTENT ||
                flag.type === ModerationFlagEnum.SPAM_CONTENT ||
                flag.type === ModerationFlagEnum.BOT_CONTENT,
        )

        if (criticalFlags.length > 0) {
            return true
        }

        // Verificar severidade
        if (moderation.severity === ModerationSeverityEnum.HIGH) {
            return true
        }

        // Verificar confiança baixa
        if (moderation.confidence < 50) {
            return true
        }

        return false
    }

    /**
     * Verifica se o conteúdo deve ser ocultado
     */
    shouldHide(moderation: ModerationEntity): boolean {
        // Verificar flags de qualidade
        const qualityFlags = moderation.flags.filter(
            (flag) =>
                flag.type === ModerationFlagEnum.LOW_QUALITY_VIDEO ||
                flag.type === ModerationFlagEnum.LOW_QUALITY_AUDIO ||
                flag.type === ModerationFlagEnum.NO_AUDIO ||
                flag.type === ModerationFlagEnum.STATIC_CONTENT,
        )

        if (qualityFlags.length > 0) {
            return true
        }

        // Verificar severidade média
        if (moderation.severity === ModerationSeverityEnum.MEDIUM) {
            return true
        }

        return false
    }

    /**
     * Verifica se o conteúdo deve ser marcado para revisão
     */
    shouldFlag(moderation: ModerationEntity): boolean {
        // Verificar flags de autenticidade
        const authenticityFlags = moderation.flags.filter(
            (flag) =>
                flag.type === ModerationFlagEnum.NO_FACE_DETECTED ||
                flag.type === ModerationFlagEnum.MEME_CONTENT ||
                flag.type === ModerationFlagEnum.EXCESSIVE_HASHTAGS ||
                flag.type === ModerationFlagEnum.TEXT_ONLY,
        )

        if (authenticityFlags.length > 0) {
            return true
        }

        // Verificar severidade baixa
        if (moderation.severity === ModerationSeverityEnum.LOW) {
            return true
        }

        return false
    }
}
