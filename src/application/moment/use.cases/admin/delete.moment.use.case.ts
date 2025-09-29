// ===== DELETE MOMENT USE CASE (ADMIN) =====

import { MomentService } from "@/application/moment/services/moment.service"
import { MomentNotFoundError } from "@/domain/moment/errors/moment.errors"

export interface DeleteMomentRequest {
    momentId: string
    adminId: string
    reason: string
}

export interface DeleteMomentResponse {
    success: boolean
    error?: string
}

export class DeleteMomentUseCase {
    constructor(private readonly momentService: MomentService) {}

    async execute(request: DeleteMomentRequest): Promise<DeleteMomentResponse> {
        const { momentId, adminId, reason } = request

        if (!reason || reason.trim().length === 0) {
            return {
                success: false,
                error: "Delete reason is required",
            }
        }

        try {
            const success = await this.momentService.deleteMoment(momentId, reason.trim())

            if (!success) {
                return {
                    success: false,
                    error: "Failed to delete moment",
                }
            }

            return {
                success: true,
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes("não encontrado")) {
                throw new MomentNotFoundError()
            }
            return {
                success: false,
                error: "An unexpected error occurred",
            }
        }
    }
}
