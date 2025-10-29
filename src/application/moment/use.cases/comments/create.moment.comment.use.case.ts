import { ModerationEngine } from "@/core/content.moderation/moderation"
import { CommentSentimentEnum, Moment } from "@/domain/moment"
import { Comment } from "@/domain/moment/entities/comment.entity"
import { ICommentRepository } from "@/domain/moment/repositories/comment.repository"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { User } from "@/domain/user/entities/user.entity"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { textLib } from "@/shared/circle.text.library"

export interface ResponseComment {
    id: string
    user: {
        id: string
        username: string
        profilePicture: string
    },
    content: string
    richContent: string
    sentiment: CommentSentimentEnum
    createdAt: Date
    
}

export interface CommentMomentRequest {
    momentId: string
    userId: string
    content: string
    replyId?: string
}

export interface CommentMomentResponse {
    success: boolean
    comment?: Comment
    error?: string
}

export class CommentMomentUseCase {
    constructor(
        private readonly moderationEngine: ModerationEngine,
        private readonly commentRepository: ICommentRepository,
        private readonly momentRepository: IMomentRepository,
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(request: CommentMomentRequest): Promise<CommentMomentResponse> {
        try {
            const hasReply = !!request.replyId

            // Buscar entidades e mapear mentions com IDs
            const [entitiesWithIds, user, moment] = await Promise.all([
                this._findEntities(request.content),
                this.userRepository.findById(request.userId),
                this.momentRepository.findById(request.momentId),
            ])

            if (!user) return { success: false, error: "User not found" }
            if (!moment) return { success: false, error: "Moment not found" }

            const [permissionsCheck, replyToComment] = await Promise.all([
                this._commentPermissionsCheck(user, moment),
                hasReply ? this.commentRepository.findById(request.replyId!) : Promise.resolve(null),
            ])

            if (!permissionsCheck.allowed) return { success: false, error: permissionsCheck.reason }
            if (hasReply && !replyToComment) return { success: false, error: "Reply to comment not found" }

            const richContent = textLib.rich.formatToEnriched(request.content, entitiesWithIds)
            // Criar o comentário
            const comment = Comment.create({
                momentId: request.momentId,
                userId: request.userId,
                content: request.content,
                richContent: richContent,
                replyId: request.replyId || null,
            })

            const moderationResult = await this.moderationEngine.moderateComment(comment)

            if (moderationResult.success) comment.applyModerationResult(moderationResult.moderationFields)

            // Executar incrementReplies e create em paralelo
            const [savedComment] = await Promise.all([
                this.commentRepository.create(comment),
                hasReply ? this.commentRepository.incrementReplies(request.replyId!) : Promise.resolve(),
            ])

            return { success: true, comment: savedComment }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Internal server error" }
        }
    }

    private async _findEntities(
        content: string,
    ): Promise<{
        mentions?: Record<string, string>
    }> {
        // Extrair mentions do conteúdo usando textLib
        textLib.extractor.setText(content)
        const entities = textLib.extractor.entities({ mentions: true })

        // Obter os usernames extraídos (remover o @ se presente)
        const extractedMentions = entities.mentions || []
        const usernames = extractedMentions.map((mention: string) => mention.replace(/^@/, ""))

        // Buscar IDs dos usuários mencionados
        const mentionsWithIds: Record<string, string> = {}

        if (usernames.length > 0) {
            // Remover duplicatas mantendo a ordem
            const uniqueUsernames = Array.from(new Set(usernames))

            // Buscar todos os usuários em paralelo
            const usersPromises = uniqueUsernames.map((username) =>
                this.userRepository.findByUsername(username),
            )

            const users = await Promise.all(usersPromises)

            // Mapear username -> ID (apenas usuários encontrados)
            uniqueUsernames.forEach((username, index) => {
                const user = users[index]
                if (user) {
                    mentionsWithIds[username] = user.id
                }
            })
        }

        return {
            mentions: Object.keys(mentionsWithIds).length > 0 ? mentionsWithIds : undefined,
        }
    }

    private async _commentPermissionsCheck(user: User, moment: Moment): Promise<{ allowed: boolean, reason?: string }> {
            // Verificar se o usuário pode comentar
            const [canComment, isInteractable] = await Promise.all([
                moment.canComment(user, this.userRepository),
                moment.isInteractable(this.userRepository, user),
            ])
            if (!canComment.allowed) return { allowed: false, reason: canComment.reason }
            if (!isInteractable) return { allowed: false, reason: "Moment is not available for comments" }
            return { allowed: true }

    }

}
