import { beforeEach, describe, expect, it } from "vitest"
import { MomentQualityEnum, MomentStatusEnum, MomentVisibilityEnum } from "../../types"
import {
    DEFAULT_MOMENT_VALIDATION_RULES,
    MomentValidationRules,
    MomentValidationRulesFactory,
    MomentValidator,
    PREMIUM_MOMENT_VALIDATION_RULES,
} from "../moment.validation.rules"

describe("MomentValidationRules", () => {
    let validator: MomentValidator

    beforeEach(() => {
        validator = new MomentValidator(DEFAULT_MOMENT_VALIDATION_RULES)
    })

    describe("DEFAULT_MOMENT_VALIDATION_RULES", () => {
        it("deve ter configurações corretas para validação padrão", () => {
            expect(DEFAULT_MOMENT_VALIDATION_RULES.content.maxDuration).toBe(30)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.content.minDuration).toBe(1)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.content.maxSize).toBe(100 * 1024 * 1024)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.content.minSize).toBe(1024)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.content.requiredAspectRatio).toEqual({
                width: 9,
                height: 16,
            })
        })

        it("deve ter configurações de texto corretas", () => {
            expect(DEFAULT_MOMENT_VALIDATION_RULES.text.maxDescriptionLength).toBe(500)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.text.minDescriptionLength).toBe(10)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.text.maxHashtags).toBe(10)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.text.minHashtags).toBe(0)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.text.maxMentions).toBe(5)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.text.minMentions).toBe(0)
        })

        it("deve ter configurações de status corretas", () => {
            expect(DEFAULT_MOMENT_VALIDATION_RULES.status.allowedStatuses).toContain(
                MomentStatusEnum.UNDER_REVIEW,
            )
            expect(DEFAULT_MOMENT_VALIDATION_RULES.status.allowedStatuses).toContain(
                MomentStatusEnum.PUBLISHED,
            )
            expect(DEFAULT_MOMENT_VALIDATION_RULES.status.allowedStatuses).toContain(
                MomentStatusEnum.ARCHIVED,
            )
            expect(DEFAULT_MOMENT_VALIDATION_RULES.status.allowedStatuses).toContain(
                MomentStatusEnum.DELETED,
            )
            expect(DEFAULT_MOMENT_VALIDATION_RULES.status.allowedStatuses).toContain(
                MomentStatusEnum.BLOCKED,
            )
        })

        it("deve ter configurações de visibilidade corretas", () => {
            expect(DEFAULT_MOMENT_VALIDATION_RULES.visibility.allowedLevels).toContain(
                MomentVisibilityEnum.PRIVATE,
            )
            expect(DEFAULT_MOMENT_VALIDATION_RULES.visibility.allowedLevels).toContain(
                MomentVisibilityEnum.FOLLOWERS_ONLY,
            )
            expect(DEFAULT_MOMENT_VALIDATION_RULES.visibility.allowedLevels).toContain(
                MomentVisibilityEnum.PUBLIC,
            )
            expect(DEFAULT_MOMENT_VALIDATION_RULES.visibility.allowedLevels).toContain(
                MomentVisibilityEnum.UNLISTED,
            )
        })

        it("deve ter configurações de qualidade corretas", () => {
            expect(DEFAULT_MOMENT_VALIDATION_RULES.quality.minQualityScore).toBe(30)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.quality.maxQualityScore).toBe(100)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.quality.requireQualityCheck).toBe(true)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.quality.allowLowQuality).toBe(false)
        })

        it("deve ter configurações de segurança corretas", () => {
            expect(DEFAULT_MOMENT_VALIDATION_RULES.security.requireAuthentication).toBe(true)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.security.allowAnonymous).toBe(false)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.security.maxCreationRate).toBe(10)
            expect(DEFAULT_MOMENT_VALIDATION_RULES.security.requireContentModeration).toBe(true)
        })
    })

    describe("PREMIUM_MOMENT_VALIDATION_RULES", () => {
        it("deve ter configurações mais restritivas para conteúdo premium", () => {
            expect(PREMIUM_MOMENT_VALIDATION_RULES.content.maxDuration).toBe(60)
            expect(PREMIUM_MOMENT_VALIDATION_RULES.content.minDuration).toBe(2)
            expect(PREMIUM_MOMENT_VALIDATION_RULES.content.maxSize).toBe(200 * 1024 * 1024)
            expect(PREMIUM_MOMENT_VALIDATION_RULES.content.minSize).toBe(1024 * 1024)
        })

        it("deve ter qualidade mínima maior", () => {
            expect(PREMIUM_MOMENT_VALIDATION_RULES.quality.minQualityScore).toBe(50)
            expect(PREMIUM_MOMENT_VALIDATION_RULES.quality.requireQualityCheck).toBe(true)
            expect(PREMIUM_MOMENT_VALIDATION_RULES.quality.allowLowQuality).toBe(false)
        })

        it("deve ter verificação obrigatória", () => {
            expect(PREMIUM_MOMENT_VALIDATION_RULES.security.requireVerification).toBe(true)
            expect(PREMIUM_MOMENT_VALIDATION_RULES.security.requireOwnerVerification).toBe(true)
        })

        it("deve ter taxa de criação maior", () => {
            expect(PREMIUM_MOMENT_VALIDATION_RULES.security.maxCreationRate).toBe(20)
        })
    })

    describe("MomentValidator", () => {
        describe("validateDuration", () => {
            it("deve validar duração dentro dos limites", () => {
                expect(validator.validateDuration(15).isValid).toBe(true)
                expect(validator.validateDuration(30).isValid).toBe(true)
            })

            it("deve rejeitar duração muito curta", () => {
                const result = validator.validateDuration(0.5)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Duração mínima de 1 segundos")
            })

            it("deve rejeitar duração muito longa", () => {
                const result = validator.validateDuration(31)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Duração máxima de 30 segundos")
            })
        })

        describe("validateSize", () => {
            it("deve validar tamanho dentro dos limites", () => {
                expect(validator.validateSize(1024).isValid).toBe(true)
                expect(validator.validateSize(100 * 1024 * 1024).isValid).toBe(true)
            })

            it("deve rejeitar tamanho muito pequeno", () => {
                const result = validator.validateSize(512)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Tamanho mínimo de 1024 bytes")
            })

            it("deve rejeitar tamanho muito grande", () => {
                const result = validator.validateSize(101 * 1024 * 1024)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Tamanho máximo de 104857600 bytes")
            })
        })

        describe("validateFormat", () => {
            it("deve validar formatos permitidos", () => {
                expect(validator.validateFormat("mp4").isValid).toBe(true)
                expect(validator.validateFormat("webm").isValid).toBe(true)
                expect(validator.validateFormat("mov").isValid).toBe(true)
            })

            it("deve rejeitar formatos não permitidos", () => {
                const result = validator.validateFormat("avi")
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Formato avi não é suportado")
            })
        })

        describe("validateResolution", () => {
            it("deve validar resoluções 9:16 permitidas", () => {
                expect(validator.validateResolution(720, 1280).isValid).toBe(true)
                expect(validator.validateResolution(1080, 1920).isValid).toBe(true)
            })

            it("deve rejeitar aspect ratio incorreto", () => {
                const result = validator.validateResolution(1920, 1080)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Aspect ratio deve ser 9:16")
            })

            it("deve rejeitar resoluções não permitidas", () => {
                const result = validator.validateResolution(1440, 2560)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Resolução 1440x2560 não é suportada")
            })

            it("deve aceitar resoluções com tolerância", () => {
                expect(validator.validateResolution(720, 1281).isValid).toBe(true)
                expect(validator.validateResolution(721, 1280).isValid).toBe(true)
            })
        })

        describe("validateDescription", () => {
            it("deve validar descrição dentro dos limites", () => {
                expect(validator.validateDescription("Valid description").isValid).toBe(true)
                expect(validator.validateDescription("A".repeat(500)).isValid).toBe(true)
            })

            it("deve rejeitar descrição muito curta", () => {
                const result = validator.validateDescription("Short")
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("pelo menos 10 caracteres")
            })

            it("deve rejeitar descrição muito longa", () => {
                const result = validator.validateDescription("A".repeat(501))
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("no máximo 500 caracteres")
            })
        })

        describe("validateHashtags", () => {
            it("deve validar hashtags dentro dos limites", () => {
                expect(validator.validateHashtags([]).isValid).toBe(true)
                expect(validator.validateHashtags(["#test"]).isValid).toBe(true)
                expect(validator.validateHashtags(Array(10).fill("#test")).isValid).toBe(true)
            })

            it("deve aceitar hashtags vazias quando mínimo é 0", () => {
                const premiumValidator = new MomentValidator(PREMIUM_MOMENT_VALIDATION_RULES)
                const result = premiumValidator.validateHashtags([])
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar muitas hashtags", () => {
                const result = validator.validateHashtags(Array(11).fill("#test"))
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Máximo 10 hashtags permitidas")
            })
        })

        describe("validateMentions", () => {
            it("deve validar menções dentro dos limites", () => {
                expect(validator.validateMentions([]).isValid).toBe(true)
                expect(validator.validateMentions(["@user"]).isValid).toBe(true)
                expect(validator.validateMentions(Array(5).fill("@user")).isValid).toBe(true)
            })

            it("deve rejeitar muitas menções", () => {
                const result = validator.validateMentions(Array(6).fill("@user"))
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Máximo 5 menções permitidas")
            })
        })

        describe("validateForbiddenWords", () => {
            it("deve validar texto sem palavras proibidas", () => {
                expect(validator.validateForbiddenWords("Great content").isValid).toBe(true)
            })

            it("deve rejeitar texto com palavras proibidas", () => {
                const result = validator.validateForbiddenWords("This is spam")
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Palavra proibida encontrada: spam")
            })

            it("deve ser case insensitive", () => {
                const result = validator.validateForbiddenWords("AI generated")
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Palavra proibida encontrada: ai")
            })
        })

        describe("validateStatusTransition", () => {
            it("deve validar transições permitidas", () => {
                expect(
                    validator.validateStatusTransition(
                        MomentStatusEnum.UNDER_REVIEW,
                        MomentStatusEnum.PUBLISHED,
                    ).isValid,
                ).toBe(true)
                expect(
                    validator.validateStatusTransition(
                        MomentStatusEnum.PUBLISHED,
                        MomentStatusEnum.ARCHIVED,
                    ).isValid,
                ).toBe(true)
                expect(
                    validator.validateStatusTransition(
                        MomentStatusEnum.ARCHIVED,
                        MomentStatusEnum.PUBLISHED,
                    ).isValid,
                ).toBe(true)
            })

            it("deve rejeitar transições não permitidas", () => {
                const result = validator.validateStatusTransition(
                    MomentStatusEnum.DELETED,
                    MomentStatusEnum.PUBLISHED,
                )
                expect(result.isValid).toBe(false)
                expect(result.error).toContain(
                    "Transição de deleted para published não é permitida",
                )
            })

            it("deve rejeitar status não permitido", () => {
                const result = validator.validateStatusTransition(
                    MomentStatusEnum.UNDER_REVIEW,
                    "invalid" as MomentStatusEnum,
                )
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Status invalid não é permitido")
            })
        })

        describe("validateVisibility", () => {
            it("deve validar níveis de visibilidade permitidos", () => {
                expect(validator.validateVisibility(MomentVisibilityEnum.PRIVATE).isValid).toBe(
                    true,
                )
                expect(validator.validateVisibility(MomentVisibilityEnum.PUBLIC).isValid).toBe(true)
                expect(
                    validator.validateVisibility(MomentVisibilityEnum.FOLLOWERS_ONLY).isValid,
                ).toBe(true)
                expect(validator.validateVisibility(MomentVisibilityEnum.UNLISTED).isValid).toBe(
                    true,
                )
            })

            it("deve rejeitar níveis de visibilidade não permitidos", () => {
                const result = validator.validateVisibility("invalid" as MomentVisibilityEnum)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Nível de visibilidade invalid não é permitido")
            })
        })

        describe("validateQuality", () => {
            it("deve validar qualidade dentro dos limites", () => {
                expect(validator.validateQuality(70).isValid).toBe(true) // Acima do threshold médio
                expect(validator.validateQuality(100).isValid).toBe(true)
            })

            it("deve rejeitar qualidade muito baixa", () => {
                const result = validator.validateQuality(25)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Qualidade mínima de 30 pontos")
            })

            it("deve rejeitar qualidade muito alta", () => {
                const result = validator.validateQuality(101)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Qualidade máxima de 100 pontos")
            })

            it("deve rejeitar qualidade baixa quando não permitida", () => {
                const result = validator.validateQuality(40)
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Qualidade muito baixa para publicação")
            })
        })

        describe("validateMoment", () => {
            it("deve validar momento completo válido", () => {
                const data = {
                    content: {
                        duration: 30,
                        size: 100 * 1024 * 1024,
                        format: "mp4",
                        width: 720,
                        height: 1280,
                    },
                    description: "Great content here",
                    hashtags: ["#test", "#content"],
                    mentions: ["@user"],
                    currentStatus: MomentStatusEnum.UNDER_REVIEW,
                    newStatus: MomentStatusEnum.PUBLISHED,
                    visibility: MomentVisibilityEnum.PUBLIC,
                    qualityScore: 70, // Acima do threshold médio
                }

                const result = validator.validateMoment(data)
                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })

            it("deve rejeitar momento com múltiplos erros", () => {
                const data = {
                    content: {
                        duration: 31, // muito longo
                        size: 101 * 1024 * 1024, // muito grande
                        format: "avi", // formato não permitido
                        width: 1920, // aspect ratio incorreto
                        height: 1080,
                    },
                    description: "A".repeat(501), // muito longa
                    hashtags: Array(11).fill("#test"), // muitas hashtags
                    mentions: Array(6).fill("@user"), // muitas menções
                    currentStatus: MomentStatusEnum.DELETED,
                    newStatus: MomentStatusEnum.PUBLISHED, // transição não permitida
                    visibility: "invalid" as MomentVisibilityEnum, // visibilidade inválida
                    qualityScore: 25, // qualidade baixa
                }

                const result = validator.validateMoment(data)
                expect(result.isValid).toBe(false)
                expect(result.errors.length).toBeGreaterThan(5)
            })

            it("deve validar momento com campos opcionais", () => {
                const data = {
                    description: "Valid description",
                    hashtags: ["#test"],
                }

                const result = validator.validateMoment(data)
                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })
        })
    })

    describe("MomentValidationRulesFactory", () => {
        describe("createDefault", () => {
            it("deve criar regras padrão", () => {
                const rules = MomentValidationRulesFactory.createDefault()
                expect(rules).toEqual(DEFAULT_MOMENT_VALIDATION_RULES)
            })
        })

        describe("createForPremium", () => {
            it("deve criar regras para conteúdo premium", () => {
                const rules = MomentValidationRulesFactory.createForPremium()
                expect(rules).toEqual(PREMIUM_MOMENT_VALIDATION_RULES)
            })
        })

        describe("createCustom", () => {
            it("deve criar regras customizadas", () => {
                const overrides: Partial<MomentValidationRules> = {
                    content: {
                        maxDuration: 45,
                        minDuration: 2,
                        maxSize: 150 * 1024 * 1024,
                        minSize: 2048,
                        allowedFormats: ["mp4"],
                        requiredAspectRatio: { width: 9, height: 16 },
                        allowedResolutions: [
                            { width: 1080, height: 1920, quality: MomentQualityEnum.HIGH },
                        ],
                        qualityThresholds: {
                            low: 40,
                            medium: 70,
                            high: 90,
                        },
                    },
                    text: {
                        maxDescriptionLength: 750,
                        minDescriptionLength: 20,
                        maxHashtags: 15,
                        minHashtags: 1,
                        maxMentions: 8,
                        minMentions: 0,
                        forbiddenWords: ["custom", "forbidden"],
                        requiredWords: ["required"],
                        allowedCharacters: "abcdefghijklmnopqrstuvwxyz",
                        allowEmojis: false,
                        allowSpecialCharacters: false,
                        allowNumbers: true,
                        allowSpaces: true,
                    },
                    quality: {
                        minQualityScore: 60,
                        maxQualityScore: 100,
                        requireQualityCheck: true,
                        allowLowQuality: false,
                        qualityThresholds: {
                            low: 40,
                            medium: 70,
                            high: 90,
                        },
                        qualityFactors: {
                            videoQuality: 0.5,
                            audioQuality: 0.3,
                            contentQuality: 0.2,
                            faceDetection: 0.0,
                        },
                    },
                }

                const rules = MomentValidationRulesFactory.createCustom(overrides)
                expect(rules.content.maxDuration).toBe(45)
                expect(rules.content.minDuration).toBe(2)
                expect(rules.content.maxSize).toBe(150 * 1024 * 1024)
                expect(rules.content.minSize).toBe(2048)
                expect(rules.content.allowedFormats).toEqual(["mp4"])
                expect(rules.text.maxDescriptionLength).toBe(750)
                expect(rules.text.minDescriptionLength).toBe(20)
                expect(rules.text.maxHashtags).toBe(15)
                expect(rules.text.minHashtags).toBe(1)
                expect(rules.text.forbiddenWords).toContain("custom")
                expect(rules.text.forbiddenWords).toContain("forbidden")
                expect(rules.text.requiredWords).toContain("required")
                expect(rules.text.allowEmojis).toBe(false)
                expect(rules.text.allowSpecialCharacters).toBe(false)
                expect(rules.quality.minQualityScore).toBe(60)
                expect(rules.quality.qualityFactors.videoQuality).toBe(0.5)
            })

            it("deve manter valores padrão para propriedades não especificadas", () => {
                const overrides: Partial<MomentValidationRules> = {
                    content: {
                        maxDuration: DEFAULT_MOMENT_VALIDATION_RULES.content.maxDuration,
                        minDuration: DEFAULT_MOMENT_VALIDATION_RULES.content.minDuration,
                        maxSize: DEFAULT_MOMENT_VALIDATION_RULES.content.maxSize,
                        minSize: DEFAULT_MOMENT_VALIDATION_RULES.content.minSize,
                        allowedFormats: DEFAULT_MOMENT_VALIDATION_RULES.content.allowedFormats,
                        requiredAspectRatio:
                            DEFAULT_MOMENT_VALIDATION_RULES.content.requiredAspectRatio,
                        allowedResolutions:
                            DEFAULT_MOMENT_VALIDATION_RULES.content.allowedResolutions,
                        qualityThresholds:
                            DEFAULT_MOMENT_VALIDATION_RULES.content.qualityThresholds,
                    },
                }

                const rules = MomentValidationRulesFactory.createCustom(overrides)
                expect(rules.content.maxDuration).toBe(30)
                expect(rules.content.minDuration).toBe(
                    DEFAULT_MOMENT_VALIDATION_RULES.content.minDuration,
                )
                expect(rules.text.maxDescriptionLength).toBe(
                    DEFAULT_MOMENT_VALIDATION_RULES.text.maxDescriptionLength,
                )
                expect(rules.quality.minQualityScore).toBe(
                    DEFAULT_MOMENT_VALIDATION_RULES.quality.minQualityScore,
                )
                expect(rules.security.requireAuthentication).toBe(
                    DEFAULT_MOMENT_VALIDATION_RULES.security.requireAuthentication,
                )
            })
        })
    })
})
