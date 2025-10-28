import { Moment, MomentVisibilityEnum } from "@/domain/moment"

import { MomentService } from "@/application/moment/services/moment.service"
import { IUserRepository } from "@/domain/user/repositories/user.repository"

export interface CreateMomentRequest {
    ownerId: string
    videoData: Buffer // Dados do vídeo para processamento
    videoMetadata: {
        filename: string
        mimeType: string
        size: number
    }
    description?: string
    visibility?: MomentVisibilityEnum
    location?: {
        latitude: number
        longitude: number
    }
    device?: {
        type: string
        os: string
        osVersion: string
        model: string
        screenResolution: string
        orientation: string
    }
}

export interface CreateMomentResponse {
    success: boolean
    moment?: Moment
    error?: string
}

export class CreateMomentUseCase {
    constructor(
        private readonly momentService: MomentService,
        private readonly userRepository: IUserRepository,
    ) {}

    /**
     * Executa a criação de um momento
     *
     * Validações realizadas:
     * - Verifica se o usuário existe
     * - Verifica se o usuário está ativo
     * - Verifica se o usuário não está bloqueado
     * - Verifica se o usuário não foi deletado
     * - Verifica se o usuário pode criar momentos (canCreateMoments)
     * - Valida conteúdo obrigatório (content, media, thumbnail)
     */
    async execute(request: CreateMomentRequest): Promise<CreateMomentResponse> {
        try {
            // Validar se o usuário existe e tem permissão
            if (!request.ownerId) {
                return {
                    success: false,
                    error: "Owner ID is required",
                }
            }

            const owner = await this.userRepository.findById(request.ownerId)

            if (!owner) {
                return {
                    success: false,
                    error: "Owner not found",
                }
            }

            // Verificar se o usuário pode criar momentos (verificação final)
            if (!owner.canCreateMoments()) {
                return {
                    success: false,
                    error: "User does not have permission to create moments",
                }
            }

            // Validar dados obrigatórios
            if (!request.videoData || request.videoData.length === 0) {
                return {
                    success: false,
                    error: "Video data is required",
                }
            }

            if (!request.videoMetadata) {
                return {
                    success: false,
                    error: "Video metadata is required",
                }
            }

            // Criar o momento usando o service
            // Se nenhuma visibilidade for fornecida, usar PUBLIC como padrão
            const visibility = request.visibility || MomentVisibilityEnum.PUBLIC

            const moment = await this.momentService.createMoment({
                ownerId: owner.id,
                ownerUsername: owner.username,
                videoData: request.videoData,
                videoMetadata: request.videoMetadata,
                description: request.description || "",
                location: request.location,
                device: request.device,
                visibility,
            })

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
}
