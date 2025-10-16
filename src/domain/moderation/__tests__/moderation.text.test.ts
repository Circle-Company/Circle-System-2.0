/**
 * Testes para moderação de conteúdo de texto
 * Simula diferentes cenários de moderação usando algoritmos matemáticos
 */

import { beforeEach, describe, expect, it } from "vitest"
import {
    ContentTypeEnum,
    ModerationFlagEnum,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "../moderation.type"

import { Moderation } from "../moderation.entity"
import { ModerationRules } from "../moderation.rules"

describe("Moderação de Texto", () => {
    let moderation: Moderation

    beforeEach(() => {
        moderation = Moderation.create({
            contentId: "test-content-123",
            contentOwnerId: "user-456",
        })
    })

    describe("Detecção de Spam", () => {
        it("deve detectar spam com padrões conhecidos", async () => {
            const spamText = "Click here to buy now! Limited time offer! Free money guaranteed!"

            await moderation.processTextContent(spamText)

            expect(moderation.detectedContentType).toBe(ContentTypeEnum.SPAM)
            expect(
                moderation.flags.some((flag) => flag.type === ModerationFlagEnum.SPAM_CONTENT),
            ).toBe(true)
            expect(moderation.status).toBe(ModerationStatusEnum.REJECTED)
            expect(moderation.isBlocked).toBe(true)
        })

        it("deve detectar spam por repetição excessiva", async () => {
            const repetitiveText =
                "buy buy buy buy buy buy buy buy buy buy buy buy buy buy buy buy buy buy buy buy"

            await moderation.processTextContent(repetitiveText)

            expect(
                moderation.flags.some((flag) => flag.type === ModerationFlagEnum.SPAM_CONTENT),
            ).toBe(true)
            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.REPETITIVE_CONTENT,
                ),
            ).toBe(true)
        })

        it("deve detectar spam por caracteres especiais excessivos", async () => {
            const specialCharText = "!!!@@@###$$$%%%^^^&&&***(((!!!@@@###$$$%%%"

            await moderation.processTextContent(specialCharText)

            expect(
                moderation.flags.some((flag) => flag.type === ModerationFlagEnum.SPAM_CONTENT),
            ).toBe(true)
        })

        it("não deve detectar spam em texto normal", async () => {
            const normalText = "Olá! Como você está hoje? Espero que tenha um bom dia."

            await moderation.processTextContent(normalText)

            expect(moderation.detectedContentType).toBe(ContentTypeEnum.HUMAN)
            expect(
                moderation.flags.some((flag) => flag.type === ModerationFlagEnum.SPAM_CONTENT),
            ).toBe(false)
        })
    })

    describe("Análise de Qualidade de Texto", () => {
        it("deve detectar hashtags excessivas", async () => {
            const hashtagText =
                "Texto com #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 #hashtag7 #hashtag8 #hashtag9 #hashtag10 #hashtag11"

            await moderation.processTextContent(hashtagText)

            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.EXCESSIVE_HASHTAGS,
                ),
            ).toBe(true)
        })

        it("deve detectar menções excessivas", async () => {
            const mentionText =
                "Olá @user1 @user2 @user3 @user4 @user5 @user6 @user7 @user8 @user9 @user10 @user11 @user12 @user13 @user14 @user15 @user16 @user17 @user18 @user19 @user20 @user21"

            await moderation.processTextContent(mentionText)

            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.EXCESSIVE_MENTIONS,
                ),
            ).toBe(true)
        })

        it("deve detectar URLs excessivas", async () => {
            const urlText =
                "Confira estes links: https://site1.com https://site2.com https://site3.com https://site4.com https://site5.com https://site6.com"

            await moderation.processTextContent(urlText)

            expect(
                moderation.flags.some((flag) => flag.type === ModerationFlagEnum.EXCESSIVE_URLS),
            ).toBe(true)
        })

        it("deve detectar texto muito curto", async () => {
            const shortText = "Oi"

            await moderation.processTextContent(shortText)

            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ),
            ).toBe(true)
        })

        it("deve detectar texto muito longo", async () => {
            const longText = "a".repeat(1000)

            await moderation.processTextContent(longText)

            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ),
            ).toBe(true)
        })
    })

    describe("Padrões Suspeitos", () => {
        it("deve detectar texto longo sem links", async () => {
            const longTextNoLinks =
                "Este é um texto muito longo que não contém nenhum link ou referência externa. " +
                "Continuando o texto para atingir o limite mínimo de caracteres. ".repeat(10)

            await moderation.processTextContent(longTextNoLinks)

            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.SUSPICIOUS_PATTERNS,
                ),
            ).toBe(true)
        })

        it("deve detectar repetição excessiva de caracteres", async () => {
            const repeatedChars =
                "Este texto tem muitas letras repetidas: aaaaaaaa bbbbbbbb cccccccc"

            await moderation.processTextContent(repeatedChars)

            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.SUSPICIOUS_PATTERNS,
                ),
            ).toBe(true)
        })

        it("deve detectar maiúsculas excessivas", async () => {
            const uppercaseText =
                "ESTE TEXTO ESTÁ TODOM EM MAIÚSCULAS E PODE SER CONSIDERADO SUSPEITO"

            await moderation.processTextContent(uppercaseText)

            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.SUSPICIOUS_PATTERNS,
                ),
            ).toBe(true)
        })
    })

    describe("Cenários Complexos", () => {
        it("deve processar texto com múltiplos problemas", async () => {
            const complexText =
                "BUY NOW!!! #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 #hashtag7 #hashtag8 #hashtag9 #hashtag10 #hashtag11 @user1 @user2 @user3 @user4 @user5 @user6 @user7 @user8 @user9 @user10 @user11 @user12 @user13 @user14 @user15 @user16 @user17 @user18 @user19 @user20 @user21 https://spam1.com https://spam2.com https://spam3.com https://spam4.com https://spam5.com https://spam6.com"

            await moderation.processTextContent(complexText)

            expect(
                moderation.flags.some((flag) => flag.type === ModerationFlagEnum.SPAM_CONTENT),
            ).toBe(true)
            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.EXCESSIVE_HASHTAGS,
                ),
            ).toBe(true)
            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.EXCESSIVE_MENTIONS,
                ),
            ).toBe(true)
            expect(
                moderation.flags.some((flag) => flag.type === ModerationFlagEnum.EXCESSIVE_URLS),
            ).toBe(true)
            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.SUSPICIOUS_PATTERNS,
                ),
            ).toBe(true)

            expect(moderation.status).toBe(ModerationStatusEnum.REJECTED)
            expect(moderation.isBlocked).toBe(true)
        })

        it("deve calcular confiança corretamente", async () => {
            const spamText = "Click here to buy now! Limited time offer!"

            await moderation.processTextContent(spamText)

            expect(moderation.confidence).toBeGreaterThan(0)
            expect(moderation.confidence).toBeLessThanOrEqual(100)
        })

        it("deve calcular severidade baseada nas flags", async () => {
            const highSeverityText = "BUY NOW!!! Click here! Limited time! Free money! Guaranteed!"

            await moderation.processTextContent(highSeverityText)

            const highSeverityFlags = moderation.flags.filter(
                (flag) => flag.severity === ModerationSeverityEnum.HIGH,
            )
            expect(highSeverityFlags.length).toBeGreaterThan(0)
        })
    })

    describe("Validação de Regras", () => {
        it("deve usar os pesos corretos das regras centralizadas", async () => {
            const spamText = "buy now"

            await moderation.processTextContent(spamText)

            // Verifica se as regras estão sendo aplicadas
            expect(ModerationRules.SPAM_DETECTION.PATTERN_MATCH_WEIGHT).toBe(20)
            expect(ModerationRules.SPAM_DETECTION.SPAM_THRESHOLD_MEDIUM).toBe(50)
            expect(ModerationRules.QUALITY_THRESHOLDS.MAX_HASHTAGS).toBe(10)
        })

        it("deve respeitar os limiares de qualidade", async () => {
            const qualityText = "Texto normal com qualidade adequada"

            await moderation.processTextContent(qualityText)

            expect(moderation.confidence).toBeGreaterThanOrEqual(
                ModerationRules.VALIDATION.MIN_CONFIDENCE,
            )
            expect(moderation.confidence).toBeLessThanOrEqual(
                ModerationRules.VALIDATION.MAX_CONFIDENCE,
            )
        })
    })

    describe("Tratamento de Erros", () => {
        it("deve lidar com texto vazio", async () => {
            await moderation.processTextContent("")

            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ),
            ).toBe(true)
        })

        it("deve lidar com texto apenas com espaços", async () => {
            await moderation.processTextContent("   \n\t   ")

            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ),
            ).toBe(true)
        })

        it("deve calcular tempo de processamento", async () => {
            const startTime = Date.now()

            await moderation.processTextContent(
                "Texto de teste para verificar tempo de processamento",
            )

            expect(moderation.processingTime).toBeGreaterThan(0)
            expect(moderation.processingTime).toBeLessThan(
                ModerationRules.VALIDATION.MAX_PROCESSING_TIME,
            )
        })
    })
})
