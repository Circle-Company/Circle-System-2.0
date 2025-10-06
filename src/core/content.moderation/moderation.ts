import {
    ModerationEntity,
    ModerationProps,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "../../domain/moderation/moderation.type"
import {
    ContentBlockingRequest,
    ContentBlockingResult,
    ContentDetectionRequest,
    ContentStorage,
    HttpAdapter,
    ModerationEngineConfig,
    ModerationRepository,
    ModerationResult,
} from "./types"

import { ContentBlocker } from "./content/blocker"
import { ContentDetector } from "./content/detector"

export class ModerationEngine {
    constructor(
        private readonly contentDetector: ContentDetector,
        private readonly contentBlocker: ContentBlocker,
        private readonly moderationRepository: ModerationRepository,
        private readonly contentStorage: ContentStorage,
        private readonly httpAdapter: HttpAdapter,
        private readonly config: ModerationEngineConfig,
    ) {}

    /**
     * Processa moderação completa de um conteúdo
     */
    async moderateContent(request: ContentDetectionRequest): Promise<ModerationResult> {
        const startTime = Date.now()
        const errors: string[] = []

        try {
            // 1. Verificar se já existe moderação para este conteúdo
            const existingModeration = await this.moderationRepository.findByContentId(
                request.contentId,
            )
            if (existingModeration) {
                return {
                    success: true,
                    moderation: existingModeration,
                    processingTime: Date.now() - startTime,
                }
            }

            // 2. Armazenar conteúdo se necessário
            if (request.contentData) {
                await this.contentStorage.store(request.contentId, request.contentData)
            }

            // 3. Detectar tipo de conteúdo
            const detectionResult = await this.contentDetector.detectContent(request)

            // 4. Criar moderação
            const moderationProps: ModerationProps = {
                contentId: request.contentId,
                contentOwnerId: request.contentOwnerId,
                detectedContentType: detectionResult.contentType,
                confidence: detectionResult.confidence,
                isHumanContent: detectionResult.isHumanContent,
                status: ModerationStatusEnum.PENDING,
                isBlocked: false,
                isHidden: false,
                flags: detectionResult.flags,
                severity: this.calculateSeverity(detectionResult.flags),
                detectionModel: detectionResult.model,
                detectionVersion: detectionResult.version,
                processingTime: detectionResult.processingTime,
                moderatedAt: null,
            }

            const moderation = await this.moderationRepository.save(
                moderationProps as ModerationEntity,
            )

            // 5. Aplicar bloqueio automático se configurado
            let blockingResult: ContentBlockingResult | undefined
            if (
                this.config.blocking.autoBlock ||
                this.config.blocking.autoHide ||
                this.config.blocking.autoFlag
            ) {
                blockingResult = await this.contentBlocker.applyAutomaticBlocking(moderation)
            }

            return {
                success: true,
                moderation,
                detectionResult,
                blockingResult,
                processingTime: Date.now() - startTime,
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
            errors.push(errorMessage)

            return {
                success: false,
                moderation: {} as ModerationEntity, // Moderação vazia em caso de erro
                processingTime: Date.now() - startTime,
                errors,
            }
        }
    }

    /**
     * Aplica bloqueio manual em uma moderação
     */
    async blockContent(request: ContentBlockingRequest): Promise<ContentBlockingResult> {
        try {
            return await this.contentBlocker.blockContent(request)
        } catch (error) {
            return {
                success: false,
                moderationId: request.moderationId,
                blockType: request.blockType,
                appliedAt: new Date(),
                reason: `Erro ao aplicar bloqueio: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                metadata: { error: true },
            }
        }
    }

    /**
     * Remove bloqueio de uma moderação
     */
    async unblockContent(moderationId: string): Promise<ContentBlockingResult> {
        try {
            const result = await this.contentBlocker.unblockContent(moderationId)

            return result
        } catch (error) {
            return {
                success: false,
                moderationId,
                blockType: "warn" as any,
                appliedAt: new Date(),
                reason: `Erro ao remover bloqueio: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                metadata: { error: true },
            }
        }
    }

    /**
     * Aprova conteúdo manualmente
     */
    async approveContent(moderationId: string, reason?: string): Promise<ContentBlockingResult> {
        try {
            const moderation = await this.moderationRepository.findById(moderationId)
            if (!moderation) {
                throw new Error(`Moderação não encontrada: ${moderationId}`)
            }

            // Atualizar moderação para aprovada
            await this.moderationRepository.update(moderationId, {
                status: ModerationStatusEnum.APPROVED,
                isBlocked: false,
                isHidden: false,
                moderatedAt: new Date(),
            })

            return {
                success: true,
                moderationId,
                blockType: "warn" as any,
                appliedAt: new Date(),
                reason: reason || "Conteúdo aprovado manualmente",
                metadata: { manual: true },
            }
        } catch (error) {
            return {
                success: false,
                moderationId,
                blockType: "warn" as any,
                appliedAt: new Date(),
                reason: `Erro ao aprovar conteúdo: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                metadata: { error: true },
            }
        }
    }

    /**
     * Marca conteúdo para revisão
     */
    async flagContent(moderationId: string, reason?: string): Promise<ContentBlockingResult> {
        try {
            const moderation = await this.moderationRepository.findById(moderationId)
            if (!moderation) {
                throw new Error(`Moderação não encontrada: ${moderationId}`)
            }

            // Atualizar moderação para flagada
            await this.moderationRepository.update(moderationId, {
                status: ModerationStatusEnum.FLAGGED,
                moderatedAt: new Date(),
            })

            return {
                success: true,
                moderationId,
                blockType: "flag" as any,
                appliedAt: new Date(),
                reason: reason || "Conteúdo marcado para revisão",
                metadata: { manual: true },
            }
        } catch (error) {
            return {
                success: false,
                moderationId,
                blockType: "flag" as any,
                appliedAt: new Date(),
                reason: `Erro ao marcar conteúdo: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                metadata: { error: true },
            }
        }
    }

    /**
     * Obtém moderação por ID
     */
    async getModeration(moderationId: string): Promise<ModerationEntity | null> {
        return this.moderationRepository.findById(moderationId)
    }

    /**
     * Obtém moderação por content ID
     */
    async getModerationByContentId(contentId: string): Promise<ModerationEntity | null> {
        return this.moderationRepository.findByContentId(contentId)
    }

    /**
     * Calcula severidade baseada nas flags
     */
    private calculateSeverity(flags: any[]): ModerationSeverityEnum {
        if (flags.length === 0) {
            return ModerationSeverityEnum.LOW
        }

        const severities = flags.map((flag) => flag.severity)

        if (severities.includes(ModerationSeverityEnum.HIGH)) {
            return ModerationSeverityEnum.HIGH
        }

        if (severities.includes(ModerationSeverityEnum.MEDIUM)) {
            return ModerationSeverityEnum.MEDIUM
        }

        return ModerationSeverityEnum.LOW
    }
}
