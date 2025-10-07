/**
 * Testes para filtros de moderação
 * Verifica se os filtros funcionam corretamente com diferentes cenários
 */

import { describe, expect, it } from "vitest"
import { ModerationFilterBuilder, ModerationFilters } from "../moderation.filters"
import {
    ContentTypeEnum,
    ModerationFlagEnum,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "../moderation.type"

// Mock data para testes
const createMockModeration = (overrides: Partial<any> = {}) => ({
    id: "mod-123",
    contentId: "content-123",
    contentOwnerId: "user-456",
    detectedContentType: ContentTypeEnum.HUMAN,
    confidence: 85,
    isHumanContent: true,
    status: ModerationStatusEnum.APPROVED,
    isBlocked: false,
    isHidden: false,
    flags: [],
    severity: ModerationSeverityEnum.LOW,
    detectionModel: "algorithmic-spam-detector",
    detectionVersion: "1.0",
    processingTime: 100,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    moderatedAt: new Date("2024-01-01"),
    ...overrides,
})

describe("ModerationFilters", () => {
    const mockModerations = [
        createMockModeration({
            id: "mod-1",
            status: ModerationStatusEnum.PENDING,
            detectedContentType: ContentTypeEnum.HUMAN,
            isHumanContent: true,
            confidence: 70,
            flags: [
                {
                    type: ModerationFlagEnum.LOW_QUALITY_CONTENT,
                    severity: ModerationSeverityEnum.LOW,
                    confidence: 80,
                    description: "Test",
                    detectedAt: new Date(),
                    metadata: {},
                },
            ],
        }),
        createMockModeration({
            id: "mod-2",
            status: ModerationStatusEnum.APPROVED,
            detectedContentType: ContentTypeEnum.SPAM,
            isHumanContent: false,
            confidence: 90,
            isBlocked: true,
            flags: [
                {
                    type: ModerationFlagEnum.SPAM_CONTENT,
                    severity: ModerationSeverityEnum.HIGH,
                    confidence: 95,
                    description: "Spam detected",
                    detectedAt: new Date(),
                    metadata: {},
                },
            ],
        }),
        createMockModeration({
            id: "mod-3",
            status: ModerationStatusEnum.FLAGGED,
            detectedContentType: ContentTypeEnum.AI_GENERATED,
            isHumanContent: false,
            confidence: 60,
            flags: [
                {
                    type: ModerationFlagEnum.SUSPICIOUS_PATTERNS,
                    severity: ModerationSeverityEnum.MEDIUM,
                    confidence: 70,
                    description: "Suspicious",
                    detectedAt: new Date(),
                    metadata: {},
                },
            ],
        }),
        createMockModeration({
            id: "mod-4",
            status: ModerationStatusEnum.REJECTED,
            detectedContentType: ContentTypeEnum.BOT,
            isHumanContent: false,
            confidence: 95,
            isBlocked: true,
            flags: [
                {
                    type: ModerationFlagEnum.BOT_CONTENT,
                    severity: ModerationSeverityEnum.HIGH,
                    confidence: 98,
                    description: "Bot detected",
                    detectedAt: new Date(),
                    metadata: {},
                },
            ],
        }),
    ]

    describe("applyFilters", () => {
        it("deve filtrar por status", () => {
            const filters = { status: [ModerationStatusEnum.PENDING, ModerationStatusEnum.FLAGGED] }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(2)
            expect(result.map((m) => m.id)).toEqual(["mod-1", "mod-3"])
        })

        it("deve filtrar por tipo de conteúdo", () => {
            const filters = { contentType: [ContentTypeEnum.HUMAN] }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("mod-1")
        })

        it("deve filtrar por flags", () => {
            const filters = { flagType: [ModerationFlagEnum.SPAM_CONTENT] }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("mod-2")
        })

        it("deve filtrar por conteúdo humano", () => {
            const filters = { isHumanContent: true }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("mod-1")
        })

        it("deve filtrar por confiança mínima", () => {
            const filters = { minConfidence: 80 }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(2)
            expect(result.map((m) => m.id)).toEqual(["mod-2", "mod-4"])
        })

        it("deve filtrar por confiança máxima", () => {
            const filters = { maxConfidence: 70 }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(2)
            expect(result.map((m) => m.id)).toEqual(["mod-1", "mod-3"])
        })

        it("deve filtrar por severidade", () => {
            const filters = { severity: [ModerationSeverityEnum.HIGH] }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(2)
            expect(result.map((m) => m.id)).toEqual(["mod-2", "mod-4"])
        })

        it("deve filtrar por status de bloqueio", () => {
            const filters = { isBlocked: true }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(2)
            expect(result.map((m) => m.id)).toEqual(["mod-2", "mod-4"])
        })

        it("deve filtrar por owner", () => {
            const filters = { contentOwnerId: "user-456" }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(4)
        })

        it("deve aplicar múltiplos filtros", () => {
            const filters = {
                status: [ModerationStatusEnum.APPROVED],
                contentType: [ContentTypeEnum.SPAM],
                isBlocked: true,
            }
            const result = ModerationFilters.applyFilters(mockModerations, filters)

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("mod-2")
        })
    })

    describe("filterByContentType", () => {
        it("deve filtrar por tipo específico", () => {
            const result = ModerationFilters.filterByContentType(
                mockModerations,
                ContentTypeEnum.HUMAN,
            )

            expect(result).toHaveLength(1)
            expect(result[0].detectedContentType).toBe(ContentTypeEnum.HUMAN)
        })
    })

    describe("filterByFlags", () => {
        it("deve filtrar por tipos de flag", () => {
            const result = ModerationFilters.filterByFlags(mockModerations, [
                ModerationFlagEnum.SPAM_CONTENT,
            ])

            expect(result).toHaveLength(1)
            expect(result[0].flags.some((f) => f.type === ModerationFlagEnum.SPAM_CONTENT)).toBe(
                true,
            )
        })
    })

    describe("filterHumanContent", () => {
        it("deve filtrar apenas conteúdo humano", () => {
            const result = ModerationFilters.filterHumanContent(mockModerations)

            expect(result).toHaveLength(1)
            expect(result[0].isHumanContent).toBe(true)
        })
    })

    describe("filterSyntheticContent", () => {
        it("deve filtrar apenas conteúdo sintético", () => {
            const result = ModerationFilters.filterSyntheticContent(mockModerations)

            expect(result).toHaveLength(3)
            result.forEach((moderation) => {
                expect(moderation.isHumanContent).toBe(false)
            })
        })
    })

    describe("filterByQuality", () => {
        it("deve filtrar por qualidade mínima", () => {
            const result = ModerationFilters.filterByQuality(mockModerations, 80)

            expect(result).toHaveLength(2)
            result.forEach((moderation) => {
                expect(moderation.confidence).toBeGreaterThanOrEqual(80)
            })
        })
    })

    describe("filterBySeverity", () => {
        it("deve filtrar por severidade", () => {
            const result = ModerationFilters.filterBySeverity(
                mockModerations,
                ModerationSeverityEnum.HIGH,
            )

            expect(result).toHaveLength(2)
            result.forEach((moderation) => {
                expect(moderation.severity).toBe(ModerationSeverityEnum.HIGH)
            })
        })
    })

    describe("filterByStatus", () => {
        it("deve filtrar por status", () => {
            const result = ModerationFilters.filterByStatus(
                mockModerations,
                ModerationStatusEnum.APPROVED,
            )

            expect(result).toHaveLength(1)
            expect(result[0].status).toBe(ModerationStatusEnum.APPROVED)
        })
    })

    describe("filterByDateRange", () => {
        it("deve filtrar por período", () => {
            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")
            const result = ModerationFilters.filterByDateRange(mockModerations, startDate, endDate)

            expect(result).toHaveLength(4)
        })
    })

    describe("filterByOwner", () => {
        it("deve filtrar por owner", () => {
            const result = ModerationFilters.filterByOwner(mockModerations, "user-456")

            expect(result).toHaveLength(4)
        })
    })

    describe("filterByQualityFlags", () => {
        it("deve filtrar por flags de qualidade", () => {
            const result = ModerationFilters.filterByQualityFlags(mockModerations)

            expect(result).toHaveLength(1)
            expect(
                result[0].flags.some((f) => f.type === ModerationFlagEnum.LOW_QUALITY_CONTENT),
            ).toBe(true)
        })
    })

    describe("filterByAuthenticityFlags", () => {
        it("deve filtrar por flags de autenticidade", () => {
            const result = ModerationFilters.filterByAuthenticityFlags(mockModerations)

            expect(result).toHaveLength(3) // mod-1, mod-3, mod-4
        })
    })

    describe("filterBySpamFlags", () => {
        it("deve filtrar por flags de spam", () => {
            const result = ModerationFilters.filterBySpamFlags(mockModerations)

            expect(result).toHaveLength(2) // mod-2, mod-3
        })
    })

    describe("groupByContentType", () => {
        it("deve agrupar por tipo de conteúdo", () => {
            const result = ModerationFilters.groupByContentType(mockModerations)

            expect(result[ContentTypeEnum.HUMAN]).toHaveLength(1)
            expect(result[ContentTypeEnum.SPAM]).toHaveLength(1)
            expect(result[ContentTypeEnum.AI_GENERATED]).toHaveLength(1)
            expect(result[ContentTypeEnum.BOT]).toHaveLength(1)
        })
    })

    describe("groupBySeverity", () => {
        it("deve agrupar por severidade", () => {
            const result = ModerationFilters.groupBySeverity(mockModerations)

            expect(result[ModerationSeverityEnum.LOW]).toHaveLength(1)
            expect(result[ModerationSeverityEnum.MEDIUM]).toHaveLength(1)
            expect(result[ModerationSeverityEnum.HIGH]).toHaveLength(2)
        })
    })

    describe("groupByStatus", () => {
        it("deve agrupar por status", () => {
            const result = ModerationFilters.groupByStatus(mockModerations)

            expect(result[ModerationStatusEnum.PENDING]).toHaveLength(1)
            expect(result[ModerationStatusEnum.APPROVED]).toHaveLength(1)
            expect(result[ModerationStatusEnum.FLAGGED]).toHaveLength(1)
            expect(result[ModerationStatusEnum.REJECTED]).toHaveLength(1)
        })
    })

    describe("calculateStats", () => {
        it("deve calcular estatísticas corretamente", () => {
            const stats = ModerationFilters.calculateStats(mockModerations)

            expect(stats.total).toBe(4)
            expect(stats.humanContent).toBe(1)
            expect(stats.syntheticContent).toBe(3)
            expect(stats.blocked).toBe(2)
            expect(stats.pending).toBe(1)
            expect(stats.flagged).toBe(1)
            expect(stats.approved).toBe(1)
            expect(stats.rejected).toBe(1)
            expect(stats.averageConfidence).toBe(80)
            expect(stats.humanContentRatio).toBe(0.25)
            expect(stats.blockedRatio).toBe(0.5)
        })
    })

    describe("Métodos auxiliares", () => {
        it("deve verificar se tem conteúdo de baixa qualidade", () => {
            const moderation = createMockModeration({
                flags: [
                    {
                        type: ModerationFlagEnum.LOW_QUALITY_CONTENT,
                        severity: ModerationSeverityEnum.LOW,
                        confidence: 80,
                        description: "Test",
                        detectedAt: new Date(),
                        metadata: {},
                    },
                ],
            })

            expect(ModerationFilters.hasLowQualityContent(moderation)).toBe(true)
        })

        it("deve verificar se tem áudio", () => {
            const moderationWithAudio = createMockModeration()
            const moderationWithoutAudio = createMockModeration({
                flags: [
                    {
                        type: ModerationFlagEnum.NO_AUDIO,
                        severity: ModerationSeverityEnum.LOW,
                        confidence: 80,
                        description: "No audio",
                        detectedAt: new Date(),
                        metadata: {},
                    },
                ],
            })

            expect(ModerationFilters.hasAudio(moderationWithAudio)).toBe(true)
            expect(ModerationFilters.hasAudio(moderationWithoutAudio)).toBe(false)
        })

        it("deve verificar se é conteúdo estático", () => {
            const staticModeration = createMockModeration({
                flags: [
                    {
                        type: ModerationFlagEnum.STATIC_CONTENT,
                        severity: ModerationSeverityEnum.MEDIUM,
                        confidence: 80,
                        description: "Static",
                        detectedAt: new Date(),
                        metadata: {},
                    },
                ],
            })

            expect(ModerationFilters.isStaticContent(staticModeration)).toBe(true)
        })

        it("deve verificar qualidade de vídeo", () => {
            const lowQualityModeration = createMockModeration({
                flags: [
                    {
                        type: ModerationFlagEnum.LOW_QUALITY_VIDEO,
                        severity: ModerationSeverityEnum.MEDIUM,
                        confidence: 80,
                        description: "Low quality",
                        detectedAt: new Date(),
                        metadata: {},
                    },
                ],
            })

            expect(ModerationFilters.hasLowVideoQuality(lowQualityModeration)).toBe(true)
        })

        it("deve verificar qualidade de áudio", () => {
            const lowQualityModeration = createMockModeration({
                flags: [
                    {
                        type: ModerationFlagEnum.LOW_QUALITY_AUDIO,
                        severity: ModerationSeverityEnum.MEDIUM,
                        confidence: 80,
                        description: "Low quality audio",
                        detectedAt: new Date(),
                        metadata: {},
                    },
                ],
            })

            expect(ModerationFilters.hasLowAudioQuality(lowQualityModeration)).toBe(true)
        })

        it("deve verificar hashtags excessivas", () => {
            const excessiveHashtagsModeration = createMockModeration({
                flags: [
                    {
                        type: ModerationFlagEnum.EXCESSIVE_HASHTAGS,
                        severity: ModerationSeverityEnum.MEDIUM,
                        confidence: 80,
                        description: "Too many hashtags",
                        detectedAt: new Date(),
                        metadata: {},
                    },
                ],
            })

            expect(ModerationFilters.hasExcessiveHashtags(excessiveHashtagsModeration)).toBe(true)
        })

        it("deve verificar se é apenas texto", () => {
            const textOnlyModeration = createMockModeration({
                flags: [
                    {
                        type: ModerationFlagEnum.TEXT_ONLY,
                        severity: ModerationSeverityEnum.LOW,
                        confidence: 80,
                        description: "Text only",
                        detectedAt: new Date(),
                        metadata: {},
                    },
                ],
            })

            expect(ModerationFilters.isTextOnly(textOnlyModeration)).toBe(true)
        })

        it("deve verificar tipos de conteúdo", () => {
            const aiModeration = createMockModeration({
                detectedContentType: ContentTypeEnum.AI_GENERATED,
            })
            const memeModeration = createMockModeration({
                detectedContentType: ContentTypeEnum.MEME,
            })
            const spamModeration = createMockModeration({
                detectedContentType: ContentTypeEnum.SPAM,
            })
            const botModeration = createMockModeration({ detectedContentType: ContentTypeEnum.BOT })

            expect(ModerationFilters.isAIGenerated(aiModeration)).toBe(true)
            expect(ModerationFilters.isMeme(memeModeration)).toBe(true)
            expect(ModerationFilters.isSpam(spamModeration)).toBe(true)
            expect(ModerationFilters.isBot(botModeration)).toBe(true)
        })
    })
})

describe("ModerationFilterBuilder", () => {
    it("deve criar builder vazio", () => {
        const builder = ModerationFilterBuilder.create()
        const filters = builder.build()

        expect(filters).toEqual({})
    })

    it("deve construir filtros com múltiplas condições", () => {
        const filters = ModerationFilterBuilder.create()
            .withStatus([ModerationStatusEnum.PENDING])
            .withContentType([ContentTypeEnum.HUMAN])
            .withHumanContent(true)
            .withConfidenceRange(70, 90)
            .withSeverity([ModerationSeverityEnum.MEDIUM])
            .build()

        expect(filters.status).toEqual([ModerationStatusEnum.PENDING])
        expect(filters.contentType).toEqual([ContentTypeEnum.HUMAN])
        expect(filters.isHumanContent).toBe(true)
        expect(filters.minConfidence).toBe(70)
        expect(filters.maxConfidence).toBe(90)
        expect(filters.severity).toEqual([ModerationSeverityEnum.MEDIUM])
    })

    it("deve permitir chain de métodos", () => {
        const builder = ModerationFilterBuilder.create()
            .withStatus([ModerationStatusEnum.APPROVED])
            .withFlagType([ModerationFlagEnum.SPAM_CONTENT])
            .withBlockedStatus(false)
            .withHiddenStatus(false)
            .needsModeration(false)

        expect(builder).toBeInstanceOf(ModerationFilterBuilder)
    })

    it("deve aceitar confiança apenas mínima", () => {
        const filters = ModerationFilterBuilder.create().withConfidenceRange(80).build()

        expect(filters.minConfidence).toBe(80)
        expect(filters.maxConfidence).toBeUndefined()
    })
})
