/**
 * Repository para comentários de momentos
 * Implementa operações CRUD e busca avançada para comentários
 */

import {
    CommentAnalytics,
    CommentFilters,
    CommentSearchOptions,
    CommentSortOptions,
} from "../types/comment.type"

import { Comment } from "../entities/comment.entity"

export interface ICommentRepository {
    // Operações básicas CRUD
    create(comment: Comment): Promise<Comment>
    findById(id: string): Promise<Comment | null>
    update(comment: Comment): Promise<Comment>
    delete(id: string): Promise<void>

    // Operações de busca
    findByMomentId(momentId: string, limit?: number, offset?: number): Promise<Comment[]>
    findByUserId(userId: string, limit?: number, offset?: number): Promise<Comment[]>
    findByReplyId(
        replyId: string,
        limit?: number,
        offset?: number,
    ): Promise<Comment[]>

    // Operações de busca avançada
    findTopLevelComments(momentId: string, limit?: number, offset?: number): Promise<Comment[]>
    findRepliesToComment(commentId: string, limit?: number, offset?: number): Promise<Comment[]>

    // Operações por status e categoria
    findByStatus(status: string, limit?: number, offset?: number): Promise<Comment[]>
    findByCategory(category: string, limit?: number, offset?: number): Promise<Comment[]>
    findBySentiment(sentiment: string, limit?: number, offset?: number): Promise<Comment[]>
    findBySeverity(severity: string, limit?: number, offset?: number): Promise<Comment[]>

    // Operações de moderação
    findPendingModeration(limit?: number, offset?: number): Promise<Comment[]>
    findFlaggedComments(limit?: number, offset?: number): Promise<Comment[]>
    findHiddenComments(limit?: number, offset?: number): Promise<Comment[]>
    findDeletedComments(limit?: number, offset?: number): Promise<Comment[]>

    // Operações de busca por conteúdo
    findByContent(content: string, limit?: number, offset?: number): Promise<Comment[]>
    findByMention(mention: string, limit?: number, offset?: number): Promise<Comment[]>
    findByHashtag(hashtag: string, limit?: number, offset?: number): Promise<Comment[]>

    // Operações de contagem
    countByMomentId(momentId: string): Promise<number>
    countByUserId(userId: string): Promise<number>
    countByStatus(status: string): Promise<number>
    countByCategory(category: string): Promise<number>
    countBySentiment(sentiment: string): Promise<number>
    countPendingModeration(): Promise<number>

    // Operações de existência
    exists(id: string): Promise<boolean>
    existsByMomentId(momentId: string): Promise<boolean>
    existsByUserId(userId: string): Promise<boolean>

    // Operações em lote
    createMany(comments: Comment[]): Promise<Comment[]>
    updateMany(comments: Comment[]): Promise<Comment[]>
    deleteMany(ids: string[]): Promise<void>

    // Operações de paginação
    findPaginated(
        page: number,
        limit: number,
        filters?: CommentFilters,
        sort?: CommentSortOptions,
    ): Promise<{
        comments: Comment[]
        total: number
        page: number
        limit: number
        totalPages: number
    }>

    // Operações de busca
    search(options: CommentSearchOptions): Promise<Comment[]>

    // Análise e estatísticas
    getAnalytics(filters?: CommentFilters): Promise<CommentAnalytics>
    getStats(): Promise<{
        totalComments: number
        activeComments: number
        hiddenComments: number
        deletedComments: number
        flaggedComments: number
        pendingModeration: number
        averageLikes: number
        averageReplies: number
        topCommenters: Array<{ userId: string; count: number }>
    }>

    // Operações de interação
    incrementLikes(commentId: string): Promise<void>
    decrementLikes(commentId: string): Promise<void>
    incrementReplies(commentId: string): Promise<void>
    decrementReplies(commentId: string): Promise<void>
    incrementReports(commentId: string): Promise<void>
    incrementViews(commentId: string): Promise<void>
}

export abstract class BaseCommentRepository implements ICommentRepository {
    // Métodos abstratos que devem ser implementados pelas classes filhas
    abstract create(comment: Comment): Promise<Comment>
    abstract findById(id: string): Promise<Comment | null>
    abstract update(comment: Comment): Promise<Comment>
    abstract delete(id: string): Promise<void>
    abstract findByMomentId(momentId: string, limit?: number, offset?: number): Promise<Comment[]>
    abstract findByUserId(userId: string, limit?: number, offset?: number): Promise<Comment[]>
    abstract findByReplyId(
        replyId: string,
        limit?: number,
        offset?: number,
    ): Promise<Comment[]>
    abstract findTopLevelComments(
        momentId: string,
        limit?: number,
        offset?: number,
    ): Promise<Comment[]>
    abstract findRepliesToComment(
        commentId: string,
        limit?: number,
        offset?: number,
    ): Promise<Comment[]>
    abstract findByStatus(status: string, limit?: number, offset?: number): Promise<Comment[]>
    abstract findByCategory(category: string, limit?: number, offset?: number): Promise<Comment[]>
    abstract findBySentiment(sentiment: string, limit?: number, offset?: number): Promise<Comment[]>
    abstract findBySeverity(severity: string, limit?: number, offset?: number): Promise<Comment[]>
    abstract findPendingModeration(limit?: number, offset?: number): Promise<Comment[]>
    abstract findFlaggedComments(limit?: number, offset?: number): Promise<Comment[]>
    abstract findHiddenComments(limit?: number, offset?: number): Promise<Comment[]>
    abstract findDeletedComments(limit?: number, offset?: number): Promise<Comment[]>
    abstract findByContent(content: string, limit?: number, offset?: number): Promise<Comment[]>
    abstract findByMention(mention: string, limit?: number, offset?: number): Promise<Comment[]>
    abstract findByHashtag(hashtag: string, limit?: number, offset?: number): Promise<Comment[]>
    abstract countByMomentId(momentId: string): Promise<number>
    abstract countByUserId(userId: string): Promise<number>
    abstract countByStatus(status: string): Promise<number>
    abstract countByCategory(category: string): Promise<number>
    abstract countBySentiment(sentiment: string): Promise<number>
    abstract countPendingModeration(): Promise<number>
    abstract exists(id: string): Promise<boolean>
    abstract existsByMomentId(momentId: string): Promise<boolean>
    abstract existsByUserId(userId: string): Promise<boolean>
    abstract createMany(comments: Comment[]): Promise<Comment[]>
    abstract updateMany(comments: Comment[]): Promise<Comment[]>
    abstract deleteMany(ids: string[]): Promise<void>
    abstract findPaginated(
        page: number,
        limit: number,
        filters?: CommentFilters,
        sort?: CommentSortOptions,
    ): Promise<{
        comments: Comment[]
        total: number
        page: number
        limit: number
        totalPages: number
    }>
    abstract search(options: CommentSearchOptions): Promise<Comment[]>
    abstract getAnalytics(filters?: CommentFilters): Promise<CommentAnalytics>
    abstract getStats(): Promise<{
        totalComments: number
        activeComments: number
        hiddenComments: number
        deletedComments: number
        flaggedComments: number
        pendingModeration: number
        averageLikes: number
        averageReplies: number
        topCommenters: Array<{ userId: string; count: number }>
    }>
    abstract incrementLikes(commentId: string): Promise<void>
    abstract decrementLikes(commentId: string): Promise<void>
    abstract incrementReplies(commentId: string): Promise<void>
    abstract decrementReplies(commentId: string): Promise<void>
    abstract incrementReports(commentId: string): Promise<void>
    abstract incrementViews(commentId: string): Promise<void>
}
