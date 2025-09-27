import {
    ContentDetectionResult,
    ContentTypeEnum,
    ModerationEntity,
    ModerationFlag,
    ModerationFlagEnum,
    ModerationProps,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "./moderation.type"

import { ModerationFilters } from "./moderation.filters"

export class Moderation {
    private readonly _id: string
    private readonly _contentId: string
    private readonly _contentOwnerId: string
    private _detectedContentType: ContentTypeEnum
    private _confidence: number
    private _isHumanContent: boolean
    private _status: ModerationStatusEnum
    private _isBlocked: boolean
    private _isHidden: boolean
    private _flags: ModerationFlag[]
    private _severity: ModerationSeverityEnum
    private _detectionModel: string
    private _detectionVersion: string
    private _processingTime: number
    private readonly _createdAt: Date
    private _updatedAt: Date
    private _moderatedAt: Date | null

    // Regras de validação
    private static readonly VALIDATION_RULES = {
        maxFlags: 20,
        minConfidence: 0,
        maxConfidence: 100,
        maxProcessingTime: 30000, // 30 segundos
        requiredFields: ["contentId", "contentOwnerId"],
        allowedContentTypes: Object.values(ContentTypeEnum),
        detectionModels: [
            "face-detector-v1",
            "ai-detector-v1",
            "meme-detector-v1",
            "spam-detector-v1",
            "quality-detector-v1",
            "audio-detector-v1",
        ],
    }

    constructor(props: ModerationProps) {
        this._id = props.id || this.generateId()
        this._contentId = props.contentId
        this._contentOwnerId = props.contentOwnerId
        this._detectedContentType = props.detectedContentType || ContentTypeEnum.UNKNOWN
        this._confidence = props.confidence || 0
        this._isHumanContent = props.isHumanContent || false
        this._status = props.status || ModerationStatusEnum.PENDING
        this._isBlocked = props.isBlocked || false
        this._isHidden = props.isHidden || false
        this._flags = props.flags || []
        this._severity = props.severity || ModerationSeverityEnum.LOW
        this._detectionModel = props.detectionModel || ""
        this._detectionVersion = props.detectionVersion || "1.0"
        this._processingTime = props.processingTime || 0
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()
        this._moderatedAt = props.moderatedAt || null

        this.validate()
    }

    // ===== GETTERS =====
    get id(): string {
        return this._id
    }
    get contentId(): string {
        return this._contentId
    }
    get contentOwnerId(): string {
        return this._contentOwnerId
    }
    get detectedContentType(): ContentTypeEnum {
        return this._detectedContentType
    }
    get confidence(): number {
        return this._confidence
    }
    get isHumanContent(): boolean {
        return this._isHumanContent
    }
    get status(): ModerationStatusEnum {
        return this._status
    }
    get isBlocked(): boolean {
        return this._isBlocked
    }
    get isHidden(): boolean {
        return this._isHidden
    }
    get flags(): ModerationFlag[] {
        return [...this._flags]
    }
    get severity(): ModerationSeverityEnum {
        return this._severity
    }
    get detectionModel(): string {
        return this._detectionModel
    }
    get detectionVersion(): string {
        return this._detectionVersion
    }
    get processingTime(): number {
        return this._processingTime
    }
    get createdAt(): Date {
        return this._createdAt
    }
    get updatedAt(): Date {
        return this._updatedAt
    }
    get moderatedAt(): Date | null {
        return this._moderatedAt
    }

    // ===== BUSINESS LOGIC =====

    /**
     * Processar resultado de detecção de conteúdo
     */
    processDetectionResult(result: ContentDetectionResult): void {
        this._detectedContentType = result.contentType
        this._confidence = result.confidence
        this._isHumanContent = result.isHumanContent
        this._detectionModel = result.model
        this._detectionVersion = result.version
        this._processingTime = result.processingTime

        // Adicionar flags detectadas
        result.flags.forEach((flag) => {
            this._flags.push(flag)
        })

        // Determinar severidade geral
        this._severity = this.calculateOverallSeverity()

        // Atualizar status baseado no tipo de conteúdo
        this.updateStatusBasedOnContentType()

        this._updatedAt = new Date()
    }

    /**
     * Adicionar flag de moderação
     */
    addFlag(
        type: ModerationFlagEnum,
        severity: ModerationSeverityEnum,
        confidence: number,
        description: string,
        metadata?: Record<string, any>,
    ): void {
        if (this._flags.length >= Moderation.VALIDATION_RULES.maxFlags) {
            throw new Error(`Máximo ${Moderation.VALIDATION_RULES.maxFlags} flags permitidas`)
        }

        const flag: ModerationFlag = {
            type,
            severity,
            confidence,
            description,
            detectedAt: new Date(),
            metadata: metadata || {},
        }

        this._flags.push(flag)
        this._severity = this.calculateOverallSeverity()
        this._updatedAt = new Date()
    }

    /**
     * Bloquear conteúdo
     */
    block(): void {
        this._status = ModerationStatusEnum.REJECTED
        this._isBlocked = true
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Desbloquear conteúdo
     */
    unblock(): void {
        if (!this._isBlocked) {
            throw new Error("Conteúdo não está bloqueado")
        }

        this._status = ModerationStatusEnum.APPROVED
        this._isBlocked = false
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Ocultar conteúdo
     */
    hide(): void {
        this._isHidden = true
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Mostrar conteúdo
     */
    show(): void {
        this._isHidden = false
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Aprovar conteúdo
     */
    approve(): void {
        this._status = ModerationStatusEnum.APPROVED
        this._isBlocked = false
        this._isHidden = false
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Rejeitar conteúdo
     */
    reject(): void {
        this._status = ModerationStatusEnum.REJECTED
        this._isBlocked = true
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Marcar como flag
     */
    flag(): void {
        this._status = ModerationStatusEnum.FLAGGED
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    // ===== QUERY METHODS =====
    // Métodos de filtragem movidos para ModerationFilters

    // ===== PRIVATE METHODS =====

    /**
     * Valida a moderação
     */
    private validate(): void {
        if (!this._contentId) {
            throw new Error("Content ID é obrigatório")
        }

        if (!this._contentOwnerId) {
            throw new Error("Content Owner ID é obrigatório")
        }

        if (
            this._confidence < Moderation.VALIDATION_RULES.minConfidence ||
            this._confidence > Moderation.VALIDATION_RULES.maxConfidence
        ) {
            throw new Error(
                `Confiança deve estar entre ${Moderation.VALIDATION_RULES.minConfidence} e ${Moderation.VALIDATION_RULES.maxConfidence}`,
            )
        }

        if (this._processingTime > Moderation.VALIDATION_RULES.maxProcessingTime) {
            throw new Error(
                `Tempo de processamento não pode exceder ${Moderation.VALIDATION_RULES.maxProcessingTime}ms`,
            )
        }

        if (!Moderation.VALIDATION_RULES.allowedContentTypes.includes(this._detectedContentType)) {
            throw new Error(`Tipo de conteúdo ${this._detectedContentType} não é suportado`)
        }
    }

    /**
     * Atualiza status baseado no tipo de conteúdo detectado
     */
    private updateStatusBasedOnContentType(): void {
        const entity = this.toEntity()

        switch (this._detectedContentType) {
            case ContentTypeEnum.HUMAN:
                // Conteúdo humano é aprovado por padrão, mas pode ser flagado se tiver problemas
                if (
                    ModerationFilters.hasLowVideoQuality(entity) ||
                    ModerationFilters.hasLowAudioQuality(entity) ||
                    !ModerationFilters.hasFaceDetected(entity)
                ) {
                    this._status = ModerationStatusEnum.FLAGGED
                } else {
                    this._status = ModerationStatusEnum.APPROVED
                }
                break
            case ContentTypeEnum.AI_GENERATED:
            case ContentTypeEnum.MEME:
                this._status = ModerationStatusEnum.FLAGGED
                break
            case ContentTypeEnum.SPAM:
            case ContentTypeEnum.BOT:
                this._status = ModerationStatusEnum.REJECTED
                this._isBlocked = true
                break
            case ContentTypeEnum.UNKNOWN:
                this._status = ModerationStatusEnum.PENDING
                break
            default:
                this._status = ModerationStatusEnum.PENDING
        }
    }

    /**
     * Calcula severidade geral baseada nas flags
     */
    private calculateOverallSeverity(): ModerationSeverityEnum {
        if (this._flags.length === 0) {
            return ModerationSeverityEnum.LOW
        }

        const severities = this._flags.map((flag) => flag.severity)

        if (severities.includes(ModerationSeverityEnum.HIGH)) {
            return ModerationSeverityEnum.HIGH
        }

        if (severities.includes(ModerationSeverityEnum.MEDIUM)) {
            return ModerationSeverityEnum.MEDIUM
        }

        return ModerationSeverityEnum.LOW
    }

    /**
     * Gera ID único
     */
    private generateId(): string {
        return `moderation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // ===== SERIALIZATION =====

    /**
     * Converte para entidade
     */
    toEntity(): ModerationEntity {
        return {
            id: this._id,
            contentId: this._contentId,
            contentOwnerId: this._contentOwnerId,
            detectedContentType: this._detectedContentType,
            confidence: this._confidence,
            isHumanContent: this._isHumanContent,
            status: this._status,
            isBlocked: this._isBlocked,
            isHidden: this._isHidden,
            flags: this._flags,
            severity: this._severity,
            detectionModel: this._detectionModel,
            detectionVersion: this._detectionVersion,
            processingTime: this._processingTime,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            moderatedAt: this._moderatedAt,
        }
    }

    /**
     * Cria instância a partir de entidade
     */
    static fromEntity(entity: ModerationEntity): Moderation {
        return new Moderation({
            id: entity.id,
            contentId: entity.contentId,
            contentOwnerId: entity.contentOwnerId,
            detectedContentType: entity.detectedContentType,
            confidence: entity.confidence,
            isHumanContent: entity.isHumanContent,
            status: entity.status,
            isBlocked: entity.isBlocked,
            isHidden: entity.isHidden,
            flags: entity.flags,
            severity: entity.severity,
            detectionModel: entity.detectionModel,
            detectionVersion: entity.detectionVersion,
            processingTime: entity.processingTime,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            moderatedAt: entity.moderatedAt,
        })
    }

    /**
     * Cria nova moderação
     */
    static create(props: Omit<ModerationProps, "id" | "createdAt" | "updatedAt">): Moderation {
        return new Moderation({
            ...props,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    }
}
