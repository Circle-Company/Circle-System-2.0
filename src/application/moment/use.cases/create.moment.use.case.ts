import { IMomentRepository, MomentEntity } from "../../../domain/moment"

import { MomentService } from "../services/moment.service"

export interface CreateMomentRequest {
    ownerId: string
    description?: string
    hashtags?: string[]
    mentions?: string[]
    content: {
        duration: number
        size: number
        format: string
        hasAudio: boolean
        codec: string
        resolution: {
            width: number
            height: number
            quality: string
        }
        createdAt?: Date
        updatedAt?: Date
    }
    media: {
        urls: {
            low: string
            medium: string
            high: string
        }
        storage: {
            provider: string
            bucket: string
            key: string
            region: string
        }
    }
    thumbnail: {
        url: string
        width: number
        height: number
        storage: {
            provider: string
            bucket: string
            key: string
            region: string
        }
    }
    context?: {
        device: {
            type: string
            os: string
            osVersion: string
            model: string
            screenResolution: string
            orientation: string
        }
        location?: {
            latitude: number
            longitude: number
        }
    }
}

export interface CreateMomentResponse {
    success: boolean
    moment?: MomentEntity
    error?: string
}

export class CreateMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: CreateMomentRequest): Promise<CreateMomentResponse> {
        try {
            // Validar se o usuário existe e tem permissão
            if (!request.ownerId) {
                return {
                    success: false,
                    error: "Owner ID é obrigatório",
                }
            }

            // Validar conteúdo obrigatório
            if (!request.content || !request.media || !request.thumbnail) {
                return {
                    success: false,
                    error: "Conteúdo, mídia e thumbnail são obrigatórios",
                }
            }

            // Criar o momento usando o service
            const moment = await this.momentService.createMoment({
                ownerId: request.ownerId,
                description: request.description || "",
                hashtags: request.hashtags || [],
                mentions: request.mentions || [],
                content: {
                    duration: request.content.duration,
                    size: request.content.size,
                    format: request.content.format,
                    width: request.content.resolution.width,
                    height: request.content.resolution.height,
                    hasAudio: request.content.hasAudio,
                    codec: request.content.codec,
                },
                location: request.context?.location,
                device: request.context?.device,
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
