/**
 * Engagement Calculator
 * Serviço desacoplado para calcular engagement vectors
 */

import { EngagementFeatures, EngagementMetrics, EngagementVector } from "../../types/embedding.generation.types"
import { normalizeL2 } from "../../utils/normalization"

export interface CalculateEngagementParams {
    momentId: string
    metrics: EngagementMetrics
    duration: number
    createdAt: Date
}

export interface CalculateEngagementResult {
    success: boolean
    vector?: EngagementVector
    error?: string
}

/**
 * Calculador de Engagement Vector com arquitetura desacoplada
 */
export class EngagementCalculator {
    /**
     * Calcula engagement vector com features normalizadas
     */
    async calculate(params: CalculateEngagementParams): Promise<CalculateEngagementResult> {
        try {
            console.log(`[EngagementCalculator] 📊 Calculando engagement: ${params.momentId}`)

            const { metrics, duration } = params

            // Calcular features normalizadas
            const features: EngagementFeatures = {
                likeRate: metrics.views > 0 ? metrics.likes / metrics.views : 0,
                commentRate: metrics.views > 0 ? metrics.comments / metrics.views : 0,
                shareRate: metrics.views > 0 ? metrics.shares / metrics.views : 0,
                saveRate: metrics.views > 0 ? metrics.saves / metrics.views : 0,
                retentionRate:
                    metrics.views > 0 && duration > 0
                        ? metrics.avgWatchTime / (metrics.views * duration)
                        : 0,
                avgCompletionRate: metrics.completionRate,
                reportRate: metrics.views > 0 ? metrics.reports / metrics.views : 0,
                viralityScore: 0,
                qualityScore: 0,
            }

            // Calcular scores compostos
            features.viralityScore = (features.shareRate + features.saveRate) / 2
            features.qualityScore = Math.max(
                0,
                features.retentionRate + features.avgCompletionRate - features.reportRate * 2,
            )

            // Montar vetor de features (9 dimensões)
            const rawVector: number[] = [
                features.likeRate,
                features.commentRate,
                features.shareRate,
                features.saveRate,
                features.retentionRate,
                features.avgCompletionRate,
                features.reportRate,
                features.viralityScore,
                features.qualityScore,
            ]

            // Normalizar vetor
            const normalizedVector = normalizeL2(rawVector)

            const engagementVector: EngagementVector = {
                vector: normalizedVector,
                dimension: normalizedVector.length,
                metrics,
                features,
                metadata: {
                    lastUpdated: new Date(),
                    version: "engagement-vector-v1",
                    calculationMethod: "normalized-features",
                },
            }

            console.log(
                `[EngagementCalculator] ✅ Calculado: quality=${(features.qualityScore * 100).toFixed(1)}%`,
            )

            return {
                success: true,
                vector: engagementVector,
            }
        } catch (error) {
            console.error("[EngagementCalculator] ❌ Erro:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }
}

