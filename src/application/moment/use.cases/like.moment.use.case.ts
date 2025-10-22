import { Moment } from "@/domain/moment/entities/moment.entity"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { User } from "@/domain/user/entities/user.entity"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { MomentMetricsService } from "../services/moment.metrics.service"
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
        private readonly userRepository: IUserRepository,
        private readonly metricsService: MomentMetricsService,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: LikeMomentRequest): Promise<LikeMomentResponse> {
        try {
            const [moment, requestingUser] = await Promise.all([
                this.momentRepository.findById(request.momentId)!,
                this.userRepository.findById(request.userId),
            ])

            const [isInteractable, alreadyLiked, isOwner] = await Promise.all([
                moment?.isInteractable(this.userRepository, requestingUser!),
                this.momentService.hasUserLikedMoment(request.momentId, request.userId),
                moment?.ownerId === request.userId,
            ])

            this._validateData(requestingUser, moment, isOwner, isInteractable, alreadyLiked)

            // Curtir moment + adicionar like na métrica se o usuário não já curtiu o momento
            if (isInteractable && !alreadyLiked && !isOwner) {
                await Promise.all([
                    this.momentService.likeMoment(moment!.id, requestingUser!.id),
                    this.metricsService.recordLike(moment!.id, {
                        userId: requestingUser!.id,
                    }),
                ])
            }

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
    private _validateData(
        requestingUser: User | null,
        moment: Moment | null,
        isOwner: boolean | undefined,
        isInteractable: boolean | undefined,
        alreadyLiked: boolean | undefined,
    ) {
        if (!requestingUser) return { success: false, error: "User not found" }

        if (!moment)
            return {
                success: false,
                error: "Moment not found",
            }

        if (isOwner)
            return {
                success: false,
                error: "User cannot like their own moment",
            }

        // Verificar se o momento pode ser curtido
        if (!isInteractable)
            return {
                success: false,
                error: "Moment cannot be liked in current state",
            }
        if (alreadyLiked) {
            return {
                success: false,
                error: "User has already liked this moment",
            }
        }
    }
}
