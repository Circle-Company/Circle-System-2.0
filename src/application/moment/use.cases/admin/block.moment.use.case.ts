// ===== BLOCK MOMENT USE CASE (ADMIN) =====

import { MomentService } from "@/application/moment/services/moment.service"
import { MomentNotFoundError } from "@/domain/moment/moment.errors"

export interface BlockMomentRequest {
    momentId: string
    adminId: string
    reason: string
}

export interface BlockMomentResponse {
    success: boolean
    moment?: {
        id: string
        status: string
        reason: string
        blockedBy: string
        blockedAt: Date
    }
    error?: string
}

export class BlockMomentUseCase {
    constructor(private readonly momentService: MomentService) {}

    async execute(request: BlockMomentRequest): Promise<BlockMomentResponse> {
        const { momentId, adminId, reason } = request

        if (!reason || reason.trim().length === 0) {
            return {
                success: false,
                error: "Block reason is required",
            }
        }

        try {
            const result = await this.momentService.blockMoment({
                momentId,
                adminId,
                reason: reason.trim(),
            })

            if (!result.success) {
                if (result.error === "Moment not found") {
                    throw new MomentNotFoundError(momentId)
                }
                return {
                    success: false,
                    error: result.error || "Failed to block moment",
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
