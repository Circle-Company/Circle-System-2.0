// Use Cases
import {
    CreateMomentUseCase,
    DeleteMomentUseCase,
    GetLikedMomentsUseCase,
    GetMomentReportsUseCase,
    GetMomentUseCase,
    GetUserMomentReportsUseCase,
    GetUserMomentsUseCase,
    GetUserReportedMomentsUseCase,
    LikeMomentUseCase,
    ListMomentsUseCase,
    PublishMomentUseCase,
    ReportMomentUseCase,
    UnlikeMomentUseCase,
} from "@/application/moment/use.cases"

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
    hashtags?: string[]
    mentions?: string[]
    visibility?: "public" | "followers_only" | "private" | "unlisted"
    ageRestriction?: boolean
    contentWarning?: boolean
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
            repeatViews: number
            completionViews: number
            averageWatchTime: number
            averageCompletionRate: number
            bounceRate: number
        }
        engagement: {
            totalLikes: number
            totalReports: number
            likeRate: number
            reportRate: number
        }
        performance: {
            loadTime: number
            bufferTime: number
            errorRate: number
            successRate: number
        }
    }
    createdAt: Date
    updatedAt: Date
}

// Schemas de validação
const CreateMomentRequestSchema = z.object({
    description: z.string().min(1).max(500).optional(),
    hashtags: z.array(z.string()).max(10).optional(),
    mentions: z.array(z.string()).max(10).optional(),
    visibility: z.enum(["public", "followers_only", "private", "unlisted"]).optional(),
    ageRestriction: z.boolean().optional(),
    contentWarning: z.boolean().optional(),
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
        private readonly publishMomentUseCase: PublishMomentUseCase,
        private readonly listMomentsUseCase: ListMomentsUseCase,
        private readonly getUserMomentsUseCase: GetUserMomentsUseCase,
        private readonly likeMomentUseCase: LikeMomentUseCase,
        private readonly unlikeMomentUseCase: UnlikeMomentUseCase,
        private readonly getLikedMomentsUseCase: GetLikedMomentsUseCase,
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

            const result = await this.createMomentUseCase.execute({
                ownerId: userId,
                videoData: request.videoData,
                videoMetadata: request.videoMetadata,
                description: request.description,
                location: request.location,
                device: request.device,
            })

            if (!result.success || !result.moment) {
                throw new Error(result.error || "Erro ao criar momento")
            }

            return this.mapToResponse(result.moment)
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
        ownerId: string,
        query: ListMomentsQuery,
    ): Promise<MomentResponse[]> {
        try {
            // Validação com Zod
            const validatedQuery = ListMomentsQuerySchema.parse(query)

            const result = await this.getUserMomentReportsUseCase.execute({
                userId: ownerId,
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
                          totalReports: momentData.metrics.engagement?.totalReports || 0,
                          likeRate: momentData.metrics.engagement?.likeRate || 0,
                          reportRate: momentData.metrics.engagement?.reportRate || 0,
                      },
                      performance: {
                          loadTime: momentData.metrics.performance?.loadTime || 0,
                          bufferTime: momentData.metrics.performance?.bufferTime || 0,
                          errorRate: momentData.metrics.performance?.errorRate || 0,
                          successRate: momentData.metrics.performance?.successRate || 0,
                      },
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
                          totalReports: 0,
                          likeRate: 0,
                          reportRate: 0,
                      },
                      performance: {
                          loadTime: 0,
                          bufferTime: 0,
                          errorRate: 0,
                          successRate: 0,
                      },
                  },
            createdAt: momentData.createdAt,
            updatedAt: momentData.updatedAt,
        }
    }
}
