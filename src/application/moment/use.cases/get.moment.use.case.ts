import { MomentEntity, IMomentRepository } from "../../../domain/moment"
import { MomentService } from "../services/moment.service"

export interface GetMomentRequest {
    momentId: string
    userId?: string // Para verificar permissões
    includeMetrics?: boolean
}

export interface GetMomentResponse {
    success: boolean
    moment?: MomentEntity
    error?: string
}

export class GetMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: GetMomentRequest): Promise<GetMomentResponse> {
        try {
            // Validar se o ID do momento foi fornecido
            if (!request.momentId) {
                return {
                    success: false,
                    error: "ID do momento é obrigatório",
                }
            }

            // Buscar o momento
            const moment = await this.momentService.getMomentById(request.momentId)

            if (!moment) {
                return {
                    success: false,
                    error: "Momento não encontrado",
                }
            }

            // Verificar permissões de visualização
            if (!this.canViewMoment(moment, request.userId)) {
                return {
                    success: false,
                    error: "Acesso negado",
                }
            }

            return {
                success: true,
                moment,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    private canViewMoment(moment: MomentEntity, userId?: string): boolean {
        // Se não há usuário logado, só pode ver momentos públicos
        if (!userId) {
            return moment.visibility.level === "public"
        }

        // Se é o dono do momento, pode ver sempre
        if (moment.ownerId === userId) {
            return true
        }

        // Verificar nível de visibilidade
        switch (moment.visibility.level) {
            case "public":
                return true
            case "followers_only":
                // Aqui deveria verificar se o usuário segue o dono
                // Por enquanto, assumindo que pode ver
                return true
            case "private":
                return moment.visibility.allowedUsers?.includes(userId) || false
            case "unlisted":
                return true
            default:
                return false
        }
    }
}
