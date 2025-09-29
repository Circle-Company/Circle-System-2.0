import { MomentEntity } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface GetCommentedMomentsRequest {
    userId: string
    limit?: number
    offset?: number
}

export interface GetCommentedMomentsResponse {
    success: boolean
    moments?: MomentEntity[]
    total?: number
    error?: string
}

export class GetCommentedMomentsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: GetCommentedMomentsRequest): Promise<GetCommentedMomentsResponse> {
        try {
            // Validar parâmetros
            if (!request.userId) {
                return {
                    success: false,
                    error: "ID do usuário é obrigatório",
                }
            }

            // Validar limites
            if (request.limit !== undefined && (request.limit < 1 || request.limit > 100)) {
                return {
                    success: false,
                    error: "Limite deve estar entre 1 e 100",
                }
            }

            if (request.offset !== undefined && request.offset < 0) {
                return {
                    success: false,
                    error: "Offset deve ser maior ou igual a 0",
                }
            }

            const limit = request.limit || 20
            const offset = request.offset || 0

            // Buscar momentos comentados pelo usuário
            const result = await this.momentService.getCommentedMomentsByUser(
                request.userId,
                limit,
                offset,
            )

            return {
                success: true,
                moments: result.moments,
                total: result.total,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
