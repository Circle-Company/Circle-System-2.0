import {
    CommentMomentUseCase,
    CreateMomentUseCase,
    DeleteMomentCommentUseCase,
    DeleteMomentUseCase,
    EditMomentCommentUseCase,
    GetCommentedMomentsUseCase,
    GetLikedMomentsUseCase,
    GetMomentCommentsUseCase,
    GetMomentReportsUseCase,
    GetMomentUseCase,
    GetUserMomentReportsUseCase,
    GetUserMomentsUseCase,
    GetUserReportedMomentsUseCase,
    LikeMomentUseCase,
    ListMomentsUseCase,
    PublishMomentUseCase,
    ReportMomentUseCase,
    SearchMomentsUseCase,
    UnlikeMomentUseCase,
} from "@/application/moment/use.cases"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MomentController } from "../moment.controller"

// Mock dos use cases
const mockCreateMomentUseCase = {
    execute: vi.fn(),
} as unknown as CreateMomentUseCase

const mockGetMomentUseCase = {
    execute: vi.fn(),
} as unknown as GetMomentUseCase

const mockDeleteMomentUseCase = {
    execute: vi.fn(),
} as unknown as DeleteMomentUseCase

const mockPublishMomentUseCase = {
    execute: vi.fn(),
} as unknown as PublishMomentUseCase

const mockListMomentsUseCase = {
    execute: vi.fn(),
} as unknown as ListMomentsUseCase

const mockGetUserMomentsUseCase = {
    execute: vi.fn(),
} as unknown as GetUserMomentsUseCase

const mockSearchMomentsUseCase = {
    execute: vi.fn(),
} as unknown as SearchMomentsUseCase

const mockLikeMomentUseCase = {
    execute: vi.fn(),
} as unknown as LikeMomentUseCase

const mockUnlikeMomentUseCase = {
    execute: vi.fn(),
} as unknown as UnlikeMomentUseCase

const mockGetLikedMomentsUseCase = {
    execute: vi.fn(),
} as unknown as GetLikedMomentsUseCase

const mockCommentMomentUseCase = {
    execute: vi.fn(),
} as unknown as CommentMomentUseCase

const mockGetMomentCommentsUseCase = {
    execute: vi.fn(),
} as unknown as GetMomentCommentsUseCase

const mockEditMomentCommentUseCase = {
    execute: vi.fn(),
} as unknown as EditMomentCommentUseCase

const mockDeleteMomentCommentUseCase = {
    execute: vi.fn(),
} as unknown as DeleteMomentCommentUseCase

const mockGetCommentedMomentsUseCase = {
    execute: vi.fn(),
} as unknown as GetCommentedMomentsUseCase

const mockReportMomentUseCase = {
    execute: vi.fn(),
} as unknown as ReportMomentUseCase

const mockGetMomentReportsUseCase = {
    execute: vi.fn(),
} as unknown as GetMomentReportsUseCase

const mockGetUserMomentReportsUseCase = {
    execute: vi.fn(),
} as unknown as GetUserMomentReportsUseCase

const mockGetUserReportedMomentsUseCase = {
    execute: vi.fn(),
} as unknown as GetUserReportedMomentsUseCase

describe("MomentController", () => {
    let controller: MomentController

    const mockMoment = {
        id: "moment_123",
        ownerId: "user_123",
        description: "Test moment",
        hashtags: ["#test"],
        mentions: ["@user"],
        status: {
            current: "published",
            previous: null,
            reason: null,
            changedBy: "user_123",
            changedAt: new Date(),
        },
        visibility: {
            level: "public",
            allowedUsers: [],
            blockedUsers: [],
            ageRestriction: false,
            contentWarning: false,
        },
        metrics: {
            views: {
                totalViews: 100,
                uniqueViews: 80,
                repeatViews: 20,
                completionViews: 60,
                averageWatchTime: 15,
                averageCompletionRate: 0.75,
                bounceRate: 0.25,
            },
            engagement: {
                totalLikes: 10,
                totalComments: 5,
                totalReports: 0,
                likeRate: 0.1,
                commentRate: 0.05,
                reportRate: 0,
            },
            performance: {
                loadTime: 2.5,
                bufferTime: 0.5,
                errorRate: 0.01,
                qualitySwitches: 1,
            },
            viral: {
                viralScore: 75,
                trendingScore: 80,
                reachScore: 70,
                influenceScore: 65,
                growthRate: 0.15,
                totalReach: 1000,
            },
            content: {
                contentQualityScore: 85,
                audioQualityScore: 80,
                videoQualityScore: 90,
                faceDetectionRate: 0.95,
            },
            lastMetricsUpdate: new Date(),
            metricsVersion: "1.0.0",
            dataQuality: 0.95,
            confidenceLevel: 0.9,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        archivedAt: null,
        deletedAt: null,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        controller = new MomentController(
            mockCreateMomentUseCase,
            mockGetMomentUseCase,
            mockDeleteMomentUseCase,
            mockPublishMomentUseCase,
            mockListMomentsUseCase,
            mockGetUserMomentsUseCase,
            mockSearchMomentsUseCase,
            mockLikeMomentUseCase,
            mockUnlikeMomentUseCase,
            mockGetLikedMomentsUseCase,
            mockCommentMomentUseCase,
            mockGetMomentCommentsUseCase,
            mockEditMomentCommentUseCase,
            mockDeleteMomentCommentUseCase,
            mockGetCommentedMomentsUseCase,
            mockReportMomentUseCase,
            mockGetMomentReportsUseCase,
            mockGetUserMomentReportsUseCase,
            mockGetUserReportedMomentsUseCase,
        )
    })

    describe("createMoment", () => {
        it("deve criar um momento com sucesso", async () => {
            // Arrange
            const request = {
                description: "Test moment",
                hashtags: ["#test"],
                mentions: ["@user"],
                visibility: "public" as const,
                ageRestriction: false,
                contentWarning: false,
            }
            const userId = "user_123"

            vi.mocked(mockCreateMomentUseCase.execute).mockResolvedValue(mockMoment)

            // Act
            const result = await controller.createMoment(request, userId)

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBe("moment_123")
            expect(result.description).toBe("Test moment")
            expect(mockCreateMomentUseCase.execute).toHaveBeenCalledWith({
                ownerId: userId,
                description: request.description,
                hashtags: request.hashtags,
                mentions: request.mentions,
                content: expect.objectContaining({
                    duration: 0,
                    size: 0,
                    format: "mp4",
                    hasAudio: true,
                    codec: "h264",
                    resolution: {
                        width: 1080,
                        height: 1920,
                        quality: "high",
                    },
                }),
                media: expect.objectContaining({
                    urls: {
                        low: "",
                        medium: "",
                        high: "",
                    },
                    storage: {
                        provider: "s3",
                        bucket: "",
                        key: "",
                        region: "us-east-1",
                    },
                }),
                thumbnail: expect.objectContaining({
                    url: "",
                    width: 1080,
                    height: 1920,
                    storage: {
                        provider: "s3",
                        bucket: "",
                        key: "",
                        region: "us-east-1",
                    },
                }),
            })
        })

        it("deve falhar com dados inválidos", async () => {
            // Arrange
            const request = {
                description: "a".repeat(501), // Muito longo
                hashtags: Array(11).fill("#test"), // Muitas hashtags
                mentions: Array(11).fill("@user"), // Muitas menções
            }
            const userId = "user_123"

            // Act & Assert
            await expect(controller.createMoment(request, userId)).rejects.toThrow(
                "Erro de validação",
            )
        })

        it("deve falhar quando o use case retorna erro", async () => {
            // Arrange
            const request = {
                description: "Test moment",
            }
            const userId = "user_123"

            vi.mocked(mockCreateMomentUseCase.execute).mockRejectedValue(
                new Error("Database error"),
            )

            // Act & Assert
            await expect(controller.createMoment(request, userId)).rejects.toThrow(
                "Erro ao criar momento",
            )
        })
    })

    describe("getMoment", () => {
        it("deve retornar um momento existente", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"

            vi.mocked(mockGetMomentUseCase.execute).mockResolvedValue(mockMoment)

            // Act
            const result = await controller.getMoment(momentId, userId)

            // Assert
            expect(result).toBeDefined()
            expect(result?.id).toBe("moment_123")
            expect(mockGetMomentUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
            })
        })

        it("deve retornar null para momento inexistente", async () => {
            // Arrange
            const momentId = "inexistente"
            const userId = "user_123"

            vi.mocked(mockGetMomentUseCase.execute).mockRejectedValue(new Error("Moment not found"))

            // Act
            const result = await controller.getMoment(momentId, userId)

            // Assert
            expect(result).toBeNull()
        })

        it("deve falhar com erro inesperado", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"

            vi.mocked(mockGetMomentUseCase.execute).mockRejectedValue(new Error("Database error"))

            // Act & Assert
            await expect(controller.getMoment(momentId, userId)).rejects.toThrow(
                "Erro ao buscar momento",
            )
        })
    })

    describe("deleteMoment", () => {
        it("deve deletar um momento com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"

            vi.mocked(mockDeleteMomentUseCase.execute).mockResolvedValue({
                success: true,
                deleted: true,
            })

            // Act
            await controller.deleteMoment(momentId, userId)

            // Assert
            expect(mockDeleteMomentUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
            })
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const momentId = "inexistente"
            const userId = "user_123"

            vi.mocked(mockDeleteMomentUseCase.execute).mockRejectedValue(
                new Error("Moment not found"),
            )

            // Act & Assert
            await expect(controller.deleteMoment(momentId, userId)).rejects.toThrow(
                "Momento não encontrado",
            )
        })

        it("deve falhar quando usuário não é autorizado", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_456"

            vi.mocked(mockDeleteMomentUseCase.execute).mockRejectedValue(new Error("Unauthorized"))

            // Act & Assert
            await expect(controller.deleteMoment(momentId, userId)).rejects.toThrow(
                "Não autorizado",
            )
        })
    })

    describe("publishMoment", () => {
        it("deve publicar um momento com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"

            vi.mocked(mockPublishMomentUseCase.execute).mockResolvedValue(mockMoment)

            // Act
            const result = await controller.publishMoment(momentId, userId)

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBe("moment_123")
            expect(mockPublishMomentUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
            })
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const momentId = "inexistente"
            const userId = "user_123"

            vi.mocked(mockPublishMomentUseCase.execute).mockRejectedValue(
                new Error("Moment not found"),
            )

            // Act & Assert
            await expect(controller.publishMoment(momentId, userId)).rejects.toThrow(
                "Momento não encontrado",
            )
        })
    })

    describe("listMoments", () => {
        it("deve listar momentos com sucesso", async () => {
            // Arrange
            const query = {
                page: 1,
                limit: 20,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
                status: "published" as const,
            }

            vi.mocked(mockListMomentsUseCase.execute).mockResolvedValue({
                success: true,
                moments: [mockMoment],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
            })

            // Act
            const result = await controller.listMoments(query)

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("moment_123")
            expect(mockListMomentsUseCase.execute).toHaveBeenCalledWith({
                limit: 20,
                offset: 0,
                sortBy: "createdAt",
                sortOrder: "desc",
                status: "published",
            })
        })

        it("deve falhar com query inválida", async () => {
            // Arrange
            const query = {
                page: 0, // Inválido
                limit: 101, // Inválido
            }

            // Act & Assert
            await expect(controller.listMoments(query)).rejects.toThrow("Erro de validação")
        })

        it("deve falhar quando use case retorna erro", async () => {
            // Arrange
            const query = {
                page: 1,
                limit: 20,
            }

            vi.mocked(mockListMomentsUseCase.execute).mockResolvedValue({
                success: false,
                error: "Database error",
            })

            // Act & Assert
            await expect(controller.listMoments(query)).rejects.toThrow("Erro ao listar momentos")
        })
    })

    describe("getUserMoments", () => {
        it("deve listar momentos de um usuário com sucesso", async () => {
            // Arrange
            const userId = "user_123"
            const query = {
                page: 1,
                limit: 20,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
                status: "published" as const,
            }

            vi.mocked(mockGetUserMomentsUseCase.execute).mockResolvedValue({
                success: true,
                moments: [mockMoment],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
            })

            // Act
            const result = await controller.getUserMoments(userId, query)

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("moment_123")
            expect(mockGetUserMomentsUseCase.execute).toHaveBeenCalledWith({
                userId,
                limit: 20,
                offset: 0,
                sortBy: "createdAt",
                sortOrder: "desc",
                status: "published",
            })
        })
    })

    describe("searchMoments", () => {
        it("deve buscar momentos com sucesso", async () => {
            // Arrange
            const query = {
                q: "test",
                page: 1,
                limit: 20,
                type: "all" as const,
            }

            vi.mocked(mockSearchMomentsUseCase.execute).mockResolvedValue({
                success: true,
                results: {
                    moments: [mockMoment],
                    total: 1,
                    page: 1,
                    limit: 20,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            })

            // Act
            const result = await controller.searchMoments(query)

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("moment_123")
            expect(mockSearchMomentsUseCase.execute).toHaveBeenCalledWith({
                term: "test",
                filters: {
                    status: undefined,
                },
                pagination: {
                    limit: 20,
                    offset: 0,
                },
            })
        })
    })

    describe("likeMoment", () => {
        it("deve curtir um momento com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"

            vi.mocked(mockLikeMomentUseCase.execute).mockResolvedValue(mockMoment)

            // Act
            const result = await controller.likeMoment(momentId, userId)

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBe("moment_123")
            expect(mockLikeMomentUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
            })
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const momentId = "inexistente"
            const userId = "user_123"

            vi.mocked(mockLikeMomentUseCase.execute).mockRejectedValue(
                new Error("Moment not found"),
            )

            // Act & Assert
            await expect(controller.likeMoment(momentId, userId)).rejects.toThrow(
                "Momento não encontrado",
            )
        })
    })

    describe("unlikeMoment", () => {
        it("deve descurtir um momento com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"

            vi.mocked(mockUnlikeMomentUseCase.execute).mockResolvedValue(mockMoment)

            // Act
            const result = await controller.unlikeMoment(momentId, userId)

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBe("moment_123")
            expect(mockUnlikeMomentUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
            })
        })
    })

    describe("getLikedMoments", () => {
        it("deve listar momentos curtidos com sucesso", async () => {
            // Arrange
            const userId = "user_123"
            const query = {
                page: 1,
                limit: 20,
            }

            vi.mocked(mockGetLikedMomentsUseCase.execute).mockResolvedValue({
                success: true,
                moments: [mockMoment],
                total: 1,
            })

            // Act
            const result = await controller.getLikedMoments(userId, query)

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("moment_123")
            expect(mockGetLikedMomentsUseCase.execute).toHaveBeenCalledWith({
                userId,
                limit: 20,
                offset: 0,
            })
        })
    })

    describe("commentMoment", () => {
        it("deve comentar em um momento com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const request = {
                content: "Great moment!",
            }

            vi.mocked(mockCommentMomentUseCase.execute).mockResolvedValue(mockMoment)

            // Act
            const result = await controller.commentMoment(momentId, userId, request)

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBe("moment_123")
            expect(mockCommentMomentUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
                content: "Great moment!",
            })
        })

        it("deve falhar com conteúdo inválido", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const request = {
                content: "", // Vazio
            }

            // Act & Assert
            await expect(controller.commentMoment(momentId, userId, request)).rejects.toThrow(
                "Erro de validação",
            )
        })
    })

    describe("getMomentComments", () => {
        it("deve listar comentários de um momento", async () => {
            // Arrange
            const momentId = "moment_123"
            const query = {
                page: 1,
                limit: 20,
            }

            vi.mocked(mockGetMomentCommentsUseCase.execute).mockResolvedValue({
                success: true,
                comments: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                },
            })

            // Act
            const result = await controller.getMomentComments(momentId, query)

            // Assert
            expect(result).toEqual([])
            expect(mockGetMomentCommentsUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId: "",
                page: 1,
                limit: 20,
            })
        })
    })

    describe("editMomentComment", () => {
        it("deve editar comentário com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const commentId = "comment_123"
            const userId = "user_123"
            const request = {
                content: "Updated comment",
            }

            vi.mocked(mockEditMomentCommentUseCase.execute).mockResolvedValue(mockMoment)

            // Act
            const result = await controller.editMomentComment(momentId, commentId, userId, request)

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBe("moment_123")
            expect(mockEditMomentCommentUseCase.execute).toHaveBeenCalledWith({
                momentId,
                commentId,
                userId,
                content: "Updated comment",
            })
        })

        it("deve falhar quando comentário não é encontrado", async () => {
            // Arrange
            const momentId = "moment_123"
            const commentId = "inexistente"
            const userId = "user_123"
            const request = {
                content: "Updated comment",
            }

            vi.mocked(mockEditMomentCommentUseCase.execute).mockRejectedValue(
                new Error("Comment not found"),
            )

            // Act & Assert
            await expect(
                controller.editMomentComment(momentId, commentId, userId, request),
            ).rejects.toThrow("Comentário não encontrado")
        })
    })

    describe("deleteMomentComment", () => {
        it("deve deletar comentário com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const commentId = "comment_123"
            const userId = "user_123"

            vi.mocked(mockDeleteMomentCommentUseCase.execute).mockResolvedValue({
                success: true,
            })

            // Act
            await controller.deleteMomentComment(momentId, commentId, userId)

            // Assert
            expect(mockDeleteMomentCommentUseCase.execute).toHaveBeenCalledWith({
                momentId,
                commentId,
                userId,
            })
        })

        it("deve falhar quando comentário não é encontrado", async () => {
            // Arrange
            const momentId = "moment_123"
            const commentId = "inexistente"
            const userId = "user_123"

            vi.mocked(mockDeleteMomentCommentUseCase.execute).mockRejectedValue(
                new Error("Comment not found"),
            )

            // Act & Assert
            await expect(
                controller.deleteMomentComment(momentId, commentId, userId),
            ).rejects.toThrow("Comentário não encontrado")
        })
    })

    describe("getCommentedMoments", () => {
        it("deve listar momentos comentados com sucesso", async () => {
            // Arrange
            const userId = "user_123"
            const query = {
                page: 1,
                limit: 20,
            }

            vi.mocked(mockGetCommentedMomentsUseCase.execute).mockResolvedValue({
                success: true,
                moments: [mockMoment],
                total: 1,
            })

            // Act
            const result = await controller.getCommentedMoments(userId, query)

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("moment_123")
            expect(mockGetCommentedMomentsUseCase.execute).toHaveBeenCalledWith({
                userId,
                limit: 20,
                offset: 0,
            })
        })
    })

    describe("reportMoment", () => {
        it("deve reportar um momento com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const request = {
                reason: "spam" as const,
                description: "This is spam content",
            }

            vi.mocked(mockReportMomentUseCase.execute).mockResolvedValue({
                success: true,
                report: {
                    id: "report_123",
                    momentId,
                    userId,
                    reason: "spam",
                    description: "This is spam content",
                    status: "pending",
                    createdAt: new Date(),
                },
            })

            vi.mocked(mockGetMomentUseCase.execute).mockResolvedValue(mockMoment)

            // Act
            const result = await controller.reportMoment(momentId, userId, request)

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBe("moment_123")
            expect(mockReportMomentUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
                reason: "spam",
                description: "This is spam content",
            })
        })

        it("deve falhar com motivo inválido", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const request = {
                reason: "invalid_reason" as any,
            }

            // Act & Assert
            await expect(controller.reportMoment(momentId, userId, request)).rejects.toThrow(
                "Erro de validação",
            )
        })
    })

    describe("getMomentReports", () => {
        it("deve listar reports de um momento", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const query = {
                page: 1,
                limit: 20,
            }

            vi.mocked(mockGetMomentReportsUseCase.execute).mockResolvedValue({
                success: true,
                reports: [],
                total: 0,
            })

            // Act
            const result = await controller.getMomentReports(momentId, userId, query)

            // Assert
            expect(result).toEqual([])
            expect(mockGetMomentReportsUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
                limit: 20,
                offset: 0,
            })
        })
    })

    describe("getUserMomentReports", () => {
        it("deve listar reports dos momentos de um usuário", async () => {
            // Arrange
            const userId = "user_123"
            const currentUserId = "user_123"
            const query = {
                page: 1,
                limit: 20,
            }

            vi.mocked(mockGetUserMomentReportsUseCase.execute).mockResolvedValue({
                success: true,
                momentReports: [],
                total: 0,
            })

            // Act
            const result = await controller.getUserMomentReports(userId, currentUserId, query)

            // Assert
            expect(result).toEqual([])
            expect(mockGetUserMomentReportsUseCase.execute).toHaveBeenCalledWith({
                userId,
                limit: 20,
                offset: 0,
            })
        })
    })

    describe("getUserReportedMoments", () => {
        it("deve listar momentos reportados por um usuário", async () => {
            // Arrange
            const userId = "user_123"
            const currentUserId = "user_123"
            const query = {
                page: 1,
                limit: 20,
            }

            vi.mocked(mockGetUserReportedMomentsUseCase.execute).mockResolvedValue({
                success: true,
                reportedMoments: [],
                total: 0,
            })

            // Act
            const result = await controller.getUserReportedMoments(userId, currentUserId, query)

            // Assert
            expect(result).toEqual([])
            expect(mockGetUserReportedMomentsUseCase.execute).toHaveBeenCalledWith({
                userId,
                limit: 20,
                offset: 0,
            })
        })
    })

    describe("mapToResponse", () => {
        it("deve mapear entidade para response corretamente", () => {
            // Arrange
            const moment = {
                toEntity: () => mockMoment,
            }

            // Act
            const result = (controller as any).mapToResponse(moment)

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBe("moment_123")
            expect(result.ownerId).toBe("user_123")
            expect(result.description).toBe("Test moment")
            expect(result.hashtags).toEqual(["#test"])
            expect(result.mentions).toEqual(["@user"])
            expect(result.status.current).toBe("published")
            expect(result.visibility.level).toBe("public")
            expect(result.metrics.views.totalViews).toBe(100)
            expect(result.metrics.engagement.totalLikes).toBe(10)
            expect(result.createdAt).toBeDefined()
            expect(result.updatedAt).toBeDefined()
            expect(result.publishedAt).toBeDefined()
        })

        it("deve mapear entidade sem toEntity corretamente", () => {
            // Act
            const result = (controller as any).mapToResponse(mockMoment)

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBe("moment_123")
            expect(result.ownerId).toBe("user_123")
        })

        it("deve usar valores padrão quando propriedades estão ausentes", () => {
            // Arrange
            const momentWithoutMetrics = {
                id: "moment_123",
                ownerId: "user_123",
                description: "Test moment",
                hashtags: [],
                mentions: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                publishedAt: null,
                archivedAt: null,
                deletedAt: null,
            }

            // Act
            const result = (controller as any).mapToResponse(momentWithoutMetrics)

            // Assert
            expect(result).toBeDefined()
            expect(result.status.current).toBe("draft")
            expect(result.visibility.level).toBe("public")
            expect(result.metrics.views.totalViews).toBe(0)
            expect(result.metrics.engagement.totalLikes).toBe(0)
        })
    })
})
