import { beforeEach, describe, expect, it } from "vitest"
import {
    MOMENT_BUSINESS_RULES,
    MomentBusinessRules,
    MomentBusinessRulesFactory,
    MomentBusinessValidator,
} from "../moment.business.rules"

describe("MomentBusinessRules", () => {
    let validator: MomentBusinessValidator

    beforeEach(() => {
        validator = new MomentBusinessValidator(MOMENT_BUSINESS_RULES)
    })

    describe("MOMENT_BUSINESS_RULES", () => {
        it("deve ter configurações corretas para negócio padrão", () => {
            expect(MOMENT_BUSINESS_RULES.publishing.autoPublish).toBe(false)
            expect(MOMENT_BUSINESS_RULES.engagement.allowLikes).toBe(true)
            expect(MOMENT_BUSINESS_RULES.quality.requireQualityCheck).toBe(true)
        })

        it("deve ter configurações de publicação corretas", () => {
            expect(MOMENT_BUSINESS_RULES.publishing.autoPublish).toBe(false)
            expect(MOMENT_BUSINESS_RULES.publishing.requireModeration).toBe(true)
            expect(MOMENT_BUSINESS_RULES.publishing.requireApproval).toBe(false)
            expect(MOMENT_BUSINESS_RULES.publishing.moderationTimeLimit).toBe(24)
            expect(MOMENT_BUSINESS_RULES.publishing.approvalTimeLimit).toBe(48)
        })

        it("deve ter configurações de engajamento corretas", () => {
            expect(MOMENT_BUSINESS_RULES.engagement.allowLikes).toBe(true)
            expect(MOMENT_BUSINESS_RULES.engagement.allowComments).toBe(true)
            expect(MOMENT_BUSINESS_RULES.engagement.allowShares).toBe(false)
            expect(MOMENT_BUSINESS_RULES.engagement.allowReports).toBe(true)
            expect(MOMENT_BUSINESS_RULES.engagement.maxCommentsPerUser).toBe(10)
            expect(MOMENT_BUSINESS_RULES.engagement.maxReportsPerUser).toBe(3)
        })

        it("deve ter configurações de descoberta corretas", () => {
            expect(MOMENT_BUSINESS_RULES.discovery.enableSearch).toBe(true)
            expect(MOMENT_BUSINESS_RULES.discovery.enableTrending).toBe(true)
            expect(MOMENT_BUSINESS_RULES.discovery.enableRecommendations).toBe(true)
            expect(MOMENT_BUSINESS_RULES.discovery.enableHashtags).toBe(true)
            expect(MOMENT_BUSINESS_RULES.discovery.enableMentions).toBe(true)
            expect(MOMENT_BUSINESS_RULES.discovery.minViewsForTrending).toBe(1000)
            expect(MOMENT_BUSINESS_RULES.discovery.minEngagementForTrending).toBe(100)
        })

        it("deve ter configurações de qualidade corretas", () => {
            expect(MOMENT_BUSINESS_RULES.quality.requireQualityCheck).toBe(true)
            expect(MOMENT_BUSINESS_RULES.quality.minQualityScore).toBe(30)
            expect(MOMENT_BUSINESS_RULES.quality.maxQualityScore).toBe(100)
            expect(MOMENT_BUSINESS_RULES.quality.allowLowQuality).toBe(false)
            expect(MOMENT_BUSINESS_RULES.quality.autoRejectLowQuality).toBe(true)
        })

        it("deve ter configurações de segurança corretas", () => {
            expect(MOMENT_BUSINESS_RULES.security.requireAuthentication).toBe(true)
            expect(MOMENT_BUSINESS_RULES.security.allowAnonymous).toBe(false)
            expect(MOMENT_BUSINESS_RULES.security.maxCreationRate).toBe(10)
            expect(MOMENT_BUSINESS_RULES.security.maxUploadRate).toBe(5)
            expect(MOMENT_BUSINESS_RULES.security.requireContentModeration).toBe(true)
            expect(MOMENT_BUSINESS_RULES.security.blockSuspiciousContent).toBe(true)
        })

        it("deve ter configurações de armazenamento corretas", () => {
            expect(MOMENT_BUSINESS_RULES.storage.maxStoragePerUser).toBe(1024 * 1024 * 1024) // 1GB
            expect(MOMENT_BUSINESS_RULES.storage.maxStoragePerMoment).toBe(100 * 1024 * 1024) // 100MB
            expect(MOMENT_BUSINESS_RULES.storage.storageProviders).toEqual(["aws", "gcp"])
            expect(MOMENT_BUSINESS_RULES.storage.compressionEnabled).toBe(true)
            expect(MOMENT_BUSINESS_RULES.storage.cdnEnabled).toBe(true)
            expect(MOMENT_BUSINESS_RULES.storage.retentionPeriod).toBe(365) // 1 ano
        })

        it("deve ter configurações de processamento corretas", () => {
            expect(MOMENT_BUSINESS_RULES.processing.maxProcessingTime).toBe(300) // 5 minutos
            expect(MOMENT_BUSINESS_RULES.processing.retryAttempts).toBe(3)
            expect(MOMENT_BUSINESS_RULES.processing.qualityLevels).toEqual(["medium", "high"])
            expect(MOMENT_BUSINESS_RULES.processing.thumbnailGeneration).toBe(true)
            expect(MOMENT_BUSINESS_RULES.processing.embeddingGeneration).toBe(true)
        })

        it("deve ter configurações de analytics corretas", () => {
            expect(MOMENT_BUSINESS_RULES.analytics.enableAnalytics).toBe(true)
            expect(MOMENT_BUSINESS_RULES.analytics.trackViews).toBe(true)
            expect(MOMENT_BUSINESS_RULES.analytics.trackEngagement).toBe(true)
            expect(MOMENT_BUSINESS_RULES.analytics.trackPerformance).toBe(true)
            expect(MOMENT_BUSINESS_RULES.analytics.trackViral).toBe(true)
            expect(MOMENT_BUSINESS_RULES.analytics.dataRetentionPeriod).toBe(365) // 1 ano
        })

        it("deve ter configurações de notificações corretas", () => {
            expect(MOMENT_BUSINESS_RULES.notifications.enableNotifications).toBe(true)
            expect(MOMENT_BUSINESS_RULES.notifications.notifyOnPublish).toBe(true)
            expect(MOMENT_BUSINESS_RULES.notifications.notifyOnLike).toBe(true)
            expect(MOMENT_BUSINESS_RULES.notifications.notifyOnComment).toBe(true)
            expect(MOMENT_BUSINESS_RULES.notifications.notifyOnShare).toBe(false)
            expect(MOMENT_BUSINESS_RULES.notifications.maxNotificationsPerUser).toBe(100)
            expect(MOMENT_BUSINESS_RULES.notifications.notificationChannels).toEqual([
                "push",
                "email",
            ])
        })
    })

    describe("MomentBusinessValidator", () => {
        describe("validatePublishing", () => {
            it("deve validar publicação quando permitida", () => {
                const result = validator.validatePublishing()
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar publicação quando não permitida", () => {
                const customRules = {
                    ...MOMENT_BUSINESS_RULES,
                    publishing: {
                        ...MOMENT_BUSINESS_RULES.publishing,
                        allowPublic: false,
                        allowPrivate: false,
                    },
                }
                const customValidator = new MomentBusinessValidator(customRules)
                const result = customValidator.validatePublishing()
                expect(result.isValid).toBe(false)
                expect(result.error).toBe("Publicação não está permitida")
            })
        })

        describe("validateEngagement", () => {
            it("deve validar engajamento quando permitido", () => {
                const result = validator.validateEngagement()
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar engajamento quando não permitido", () => {
                const customRules = {
                    ...MOMENT_BUSINESS_RULES,
                    engagement: {
                        ...MOMENT_BUSINESS_RULES.engagement,
                        allowLikes: false,
                        allowComments: false,
                    },
                }
                const customValidator = new MomentBusinessValidator(customRules)
                const result = customValidator.validateEngagement()
                expect(result.isValid).toBe(false)
                expect(result.error).toBe("Engajamento não está permitido")
            })
        })

        describe("validateDiscovery", () => {
            it("deve validar descoberta quando habilitada", () => {
                const result = validator.validateDiscovery()
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar descoberta quando não habilitada", () => {
                const customRules = {
                    ...MOMENT_BUSINESS_RULES,
                    discovery: {
                        ...MOMENT_BUSINESS_RULES.discovery,
                        enableSearch: false,
                        enableTrending: false,
                    },
                }
                const customValidator = new MomentBusinessValidator(customRules)
                const result = customValidator.validateDiscovery()
                expect(result.isValid).toBe(false)
                expect(result.error).toBe("Descoberta não está habilitada")
            })
        })

        describe("validateQuality", () => {
            it("deve validar qualidade suficiente", () => {
                const result = validator.validateQuality(50)
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar qualidade muito baixa", () => {
                const result = validator.validateQuality(25)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Qualidade mínima de 30 pontos")
            })

            it("deve rejeitar qualidade baixa quando não permitida", () => {
                const result = validator.validateQuality(40)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Qualidade muito baixa para publicação")
            })
        })

        describe("validateSecurity", () => {
            it("deve validar segurança quando configurada corretamente", () => {
                const result = validator.validateSecurity()
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar configuração de segurança inválida", () => {
                const customRules = {
                    ...MOMENT_BUSINESS_RULES,
                    security: {
                        ...MOMENT_BUSINESS_RULES.security,
                        requireAuthentication: true,
                        allowAnonymous: true,
                    },
                }
                const customValidator = new MomentBusinessValidator(customRules)
                const result = customValidator.validateSecurity()
                expect(result.isValid).toBe(false)
                expect(result.error).toBe("Autenticação é obrigatória")
            })
        })

        describe("validateStorage", () => {
            it("deve validar armazenamento dentro dos limites", () => {
                const result = validator.validateStorage(500 * 1024 * 1024, 50 * 1024 * 1024) // 500MB usado, 50MB novo
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar quando excede limite por usuário", () => {
                const result = validator.validateStorage(900 * 1024 * 1024, 200 * 1024 * 1024) // 900MB + 200MB = 1.1GB
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Limite de armazenamento excedido")
            })

            it("deve rejeitar quando excede limite por momento", () => {
                const result = validator.validateStorage(100 * 1024 * 1024, 150 * 1024 * 1024) // 150MB > 100MB limite
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Tamanho do momento excede o limite")
            })
        })

        describe("validateProcessing", () => {
            it("deve validar processamento quando configurado corretamente", () => {
                const result = validator.validateProcessing()
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar processamento com tempo inválido", () => {
                const customRules = {
                    ...MOMENT_BUSINESS_RULES,
                    processing: {
                        ...MOMENT_BUSINESS_RULES.processing,
                        maxProcessingTime: 0,
                    },
                }
                const customValidator = new MomentBusinessValidator(customRules)
                const result = customValidator.validateProcessing()
                expect(result.isValid).toBe(false)
                expect(result.error).toBe("Tempo de processamento inválido")
            })
        })

        describe("validateAnalytics", () => {
            it("deve validar analytics quando habilitado", () => {
                const result = validator.validateAnalytics()
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar analytics quando desabilitado", () => {
                const customRules = {
                    ...MOMENT_BUSINESS_RULES,
                    analytics: {
                        ...MOMENT_BUSINESS_RULES.analytics,
                        enableAnalytics: false,
                    },
                }
                const customValidator = new MomentBusinessValidator(customRules)
                const result = customValidator.validateAnalytics()
                expect(result.isValid).toBe(false)
                expect(result.error).toBe("Analytics não está habilitado")
            })
        })

        describe("validateNotifications", () => {
            it("deve validar notificações quando habilitadas", () => {
                const result = validator.validateNotifications()
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar notificações quando desabilitadas", () => {
                const customRules = {
                    ...MOMENT_BUSINESS_RULES,
                    notifications: {
                        ...MOMENT_BUSINESS_RULES.notifications,
                        enableNotifications: false,
                    },
                }
                const customValidator = new MomentBusinessValidator(customRules)
                const result = customValidator.validateNotifications()
                expect(result.isValid).toBe(false)
                expect(result.error).toBe("Notificações não estão habilitadas")
            })
        })

        describe("validateBusinessRules", () => {
            it("deve validar regras de negócio completas válidas", () => {
                const data = {
                    qualityScore: 50,
                    currentStorageUsage: 500 * 1024 * 1024,
                    newMomentSize: 50 * 1024 * 1024,
                }

                const result = validator.validateBusinessRules(data)
                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })

            it("deve rejeitar regras de negócio com múltiplos erros", () => {
                const data = {
                    qualityScore: 25, // qualidade baixa
                    currentStorageUsage: 900 * 1024 * 1024, // quase no limite
                    newMomentSize: 150 * 1024 * 1024, // excede limite por momento
                }

                const result = validator.validateBusinessRules(data)
                expect(result.isValid).toBe(false)
                expect(result.errors.length).toBeGreaterThan(1)
            })

            it("deve validar regras de negócio com campos opcionais", () => {
                const result = validator.validateBusinessRules({})
                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })
        })
    })

    describe("MomentBusinessRulesFactory", () => {
        describe("createDefault", () => {
            it("deve criar regras padrão", () => {
                const rules = MomentBusinessRulesFactory.createDefault()
                expect(rules).toEqual(MOMENT_BUSINESS_RULES)
            })
        })

        describe("createCustom", () => {
            it("deve criar regras customizadas", () => {
                const overrides: Partial<MomentBusinessRules> = {
                    publishing: {
                        autoPublish: false,
                        requireModeration: true,
                        requireApproval: false,
                        moderationTimeLimit: 12,
                        approvalTimeLimit: 24,
                        allowScheduledPublishing: true,
                        maxScheduledDays: 14,
                        allowDraft: true,
                        allowPrivate: true,
                        allowPublic: true,
                    },
                    engagement: {
                        allowLikes: true,
                        allowComments: true,
                        allowShares: true,
                        allowReports: true,
                        allowBookmarks: false,
                        allowDownloads: false,
                        maxCommentsPerUser: 15,
                        maxReportsPerUser: 5,
                        commentModeration: true,
                        autoHideSpamComments: true,
                    },
                    quality: {
                        requireQualityCheck: true,
                        minQualityScore: 40,
                        maxQualityScore: 100,
                        qualityFactors: {
                            videoQuality: 0.5,
                            audioQuality: 0.3,
                            contentQuality: 0.2,
                            faceDetection: 0.0,
                        },
                        allowLowQuality: false,
                        autoRejectLowQuality: true,
                        qualityReviewRequired: false,
                    },
                }

                const rules = MomentBusinessRulesFactory.createCustom(overrides)
                expect(rules.publishing.moderationTimeLimit).toBe(12)
                expect(rules.engagement.allowShares).toBe(true)
                expect(rules.engagement.maxCommentsPerUser).toBe(15)
                expect(rules.quality.minQualityScore).toBe(40)
                expect(rules.quality.qualityFactors.videoQuality).toBe(0.5)
            })

            it("deve manter valores padrão para propriedades não especificadas", () => {
                const overrides: Partial<MomentBusinessRules> = {
                    publishing: {
                        autoPublish: true,
                        requireModeration: true,
                        requireApproval: false,
                        moderationTimeLimit: 24,
                        approvalTimeLimit: 48,
                        allowScheduledPublishing: true,
                        maxScheduledDays: 30,
                        allowDraft: true,
                        allowPrivate: true,
                        allowPublic: true,
                    },
                }

                const rules = MomentBusinessRulesFactory.createCustom(overrides)
                expect(rules.publishing.autoPublish).toBe(true)
                expect(rules.engagement.allowLikes).toBe(
                    MOMENT_BUSINESS_RULES.engagement.allowLikes,
                )
                expect(rules.quality.requireQualityCheck).toBe(
                    MOMENT_BUSINESS_RULES.quality.requireQualityCheck,
                )
                expect(rules.security.requireAuthentication).toBe(
                    MOMENT_BUSINESS_RULES.security.requireAuthentication,
                )
            })
        })
    })
})
