/**
 * User Metrics Types
 *
 * Defines types and interfaces for user metrics functionality
 */

export interface UserMetricsProps {
    id?: string
    userId: string
    totalLikesReceived: number
    totalViewsReceived: number
    totalSharesReceived: number
    totalCommentsReceived: number
    totalMemoriesCreated: number
    totalMomentsCreated: number
    totalLikesGiven: number
    totalCommentsGiven: number
    totalSharesGiven: number
    totalFollowsGiven: number
    totalReportsGiven: number
    totalFollowers: number
    totalFollowing: number
    totalRelations: number
    engagementRate: number
    reachRate: number
    momentsPublishedGrowthRate30d: number
    memoriesPublishedGrowthRate30d: number
    followerGrowthRate30d: number
    engagementGrowthRate30d: number
    interactionsGrowthRate30d: number
    memoriesPerDayAverage: number
    momentsPerDayAverage: number
    reportsReceived: number
    violationsCount: number
    lastMetricsUpdate: Date
    createdAt: Date
    updatedAt: Date
}

export interface MetricsUpdateInput {
    likesReceived?: number
    viewsReceived?: number
    sharesReceived?: number
    commentsReceived?: number
    memoriesCreated?: number
    momentsCreated?: number
    likesGiven?: number
    commentsGiven?: number
    sharesGiven?: number
    followsGiven?: number
    reportsGiven?: number
    followers?: number
    following?: number
    reportsReceived?: number
    violationsCount?: number
}

export interface GrowthMetrics {
    momentsPublishedGrowthRate30d: number
    memoriesPublishedGrowthRate30d: number
    followerGrowthRate30d: number
    engagementGrowthRate30d: number
    interactionsGrowthRate30d: number
}

export interface ActivityMetrics {
    memoriesPerDayAverage: number
    momentsPerDayAverage: number
    engagementRate: number
    reachRate: number
}
