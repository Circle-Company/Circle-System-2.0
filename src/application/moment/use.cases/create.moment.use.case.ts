import { IMomentRepository, Moment } from "@/domain/moment"

import { MomentService } from "@/application/moment/services/moment.service"
import { User } from "@/domain/user/entities/user.entity"
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
    hashtags?: string[]
    mentions?: string[]
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
        private readonly momentRepository: IMomentRepository,
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
                    error: "Owner ID é obrigatório",
                }
            }

            // Verificar se o usuário existe
            let owner: User | null
            try {
                owner = await this.userRepository.findById(request.ownerId)
            } catch (error) {
                return {
                    success: false,
                    error: "ID do usuário inválido",
                }
            }

            if (!owner) {
                return {
                    success: false,
                    error: "Owner não encontrado",
                }
            }

            // Verificar se o usuário pode criar momentos (verificação final)
            if (!owner.canCreateMoments()) {
                return {
                    success: false,
                    error: "Usuário não tem permissão para criar momentos",
                }
            }

            // Validar dados obrigatórios
            if (!request.videoData || request.videoData.length === 0) {
                return {
                    success: false,
                    error: "Dados do vídeo são obrigatórios",
                }
            }

            if (!request.videoMetadata) {
                return {
                    success: false,
                    error: "Metadados do vídeo são obrigatórios",
                }
            }

            // Criar o momento usando o service
            const moment = await this.momentService.createMoment({
                ownerId: request.ownerId,
                videoData: request.videoData,
                videoMetadata: request.videoMetadata,
                description: request.description || "",
                hashtags: request.hashtags || [],
                mentions: request.mentions || [],
                location: request.location,
                device: request.device,
            })

            return {
                success: true,
                moment,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
