import { beforeEach, describe, expect, it } from "vitest"
import {
    DEFAULT_MOMENT_PROCESSING_RULES,
    HIGH_QUALITY_PROCESSING_RULES,
    HUMAN_CONTENT_PROCESSING_RULES,
    MomentProcessingRules,
    MomentProcessingRulesFactory,
    MomentProcessingValidator,
} from "../moment.processing.rules"

import { MomentQualityEnum } from "../../types"

describe("MomentProcessingRules", () => {
    let validator: MomentProcessingValidator

    beforeEach(() => {
        validator = new MomentProcessingValidator(DEFAULT_MOMENT_PROCESSING_RULES)
    })

    describe("DEFAULT_MOMENT_PROCESSING_RULES", () => {
        it("deve ter configurações corretas para conteúdo padrão", () => {
            expect(DEFAULT_MOMENT_PROCESSING_RULES.content.maxDuration).toBe(30)
            expect(DEFAULT_MOMENT_PROCESSING_RULES.content.maxSize).toBe(100 * 1024 * 1024)
            expect(DEFAULT_MOMENT_PROCESSING_RULES.content.allowedFormats).toEqual([
                "mp4",
                "webm",
                "mov",
            ])
            expect(DEFAULT_MOMENT_PROCESSING_RULES.text.maxHashtags).toBe(10)
            expect(DEFAULT_MOMENT_PROCESSING_RULES.text.maxMentions).toBe(2)
            expect(DEFAULT_MOMENT_PROCESSING_RULES.processing.retryAttempts).toBe(1)
            expect(DEFAULT_MOMENT_PROCESSING_RULES.storage.maxConcurrentUploads).toBe(1)
        })

        it("deve ter apenas resoluções com aspect ratio 360:558", () => {
            const resolutions = DEFAULT_MOMENT_PROCESSING_RULES.content.allowedResolutions
            resolutions.forEach((res) => {
                const aspectRatio = res.width / res.height
                const targetRatio = 360 / 558
                expect(Math.abs(aspectRatio - targetRatio)).toBeLessThan(0.01)
            })
        })

        it("deve conter palavras proibidas para bots e IA", () => {
            const forbiddenWords = DEFAULT_MOMENT_PROCESSING_RULES.text.forbiddenWords
            expect(forbiddenWords).toContain("bot")
            expect(forbiddenWords).toContain("ai")
            expect(forbiddenWords).toContain("generated")
            expect(forbiddenWords).toContain("synthetic")
        })
    })

    describe("HUMAN_CONTENT_PROCESSING_RULES", () => {
        it("deve ter configurações mais permissivas para conteúdo humano", () => {
            expect(HUMAN_CONTENT_PROCESSING_RULES.content.maxDuration).toBe(60)
            expect(HUMAN_CONTENT_PROCESSING_RULES.content.maxSize).toBe(200 * 1024 * 1024)
            expect(HUMAN_CONTENT_PROCESSING_RULES.processing.retryAttempts).toBe(3)
            expect(HUMAN_CONTENT_PROCESSING_RULES.storage.maxConcurrentUploads).toBe(5)
        })

        it("deve ter apenas resoluções com aspect ratio 360:558", () => {
            const resolutions = HUMAN_CONTENT_PROCESSING_RULES.content.allowedResolutions
            resolutions.forEach((res) => {
                const aspectRatio = res.width / res.height
                const targetRatio = 360 / 558
                expect(Math.abs(aspectRatio - targetRatio)).toBeLessThan(0.01)
            })
        })
    })

    describe("HIGH_QUALITY_PROCESSING_RULES", () => {
        it("deve ter configurações para conteúdo ultra premium", () => {
            expect(HIGH_QUALITY_PROCESSING_RULES.content.maxDuration).toBe(120)
            expect(HIGH_QUALITY_PROCESSING_RULES.content.maxSize).toBe(500 * 1024 * 1024)
            expect(HIGH_QUALITY_PROCESSING_RULES.text.maxHashtags).toBe(20)
            expect(HIGH_QUALITY_PROCESSING_RULES.text.maxMentions).toBe(50)
            expect(HIGH_QUALITY_PROCESSING_RULES.storage.compressionEnabled).toBe(false)
        })
    })

    describe("MomentProcessingValidator", () => {
        describe("validateDuration", () => {
            it("deve validar duração dentro do limite", () => {
                expect(validator.validateDuration(30)).toBe(true)
                expect(validator.validateDuration(15)).toBe(true)
                expect(validator.validateDuration(0)).toBe(true)
            })

            it("deve rejeitar duração acima do limite", () => {
                expect(validator.validateDuration(31)).toBe(false)
                expect(validator.validateDuration(60)).toBe(false)
            })
        })

        describe("validateSize", () => {
            it("deve validar tamanho dentro do limite", () => {
                expect(validator.validateSize(100 * 1024 * 1024)).toBe(true)
                expect(validator.validateSize(50 * 1024 * 1024)).toBe(true)
                expect(validator.validateSize(0)).toBe(true)
            })

            it("deve rejeitar tamanho acima do limite", () => {
                expect(validator.validateSize(101 * 1024 * 1024)).toBe(false)
                expect(validator.validateSize(200 * 1024 * 1024)).toBe(false)
            })
        })

        describe("validateFormat", () => {
            it("deve validar formatos permitidos", () => {
                expect(validator.validateFormat("mp4")).toBe(true)
                expect(validator.validateFormat("webm")).toBe(true)
                expect(validator.validateFormat("mov")).toBe(true)
            })

            it("deve rejeitar formatos não permitidos", () => {
                expect(validator.validateFormat("avi")).toBe(false)
                expect(validator.validateFormat("mkv")).toBe(false)
                expect(validator.validateFormat("wmv")).toBe(false)
            })
        })

        describe("validateResolution", () => {
            it("deve validar resoluções com aspect ratio 360:558 permitidas", () => {
                expect(validator.validateResolution(360, 558)).toBe(true)
                expect(validator.validateResolution(720, 1116)).toBe(true)
                expect(validator.validateResolution(1080, 1674)).toBe(true)
            })

            it("deve rejeitar resoluções com aspect ratio incorreto", () => {
                expect(validator.validateResolution(1920, 1080)).toBe(false) // 16:9
                expect(validator.validateResolution(1280, 720)).toBe(false) // 16:9
                expect(validator.validateResolution(800, 600)).toBe(false) // 4:3
            })

            it("deve rejeitar resoluções não permitidas mesmo com aspect ratio correto", () => {
                expect(validator.validateResolution(1440, 2232)).toBe(false) // aspect ratio 360:558 mas não permitida
                expect(validator.validateResolution(2160, 3348)).toBe(false) // aspect ratio 360:558 mas não permitida
            })

            it("deve aceitar resoluções com tolerância de aspect ratio", () => {
                // Teste com tolerância de 1%
                expect(validator.validateResolution(360, 559)).toBe(true)
                expect(validator.validateResolution(361, 558)).toBe(true)
            })
        })

        describe("validateHashtags", () => {
            it("deve validar número de hashtags dentro do limite", () => {
                expect(validator.validateHashtags([])).toBe(true)
                expect(validator.validateHashtags(["#test"])).toBe(true)
                expect(validator.validateHashtags(Array(10).fill("#test"))).toBe(true)
            })

            it("deve rejeitar número excessivo de hashtags", () => {
                expect(validator.validateHashtags(Array(11).fill("#test"))).toBe(false)
                expect(validator.validateHashtags(Array(20).fill("#test"))).toBe(false)
            })
        })

        describe("validateMentions", () => {
            it("deve validar número de menções dentro do limite", () => {
                expect(validator.validateMentions([])).toBe(true)
                expect(validator.validateMentions(["@user"])).toBe(true)
                expect(validator.validateMentions(["@user1", "@user2"])).toBe(true)
            })

            it("deve rejeitar número excessivo de menções", () => {
                expect(validator.validateMentions(["@user1", "@user2", "@user3"])).toBe(false)
                expect(validator.validateMentions(Array(10).fill("@user"))).toBe(false)
            })
        })

        describe("validateDescription", () => {
            it("deve validar descrição dentro do limite", () => {
                expect(validator.validateDescription("")).toBe(true)
                expect(validator.validateDescription("Test description")).toBe(true)
                expect(validator.validateDescription("A".repeat(500))).toBe(true)
            })

            it("deve rejeitar descrição muito longa", () => {
                expect(validator.validateDescription("A".repeat(501))).toBe(false)
                expect(validator.validateDescription("A".repeat(1000))).toBe(false)
            })
        })

        describe("validateForbiddenWords", () => {
            it("deve validar texto sem palavras proibidas", () => {
                expect(validator.validateForbiddenWords("This is a normal description")).toBe(true)
                expect(validator.validateForbiddenWords("Great content here")).toBe(true)
            })

            it("deve rejeitar texto com palavras proibidas", () => {
                expect(validator.validateForbiddenWords("This is spam content")).toBe(false)
                expect(validator.validateForbiddenWords("AI generated video")).toBe(false)
                expect(validator.validateForbiddenWords("Bot created this")).toBe(false)
                expect(validator.validateForbiddenWords("Synthetic content")).toBe(false)
            })

            it("deve ser case insensitive", () => {
                expect(validator.validateForbiddenWords("SPAM content")).toBe(false)
                expect(validator.validateForbiddenWords("ai generated")).toBe(false)
                expect(validator.validateForbiddenWords("BOT content")).toBe(false)
            })
        })

        describe("validateContent", () => {
            it("deve validar conteúdo completo válido", () => {
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

            it("deve rejeitar conteúdo com múltiplos erros", () => {
                const content = {
                    duration: 60, // muito longo
                    size: 200 * 1024 * 1024, // muito grande
                    format: "avi", // formato não permitido
                    width: 1920, // aspect ratio incorreto
                    height: 1080,
                }

                const result = validator.validateContent(content)
                expect(result.isValid).toBe(false)
                expect(result.errors.length).toBeGreaterThan(1)
            })
        })

        describe("validateText", () => {
            it("deve validar texto completo válido", () => {
                const text = {
                    description: "Great content here",
                    hashtags: ["#test", "#content"],
                    mentions: ["@user"],
                }

                const result = validator.validateText(text)
                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
            })

            it("deve rejeitar texto com múltiplos erros", () => {
                const text = {
                    description: "A".repeat(501), // muito longo
                    hashtags: Array(11).fill("#test"), // muitas hashtags
                    mentions: ["@user1", "@user2", "@user3"], // muitas menções
                }

                const result = validator.validateText(text)
                expect(result.isValid).toBe(false)
                expect(result.errors.length).toBeGreaterThan(1)
            })
        })
    })

    describe("MomentProcessingRulesFactory", () => {
        describe("createDefault", () => {
            it("deve criar regras padrão", () => {
                const rules = MomentProcessingRulesFactory.createDefault()
                expect(rules).toEqual(DEFAULT_MOMENT_PROCESSING_RULES)
            })
        })

        describe("createForHumanContent", () => {
            it("deve criar regras para conteúdo humano", () => {
                const rules = MomentProcessingRulesFactory.createForHumanContent()
                expect(rules).toEqual(HUMAN_CONTENT_PROCESSING_RULES)
            })
        })

        describe("createForHighQuality", () => {
            it("deve criar regras para alta qualidade", () => {
                const rules = MomentProcessingRulesFactory.createForHighQuality()
                expect(rules).toEqual(HIGH_QUALITY_PROCESSING_RULES)
            })
        })

        describe("createCustom", () => {
            it("deve criar regras customizadas", () => {
                const overrides: Partial<MomentProcessingRules> = {
                    content: {
                        maxDuration: 45,
                        maxSize: 150 * 1024 * 1024,
                        allowedFormats: ["mp4"],
                        allowedResolutions: [
                            { width: 360, height: 558, quality: MomentQualityEnum.MEDIUM },
                        ],
                    },
                    text: {
                        maxHashtags: 15,
                        maxMentions: 3,
                        maxDescriptionLength: 750,
                        forbiddenWords: ["custom", "forbidden"],
                    },
                }

                const rules = MomentProcessingRulesFactory.createCustom(overrides)
                expect(rules.content.maxDuration).toBe(45)
                expect(rules.content.maxSize).toBe(150 * 1024 * 1024)
                expect(rules.content.allowedFormats).toEqual(["mp4"])
                expect(rules.text.maxHashtags).toBe(15)
                expect(rules.text.maxMentions).toBe(3)
                expect(rules.text.maxDescriptionLength).toBe(750)
                expect(rules.text.forbiddenWords).toContain("custom")
                expect(rules.text.forbiddenWords).toContain("forbidden")
            })

            it("deve manter valores padrão para propriedades não especificadas", () => {
                const overrides: Partial<MomentProcessingRules> = {
                    content: {
                        maxDuration: 45,
                        maxSize: 150 * 1024 * 1024,
                        allowedFormats: ["mp4"],
                        allowedResolutions: [
                            { width: 360, height: 558, quality: MomentQualityEnum.MEDIUM },
                        ],
                    },
                }

                const rules = MomentProcessingRulesFactory.createCustom(overrides)
                expect(rules.text.maxHashtags).toBe(
                    DEFAULT_MOMENT_PROCESSING_RULES.text.maxHashtags,
                )
                expect(rules.processing.retryAttempts).toBe(
                    DEFAULT_MOMENT_PROCESSING_RULES.processing.retryAttempts,
                )
                expect(rules.storage.maxConcurrentUploads).toBe(
                    DEFAULT_MOMENT_PROCESSING_RULES.storage.maxConcurrentUploads,
                )
            })
        })
    })
})
