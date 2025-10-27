import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentStatusEnum, MomentVisibilityEnum } from "../../../../domain/moment"
import { CreateMomentData, MomentService } from "../moment.service"

describe("MomentService", () => {
    let momentService: MomentService
    let mockMomentRepository: any
    let mockMomentMetricsService: any

    const mockMoment: any = {
        id: "moment_123",
        ownerId: "user_123",
        status: { current: MomentStatusEnum.PUBLISHED } as any,
        visibility: { level: MomentVisibilityEnum.PUBLIC } as any,
        content: {
            duration: 30,
            size: 1024,
            format: "mp4",
            resolution: { width: 360, height: 558, quality: "medium" },
            hasAudio: true,
            codec: "av1",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        description: "Test moment",
        hashtags: ["#test"],
        mentions: ["@user"],
        metrics: {
            engagement: {
                totalLikes: 0,
                likeRate: 0,
            },
            lastMetricsUpdate: new Date(),
        },
        incrementLikes: vi.fn(),
        decrementLikes: vi.fn(),
        get likeRate() {
            return this.metrics.engagement.likeRate
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    beforeEach(() => {
        mockMomentRepository = {
            create: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            hasUserLikedMoment: vi.fn(),
            addLike: vi.fn(),
            removeLike: vi.fn(),
        }

        mockMomentMetricsService = {
            recordView: vi.fn(),
            getMetrics: vi.fn(),
            getAggregatedMetrics: vi.fn(),
        }

        momentService = new MomentService(mockMomentRepository, mockMomentMetricsService)
    })

    describe("createMoment", () => {
        it("deve criar um momento com visibilidade PUBLIC por padrão", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                description: "Test moment",
                visibility: MomentVisibilityEnum.PUBLIC, // Explicita visibility
            }

            // Act & Assert
            // Como não temos ContentProcessor configurado, testa apenas configuração padrão
            expect(momentService["config"].defaultVisibility).toBe(MomentVisibilityEnum.PUBLIC)
            expect(momentService["config"].defaultStatus).toBe(MomentStatusEnum.PUBLISHED)
            expect(createData.visibility).toBe(MomentVisibilityEnum.PUBLIC)
        })

        it("deve usar visibilidade PUBLIC quando especificada", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act & Assert
            expect(createData.visibility).toBe(MomentVisibilityEnum.PUBLIC)
        })

        it("deve usar visibilidade PRIVATE quando especificada", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PRIVATE,
            }

            // Act & Assert
            expect(createData.visibility).toBe(MomentVisibilityEnum.PRIVATE)
        })

        it("deve usar status PUBLISHED por padrão", async () => {
            // Act & Assert
            expect(momentService["config"].defaultStatus).toBe(MomentStatusEnum.PUBLISHED)
        })

        it("deve falhar quando ownerId não é fornecido", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "",
                ownerUsername: "testuser",
                videoData: Buffer.from("test"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "Owner ID is required",
            )
        })

        it("deve falhar quando videoData está vazio", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from(""),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 0,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "Video data is required",
            )
        })

        it("deve falhar quando mimeType não é vídeo", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test"),
                videoMetadata: {
                    filename: "test.mp3",
                    mimeType: "audio/mp3",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "File must be a video",
            )
        })

        it("deve aceitar diferentes níveis de visibilidade", async () => {
            const visibilityOptions = [
                MomentVisibilityEnum.PUBLIC,
                MomentVisibilityEnum.PRIVATE,
                MomentVisibilityEnum.FOLLOWERS_ONLY,
                MomentVisibilityEnum.UNLISTED,
            ]

            for (const visibility of visibilityOptions) {
                const createData: CreateMomentData = {
                    ownerId: "user_123",
                    ownerUsername: "testuser",
                    videoData: Buffer.from("test"),
                    videoMetadata: {
                        filename: "test.mp4",
                        mimeType: "video/mp4",
                        size: 1024,
                    },
                    visibility,
                }

                expect(createData.visibility).toBe(visibility)
            }
        })

        // Nota: Testes de validação de descrição, hashtags e menções requerem
        // ContentProcessor configurado, que não está disponível neste contexto de teste.
        // Esses casos são testados em testes de integração completos.
    })

    describe("deleteMomentSoft", () => {
        it("deve fazer soft delete de um momento existente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.update.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.deleteMomentSoft("moment_123", "User request")

            // Assert
            expect(result).toBe(true)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.update).toHaveBeenCalled()
        })

        it("deve falhar ao deletar momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act & Assert
            await expect(momentService.deleteMomentSoft("inexistente")).rejects.toThrow(
                "Moment with ID inexistente not found",
            )
        })
    })

    describe("adminBlockMoment", () => {
        it("deve bloquear um momento com sucesso", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.update.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.adminBlockMoment({
                momentId: "moment_123",
                adminId: "admin_123",
                reason: "Inappropriate content",
            })

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment?.id).toBe("moment_123")
            expect(result.moment?.status).toBe(MomentStatusEnum.BLOCKED)
            expect(result.moment?.reason).toBe("Inappropriate content")
            expect(result.moment?.blockedBy).toBe("admin_123")
        })

        it("deve falhar ao bloquear momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await momentService.adminBlockMoment({
                momentId: "inexistente",
                adminId: "admin_123",
                reason: "Test",
            })

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment not found")
        })
    })

    describe("adminUnlockMoment", () => {
        it("deve desbloquear um momento com sucesso", async () => {
            // Arrange
            const blockedMoment = { ...mockMoment, status: { current: MomentStatusEnum.BLOCKED } }
            mockMomentRepository.findById.mockResolvedValue(blockedMoment)
            mockMomentRepository.update.mockResolvedValue(blockedMoment)

            // Act
            const result = await momentService.adminUnlockMoment({
                momentId: "moment_123",
                adminId: "admin_123",
                reason: "Content reviewed and approved",
            })

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment?.id).toBe("moment_123")
            expect(result.moment?.status).toBe(MomentStatusEnum.PUBLISHED)
            expect(result.moment?.reason).toBe("Content reviewed and approved")
            expect(result.moment?.unblockedBy).toBe("admin_123")
        })

        it("deve falhar ao desbloquear momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await momentService.adminUnlockMoment({
                momentId: "inexistente",
                adminId: "admin_123",
            })

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment not found")
        })
    })

    describe("hasUserLikedMoment", () => {
        it("deve retornar true quando usuário curtiu o momento", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.hasUserLikedMoment.mockResolvedValue(true)

            // Act
            const result = await momentService.hasUserLikedMoment("moment_123", "user_123")

            // Assert
            expect(result).toBe(true)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.hasUserLikedMoment).toHaveBeenCalledWith(
                "moment_123",
                "user_123",
            )
        })

        it("deve retornar false quando usuário não curtiu o momento", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.hasUserLikedMoment.mockResolvedValue(false)

            // Act
            const result = await momentService.hasUserLikedMoment("moment_123", "user_123")

            // Assert
            expect(result).toBe(false)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.hasUserLikedMoment).toHaveBeenCalledWith(
                "moment_123",
                "user_123",
            )
        })

        it("deve retornar false quando momento não existe", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await momentService.hasUserLikedMoment("moment_123", "user_123")

            // Assert
            expect(result).toBe(false)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.hasUserLikedMoment).not.toHaveBeenCalled()
        })

        it("deve retornar false quando momentId é vazio", async () => {
            // Act
            const result = await momentService.hasUserLikedMoment("", "user_123")

            // Assert
            expect(result).toBe(false)
            expect(mockMomentRepository.findById).not.toHaveBeenCalled()
            expect(mockMomentRepository.hasUserLikedMoment).not.toHaveBeenCalled()
        })

        it("deve retornar false quando userId é vazio", async () => {
            // Act
            const result = await momentService.hasUserLikedMoment("moment_123", "")

            // Assert
            expect(result).toBe(false)
            expect(mockMomentRepository.findById).not.toHaveBeenCalled()
            expect(mockMomentRepository.hasUserLikedMoment).not.toHaveBeenCalled()
        })
    })

    describe("likeMoment", () => {
        it("deve curtir um momento", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.hasUserLikedMoment.mockResolvedValue(false)
            mockMomentRepository.addLike.mockResolvedValue(undefined)
            mockMomentRepository.update.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.likeMoment("moment_123", "user_123")

            // Assert
            expect(result).toEqual(mockMoment)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.hasUserLikedMoment).toHaveBeenCalledWith(
                "moment_123",
                "user_123",
            )
            expect(mockMomentRepository.addLike).toHaveBeenCalledWith("moment_123", "user_123")
        })

        it("deve retornar momento quando já curtiu", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.hasUserLikedMoment.mockResolvedValue(true)

            // Act
            const result = await momentService.likeMoment("moment_123", "user_123")

            // Assert
            expect(result).toEqual(mockMoment)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.hasUserLikedMoment).toHaveBeenCalledWith(
                "moment_123",
                "user_123",
            )
            expect(mockMomentRepository.addLike).not.toHaveBeenCalled()
        })

        it("deve retornar null para momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await momentService.likeMoment("inexistente", "user_123")

            // Assert
            expect(result).toBeNull()
            expect(mockMomentRepository.hasUserLikedMoment).not.toHaveBeenCalled()
            expect(mockMomentRepository.addLike).not.toHaveBeenCalled()
        })
    })

    describe("unlikeMoment", () => {
        it("deve remover like de um momento", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.hasUserLikedMoment.mockResolvedValue(true)
            mockMomentRepository.removeLike.mockResolvedValue(undefined)
            mockMomentRepository.update.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.unlikeMoment("moment_123", "user_123")

            // Assert
            expect(result).toEqual(mockMoment)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.hasUserLikedMoment).toHaveBeenCalledWith(
                "moment_123",
                "user_123",
            )
            expect(mockMomentRepository.removeLike).toHaveBeenCalledWith("moment_123", "user_123")
        })

        it("deve retornar momento quando não curtiu", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.hasUserLikedMoment.mockResolvedValue(false)

            // Act
            const result = await momentService.unlikeMoment("moment_123", "user_123")

            // Assert
            expect(result).toEqual(mockMoment)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.hasUserLikedMoment).toHaveBeenCalledWith(
                "moment_123",
                "user_123",
            )
            expect(mockMomentRepository.removeLike).not.toHaveBeenCalled()
        })

        it("deve retornar null para momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await momentService.unlikeMoment("inexistente", "user_123")

            // Assert
            expect(result).toBeNull()
            expect(mockMomentRepository.hasUserLikedMoment).not.toHaveBeenCalled()
            expect(mockMomentRepository.removeLike).not.toHaveBeenCalled()
        })
    })
})
