import { Moment } from "@/domain/moment"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { User } from "@/domain/user/entities/user.entity"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { MomentMetricsService } from "../services/moment.metrics.service"
import { MomentService } from "../services/moment.service"

export interface UnlikeMomentRequest {
    momentId: string
    userId: string
}

export interface UnlikeMomentResponse {
    success: boolean
    unliked?: boolean
    error?: string
}

export class UnlikeMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly userRepository: IUserRepository,
        private readonly metricsService: MomentMetricsService,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: UnlikeMomentRequest): Promise<UnlikeMomentResponse> {
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

            // Remover like do momento + adicionar unlike na métrica se o usuário não já removeu o like do momento
            if (isInteractable && alreadyLiked && !isOwner) {
                await Promise.all([
                    this.momentService.unlikeMoment(moment!.id, requestingUser!.id),
                    this.metricsService.recordUnlike(moment!.id, {
                        userId: requestingUser!.id,
                    }),
                ])
            }
            return {
                success: true,
                unliked: true,
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
