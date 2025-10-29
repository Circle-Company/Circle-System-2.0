import { IUserRepository } from "@/domain/user"
import { IMomentRepository, MomentEntity } from "../../../domain/moment"

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
        private readonly userRepository: IUserRepository,
        private readonly momentRepository: IMomentRepository,
    ) {}

    async execute(request: GetMomentRequest): Promise<GetMomentResponse> {
        try {
            // Validar se o ID do momento foi fornecido
            if (!request.momentId) {
                return {
                    success: false,
                    error: "Moment ID is required",
                }
            }

            // Buscar o momento
            const moment = await this.momentRepository.findById(request.momentId)

            if (!moment) {
                return {
                    success: false,
                    error: "Moment not found",
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
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }

    private async canViewMoment(moment: MomentEntity, userId?: string): Promise<boolean> {
        // Se não há usuário logado, só pode ver momentos públicos
        if (!userId) {
            return moment.visibility.level === "public"
        }

        const owner = await this.userRepository.findById(moment.ownerId)
        const requestingUser = await this.userRepository.findById(userId)
        // if (moment.visibility.ageRestriction && !requestingUser?.) return false
        // if (moment.visibility.contentWarning && !requestingUser?.canViewContentWarning()) return false

        if (requestingUser?.hasViewingRestrictions()) return false
        if (requestingUser?.canViewMoments()) return true

        // Se é o dono do momento, pode ver sempre
        if (owner?.id === userId) {
            return true
        }

        // Verificar nível de visibilidade
        switch (moment.visibility.level) {
            case "public":
                return true
            case "followers_only":
                return await this.userRepository.isFollowing(userId, moment.ownerId)
            case "private":
                return moment.visibility.allowedUsers?.includes(userId) || false
            case "unlisted":
                return true
            default:
                return false
        }
    }
}
