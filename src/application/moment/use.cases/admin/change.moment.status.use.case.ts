// ===== CHANGE MOMENT STATUS USE CASE (ADMIN) =====

import { MomentService } from "@/application/moment/services/moment.service"
import { MomentNotFoundError } from "@/domain/moment/moment.errors"

export interface ChangeMomentStatusRequest {
    momentId: string
    adminId: string
    status: "published" | "archived" | "deleted" | "blocked" | "under_review"
    reason?: string
}

export interface ChangeMomentStatusResponse {
    success: boolean
    moment?: {
        id: string
        status: string
        reason?: string
        changedBy: string
        changedAt: Date
    }
    error?: string
}

export class ChangeMomentStatusUseCase {
    constructor(private readonly momentService: MomentService) {}

    async execute(request: ChangeMomentStatusRequest): Promise<ChangeMomentStatusResponse> {
        const { momentId, adminId, status, reason } = request

        try {
            const result = await this.momentService.changeMomentStatus({
                momentId,
                adminId,
                status,
                reason,
            })

            if (!result.success) {
                if (result.error === "Moment not found") {
                    throw new MomentNotFoundError()
                }
                return {
                    success: false,
                    error: result.error || "Failed to change moment status",
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
