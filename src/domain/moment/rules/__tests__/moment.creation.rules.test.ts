import { beforeEach, describe, expect, it } from "vitest"
import { MomentQualityEnum, MomentStatusEnum, MomentVisibilityEnum } from "../../types"
import {
    DEFAULT_MOMENT_CREATION_RULES,
    HUMAN_CONTENT_CREATION_RULES,
    MomentCreationRules,
    MomentCreationRulesFactory,
    MomentCreationValidator,
} from "../moment.creation.rules"

describe("MomentCreationRules", () => {
    let validator: MomentCreationValidator

    beforeEach(() => {
        validator = new MomentCreationValidator(DEFAULT_MOMENT_CREATION_RULES)
    })

    describe("DEFAULT_MOMENT_CREATION_RULES", () => {
        it("deve ter configurações corretas para criação padrão", () => {
            expect(DEFAULT_MOMENT_CREATION_RULES.validation.requireOwner).toBe(true)
            expect(DEFAULT_MOMENT_CREATION_RULES.validation.requireDescription).toBe(true)
            expect(DEFAULT_MOMENT_CREATION_RULES.validation.requireContent).toBe(true)
            expect(DEFAULT_MOMENT_CREATION_RULES.validation.maxHashtags).toBe(10)
            expect(DEFAULT_MOMENT_CREATION_RULES.validation.maxMentions).toBe(5)
        })

        it("deve ter configurações de conteúdo corretas", () => {
            expect(DEFAULT_MOMENT_CREATION_RULES.content.maxDuration).toBe(30)
            expect(DEFAULT_MOMENT_CREATION_RULES.content.maxSize).toBe(100 * 1024 * 1024)
            expect(DEFAULT_MOMENT_CREATION_RULES.content.minDuration).toBe(1)
            expect(DEFAULT_MOMENT_CREATION_RULES.content.minSize).toBe(1024)
            expect(DEFAULT_MOMENT_CREATION_RULES.content.requiredAspectRatio).toEqual({
                width: 9,
                height: 16,
            })
        })

        it("deve ter status inicial correto", () => {
            expect(DEFAULT_MOMENT_CREATION_RULES.initialStatus.defaultStatus).toBe(
                MomentStatusEnum.UNDER_REVIEW,
            )
            expect(DEFAULT_MOMENT_CREATION_RULES.initialStatus.defaultVisibility).toBe(
                MomentVisibilityEnum.PRIVATE,
            )
            expect(DEFAULT_MOMENT_CREATION_RULES.initialStatus.autoPublish).toBe(false)
            expect(DEFAULT_MOMENT_CREATION_RULES.initialStatus.requireModeration).toBe(true)
        })

        it("deve ter configurações de segurança corretas", () => {
            expect(DEFAULT_MOMENT_CREATION_RULES.security.requireAuthentication).toBe(true)
            expect(DEFAULT_MOMENT_CREATION_RULES.security.allowAnonymous).toBe(false)
            expect(DEFAULT_MOMENT_CREATION_RULES.security.maxCreationRate).toBe(10)
            expect(DEFAULT_MOMENT_CREATION_RULES.security.requireContentModeration).toBe(true)
        })
    })

    describe("HUMAN_CONTENT_CREATION_RULES", () => {
        it("deve ter configurações mais permissivas para conteúdo humano", () => {
            expect(HUMAN_CONTENT_CREATION_RULES.content.maxDuration).toBe(60)
            expect(HUMAN_CONTENT_CREATION_RULES.content.maxSize).toBe(200 * 1024 * 1024)
            expect(HUMAN_CONTENT_CREATION_RULES.text.maxHashtags).toBe(15)
            expect(HUMAN_CONTENT_CREATION_RULES.text.maxMentions).toBe(10)
            expect(HUMAN_CONTENT_CREATION_RULES.security.maxCreationRate).toBe(20)
        })

        it("deve ter qualidade mínima maior", () => {
            expect(HUMAN_CONTENT_CREATION_RULES.quality.minQualityScore).toBe(50)
            expect(HUMAN_CONTENT_CREATION_RULES.quality.requireQualityCheck).toBe(true)
            expect(HUMAN_CONTENT_CREATION_RULES.quality.allowLowQuality).toBe(false)
        })

        it("deve ter verificação obrigatória", () => {
            expect(HUMAN_CONTENT_CREATION_RULES.security.requireVerification).toBe(true)
        })
    })

    describe("MomentCreationValidator", () => {
        describe("validateOwner", () => {
            it("deve validar owner quando obrigatório", () => {
                const result = validator.validateOwner("user123")
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar owner ausente quando obrigatório", () => {
                const result = validator.validateOwner(null)
                expect(result.isValid).toBe(false)
                expect(result.error).toBe("Owner é obrigatório")
            })
        })

        describe("validateDescription", () => {
            it("deve validar descrição válida", () => {
                const result = validator.validateDescription("Great content here")
                expect(result.isValid).toBe(true)
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

            it("deve rejeitar descrição ausente quando obrigatória", () => {
                const result = validator.validateDescription("")
                expect(result.isValid).toBe(false)
                expect(result.error).toBe("Descrição é obrigatória")
            })
        })

        describe("validateHashtags", () => {
            it("deve validar hashtags válidas", () => {
                const result = validator.validateHashtags(["#test", "#content"])
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar muitas hashtags", () => {
                const result = validator.validateHashtags(Array(11).fill("#test"))
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Máximo 10 hashtags")
            })

            it("deve aceitar hashtags vazias quando não obrigatórias", () => {
                const result = validator.validateHashtags([])
                expect(result.isValid).toBe(true)
            })
        })

        describe("validateMentions", () => {
            it("deve validar menções válidas", () => {
                const result = validator.validateMentions(["@user1", "@user2"])
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar muitas menções", () => {
                const result = validator.validateMentions(Array(6).fill("@user"))
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Máximo 5 menções")
            })
        })

        describe("validateContent", () => {
            it("deve validar conteúdo válido", () => {
                const content = {
                    duration: 30,
                    size: 100 * 1024 * 1024,
                    format: "mp4",
                    width: 360,
                    height: 558,
                }

                const result = validator.validateContent(content)
                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })

            it("deve rejeitar duração muito curta", () => {
                const content = {
                    duration: 0.5,
                    size: 100 * 1024 * 1024,
                    format: "mp4",
                    width: 360,
                    height: 558,
                }

                const result = validator.validateContent(content)
                expect(result.isValid).toBe(false)
                expect(result.errors).toContain("Duração mínima de 1 segundos")
            })

            it("deve rejeitar duração muito longa", () => {
                const content = {
                    duration: 31,
                    size: 100 * 1024 * 1024,
                    format: "mp4",
                    width: 360,
                    height: 558,
                }

                const result = validator.validateContent(content)
                expect(result.isValid).toBe(false)
                expect(result.errors).toContain("Duração máxima de 30 segundos")
            })

            it("deve rejeitar tamanho muito pequeno", () => {
                const content = {
                    duration: 30,
                    size: 512,
                    format: "mp4",
                    width: 360,
                    height: 558,
                }

                const result = validator.validateContent(content)
                expect(result.isValid).toBe(false)
                expect(result.errors).toContain("Tamanho mínimo de 1024 bytes")
            })

            it("deve rejeitar tamanho muito grande", () => {
                const content = {
                    duration: 30,
                    size: 101 * 1024 * 1024,
                    format: "mp4",
                    width: 360,
                    height: 558,
                }

                const result = validator.validateContent(content)
                expect(result.isValid).toBe(false)
                expect(result.errors).toContain("Tamanho máximo de 104857600 bytes")
            })

            it("deve rejeitar formato não permitido", () => {
                const content = {
                    duration: 30,
                    size: 100 * 1024 * 1024,
                    format: "avi",
                    width: 360,
                    height: 558,
                }

                const result = validator.validateContent(content)
                expect(result.isValid).toBe(false)
                expect(result.errors).toContain("Formato avi não é suportado")
            })

            it("deve rejeitar aspect ratio incorreto", () => {
                const content = {
                    duration: 30,
                    size: 100 * 1024 * 1024,
                    format: "mp4",
                    width: 1920,
                    height: 1080,
                }

                const result = validator.validateContent(content)
                expect(result.isValid).toBe(false)
                expect(result.errors).toContain("Aspect ratio deve ser 360:558")
            })

            it("deve rejeitar resolução não permitida", () => {
                const content = {
                    duration: 30,
                    size: 100 * 1024 * 1024,
                    format: "mp4",
                    width: 1440,
                    height: 2560,
                }

                const result = validator.validateContent(content)
                expect(result.isValid).toBe(false)
                expect(result.errors).toContain("não é suportada")
            })
        })

        describe("validateForbiddenWords", () => {
            it("deve validar texto sem palavras proibidas", () => {
                const result = validator.validateForbiddenWords("Great content here")
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar texto com palavras proibidas", () => {
                const result = validator.validateForbiddenWords("This is spam content")
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Palavra proibida encontrada: spam")
            })

            it("deve ser case insensitive", () => {
                const result = validator.validateForbiddenWords("AI generated content")
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Palavra proibida encontrada: ai")
            })
        })

        describe("validateQuality", () => {
            it("deve validar qualidade suficiente", () => {
                const result = validator.validateQuality(70) // Acima do threshold médio
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

        describe("validateCreationRate", () => {
            it("deve validar taxa de criação normal", () => {
                const result = validator.validateCreationRate(5, 3600) // 5 em 1 hora
                expect(result.isValid).toBe(true)
            })

            it("deve rejeitar taxa de criação muito alta", () => {
                const result = validator.validateCreationRate(15, 3600) // 15 em 1 hora
                expect(result.isValid).toBe(false)
                expect(result.error).toContain("Taxa de criação muito alta")
            })
        })

        describe("validateCreation", () => {
            it("deve validar criação completa válida", () => {
                const data = {
                    ownerId: "user123",
                    description: "Great content here",
                    hashtags: ["#test", "#content"],
                    mentions: ["@user"],
                    content: {
                        duration: 30,
                        size: 100 * 1024 * 1024,
                        format: "mp4",
                        width: 720,
                        height: 1280,
                    },
                    qualityScore: 70, // Acima do threshold médio
                    creationCount: 5,
                    timeWindow: 3600,
                }

                const result = validator.validateCreation(data)
                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })

            it("deve rejeitar criação com múltiplos erros", () => {
                const data = {
                    ownerId: null, // owner ausente
                    description: "A".repeat(501), // muito longa
                    hashtags: Array(11).fill("#test"), // muitas hashtags
                    mentions: Array(6).fill("@user"), // muitas menções
                    content: {
                        duration: 31, // muito longo
                        size: 101 * 1024 * 1024, // muito grande
                        format: "avi", // formato não permitido
                        width: 1920, // aspect ratio incorreto
                        height: 1080,
                    },
                    qualityScore: 25, // qualidade baixa
                    creationCount: 15, // taxa alta
                    timeWindow: 3600,
                }

                const result = validator.validateCreation(data)
                expect(result.isValid).toBe(false)
                expect(result.errors.length).toBeGreaterThan(5)
            })
        })
    })

    describe("MomentCreationRulesFactory", () => {
        describe("createDefault", () => {
            it("deve criar regras padrão", () => {
                const rules = MomentCreationRulesFactory.createDefault()
                expect(rules).toEqual(DEFAULT_MOMENT_CREATION_RULES)
            })
        })

        describe("createForHumanContent", () => {
            it("deve criar regras para conteúdo humano", () => {
                const rules = MomentCreationRulesFactory.createForHumanContent()
                expect(rules).toEqual(HUMAN_CONTENT_CREATION_RULES)
            })
        })

        describe("createCustom", () => {
            it("deve criar regras customizadas", () => {
                const overrides: Partial<MomentCreationRules> = {
                    validation: {
                        requireOwner: false,
                        requireDescription: false,
                        requireContent: true,
                        requireHashtags: true,
                        maxHashtags: 15,
                        maxMentions: 8,
                        maxDescriptionLength: 750,
                        minDescriptionLength: 20,
                    },
                    content: {
                        allowedFormats: ["mp4"],
                        maxDuration: 45,
                        maxSize: 150 * 1024 * 1024,
                        minDuration: 2,
                        minSize: 2048,
                        requiredAspectRatio: { width: 360, height: 558 },
                        allowedResolutions: [
                            { width: 360, height: 558, quality: MomentQualityEnum.MEDIUM },
                        ],
                    },
                }

                const rules = MomentCreationRulesFactory.createCustom(overrides)
                expect(rules.validation.requireOwner).toBe(false)
                expect(rules.validation.requireDescription).toBe(false)
                expect(rules.validation.maxHashtags).toBe(15)
                expect(rules.validation.maxMentions).toBe(8)
                expect(rules.content.maxDuration).toBe(45)
                expect(rules.content.maxSize).toBe(150 * 1024 * 1024)
                expect(rules.content.allowedFormats).toEqual(["mp4"])
            })

            it("deve manter valores padrão para propriedades não especificadas", () => {
                const overrides: Partial<MomentCreationRules> = {
                    validation: {
                        requireOwner: true,
                        requireDescription: true,
                        requireContent: true,
                        requireHashtags: false,
                        maxHashtags: 15,
                        maxMentions: 5,
                        maxDescriptionLength: 500,
                        minDescriptionLength: 10,
                    },
                }

                const rules = MomentCreationRulesFactory.createCustom(overrides)
                expect(rules.validation.maxHashtags).toBe(15)
                expect(rules.validation.requireOwner).toBe(
                    DEFAULT_MOMENT_CREATION_RULES.validation.requireOwner,
                )
                expect(rules.content.maxDuration).toBe(
                    DEFAULT_MOMENT_CREATION_RULES.content.maxDuration,
                )
                expect(rules.initialStatus.defaultStatus).toBe(
                    DEFAULT_MOMENT_CREATION_RULES.initialStatus.defaultStatus,
                )
            })
        })
    })
})
