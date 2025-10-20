// ===== UNBLOCK MOMENT USE CASE (ADMIN) =====

import { MomentService } from "@/application/moment/services/moment.service"
import { MomentNotFoundError } from "@/domain/moment/moment.errors"

export interface UnblockMomentRequest {
    momentId: string
    adminId: string
    reason?: string
}

export interface UnblockMomentResponse {
    success: boolean
    moment?: {
        id: string
        status: string
        reason?: string
        unblockedBy: string
        unblockedAt: Date
    }
    error?: string
}

export class UnblockMomentUseCase {
    constructor(private readonly momentService: MomentService) {}

    async execute(request: UnblockMomentRequest): Promise<UnblockMomentResponse> {
        const { momentId, adminId, reason } = request

        try {
            const result = await this.momentService.unblockMoment({
                momentId,
                adminId,
                reason,
            })

            if (!result.success) {
                if (result.error === "Moment not found") {
                    throw new MomentNotFoundError(momentId)
                }
                return {
                    success: false,
                    error: result.error || "Failed to unblock moment",
                }
            }

            return {
                success: true,
                moment: result.moment,
            }
        } catch (error) {
            if (error instanceof MomentNotFoundError) {
                throw error
            }
            return {
                success: false,
                error: "An unexpected error occurred",
            }
        }
    }
}
