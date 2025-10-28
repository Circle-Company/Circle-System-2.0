// Use Cases
import {
    CreateMomentUseCase,
    DeleteMomentUseCase,
    GetAccountMomentsUseCase,
    GetLikedMomentsUseCase,
    GetMomentReportsUseCase,
    GetMomentUseCase,
    GetUserMomentsUseCase,
    LikeMomentUseCase,
    ReportMomentUseCase,
    UnlikeMomentUseCase,
} from "@/application/moment/use.cases"

import { GetAccountMomentsResponse } from "@/application/moment/use.cases/get.account.moments.use.case"
import { GetUserMomentsResponse } from "@/application/moment/use.cases/get.user.moments.use.case"
import { MomentVisibilityEnum } from "@/domain/moment"
import { AuthenticatedUser } from "@/infra/middlewares"
import { z } from "zod"

// Interfaces de Request
export interface CreateMomentRequest {
    videoData: Buffer // Dados do vídeo
    videoMetadata: {
        filename: string
        mimeType: string
        size: number
    }
    description?: string
    mentions?: string[]
    visibility?: "public" | "followers_only" | "private" | "unlisted"
    location?: {
        latitude: number
        longitude: number
    }
    device?: {
        type: string
        os: string
        osVersion: string
        model: string
        screenResolution: string
        orientation: string
    }
}

export interface UpdateMomentRequest {
    description?: string
    hashtags?: string[]
    mentions?: string[]
    visibility?: "public" | "followers_only" | "private" | "unlisted"
    ageRestriction?: boolean
    contentWarning?: boolean
}

export interface ReportRequest {
    reason:
        | "spam"
        | "inappropriate_content"
        | "harassment"
        | "violence"
        | "hate_speech"
        | "fake_news"
        | "copyright_violation"
        | "other"
    description?: string
}

export interface ListMomentsQuery {
    page?: number
    limit?: number
    sortBy?: "createdAt" | "updatedAt" | "likes" | "views"
    sortOrder?: "asc" | "desc"
    status?: "published" | "archived" | "deleted" | "blocked" | "under_review"
}

// Interface de Response
export interface MomentResponse {
    id: string
    ownerId: string
    description: string
    hashtags: string[]
    mentions: string[]
    status: {
        current: string
        previous: string | null
        reason: string | null
        changedBy: string | null
        changedAt: Date
    }
    visibility: {
        level: string
        allowedUsers: string[]
        blockedUsers: string[]
        ageRestriction: boolean
        contentWarning: boolean
    }
    metrics: {
        views: {
            totalViews: number
            uniqueViews: number
            completionViews: number
            averageWatchTime: number
            averageCompletionRate: number
            bounceRate: number
        }
        engagement: {
            totalLikes: number
            totalComments: number
            totalReports: number
            likeRate: number
            commentRate: number
            reportRate: number
        }
        performance: {
            loadTime: number
            bufferTime: number
            errorRate: number
            successRate: number
        }
        viral: {
            viralScore: number
            viralReach: number
        }
        content: {
            qualityScore: number
        }
    }
    createdAt: Date
    updatedAt: Date
}

const ReportSchema = z.object({
    reason: z.enum([
        "spam",
        "inappropriate_content",
        "harassment",
        "violence",
        "hate_speech",
        "fake_news",
        "copyright_violation",
        "pornography",
        "other",
    ]),
    description: z.string().max(1000).optional(),
})

const ListMomentsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.enum(["createdAt", "updatedAt", "likes", "views"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    status: z
        .enum(["published", "archived", "deleted", "blocked", "under_review"])
        .default("published"),
})

export class MomentController {
    constructor(
        private readonly createMomentUseCase: CreateMomentUseCase,
        private readonly getMomentUseCase: GetMomentUseCase,
        private readonly deleteMomentUseCase: DeleteMomentUseCase,
        private readonly getUserMomentsUseCase: GetUserMomentsUseCase,
        private readonly getAccountMomentsUseCase: GetAccountMomentsUseCase,
        private readonly likeMomentUseCase: LikeMomentUseCase,
        private readonly unlikeMomentUseCase: UnlikeMomentUseCase,
        private readonly getLikedMomentsUseCase: GetLikedMomentsUseCase,
        private readonly reportMomentUseCase: ReportMomentUseCase,
        private readonly getMomentReportsUseCase: GetMomentReportsUseCase,
    ) {}

    // ===== CRUD OPERATIONS =====

    /**
     * Cria um novo momento
     */
    async createMoment(request: CreateMomentRequest, userId: string): Promise<void> {
        try {
            console.log(
                `[MomentController] 🚀 Iniciando processamento em background para usuário ${userId}`,
            )

            // Validação básica dos dados obrigatórios
            if (!request.videoData || request.videoData.length === 0) {
                throw new Error("Dados do vídeo são obrigatórios")
            }

            if (!request.videoMetadata) {
                throw new Error("Metadados do vídeo são obrigatórios")
            }

            // Validar menções (não pode mencionar a si mesmo)
            if (request.mentions && request.mentions.includes(userId)) {
                throw new Error("Você não pode mencionar a si mesmo")
            }

            await this.createMomentUseCase.execute({
                ownerId: userId,
                videoData: request.videoData,
                videoMetadata: request.videoMetadata,
                visibility: request.visibility as MomentVisibilityEnum,
                description: request.description,
                location: request.location,
                device: request.device,
            })

            console.log(
                `[MomentController] ✅ Processamento em background concluído para usuário ${userId}`,
            )
        } catch (error) {
            console.error(`[MomentController] ❌ Erro no processamento em background:`, error)

            if (error instanceof z.ZodError) {
                throw new Error(
                    `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            throw new Error(
                `Error to create moment: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            )
        }
    }

    /**
     * Busca momento por ID
     */
    async getMoment(momentId: string, userId?: string): Promise<MomentResponse | null> {
        try {
            const result = await this.getMomentUseCase.execute({
                momentId: momentId,
                userId: userId,
            })

            return result ? this.mapToResponse(result) : null
        } catch (error) {
            if (error instanceof Error && error.message === "Moment not found") {
                return null
            }
            throw new Error(
                `Error to get moment: ${error instanceof Error ? error.message : "Unknown error"}`,
            )
        }
    }

    /**
     * Deleta um momento (soft delete)
     */
    async deleteMoment(momentId: string, userId: string): Promise<void> {
        try {
            await this.deleteMomentUseCase.execute({
                momentId: momentId,
                userId: userId,
            })
        } catch (error) {
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Moment not found")
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Unauthorized")
            }
            throw new Error(
                `Error to delete moment: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            )
        }
    }

    /**
     * Lista momentos de um usuário específico
     */
    async getUserMoments(
        user: AuthenticatedUser,
        query: ListMomentsQuery,
    ): Promise<GetUserMomentsResponse> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.getUserMomentsUseCase.execute({
                user: user,
                query: {
                    status: validatedQuery.status as any,
                    visibility: MomentVisibilityEnum.PUBLIC,
                    includeDeleted: false,
                    sortBy: validatedQuery.sortBy,
                    sortOrder: validatedQuery.sortOrder,
                },
            })

            if (!result.success || !result.moments) {
                throw new Error(result.error || "Error to list moments of user")
            }

            return result
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            throw new Error(
                `Error to list moments of user: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            )
        }
    }

    // ===== USER ACTIONS =====

    /**
     * Curtir um momento
     */
    async likeMoment(momentId: string, userId: string): Promise<MomentResponse> {
        try {
            const result = await this.likeMomentUseCase.execute({
                momentId: momentId,
                userId: userId,
            })

            return this.mapToResponse(result)
        } catch (error) {
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Moment not found")
            }
            throw new Error(
                `Error to like moment: ${error instanceof Error ? error.message : "Unknown error"}`,
            )
        }
    }

    /**
     * Descurtir um momento
     */
    async unlikeMoment(momentId: string, userId: string): Promise<MomentResponse> {
        try {
            const result = await this.unlikeMomentUseCase.execute({
                momentId: momentId,
                userId: userId,
            })

            return this.mapToResponse(result)
        } catch (error) {
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Moment not found")
            }
            throw new Error(
                `Error to unlike moment: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            )
        }
    }

    /**
     * Lista momentos curtidos por um usuário
     */
    async getLikedMoments(userId: string, query: ListMomentsQuery): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.getLikedMomentsUseCase.execute({
                userId: userId,
                limit: validatedQuery.limit,
                offset: (validatedQuery.page - 1) * validatedQuery.limit,
            })

            if (!result.success || !result.moments) {
                throw new Error(result.error || "Error to list liked moments")
            }

            return result.moments.map((moment) => this.mapToResponse(moment))
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            throw new Error(
                `Error to list liked moments: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            )
        }
    }

    // ===== REPORTS =====

    /**
     * Reportar um momento
     */
    async reportMoment(
        momentId: string,
        userId: string,
        request: ReportRequest,
    ): Promise<MomentResponse> {
        try {
            // Validação com Zod
            const validatedData = ReportSchema.parse(request)

            const result = await this.reportMomentUseCase.execute({
                momentId: momentId,
                userId: userId,
                reason: validatedData.reason,
                description: validatedData.description,
            })

            if (!result.success) {
                throw new Error(result.error || "Error to report moment")
            }

            // Retornar o momento reportado
            const moment = await this.getMoment(momentId, userId)
            if (!moment) {
                throw new Error("Moment not found")
            }
            return moment
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Moment not found")
            }
            throw new Error(
                `Error to report moment: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            )
        }
    }

    /**
     * Lista reports de um momento (apenas owner)
     */
    async getMomentReports(
        momentId: string,
        userId: string,
        query: ListMomentsQuery,
    ): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.getMomentReportsUseCase.execute({
                momentId: momentId,
                userId: userId,
                limit: validatedQuery.limit,
                offset: (validatedQuery.page - 1) * validatedQuery.limit,
            })

            if (!result.success) {
                throw new Error(result.error || "Error to list reports of moment")
            }

            // Retornar array vazio por enquanto, pois este use case retorna reports, não momentos
            return []
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Moment not found")
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Unauthorized")
            }
            throw new Error(
                `Error to list reports of moment: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            )
        }
    }

    /**
     * Map entity Moment to MomentResponse
     */
    private mapToResponse(moment: any): MomentResponse {
        const momentData = moment.toEntity ? moment.toEntity() : moment

        return {
            id: momentData.id,
            ownerId: momentData.ownerId,
            description: momentData.description,
            hashtags: momentData.hashtags || [],
            mentions: momentData.mentions || [],
            status: momentData.status
                ? {
                      current: momentData.status.current,
                      previous: momentData.status.previous,
                      reason: momentData.status.reason,
                      changedBy: momentData.status.changedBy,
                      changedAt: momentData.status.changedAt,
                  }
                : {
                      current: "draft",
                      previous: null,
                      reason: null,
                      changedBy: null,
                      changedAt: new Date(),
                  },
            visibility: momentData.visibility
                ? {
                      level: momentData.visibility.level,
                      allowedUsers: momentData.visibility.allowedUsers || [],
                      blockedUsers: momentData.visibility.blockedUsers || [],
                      ageRestriction: momentData.visibility.ageRestriction || false,
                      contentWarning: momentData.visibility.contentWarning || false,
                  }
                : {
                      level: "public",
                      allowedUsers: [],
                      blockedUsers: [],
                      ageRestriction: false,
                      contentWarning: false,
                  },
            metrics: momentData.metrics
                ? {
                      views: {
                          totalViews: momentData.metrics.views?.totalViews || 0,
                          uniqueViews: momentData.metrics.views?.uniqueViews || 0,
                          completionViews: momentData.metrics.views?.completionViews || 0,
                          averageWatchTime: momentData.metrics.views?.averageWatchTime || 0,
                          averageCompletionRate:
                              momentData.metrics.views?.averageCompletionRate || 0,
                          bounceRate: momentData.metrics.audience?.behavior?.bounceRate || 0,
                      },
                      engagement: {
                          totalLikes: momentData.metrics.engagement?.totalLikes || 0,
                          totalComments: momentData.metrics.engagement?.totalComments || 0,
                          totalReports: momentData.metrics.engagement?.totalReports || 0,
                          likeRate: momentData.metrics.engagement?.likeRate || 0,
                          commentRate: momentData.metrics.engagement?.commentRate || 0,
                          reportRate: momentData.metrics.engagement?.reportRate || 0,
                      },
                      performance: {
                          loadTime: momentData.metrics.performance?.loadTime || 0,
                          bufferTime: momentData.metrics.performance?.bufferTime || 0,
                          errorRate: momentData.metrics.performance?.errorRate || 0,
                          successRate: momentData.metrics.performance?.successRate || 0,
                      },
                      viral: {
                          viralScore: momentData.metrics.viral?.viralScore || 0,
                          viralReach: momentData.metrics.viral?.viralReach || 0,
                      },
                      content: {
                          qualityScore: momentData.metrics.content?.qualityScore || 0,
                      },
                  }
                : {
                      views: {
                          totalViews: 0,
                          uniqueViews: 0,
                          completionViews: 0,
                          averageWatchTime: 0,
                          averageCompletionRate: 0,
                          bounceRate: 0,
                      },
                      engagement: {
                          totalLikes: 0,
                          totalComments: 0,
                          totalReports: 0,
                          likeRate: 0,
                          commentRate: 0,
                          reportRate: 0,
                      },
                      performance: {
                          loadTime: 0,
                          bufferTime: 0,
                          errorRate: 0,
                          successRate: 0,
                      },
                      viral: {
                          viralScore: 0,
                          viralReach: 0,
                      },
                      content: {
                          qualityScore: 0,
                      },
                  },
            createdAt: momentData.createdAt,
            updatedAt: momentData.updatedAt,
        }
    }

    /**
     * Obtém momentos da conta do usuário autenticado
     */
    async getAccountMoments(request: {
        requestingUser: AuthenticatedUser
        query: {
            status: string
            visibility: string
            includeDeleted?: boolean
            sortBy?: string
            sortOrder?: string
        }
        limit?: number
        offset?: number
    }): Promise<GetAccountMomentsResponse> {
        return await this.getAccountMomentsUseCase.execute({
            requestingUser: request.requestingUser,
            query: {
                status: request.query.status as any,
                visibility: request.query.visibility as any,
                includeDeleted: request.query.includeDeleted,
                sortBy: request.query.sortBy as any,
                sortOrder: request.query.sortOrder as any,
            },
            limit: request.limit,
            offset: request.offset,
        })
    }
}
