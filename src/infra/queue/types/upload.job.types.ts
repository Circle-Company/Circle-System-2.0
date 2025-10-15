export interface EmbeddingJobData {
    momentId: string
    originalVideoUrl: string
    thumbnailUrl: string
    videoMetadata: {
        width: number
        height: number
        duration: number
        codec: string
        hasAudio: boolean
    }
    priority: number
    scheduledFor?: Date
}
