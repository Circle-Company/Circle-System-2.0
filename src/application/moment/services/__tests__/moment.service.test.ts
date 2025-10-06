import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentStatusEnum, MomentVisibilityEnum } from "../../../../domain/moment"
import { CreateMomentData, MomentService, UpdateMomentData } from "../moment.service"

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
            resolution: { width: 1080, height: 1920, quality: "high" },
            hasAudio: true,
            codec: "h264",
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
            delete: vi.fn(),
            findByOwnerId: vi.fn(),
            findByStatus: vi.fn(),
            findByVisibility: vi.fn(),
            findByHashtag: vi.fn(),
            findByMention: vi.fn(),
            findPublished: vi.fn(),
            findRecent: vi.fn(),
            findPaginated: vi.fn(),
            countByOwnerId: vi.fn(),
            countByStatus: vi.fn(),
            countByVisibility: vi.fn(),
            countPublished: vi.fn(),
            exists: vi.fn(),
            existsByOwnerId: vi.fn(),
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
        it("deve criar um momento com sucesso", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                content: {
                    duration: 30,
                    size: 1024,
                    format: "mp4",
                    width: 1080,
                    height: 1920,
                    hasAudio: true,
                    codec: "h264",
                },
                description: "Test moment",
                hashtags: ["#test"],
                mentions: ["@user"],
            }

            mockMomentRepository.create.mockResolvedValue(mockMoment)
            mockMomentMetricsService.recordView.mockResolvedValue(undefined)

            // Act
            const result = await momentService.createMoment(createData)

            // Assert
            expect(result).toBeDefined()
            expect(mockMomentRepository.create).toHaveBeenCalled()
            expect(mockMomentMetricsService.recordView).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    userId: "user_123",
                }),
            )
        })

        it("deve falhar quando ownerId não é fornecido", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "",
                content: {
                    duration: 30,
                    size: 1024,
                    format: "mp4",
                    width: 1080,
                    height: 1920,
                    hasAudio: true,
                    codec: "h264",
                },
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "ID do proprietário é obrigatório",
            )
        })

        it("deve falhar quando duração é inválida", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                content: {
                    duration: 0,
                    size: 1024,
                    format: "mp4",
                    width: 1080,
                    height: 1920,
                    hasAudio: true,
                    codec: "h264",
                },
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "Duração do conteúdo deve ser maior que zero",
            )
        })

        it("deve falhar quando formato não é fornecido", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                content: {
                    duration: 30,
                    size: 1024,
                    format: "",
                    width: 1080,
                    height: 1920,
                    hasAudio: true,
                    codec: "h264",
                },
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "Formato do conteúdo é obrigatório",
            )
        })

        it("deve falhar quando dimensões são inválidas", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                content: {
                    duration: 30,
                    size: 1024,
                    format: "mp4",
                    width: 0,
                    height: 1920,
                    hasAudio: true,
                    codec: "h264",
                },
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "Dimensões do conteúdo devem ser maiores que zero",
            )
        })

        it("deve falhar quando descrição é muito longa", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                content: {
                    duration: 30,
                    size: 1024,
                    format: "mp4",
                    width: 1080,
                    height: 1920,
                    hasAudio: true,
                    codec: "h264",
                },
                description: "a".repeat(1001),
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "Descrição não pode ter mais de 1000 caracteres",
            )
        })

        it("deve falhar quando há muitas hashtags", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                content: {
                    duration: 30,
                    size: 1024,
                    format: "mp4",
                    width: 1080,
                    height: 1920,
                    hasAudio: true,
                    codec: "h264",
                },
                hashtags: Array(31).fill("#test"),
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "Máximo de 30 hashtags permitidas",
            )
        })

        it("deve falhar quando há muitas menções", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                content: {
                    duration: 30,
                    size: 1024,
                    format: "mp4",
                    width: 1080,
                    height: 1920,
                    hasAudio: true,
                    codec: "h264",
                },
                mentions: Array(51).fill("@user"),
            }

            // Act & Assert
            await expect(momentService.createMoment(createData)).rejects.toThrow(
                "Máximo de 50 menções permitidas",
            )
        })
    })

    describe("getMomentById", () => {
        it("deve retornar um momento existente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.getMomentById("moment_123")

            // Assert
            expect(result).toEqual(mockMoment)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
        })

        it("deve retornar null para momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await momentService.getMomentById("inexistente")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("updateMoment", () => {
        it("deve atualizar um momento existente", async () => {
            // Arrange
            const updateData: UpdateMomentData = {
                description: "Updated description",
                status: MomentStatusEnum.PUBLISHED,
            }

            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.update.mockResolvedValue(mockMoment)
            mockMomentMetricsService.recordView.mockResolvedValue(undefined)

            // Act
            const result = await momentService.updateMoment("moment_123", updateData)

            // Assert
            expect(result).toEqual(mockMoment)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.update).toHaveBeenCalled()
        })

        it("deve falhar ao atualizar momento inexistente", async () => {
            // Arrange
            const updateData: UpdateMomentData = {
                description: "Updated description",
            }

            mockMomentRepository.findById.mockResolvedValue(null)

            // Act & Assert
            await expect(momentService.updateMoment("inexistente", updateData)).rejects.toThrow(
                "Momento com ID inexistente não encontrado",
            )
        })

        it("deve falhar quando descrição é muito longa", async () => {
            // Arrange
            const updateData: UpdateMomentData = {
                description: "a".repeat(1001),
            }

            mockMomentRepository.findById.mockResolvedValue(mockMoment)

            // Act & Assert
            await expect(momentService.updateMoment("moment_123", updateData)).rejects.toThrow(
                "Descrição não pode ter mais de 1000 caracteres",
            )
        })
    })

    describe("deleteMoment", () => {
        it("deve deletar um momento existente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.findById
                .mockResolvedValueOnce(mockMoment)
                .mockResolvedValueOnce(mockMoment)

            // Act
            const result = await momentService.deleteMoment("moment_123")

            // Assert
            expect(result).toBe(true)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
        })

        it("deve falhar ao deletar momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act & Assert
            await expect(momentService.deleteMoment("inexistente")).rejects.toThrow(
                "Momento com ID inexistente não encontrado",
            )
        })
    })

    describe("getMomentsByOwner", () => {
        it("deve retornar momentos do proprietário", async () => {
            // Arrange
            const moments = [mockMoment]
            mockMomentRepository.findByOwnerId.mockResolvedValue(moments)

            // Act
            const result = await momentService.getMomentsByOwner("user_123", {
                limit: 10,
                offset: 0,
            })

            // Assert
            expect(result).toEqual(moments)
            expect(mockMomentRepository.findByOwnerId).toHaveBeenCalledWith("user_123", 10, 0)
        })
    })

    describe("getMomentsByStatus", () => {
        it("deve retornar momentos por status", async () => {
            // Arrange
            const moments = [mockMoment]
            mockMomentRepository.findByStatus.mockResolvedValue(moments)

            // Act
            const result = await momentService.getMomentsByStatus(MomentStatusEnum.PUBLISHED, {
                limit: 10,
                offset: 0,
            })

            // Assert
            expect(result).toEqual(moments)
            expect(mockMomentRepository.findByStatus).toHaveBeenCalledWith(
                MomentStatusEnum.PUBLISHED,
                10,
                0,
            )
        })
    })

    describe("getPublishedMoments", () => {
        it("deve retornar momentos publicados", async () => {
            // Arrange
            const moments = [mockMoment]
            mockMomentRepository.findPublished.mockResolvedValue(moments)

            // Act
            const result = await momentService.getPublishedMoments({
                limit: 10,
                offset: 0,
            })

            // Assert
            expect(result).toEqual(moments)
            expect(mockMomentRepository.findPublished).toHaveBeenCalledWith(10, 0)
        })
    })

    describe("searchMoments", () => {
        it("deve retornar resultados paginados", async () => {
            // Arrange
            const mockResult = {
                moments: [mockMoment],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
            }
            mockMomentRepository.findPaginated.mockResolvedValue(mockResult)

            // Act
            const result = await momentService.searchMoments({
                filters: {},
                limit: 20,
                offset: 0,
            })

            // Assert
            expect(result).toEqual({
                moments: [mockMoment],
                total: 1,
                page: 1,
                limit: 20,
                hasNext: false,
                hasPrev: false,
            })
            expect(mockMomentRepository.findPaginated).toHaveBeenCalledWith(1, 20)
        })
    })

    describe("countMomentsByOwner", () => {
        it("deve retornar contagem de momentos do proprietário", async () => {
            // Arrange
            mockMomentRepository.countByOwnerId.mockResolvedValue(5)

            // Act
            const result = await momentService.countMomentsByOwner("user_123")

            // Assert
            expect(result).toBe(5)
            expect(mockMomentRepository.countByOwnerId).toHaveBeenCalledWith("user_123")
        })
    })

    describe("momentExists", () => {
        it("deve retornar true para momento existente", async () => {
            // Arrange
            mockMomentRepository.exists.mockResolvedValue(true)

            // Act
            const result = await momentService.momentExists("moment_123")

            // Assert
            expect(result).toBe(true)
            expect(mockMomentRepository.exists).toHaveBeenCalledWith("moment_123")
        })

        it("deve retornar false para momento inexistente", async () => {
            // Arrange
            mockMomentRepository.exists.mockResolvedValue(false)

            // Act
            const result = await momentService.momentExists("inexistente")

            // Assert
            expect(result).toBe(false)
        })
    })

    describe("getMomentMetrics", () => {
        it("deve retornar métricas do momento", async () => {
            // Arrange
            const mockMetrics = { id: "metrics_123", momentId: "moment_123" }
            mockMomentMetricsService.getMetrics.mockResolvedValue(mockMetrics)
            mockMomentRepository.findById.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.getMomentMetrics("moment_123")

            // Assert
            expect(result).toEqual(
                expect.objectContaining({
                    momentId: "moment_123",
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    engagementRate: 0,
                    averageWatchTime: 0,
                    completionRate: 0,
                    demographics: expect.any(Object),
                    timeline: expect.any(Array),
                    topHashtags: expect.any(Array),
                    topMentions: expect.any(Array),
                }),
            )
        })

        it("deve falhar quando métricas não estão habilitadas", async () => {
            // Arrange
            const serviceWithoutMetrics = new MomentService(
                mockMomentRepository,
                mockMomentMetricsService,
                {
                    enableMetrics: false,
                },
            )

            // Act & Assert
            await expect(serviceWithoutMetrics.getMomentMetrics("moment_123")).rejects.toThrow(
                "Métricas não estão habilitadas",
            )
        })
    })

    describe("getAggregatedMetrics", () => {
        it("deve retornar métricas agregadas", async () => {
            // Arrange
            const mockAggregated = {
                totalViews: 1000,
                totalLikes: 100,
                totalComments: 50,
                totalRevenue: 500,
                averageEngagement: 0.15,
                averageViralScore: 75,
                averageTrendingScore: 80,
            }
            mockMomentMetricsService.getAggregatedMetrics.mockResolvedValue(mockAggregated)

            // Act
            const result = await momentService.getAggregatedMetrics(["moment_1", "moment_2"])

            // Assert
            expect(result).toEqual(mockAggregated)
            expect(mockMomentMetricsService.getAggregatedMetrics).toHaveBeenCalledWith([
                "moment_1",
                "moment_2",
            ])
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

    describe("hasUserReportedMoment", () => {
        it("deve retornar false por padrão", async () => {
            // Act
            const result = await momentService.hasUserReportedMoment("moment_123", "user_123")

            // Assert
            expect(result).toBe(false)
        })
    })

    describe("createReport", () => {
        it("deve criar denúncia", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.createReport({
                momentId: "moment_123",
                userId: "user_123",
                reason: "Inappropriate content",
            })

            // Assert
            expect(result).toEqual({
                id: expect.any(String),
                momentId: "moment_123",
                userId: "user_123",
                reason: "Inappropriate content",
                status: "pending",
                createdAt: expect.any(Date),
            })
        })
    })

    describe("getLikedMomentsByUser", () => {
        it("deve retornar lista vazia por padrão", async () => {
            // Act
            const result = await momentService.getLikedMomentsByUser("user_123", 20, 0)

            // Assert
            expect(result).toEqual({
                moments: [],
                total: 0,
            })
        })
    })

    describe("getCommentedMomentsByUser", () => {
        it("deve retornar lista vazia por padrão", async () => {
            // Act
            const result = await momentService.getCommentedMomentsByUser("user_123", 20, 0)

            // Assert
            expect(result).toEqual({
                moments: [],
                total: 0,
            })
        })
    })

    describe("getMomentsByVisibility", () => {
        it("deve retornar momentos por visibilidade", async () => {
            // Arrange
            mockMomentRepository.findByVisibility.mockResolvedValue([mockMoment])

            // Act
            const result = await momentService.getMomentsByVisibility(MomentVisibilityEnum.PUBLIC)

            // Assert
            expect(result).toEqual([mockMoment])
            expect(mockMomentRepository.findByVisibility).toHaveBeenCalledWith(
                MomentVisibilityEnum.PUBLIC,
                undefined,
                undefined,
            )
        })
    })

    describe("getMomentsByHashtag", () => {
        it("deve retornar momentos por hashtag", async () => {
            // Arrange
            mockMomentRepository.findByHashtag.mockResolvedValue([mockMoment])

            // Act
            const result = await momentService.getMomentsByHashtag("#test")

            // Assert
            expect(result).toEqual([mockMoment])
            expect(mockMomentRepository.findByHashtag).toHaveBeenCalledWith(
                "#test",
                undefined,
                undefined,
            )
        })
    })

    describe("getMomentsByMention", () => {
        it("deve retornar momentos por menção", async () => {
            // Arrange
            mockMomentRepository.findByMention.mockResolvedValue([mockMoment])

            // Act
            const result = await momentService.getMomentsByMention("@user")

            // Assert
            expect(result).toEqual([mockMoment])
            expect(mockMomentRepository.findByMention).toHaveBeenCalledWith(
                "@user",
                undefined,
                undefined,
            )
        })
    })

    describe("getRecentMoments", () => {
        it("deve retornar momentos recentes", async () => {
            // Arrange
            mockMomentRepository.findRecent.mockResolvedValue([mockMoment])

            // Act
            const result = await momentService.getRecentMoments()

            // Assert
            expect(result).toEqual([mockMoment])
            expect(mockMomentRepository.findRecent).toHaveBeenCalledWith(undefined, undefined)
        })
    })

    describe("countMomentsByStatus", () => {
        it("deve retornar contagem por status", async () => {
            // Arrange
            mockMomentRepository.countByStatus.mockResolvedValue(5)

            // Act
            const result = await momentService.countMomentsByStatus(MomentStatusEnum.PUBLISHED)

            // Assert
            expect(result).toBe(5)
            expect(mockMomentRepository.countByStatus).toHaveBeenCalledWith(
                MomentStatusEnum.PUBLISHED,
            )
        })
    })

    describe("countMomentsByVisibility", () => {
        it("deve retornar contagem por visibilidade", async () => {
            // Arrange
            mockMomentRepository.countByVisibility.mockResolvedValue(10)

            // Act
            const result = await momentService.countMomentsByVisibility(MomentVisibilityEnum.PUBLIC)

            // Assert
            expect(result).toBe(10)
            expect(mockMomentRepository.countByVisibility).toHaveBeenCalledWith(
                MomentVisibilityEnum.PUBLIC,
            )
        })
    })

    describe("countPublishedMoments", () => {
        it("deve retornar contagem de momentos publicados", async () => {
            // Arrange
            mockMomentRepository.countPublished.mockResolvedValue(15)

            // Act
            const result = await momentService.countPublishedMoments()

            // Assert
            expect(result).toBe(15)
            expect(mockMomentRepository.countPublished).toHaveBeenCalled()
        })
    })

    describe("ownerHasMoments", () => {
        it("deve retornar true se proprietário tem momentos", async () => {
            // Arrange
            mockMomentRepository.existsByOwnerId.mockResolvedValue(true)

            // Act
            const result = await momentService.ownerHasMoments("user_123")

            // Assert
            expect(result).toBe(true)
            expect(mockMomentRepository.existsByOwnerId).toHaveBeenCalledWith("user_123")
        })

        it("deve retornar false se proprietário não tem momentos", async () => {
            // Arrange
            mockMomentRepository.existsByOwnerId.mockResolvedValue(false)

            // Act
            const result = await momentService.ownerHasMoments("user_123")

            // Assert
            expect(result).toBe(false)
        })
    })

    describe("getTrendingContent", () => {
        it("deve retornar conteúdo em tendência", async () => {
            // Act
            const result = await momentService.getTrendingContent(10)

            // Assert
            expect(result).toEqual([])
        })

        it("deve falhar quando métricas não estão habilitadas", async () => {
            // Arrange
            const serviceWithoutMetrics = new MomentService(
                mockMomentRepository,
                mockMomentMetricsService,
                {
                    enableMetrics: false,
                },
            )

            // Act & Assert
            await expect(serviceWithoutMetrics.getTrendingContent()).rejects.toThrow(
                "Métricas não estão habilitadas",
            )
        })

        it("deve falhar com limite inválido", async () => {
            // Act & Assert
            await expect(momentService.getTrendingContent(0)).rejects.toThrow(
                "Limite deve estar entre 1 e 100",
            )
            await expect(momentService.getTrendingContent(101)).rejects.toThrow(
                "Limite deve estar entre 1 e 100",
            )
        })
    })

    describe("getViralContent", () => {
        it("deve retornar conteúdo viral", async () => {
            // Act
            const result = await momentService.getViralContent(10)

            // Assert
            expect(result).toEqual([])
        })

        it("deve falhar quando métricas não estão habilitadas", async () => {
            // Arrange
            const serviceWithoutMetrics = new MomentService(
                mockMomentRepository,
                mockMomentMetricsService,
                {
                    enableMetrics: false,
                },
            )

            // Act & Assert
            await expect(serviceWithoutMetrics.getViralContent()).rejects.toThrow(
                "Métricas não estão habilitadas",
            )
        })

        it("deve falhar com limite inválido", async () => {
            // Act & Assert
            await expect(momentService.getViralContent(0)).rejects.toThrow(
                "Limite deve estar entre 1 e 100",
            )
            await expect(momentService.getViralContent(101)).rejects.toThrow(
                "Limite deve estar entre 1 e 100",
            )
        })
    })

    describe("incrementMomentLikes", () => {
        it("deve incrementar likes do momento", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.update.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.incrementMomentLikes("moment_123", "user_123")

            // Assert
            expect(result).toEqual(mockMoment)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
        })

        it("deve retornar null para momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await momentService.incrementMomentLikes("moment_123", "user_123")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("decrementMomentLikes", () => {
        it("deve decrementar likes do momento", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockMomentRepository.update.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.decrementMomentLikes("moment_123", "user_123")

            // Assert
            expect(result).toEqual(mockMoment)
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
        })

        it("deve retornar null para momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await momentService.decrementMomentLikes("moment_123", "user_123")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("createReport", () => {
        it("deve falhar com motivo vazio", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)

            // Act & Assert
            await expect(
                momentService.createReport({
                    momentId: "moment_123",
                    userId: "user_123",
                    reason: "",
                }),
            ).rejects.toThrow("Motivo da denúncia é obrigatório")
        })

        it("deve falhar para momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act & Assert
            await expect(
                momentService.createReport({
                    momentId: "moment_123",
                    userId: "user_123",
                    reason: "Inappropriate content",
                }),
            ).rejects.toThrow("Momento com ID moment_123 não encontrado")
        })
    })

    describe("findByOwnerId", () => {
        it("deve retornar momentos do proprietário com filtros", async () => {
            // Arrange
            mockMomentRepository.findByOwnerId.mockResolvedValue([mockMoment])
            mockMomentRepository.countByOwnerId.mockResolvedValue(1)

            // Act
            const result = await momentService.findByOwnerId("user_123", 20, 0)

            // Assert
            expect(result).toEqual({ moments: [mockMoment], total: 1 })
            expect(mockMomentRepository.findByOwnerId).toHaveBeenCalledWith("user_123", 20, 0)
            expect(mockMomentRepository.countByOwnerId).toHaveBeenCalledWith("user_123")
        })
    })

    describe("getMomentsAnalytics", () => {
        it("deve retornar analytics de momentos", async () => {
            // Act
            const result = await momentService.getMomentsAnalytics({
                userId: "user_123",
                period: "30d",
            })

            // Assert
            expect(result).toEqual(
                expect.objectContaining({
                    overview: expect.any(Object),
                    trends: expect.any(Object),
                    topPerformers: expect.any(Object),
                    demographics: expect.any(Object),
                    contentAnalysis: expect.any(Object),
                    performance: expect.any(Object),
                }),
            )
        })

        it("deve falhar quando métricas não estão habilitadas", async () => {
            // Arrange
            const serviceWithoutMetrics = new MomentService(
                mockMomentRepository,
                mockMomentMetricsService,
                {
                    enableMetrics: false,
                },
            )

            // Act & Assert
            await expect(
                serviceWithoutMetrics.getMomentsAnalytics({ userId: "user_123" }),
            ).rejects.toThrow("Métricas não estão habilitadas")
        })
    })

    describe("getUserReportedMoments", () => {
        it("deve retornar momentos reportados pelo usuário", async () => {
            // Act
            const result = await momentService.getUserReportedMoments("user_123", 20, 0)

            // Assert
            expect(result).toEqual({ reportedMoments: [], total: 0 })
        })

        it("deve retornar lista vazia para usuário inválido", async () => {
            // Act
            const result = await momentService.getUserReportedMoments("", 20, 0)

            // Assert
            expect(result).toEqual({ reportedMoments: [], total: 0 })
        })
    })

    describe("getUserMomentReports", () => {
        it("deve retornar reports dos momentos do usuário", async () => {
            // Act
            const result = await momentService.getUserMomentReports("user_123", 20, 0)

            // Assert
            expect(result).toEqual({ momentReports: [], total: 0 })
        })

        it("deve retornar lista vazia para usuário inválido", async () => {
            // Act
            const result = await momentService.getUserMomentReports("", 20, 0)

            // Assert
            expect(result).toEqual({ momentReports: [], total: 0 })
        })
    })

    describe("getMomentReports", () => {
        it("deve retornar reports do momento", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.getMomentReports("moment_123", 20, 0)

            // Assert
            expect(result).toEqual({ reports: [], total: 0 })
            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
        })

        it("deve falhar para momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act & Assert
            await expect(momentService.getMomentReports("moment_123", 20, 0)).rejects.toThrow(
                "Momento com ID moment_123 não encontrado",
            )
        })

        it("deve retornar lista vazia para momento inválido", async () => {
            // Act
            const result = await momentService.getMomentReports("", 20, 0)

            // Assert
            expect(result).toEqual({ reports: [], total: 0 })
        })
    })

    describe("getMomentMetrics", () => {
        it("deve falhar para momento inexistente", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act & Assert
            await expect(momentService.getMomentMetrics("moment_123")).rejects.toThrow(
                "Momento com ID moment_123 não encontrado",
            )
        })

        it("deve retornar métricas com opções", async () => {
            // Arrange
            mockMomentRepository.findById.mockResolvedValue(mockMoment)

            // Act
            const result = await momentService.getMomentMetrics("moment_123", {
                period: "30d",
                startDate: new Date("2023-01-01"),
                endDate: new Date("2023-01-31"),
            })

            // Assert
            expect(result).toEqual(
                expect.objectContaining({
                    momentId: "moment_123",
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    engagementRate: 0,
                    averageWatchTime: 0,
                    completionRate: 0,
                    demographics: expect.any(Object),
                    timeline: expect.any(Array),
                    topHashtags: expect.any(Array),
                    topMentions: expect.any(Array),
                }),
            )
        })
    })

    describe("searchMoments", () => {
        it("deve falhar com limite inválido", async () => {
            // Act & Assert
            await expect(momentService.searchMoments({ limit: 0 })).rejects.toThrow(
                "Limite deve estar entre 1 e 100",
            )
            await expect(momentService.searchMoments({ limit: 101 })).rejects.toThrow(
                "Limite deve estar entre 1 e 100",
            )
        })

        it("deve falhar com offset negativo", async () => {
            // Act & Assert
            await expect(momentService.searchMoments({ offset: -1 })).rejects.toThrow(
                "Offset não pode ser negativo",
            )
        })

        it("deve retornar resultados com filtros", async () => {
            // Arrange
            mockMomentRepository.findPaginated.mockResolvedValue({
                moments: [mockMoment],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
            })

            // Act
            const result = await momentService.searchMoments({
                filters: { status: "PUBLISHED" },
                limit: 20,
                offset: 0,
                sortBy: "createdAt",
                sortOrder: "desc",
            })

            // Assert
            expect(result).toEqual({
                moments: [mockMoment],
                total: 1,
                page: 1,
                limit: 20,
                hasNext: false,
                hasPrev: false,
            })
        })
    })
})
