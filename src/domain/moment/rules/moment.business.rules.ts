// ===== REGRAS DE NEGÓCIO DE MOMENT =====
export interface MomentBusinessRules {
    // Regras de publicação
    publishing: {
        autoPublish: boolean
        requireModeration: boolean
        requireApproval: boolean
        moderationTimeLimit: number // horas
        approvalTimeLimit: number // horas
        allowScheduledPublishing: boolean
        maxScheduledDays: number
        allowDraft: boolean
        allowPrivate: boolean
        allowPublic: boolean
    }

    // Regras de engajamento
    engagement: {
        allowLikes: boolean
        allowComments: boolean
        allowShares: boolean
        allowReports: boolean
        allowBookmarks: boolean
        allowDownloads: boolean
        maxCommentsPerUser: number
        maxReportsPerUser: number
        commentModeration: boolean
        autoHideSpamComments: boolean
    }

    // Regras de descoberta
    discovery: {
        enableSearch: boolean
        enableTrending: boolean
        enableRecommendations: boolean
        enableHashtags: boolean
        enableMentions: boolean
        enableLocation: boolean
        enableCategories: boolean
        maxTrendingDays: number
        minViewsForTrending: number
        minEngagementForTrending: number
    }

    // Regras de qualidade
    quality: {
        requireQualityCheck: boolean
        minQualityScore: number
        maxQualityScore: number
        qualityFactors: {
            videoQuality: number
            audioQuality: number
            contentQuality: number
            faceDetection: number
        }
        allowLowQuality: boolean
        autoRejectLowQuality: boolean
        qualityReviewRequired: boolean
    }

    // Regras de segurança
    security: {
        requireAuthentication: boolean
        requireVerification: boolean
        allowAnonymous: boolean
        maxCreationRate: number // por hora
        maxUploadRate: number // por hora
        requireContentModeration: boolean
        blockSuspiciousContent: boolean
        requireOwnerVerification: boolean
        allowMultipleOwners: boolean
        enableContentFiltering: boolean
        enableSpamDetection: boolean
    }

    // Regras de armazenamento
    storage: {
        maxStoragePerUser: number // bytes
        maxStoragePerMoment: number // bytes
        storageProviders: string[]
        compressionEnabled: boolean
        cdnEnabled: boolean
        backupEnabled: boolean
        retentionPeriod: number // dias
        autoCleanup: boolean
        allowExternalStorage: boolean
    }

    // Regras de processamento
    processing: {
        maxProcessingTime: number // segundos
        retryAttempts: number
        qualityLevels: string[]
        thumbnailGeneration: boolean
        embeddingGeneration: boolean
        transcriptionEnabled: boolean
        translationEnabled: boolean
        autoTagging: boolean
        faceRecognition: boolean
    }

    // Regras de analytics
    analytics: {
        enableAnalytics: boolean
        trackViews: boolean
        trackEngagement: boolean
        trackPerformance: boolean
        trackViral: boolean
        trackAudience: boolean
        trackContent: boolean
        dataRetentionPeriod: number // dias
        enableRealTimeAnalytics: boolean
    }

    // Regras de notificações
    notifications: {
        enableNotifications: boolean
        notifyOnPublish: boolean
        notifyOnLike: boolean
        notifyOnComment: boolean
        notifyOnShare: boolean
        notifyOnReport: boolean
        notifyOnTrending: boolean
        notifyOnViral: boolean
        maxNotificationsPerUser: number
        notificationChannels: string[]
    }
}

// ===== REGRAS DE NEGÓCIO =====
export const MOMENT_BUSINESS_RULES: MomentBusinessRules = {
    publishing: {
        autoPublish: false,
        requireModeration: true,
        requireApproval: false,
        moderationTimeLimit: 24, // 24 horas
        approvalTimeLimit: 48, // 48 horas
        allowScheduledPublishing: false,
        maxScheduledDays: 7,
        allowDraft: true,
        allowPrivate: true,
        allowPublic: true,
    },
    engagement: {
        allowLikes: true,
        allowComments: true,
        allowShares: false,
        allowReports: true,
        allowBookmarks: false,
        allowDownloads: false,
        maxCommentsPerUser: 10,
        maxReportsPerUser: 3,
        commentModeration: true,
        autoHideSpamComments: true,
    },
    discovery: {
        enableSearch: true,
        enableTrending: true,
        enableRecommendations: true,
        enableHashtags: true,
        enableMentions: true,
        enableLocation: false,
        enableCategories: false,
        maxTrendingDays: 7,
        minViewsForTrending: 1000,
        minEngagementForTrending: 100,
    },
    quality: {
        requireQualityCheck: true,
        minQualityScore: 30,
        maxQualityScore: 100,
        qualityFactors: {
            videoQuality: 0.4,
            audioQuality: 0.3,
            contentQuality: 0.2,
            faceDetection: 0.1,
        },
        allowLowQuality: false,
        autoRejectLowQuality: true,
        qualityReviewRequired: false,
    },
    security: {
        requireAuthentication: true,
        requireVerification: false,
        allowAnonymous: false,
        maxCreationRate: 10, // 10 momentos por hora
        maxUploadRate: 5, // 5 uploads por hora
        requireContentModeration: true,
        blockSuspiciousContent: true,
        requireOwnerVerification: false,
        allowMultipleOwners: false,
        enableContentFiltering: true,
        enableSpamDetection: true,
    },
    storage: {
        maxStoragePerUser: 1024 * 1024 * 1024, // 1GB
        maxStoragePerMoment: 100 * 1024 * 1024, // 100MB
        storageProviders: ["aws", "gcp"],
        compressionEnabled: true,
        cdnEnabled: true,
        backupEnabled: true,
        retentionPeriod: 365, // 1 ano
        autoCleanup: false,
        allowExternalStorage: false,
    },
    processing: {
        maxProcessingTime: 300, // 5 minutos
        retryAttempts: 3,
        qualityLevels: ["medium", "high"],
        thumbnailGeneration: true,
        embeddingGeneration: true,
        transcriptionEnabled: false,
        translationEnabled: false,
        autoTagging: false,
        faceRecognition: false,
    },
    analytics: {
        enableAnalytics: true,
        trackViews: true,
        trackEngagement: true,
        trackPerformance: true,
        trackViral: true,
        trackAudience: true,
        trackContent: true,
        dataRetentionPeriod: 365, // 1 ano
        enableRealTimeAnalytics: true,
    },
    notifications: {
        enableNotifications: true,
        notifyOnPublish: true,
        notifyOnLike: true,
        notifyOnComment: true,
        notifyOnShare: false,
        notifyOnReport: true,
        notifyOnTrending: true,
        notifyOnViral: true,
        maxNotificationsPerUser: 100,
        notificationChannels: ["push", "email"],
    },
}

// ===== VALIDADOR DE REGRAS DE NEGÓCIO =====
export class MomentBusinessValidator {
    constructor(private rules: MomentBusinessRules) {}

    /**
     * Valida se publicação está permitida
     */
    validatePublishing(): { isValid: boolean; error?: string } {
        if (!this.rules.publishing.allowPublic && !this.rules.publishing.allowPrivate) {
            return {
                isValid: false,
                error: "Publicação não está permitida",
            }
        }

        return { isValid: true }
    }

    /**
     * Valida se engajamento está permitido
     */
    validateEngagement(): { isValid: boolean; error?: string } {
        if (!this.rules.engagement.allowLikes && !this.rules.engagement.allowComments) {
            return {
                isValid: false,
                error: "Engajamento não está permitido",
            }
        }

        return { isValid: true }
    }

    /**
     * Valida se descoberta está habilitada
     */
    validateDiscovery(): { isValid: boolean; error?: string } {
        if (!this.rules.discovery.enableSearch && !this.rules.discovery.enableTrending) {
            return {
                isValid: false,
                error: "Descoberta não está habilitada",
            }
        }

        return { isValid: true }
    }

    /**
     * Valida qualidade
     */
    validateQuality(qualityScore: number): { isValid: boolean; error?: string } {
        if (this.rules.quality.requireQualityCheck) {
            if (qualityScore < this.rules.quality.minQualityScore) {
                return {
                    isValid: false,
                    error: `Qualidade mínima de ${this.rules.quality.minQualityScore} pontos`,
                }
            }

            if (qualityScore > this.rules.quality.maxQualityScore) {
                return {
                    isValid: false,
                    error: `Qualidade máxima de ${this.rules.quality.maxQualityScore} pontos`,
                }
            }

            if (!this.rules.quality.allowLowQuality && qualityScore < 50) {
                return {
                    isValid: false,
                    error: "Qualidade muito baixa para publicação",
                }
            }
        }

        return { isValid: true }
    }

    /**
     * Valida segurança
     */
    validateSecurity(): { isValid: boolean; error?: string } {
        if (this.rules.security.requireAuthentication && this.rules.security.allowAnonymous) {
            return {
                isValid: false,
                error: "Autenticação é obrigatória",
            }
        }

        return { isValid: true }
    }

    /**
     * Valida armazenamento
     */
    validateStorage(currentUsage: number, newSize: number): { isValid: boolean; error?: string } {
        if (currentUsage + newSize > this.rules.storage.maxStoragePerUser) {
            return {
                isValid: false,
                error: `Limite de armazenamento excedido. Máximo ${this.rules.storage.maxStoragePerUser} bytes`,
            }
        }

        if (newSize > this.rules.storage.maxStoragePerMoment) {
            return {
                isValid: false,
                error: `Tamanho do momento excede o limite. Máximo ${this.rules.storage.maxStoragePerMoment} bytes`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida processamento
     */
    validateProcessing(): { isValid: boolean; error?: string } {
        if (this.rules.processing.maxProcessingTime <= 0) {
            return {
                isValid: false,
                error: "Tempo de processamento inválido",
            }
        }

        return { isValid: true }
    }

    /**
     * Valida analytics
     */
    validateAnalytics(): { isValid: boolean; error?: string } {
        if (!this.rules.analytics.enableAnalytics) {
            return {
                isValid: false,
                error: "Analytics não está habilitado",
            }
        }

        return { isValid: true }
    }

    /**
     * Valida notificações
     */
    validateNotifications(): { isValid: boolean; error?: string } {
        if (!this.rules.notifications.enableNotifications) {
            return {
                isValid: false,
                error: "Notificações não estão habilitadas",
            }
        }

        return { isValid: true }
    }

    /**
     * Validação completa de regras de negócio
     */
    validateBusinessRules(data: {
        qualityScore?: number
        currentStorageUsage?: number
        newMomentSize?: number
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        // Validar publicação
        const publishingValidation = this.validatePublishing()
        if (!publishingValidation.isValid) {
            errors.push(publishingValidation.error!)
        }

        // Validar engajamento
        const engagementValidation = this.validateEngagement()
        if (!engagementValidation.isValid) {
            errors.push(engagementValidation.error!)
        }

        // Validar descoberta
        const discoveryValidation = this.validateDiscovery()
        if (!discoveryValidation.isValid) {
            errors.push(discoveryValidation.error!)
        }

        // Validar qualidade
        if (data.qualityScore !== undefined) {
            const qualityValidation = this.validateQuality(data.qualityScore)
            if (!qualityValidation.isValid) {
                errors.push(qualityValidation.error!)
            }
        }

        // Validar segurança
        const securityValidation = this.validateSecurity()
        if (!securityValidation.isValid) {
            errors.push(securityValidation.error!)
        }

        // Validar armazenamento
        if (data.currentStorageUsage !== undefined && data.newMomentSize !== undefined) {
            const storageValidation = this.validateStorage(
                data.currentStorageUsage,
                data.newMomentSize,
            )
            if (!storageValidation.isValid) {
                errors.push(storageValidation.error!)
            }
        }

        // Validar processamento
        const processingValidation = this.validateProcessing()
        if (!processingValidation.isValid) {
            errors.push(processingValidation.error!)
        }

        // Validar analytics
        const analyticsValidation = this.validateAnalytics()
        if (!analyticsValidation.isValid) {
            errors.push(analyticsValidation.error!)
        }

        // Validar notificações
        const notificationsValidation = this.validateNotifications()
        if (!notificationsValidation.isValid) {
            errors.push(notificationsValidation.error!)
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }
}

// ===== FACTORY PARA REGRAS DE NEGÓCIO =====
export class MomentBusinessRulesFactory {
    /**
     * Cria regras padrão
     */
    static createDefault(): MomentBusinessRules {
        return { ...MOMENT_BUSINESS_RULES }
    }

    /**
     * Cria regras customizadas
     */
    static createCustom(overrides: Partial<MomentBusinessRules>): MomentBusinessRules {
        return {
            ...MOMENT_BUSINESS_RULES,
            ...overrides,
            publishing: {
                ...MOMENT_BUSINESS_RULES.publishing,
                ...overrides.publishing,
            },
            engagement: {
                ...MOMENT_BUSINESS_RULES.engagement,
                ...overrides.engagement,
            },
            discovery: {
                ...MOMENT_BUSINESS_RULES.discovery,
                ...overrides.discovery,
            },
            quality: {
                ...MOMENT_BUSINESS_RULES.quality,
                ...overrides.quality,
            },
            security: {
                ...MOMENT_BUSINESS_RULES.security,
                ...overrides.security,
            },
            storage: {
                ...MOMENT_BUSINESS_RULES.storage,
                ...overrides.storage,
            },
            processing: {
                ...MOMENT_BUSINESS_RULES.processing,
                ...overrides.processing,
            },
            analytics: {
                ...MOMENT_BUSINESS_RULES.analytics,
                ...overrides.analytics,
            },
            notifications: {
                ...MOMENT_BUSINESS_RULES.notifications,
                ...overrides.notifications,
            },
        }
    }
}
