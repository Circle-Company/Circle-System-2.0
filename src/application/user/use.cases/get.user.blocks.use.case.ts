/**
 * Get User Blocks Use Case - Caso de uso para obter usuários bloqueados
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserProfilePicture } from "@/domain/user"

export interface GetUserBlocksRequest {
    userId: string
    limit?: number
    offset?: number
}

export interface GetUserBlocksResponse {
    success: boolean
    blocks?: Array<{
        id: string
        username: string
        name: string | null
        profilePicture: UserProfilePicture | null
    }>
    error?: string
}

export class GetUserBlocksUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(request: GetUserBlocksRequest): Promise<GetUserBlocksResponse> {
        try {
            // Validar dados de entrada
            const validationResult = this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Buscar usuários bloqueados
            const blockedUsers = await this.userRepository.getBlockedUsers(
                request.userId,
                request.limit || 50,
                request.offset || 0,
            )

            // Mapear para formato de resposta
            const blocks = blockedUsers.map((user) => ({
                id: user.id,
                username: user.username,
                profilePicture: user.profilePicture || null,
                name: user.name,
            }))

            return {
                success: true,
                blocks,
            }
        } catch (error: any) {
            console.error("Error getting blocked users:", error)
            return {
                success: false,
                error: error.message || "Internal server error",
            }
        }
    }

    private validateRequest(
        request: GetUserBlocksRequest,
    ): { isValid: boolean; error?: string } {
        if (!request.userId || request.userId.trim().length === 0) {
            return {
                isValid: false,
                error: "User ID is required",
            }
        }

        if (request.limit !== undefined && request.limit < 1) {
            return {
                isValid: false,
                error: "Limit must be greater than 0",
            }
        }

        if (request.offset !== undefined && request.offset < 0) {
            return {
                isValid: false,
                error: "Offset must be greater than or equal to 0",
            }
        }

        return { isValid: true }
    }
}

