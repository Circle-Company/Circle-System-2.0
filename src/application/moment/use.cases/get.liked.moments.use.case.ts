import { MomentEntity } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface GetLikedMomentsRequest {
    userId: string
    limit?: number
    offset?: number
}

export interface GetLikedMomentsResponse {
    success: boolean
    moments?: MomentEntity[]
    total?: number
    error?: string
}

export class GetLikedMomentsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: GetLikedMomentsRequest): Promise<GetLikedMomentsResponse> {
        try {
            // Validar parâmetros
            if (!request.userId) {
                return {
                    success: false,
                    error: "User ID is required",
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

            // Buscar momentos curtidos pelo usuário
            const result = await this.momentService.getLikedMomentsByUser(
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
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }
}
