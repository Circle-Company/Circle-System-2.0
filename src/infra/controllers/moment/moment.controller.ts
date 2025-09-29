// Use Cases
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

import { z } from "zod"

// Interfaces de Request
export interface CreateMomentRequest {
    description?: string
    hashtags?: string[]
    mentions?: string[]
    visibility?: "public" | "followers_only" | "private" | "unlisted"
    ageRestriction?: boolean
    contentWarning?: boolean
}

export interface UpdateMomentRequest {
    description?: string
    hashtags?: string[]
    mentions?: string[]
    visibility?: "public" | "followers_only" | "private" | "unlisted"
    ageRestriction?: boolean
    contentWarning?: boolean
}

export interface CommentRequest {
    content: string
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

export interface SearchMomentsQuery {
    q: string
    page?: number
    limit?: number
    type?: "all" | "text" | "hashtag" | "location"
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
            repeatViews: number
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
            qualitySwitches: number
        }
        viral: {
            viralScore: number
            trendingScore: number
            reachScore: number
            influenceScore: number
            growthRate: number
            totalReach: number
        }
        content: {
            contentQualityScore: number
            audioQualityScore: number
            videoQualityScore: number
            faceDetectionRate: number
        }
        lastMetricsUpdate: Date
        metricsVersion: string
        dataQuality: number
        confidenceLevel: number
    }
    createdAt: Date
    updatedAt: Date
    publishedAt: Date | null
    archivedAt: Date | null
    deletedAt: Date | null
}

// Schemas de validação
const CreateMomentSchema = z.object({
    description: z.string().min(1).max(500).optional(),
    hashtags: z.array(z.string()).max(10).optional(),
    mentions: z.array(z.string()).max(10).optional(),
    visibility: z.enum(["public", "followers_only", "private", "unlisted"]).optional(),
    ageRestriction: z.boolean().optional(),
    contentWarning: z.boolean().optional(),
})

const UpdateMomentSchema = z.object({
    description: z.string().min(1).max(500).optional(),
    hashtags: z.array(z.string()).max(10).optional(),
    mentions: z.array(z.string()).max(10).optional(),
    visibility: z.enum(["public", "followers_only", "private", "unlisted"]).optional(),
    ageRestriction: z.boolean().optional(),
    contentWarning: z.boolean().optional(),
})

const CommentSchema = z.object({
    content: z.string().min(1).max(500),
})

const EditCommentSchema = z.object({
    content: z.string().min(1).max(500),
})

const ReportSchema = z.object({
    reason: z.enum([
        "spam",
        "inappropriate_content",
        "harassment",
        "violence",
        "hate_speech",
        "fake_news",
        "copyright_violation",
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

const SearchMomentsQuerySchema = z.object({
    q: z.string().min(1),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    type: z.enum(["all", "text", "hashtag", "location"]).default("all"),
})

export class MomentController {
    constructor(
        private readonly createMomentUseCase: CreateMomentUseCase,
        private readonly getMomentUseCase: GetMomentUseCase,
        private readonly deleteMomentUseCase: DeleteMomentUseCase,
        private readonly publishMomentUseCase: PublishMomentUseCase,
        private readonly listMomentsUseCase: ListMomentsUseCase,
        private readonly getUserMomentsUseCase: GetUserMomentsUseCase,
        private readonly searchMomentsUseCase: SearchMomentsUseCase,
        private readonly likeMomentUseCase: LikeMomentUseCase,
        private readonly unlikeMomentUseCase: UnlikeMomentUseCase,
        private readonly getLikedMomentsUseCase: GetLikedMomentsUseCase,
        private readonly commentMomentUseCase: CommentMomentUseCase,
        private readonly getMomentCommentsUseCase: GetMomentCommentsUseCase,
        private readonly editMomentCommentUseCase: EditMomentCommentUseCase,
        private readonly deleteMomentCommentUseCase: DeleteMomentCommentUseCase,
        private readonly getCommentedMomentsUseCase: GetCommentedMomentsUseCase,
        private readonly reportMomentUseCase: ReportMomentUseCase,
        private readonly getMomentReportsUseCase: GetMomentReportsUseCase,
        private readonly getUserMomentReportsUseCase: GetUserMomentReportsUseCase,
        private readonly getUserReportedMomentsUseCase: GetUserReportedMomentsUseCase,
    ) {}

    // ===== CRUD OPERATIONS =====

    /**
     * Cria um novo momento
     */
    async createMoment(request: CreateMomentRequest, userId: string): Promise<MomentResponse> {
        try {
            // Validação com Zod
            const validatedData = CreateMomentSchema.parse(request)

            const result = await this.createMomentUseCase.execute({
                ownerId: userId,
                description: validatedData.description,
                hashtags: validatedData.hashtags,
                mentions: validatedData.mentions,
                content: {
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
                },
                media: {
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
                },
                thumbnail: {
                    url: "",
                    width: 1080,
                    height: 1920,
                    storage: {
                        provider: "s3",
                        bucket: "",
                        key: "",
                        region: "us-east-1",
                    },
                },
            })

            return this.mapToResponse(result)
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            throw new Error(
                `Erro ao criar momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
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
                `Erro ao buscar momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
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
                throw new Error("Momento não encontrado")
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao deletar momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Publica um momento
     */
    async publishMoment(momentId: string, userId: string): Promise<MomentResponse> {
        try {
            const result = await this.publishMomentUseCase.execute({
                momentId: momentId,
                userId: userId,
            })

            return this.mapToResponse(result)
        } catch (error) {
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao publicar momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    // ===== LISTING AND SEARCH =====

    /**
     * Lista momentos com filtros
     */
    async listMoments(query: ListMomentsQuery): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.listMomentsUseCase.execute({
                limit: validatedQuery.limit,
                offset: (validatedQuery.page - 1) * validatedQuery.limit,
                sortBy: validatedQuery.sortBy,
                sortOrder: validatedQuery.sortOrder,
                status: validatedQuery.status as any,
            })

            if (!result.success || !result.moments) {
                throw new Error(result.error || "Erro ao listar momentos")
            }

            return result.moments.map((moment) => this.mapToResponse(moment))
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            throw new Error(
                `Erro ao listar momentos: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Lista momentos de um usuário específico
     */
    async getUserMoments(userId: string, query: ListMomentsQuery): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.getUserMomentsUseCase.execute({
                userId: userId,
                limit: validatedQuery.limit,
                offset: (validatedQuery.page - 1) * validatedQuery.limit,
                sortBy: validatedQuery.sortBy,
                sortOrder: validatedQuery.sortOrder,
                status: validatedQuery.status as any,
            })

            if (!result.success || !result.moments) {
                throw new Error(result.error || "Erro ao listar momentos do usuário")
            }

            return result.moments.map((moment) => this.mapToResponse(moment))
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            throw new Error(
                `Erro ao listar momentos do usuário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Busca momentos
     */
    async searchMoments(query: SearchMomentsQuery): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = SearchMomentsQuerySchema.parse(query)

            const result = await this.searchMomentsUseCase.execute({
                term: validatedQuery.q,
                filters: {
                    status: validatedQuery.type === "all" ? undefined : [validatedQuery.type],
                },
                pagination: {
                    limit: validatedQuery.limit,
                    offset: (validatedQuery.page - 1) * validatedQuery.limit,
                },
            })

            if (!result.success || !result.results) {
                throw new Error(result.error || "Erro ao buscar momentos")
            }

            return result.results.moments.map((moment) => this.mapToResponse(moment))
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            throw new Error(
                `Erro ao buscar momentos: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
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
                throw new Error("Momento não encontrado")
            }
            throw new Error(
                `Erro ao curtir momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
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
                throw new Error("Momento não encontrado")
            }
            throw new Error(
                `Erro ao descurtir momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
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
                throw new Error(result.error || "Erro ao listar momentos curtidos")
            }

            return result.moments.map((moment) => this.mapToResponse(moment))
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            throw new Error(
                `Erro ao listar momentos curtidos: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    // ===== COMMENTS =====

    /**
     * Comentar em um momento
     */
    async commentMoment(
        momentId: string,
        userId: string,
        request: CommentRequest,
    ): Promise<MomentResponse> {
        try {
            // Validação com Zod
            const validatedData = CommentSchema.parse(request)

            const result = await this.commentMomentUseCase.execute({
                momentId: momentId,
                userId: userId,
                content: validatedData.content,
            })

            return this.mapToResponse(result)
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            throw new Error(
                `Erro ao comentar no momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Lista comentários de um momento
     */
    async getMomentComments(momentId: string, query: ListMomentsQuery): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.getMomentCommentsUseCase.execute({
                momentId: momentId,
                userId: "", // TODO: Passar userId correto
                page: validatedQuery.page,
                limit: validatedQuery.limit,
            })

            // Retornar array vazio por enquanto, pois este use case retorna comentários, não momentos
            return []
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            throw new Error(
                `Erro ao listar comentários do momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Editar comentário de um momento
     */
    async editMomentComment(
        momentId: string,
        commentId: string,
        userId: string,
        request: CommentRequest,
    ): Promise<MomentResponse> {
        try {
            // Validação com Zod
            const validatedData = EditCommentSchema.parse(request)

            const result = await this.editMomentCommentUseCase.execute({
                momentId: momentId,
                commentId: commentId,
                userId: userId,
                content: validatedData.content,
            })

            return this.mapToResponse(result)
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            if (error instanceof Error && error.message === "Comment not found") {
                throw new Error("Comentário não encontrado")
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao editar comentário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Deletar comentário de um momento
     */
    async deleteMomentComment(momentId: string, commentId: string, userId: string): Promise<void> {
        try {
            await this.deleteMomentCommentUseCase.execute({
                momentId: momentId,
                commentId: commentId,
                userId: userId,
            })
        } catch (error) {
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            if (error instanceof Error && error.message === "Comment not found") {
                throw new Error("Comentário não encontrado")
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao deletar comentário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Lista momentos comentados por um usuário
     */
    async getCommentedMoments(userId: string, query: ListMomentsQuery): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.getCommentedMomentsUseCase.execute({
                userId: userId,
                limit: validatedQuery.limit,
                offset: (validatedQuery.page - 1) * validatedQuery.limit,
            })

            if (!result.success || !result.moments) {
                throw new Error(result.error || "Erro ao listar momentos comentados")
            }

            return result.moments.map((moment) => this.mapToResponse(moment))
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            throw new Error(
                `Erro ao listar momentos comentados: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
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
                throw new Error(result.error || "Erro ao reportar momento")
            }

            // Retornar o momento reportado
            const moment = await this.getMoment(momentId, userId)
            if (!moment) {
                throw new Error("Momento não encontrado")
            }
            return moment
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            throw new Error(
                `Erro ao reportar momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
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
                throw new Error(result.error || "Erro ao listar reports do momento")
            }

            // Retornar array vazio por enquanto, pois este use case retorna reports, não momentos
            return []
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao listar reports do momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Lista reports dos momentos de um usuário (apenas owner)
     */
    async getUserMomentReports(
        userId: string,
        currentUserId: string,
        query: ListMomentsQuery,
    ): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.getUserMomentReportsUseCase.execute({
                userId: userId,
                limit: validatedQuery.limit,
                offset: (validatedQuery.page - 1) * validatedQuery.limit,
            })

            if (!result.success) {
                throw new Error(result.error || "Erro ao listar reports dos momentos do usuário")
            }

            // Retornar array vazio por enquanto, pois este use case retorna reports, não momentos
            return []
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao listar reports dos momentos do usuário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Lista momentos reportados por um usuário
     */
    async getUserReportedMoments(
        userId: string,
        currentUserId: string,
        query: ListMomentsQuery,
    ): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.getUserReportedMomentsUseCase.execute({
                userId: userId,
                limit: validatedQuery.limit,
                offset: (validatedQuery.page - 1) * validatedQuery.limit,
            })

            if (!result.success) {
                throw new Error(result.error || "Erro ao listar momentos reportados pelo usuário")
            }

            // Retornar array vazio por enquanto, pois este use case retorna reports, não momentos
            return []
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao listar momentos reportados pelo usuário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Mapeia entidade Moment para MomentResponse
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
                          repeatViews: momentData.metrics.views?.repeatViews || 0,
                          completionViews: momentData.metrics.views?.completionViews || 0,
                          averageWatchTime: momentData.metrics.views?.averageWatchTime || 0,
                          averageCompletionRate:
                              momentData.metrics.views?.averageCompletionRate || 0,
                          bounceRate: momentData.metrics.views?.bounceRate || 0,
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
                          qualitySwitches: momentData.metrics.performance?.qualitySwitches || 0,
                      },
                      viral: {
                          viralScore: momentData.metrics.viral?.viralScore || 0,
                          trendingScore: momentData.metrics.viral?.trendingScore || 0,
                          reachScore: momentData.metrics.viral?.reachScore || 0,
                          influenceScore: momentData.metrics.viral?.influenceScore || 0,
                          growthRate: momentData.metrics.viral?.growthRate || 0,
                          totalReach: momentData.metrics.viral?.totalReach || 0,
                      },
                      content: {
                          contentQualityScore: momentData.metrics.content?.contentQualityScore || 0,
                          audioQualityScore: momentData.metrics.content?.audioQualityScore || 0,
                          videoQualityScore: momentData.metrics.content?.videoQualityScore || 0,
                          faceDetectionRate: momentData.metrics.content?.faceDetectionRate || 0,
                      },
                      lastMetricsUpdate: momentData.metrics.lastMetricsUpdate || new Date(),
                      metricsVersion: momentData.metrics.metricsVersion || "1.0.0",
                      dataQuality: momentData.metrics.dataQuality || 0,
                      confidenceLevel: momentData.metrics.confidenceLevel || 0,
                  }
                : {
                      views: {
                          totalViews: 0,
                          uniqueViews: 0,
                          repeatViews: 0,
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
                          qualitySwitches: 0,
                      },
                      viral: {
                          viralScore: 0,
                          trendingScore: 0,
                          reachScore: 0,
                          influenceScore: 0,
                          growthRate: 0,
                          totalReach: 0,
                      },
                      content: {
                          contentQualityScore: 0,
                          audioQualityScore: 0,
                          videoQualityScore: 0,
                          faceDetectionRate: 0,
                      },
                      lastMetricsUpdate: new Date(),
                      metricsVersion: "1.0.0",
                      dataQuality: 0,
                      confidenceLevel: 0,
                  },
            createdAt: momentData.createdAt,
            updatedAt: momentData.updatedAt,
            publishedAt: momentData.publishedAt,
            archivedAt: momentData.archivedAt,
            deletedAt: momentData.deletedAt,
        }
    }
}
