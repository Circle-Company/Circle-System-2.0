import { beforeEach, describe, expect, it } from "vitest"
import {
    ContentTypeEnum,
    ModerationFlagEnum,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "../../../domain/moderation/moderation.type"

import { Moderation } from "../../../domain/moderation/moderation.entity"

describe("ContentDetector (Algoritmos Matemáticos)", () => {
    let moderation: Moderation

    beforeEach(() => {
        moderation = Moderation.create({
            contentId: "content-1",
            contentOwnerId: "user-1",
            detectedContentType: ContentTypeEnum.UNKNOWN,
            confidence: 0,
            isHumanContent: false,
        })
    })

    describe("processImageContent", () => {
        it("deve detectar imagem de boa qualidade", async () => {
            // Arrange - Simular dados de imagem JPEG válida
            const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
            const imageData = Buffer.concat([
                jpegHeader,
                Buffer.alloc(50000, 128), // 50KB de dados com boa variação
            ])

            // Act
            await moderation.processImageContent(imageData)

            // Assert
            expect(moderation.detectedContentType).toBe(ContentTypeEnum.HUMAN)
            expect(moderation.isHumanContent).toBe(true)
            expect(moderation.flags).toHaveLength(0)
            expect(moderation.confidence).toBeGreaterThan(50)
        })

        it("deve detectar imagem de baixa qualidade", async () => {
            // Arrange - Imagem muito pequena
            const smallImage = Buffer.from([0xff, 0xd8, 0xff])

            // Act
            await moderation.processImageContent(smallImage)

            // Assert
            expect(moderation.flags.length).toBeGreaterThan(0)
            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ),
            ).toBe(true)
        })

        it("deve detectar formato de imagem inválido", async () => {
            // Arrange - Dados que não são uma imagem válida
            const invalidData = Buffer.from("não é uma imagem")

            // Act
            await moderation.processImageContent(invalidData)

            // Assert
            expect(
                moderation.flags.some(
                    (flag) =>
                        flag.type === ModerationFlagEnum.LOW_QUALITY_CONTENT &&
                        flag.description.includes("Formato de imagem inválido"),
                ),
            ).toBe(true)
            expect(moderation.flags[0].severity).toBe(ModerationSeverityEnum.HIGH)
        })

        it("deve detectar conteúdo sintético com alta repetição", async () => {
            // Arrange - Dados com padrão repetitivo (simula conteúdo gerado)
            const repetitiveData = Buffer.alloc(10000, 0x80) // Todos os bytes iguais

            // Act
            await moderation.processImageContent(repetitiveData)

            // Assert
            expect(moderation.detectedContentType).toBe(ContentTypeEnum.AI_GENERATED)
            expect(
                moderation.flags.some((flag) => flag.description.includes("conteúdo sintético")),
            ).toBe(true)
        })
    })

    describe("processTextContent", () => {
        it("deve detectar spam em texto promocional", async () => {
            // Arrange
            const spamText = "Click here! Buy now! Limited time offer! Act now!"

            // Act
            await moderation.processTextContent(spamText)

            // Assert
            expect(moderation.detectedContentType).toBe(ContentTypeEnum.SPAM)
            expect(
                moderation.flags.some((flag) => flag.type === ModerationFlagEnum.SPAM_CONTENT),
            ).toBe(true)
            expect(moderation.flags[0].severity).toBe(ModerationSeverityEnum.HIGH)
        })

        it("deve detectar repetição excessiva de palavras", async () => {
            // Arrange
            const repetitiveText = "spam spam spam spam spam spam spam"

            // Act
            await moderation.processTextContent(repetitiveText)

            // Assert
            expect(
                moderation.flags.some((flag) => flag.description.includes("Repetição excessiva")),
            ).toBe(true)
        })

        it("deve detectar excesso de caracteres especiais", async () => {
            // Arrange
            const specialCharText = "!!!@@@###$$$%%%^^^&&&***((()))"

            // Act
            await moderation.processTextContent(specialCharText)

            // Assert
            expect(
                moderation.flags.some((flag) =>
                    flag.description.includes("Excesso de caracteres especiais"),
                ),
            ).toBe(true)
        })

        it("deve detectar excesso de hashtags", async () => {
            // Arrange
            const hashtagText =
                "#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11"

            // Act
            await moderation.processTextContent(hashtagText)

            // Assert
            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.EXCESSIVE_HASHTAGS,
                ),
            ).toBe(true)
        })

        it("deve detectar excesso de menções", async () => {
            // Arrange
            const mentionText =
                "@user1 @user2 @user3 @user4 @user5 @user6 @user7 @user8 @user9 @user10 @user11 @user12 @user13 @user14 @user15 @user16 @user17 @user18 @user19 @user20 @user21"

            // Act
            await moderation.processTextContent(mentionText)

            // Assert
            expect(
                moderation.flags.some(
                    (flag) => flag.type === ModerationFlagEnum.EXCESSIVE_MENTIONS,
                ),
            ).toBe(true)
        })

        it("deve detectar excesso de URLs", async () => {
            // Arrange
            const urlText =
                "https://site1.com https://site2.com https://site3.com https://site4.com https://site5.com https://site6.com"

            // Act
            await moderation.processTextContent(urlText)

            // Assert
            expect(
                moderation.flags.some((flag) => flag.type === ModerationFlagEnum.EXCESSIVE_URLS),
            ).toBe(true)
        })

        it("deve detectar texto muito longo sem links", async () => {
            // Arrange
            const longText =
                "Este é um texto muito longo que não contém nenhum link mas tem mais de 100 caracteres para testar a detecção de padrões suspeitos no sistema de moderação de conteúdo"

            // Act
            await moderation.processTextContent(longText)

            // Assert
            expect(
                moderation.flags.some(
                    (flag) =>
                        flag.type === ModerationFlagEnum.SUSPICIOUS_PATTERNS &&
                        flag.description.includes("Texto longo sem links"),
                ),
            ).toBe(true)
        })

        it("deve detectar repetição excessiva de caracteres", async () => {
            // Arrange
            const repeatedCharsText = "Olá!!!!!! Como você está???????"

            // Act
            await moderation.processTextContent(repeatedCharsText)

            // Assert
            expect(
                moderation.flags.some((flag) =>
                    flag.description.includes("Repetição excessiva de caracteres"),
                ),
            ).toBe(true)
        })

        it("deve detectar excesso de maiúsculas", async () => {
            // Arrange
            const uppercaseText = "OLÁ COMO VOCÊ ESTÁ HOJE? TUDO BEM COM VOCÊ?"

            // Act
            await moderation.processTextContent(uppercaseText)

            // Assert
            expect(
                moderation.flags.some((flag) => flag.description.includes("Excesso de maiúsculas")),
            ).toBe(true)
        })

        it("deve aprovar texto de boa qualidade", async () => {
            // Arrange
            const goodText = "Olá! Como você está hoje? Espero que esteja bem."

            // Act
            await moderation.processTextContent(goodText)

            // Assert
            expect(moderation.detectedContentType).toBe(ContentTypeEnum.HUMAN)
            expect(moderation.flags.length).toBe(0)
        })
    })

    describe("processAudioContent", () => {
        it("deve detectar áudio de boa qualidade", async () => {
            // Arrange - Simular dados de áudio MP3 válido
            const mp3Header = Buffer.from([0xff, 0xfb, 0x90, 0x00])
            const audioData = Buffer.concat([
                mp3Header,
                Buffer.alloc(100000, 0x80), // 100KB de dados de áudio
            ])

            // Act
            await moderation.processAudioContent(audioData)

            // Assert
            expect(moderation.detectedContentType).toBe(ContentTypeEnum.HUMAN)
            expect(moderation.isHumanContent).toBe(true)
        })

        it("deve detectar formato de áudio inválido", async () => {
            // Arrange - Dados que não são áudio válido
            const invalidAudio = Buffer.from("não é áudio")

            // Act
            await moderation.processAudioContent(invalidAudio)

            // Assert
            expect(
                moderation.flags.some(
                    (flag) =>
                        flag.type === ModerationFlagEnum.LOW_QUALITY_AUDIO &&
                        flag.description.includes("Formato de áudio inválido"),
                ),
            ).toBe(true)
            expect(moderation.flags[0].severity).toBe(ModerationSeverityEnum.HIGH)
        })

        it("deve detectar áudio muito curto", async () => {
            // Arrange - Áudio muito pequeno
            const shortAudio = Buffer.from([0xff, 0xfb])

            // Act
            await moderation.processAudioContent(shortAudio)

            // Assert
            expect(
                moderation.flags.some((flag) => flag.description.includes("Áudio muito curto")),
            ).toBe(true)
        })

        it("deve detectar possível silêncio ou áudio estático", async () => {
            // Arrange - Áudio com pouca variação (todos os bytes iguais)
            const staticAudio = Buffer.alloc(5000, 0x80)

            // Act
            await moderation.processAudioContent(staticAudio)

            // Assert
            expect(
                moderation.flags.some(
                    (flag) =>
                        flag.type === ModerationFlagEnum.NO_AUDIO &&
                        flag.description.includes("silêncio ou áudio estático"),
                ),
            ).toBe(true)
        })
    })

    describe("addFlag", () => {
        it("deve adicionar flag corretamente", () => {
            // Act
            moderation.addFlag(
                ModerationFlagEnum.SPAM_CONTENT,
                ModerationSeverityEnum.HIGH,
                85,
                "Conteúdo spam detectado",
                { source: "test" },
            )

            // Assert
            expect(moderation.flags).toHaveLength(1)
            expect(moderation.flags[0].type).toBe(ModerationFlagEnum.SPAM_CONTENT)
            expect(moderation.flags[0].severity).toBe(ModerationSeverityEnum.HIGH)
            expect(moderation.flags[0].confidence).toBe(85)
            expect(moderation.flags[0].description).toBe("Conteúdo spam detectado")
            expect(moderation.flags[0].metadata.source).toBe("test")
            expect(moderation.flags[0].detectedAt).toBeInstanceOf(Date)
        })

        it("deve atualizar severidade geral quando adicionar flag", () => {
            // Arrange
            expect(moderation.severity).toBe(ModerationSeverityEnum.LOW)

            // Act
            moderation.addFlag(
                ModerationFlagEnum.SPAM_CONTENT,
                ModerationSeverityEnum.HIGH,
                90,
                "Spam detectado",
            )

            // Assert
            expect(moderation.severity).toBe(ModerationSeverityEnum.HIGH)
        })

        it("deve lançar erro ao exceder máximo de flags", () => {
            // Arrange - Adicionar flags até o limite
            for (let i = 0; i < 20; i++) {
                moderation.addFlag(
                    ModerationFlagEnum.SPAM_CONTENT,
                    ModerationSeverityEnum.LOW,
                    50,
                    `Flag ${i}`,
                )
            }

            // Act & Assert
            expect(() => {
                moderation.addFlag(
                    ModerationFlagEnum.SPAM_CONTENT,
                    ModerationSeverityEnum.LOW,
                    50,
                    "Flag 21",
                )
            }).toThrow("Máximo 20 flags permitidas")
        })
    })

    describe("blocking operations", () => {
        it("deve bloquear conteúdo", () => {
            // Act
            moderation.block()

            // Assert
            expect(moderation.isBlocked).toBe(true)
            expect(moderation.status).toBe(ModerationStatusEnum.REJECTED)
            expect(moderation.moderatedAt).toBeInstanceOf(Date)
        })

        it("deve desbloquear conteúdo", () => {
            // Arrange
            moderation.block()

            // Act
            moderation.unblock()

            // Assert
            expect(moderation.isBlocked).toBe(false)
            expect(moderation.status).toBe(ModerationStatusEnum.APPROVED)
        })

        it("deve lançar erro ao tentar desbloquear conteúdo não bloqueado", () => {
            // Act & Assert
            expect(() => moderation.unblock()).toThrow("Conteúdo não está bloqueado")
        })

        it("deve ocultar conteúdo", () => {
            // Act
            moderation.hide()

            // Assert
            expect(moderation.isHidden).toBe(true)
            expect(moderation.moderatedAt).toBeInstanceOf(Date)
        })

        it("deve mostrar conteúdo", () => {
            // Arrange
            moderation.hide()

            // Act
            moderation.show()

            // Assert
            expect(moderation.isHidden).toBe(false)
        })

        it("deve aprovar conteúdo", () => {
            // Act
            moderation.approve()

            // Assert
            expect(moderation.status).toBe(ModerationStatusEnum.APPROVED)
            expect(moderation.isBlocked).toBe(false)
            expect(moderation.isHidden).toBe(false)
        })

        it("deve rejeitar conteúdo", () => {
            // Act
            moderation.reject()

            // Assert
            expect(moderation.status).toBe(ModerationStatusEnum.REJECTED)
            expect(moderation.isBlocked).toBe(true)
        })

        it("deve marcar como flag", () => {
            // Act
            moderation.flag()

            // Assert
            expect(moderation.status).toBe(ModerationStatusEnum.FLAGGED)
        })
    })

    describe("validation", () => {
        it("deve validar criação de moderação com dados válidos", () => {
            // Act & Assert - Não deve lançar erro
            expect(() => {
                Moderation.create({
                    contentId: "content-123",
                    contentOwnerId: "user-456",
                    detectedContentType: ContentTypeEnum.HUMAN,
                    confidence: 75,
                    isHumanContent: true,
                })
            }).not.toThrow()
        })

        it("deve lançar erro ao criar moderação sem contentId", () => {
            // Act & Assert
            expect(() => {
                Moderation.create({
                    contentId: "",
                    contentOwnerId: "user-456",
                    detectedContentType: ContentTypeEnum.HUMAN,
                    confidence: 75,
                    isHumanContent: true,
                })
            }).toThrow("Content ID é obrigatório")
        })

        it("deve lançar erro ao criar moderação sem contentOwnerId", () => {
            // Act & Assert
            expect(() => {
                Moderation.create({
                    contentId: "content-123",
                    contentOwnerId: "",
                    detectedContentType: ContentTypeEnum.HUMAN,
                    confidence: 75,
                    isHumanContent: true,
                })
            }).toThrow("Content Owner ID é obrigatório")
        })

        it("deve lançar erro com confiança inválida", () => {
            // Act & Assert
            expect(() => {
                Moderation.create({
                    contentId: "content-123",
                    contentOwnerId: "user-456",
                    detectedContentType: ContentTypeEnum.HUMAN,
                    confidence: 150, // Inválido
                    isHumanContent: true,
                })
            }).toThrow("Confiança deve estar entre 0 e 100")
        })
    })

    describe("serialization", () => {
        it("deve converter para entidade corretamente", () => {
            // Arrange
            moderation.addFlag(
                ModerationFlagEnum.SPAM_CONTENT,
                ModerationSeverityEnum.MEDIUM,
                70,
                "Test flag",
            )
            moderation.block()

            // Act
            const entity = moderation.toEntity()

            // Assert
            expect(entity.id).toBe(moderation.id)
            expect(entity.contentId).toBe(moderation.contentId)
            expect(entity.contentOwnerId).toBe(moderation.contentOwnerId)
            expect(entity.flags).toHaveLength(1)
            expect(entity.isBlocked).toBe(true)
            expect(entity.status).toBe(ModerationStatusEnum.REJECTED)
        })

        it("deve criar instância a partir de entidade", () => {
            // Arrange
            const entity = moderation.toEntity()

            // Act
            const newModeration = Moderation.fromEntity(entity)

            // Assert
            expect(newModeration.id).toBe(entity.id)
            expect(newModeration.contentId).toBe(entity.contentId)
            expect(newModeration.contentOwnerId).toBe(entity.contentOwnerId)
        })
    })
})
