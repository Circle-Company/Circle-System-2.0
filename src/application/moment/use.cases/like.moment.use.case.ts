import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { MomentService } from "../services/moment.service"

export interface LikeMomentRequest {
    momentId: string
    userId: string
}

export interface LikeMomentResponse {
    success: boolean
    liked?: boolean
    error?: string
}

export class LikeMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(request: LikeMomentRequest): Promise<LikeMomentResponse> {
        try {
            // Validar parâmetros
            if (!request.momentId) {
                return {
                    success: false,
                    error: "Moment ID is required",
                }
            }

            if (!request.userId) {
                return {
                    success: false,
                    error: "User ID is required",
                }
            }

            // Buscar o momento
            const [moment, isOwner, isInteractable] = await Promise.all([
                this.momentService.getMomentById(request.momentId),
                this.momentRepository.isOwner(request.momentId, request.userId),
                this.momentRepository.isInteractable(
                    request.momentId,
                    request.userId,
                    this.userRepository,
                ),
            ])

            if (!moment) {
                return {
                    success: false,
                    error: "Moment not found",
                }
            }

            if (isOwner) {
                return {
                    success: false,
                    error: "User cannot like their own moment",
                }
            }

            // Verificar se o momento pode ser curtido
            if (!isInteractable) {
                return {
                    success: false,
                    error: "Moment cannot be liked in current state",
                }
            }

            // Verificar se o usuário já curtiu o momento
            const alreadyLiked = await this.momentService.hasUserLikedMoment(
                request.momentId,
                request.userId,
            )

            if (alreadyLiked) {
                return {
                    success: false,
                    error: "User has already liked this moment",
                }
            }

            // Curtir o momento
            await this.momentService.likeMoment(request.momentId, request.userId)

            return {
                success: true,
                liked: true,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }
}
