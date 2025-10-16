/**
 * Regras e configurações centralizadas para Clusters
 */

export const ClusterRules = {
    // ===== LIMIARES DE QUALIDADE =====
    QUALITY_THRESHOLDS: {
        MIN_SIZE: 3,
        MAX_SIZE: 1000,
        OPTIMAL_MIN_SIZE: 10,
        OPTIMAL_MAX_SIZE: 500,

        MIN_COHERENCE: 0.3,
        GOOD_COHERENCE: 0.6,
        EXCELLENT_COHERENCE: 0.8,

        MIN_DENSITY: 0.1,
        GOOD_DENSITY: 0.4,
        EXCELLENT_DENSITY: 0.7,

        MIN_QUALITY_SCORE: 0.4,
        GOOD_QUALITY_SCORE: 0.6,
        EXCELLENT_QUALITY_SCORE: 0.8,
    },

    // ===== CONFIGURAÇÕES DE CLUSTERIZAÇÃO =====
    CLUSTERING: {
        DEFAULT_DIMENSION: 128,
        MIN_DIMENSION: 32,
        MAX_DIMENSION: 512,

        RECOMPUTE_INTERVAL_HOURS: 24,
        STALE_THRESHOLD_HOURS: 72,

        MERGE_SIMILARITY_THRESHOLD: 0.85,
        SPLIT_COHERENCE_THRESHOLD: 0.3,

        AUTO_ARCHIVE_AFTER_DAYS: 30,
        MIN_ACTIVE_MOMENTS: 5,
    },

    // ===== CÁLCULO DE QUALIDADE =====
    QUALITY_CALCULATION: {
        COHERENCE_WEIGHT: 0.35,
        DENSITY_WEIGHT: 0.25,
        SIZE_WEIGHT: 0.2,
        ENGAGEMENT_WEIGHT: 0.2,

        SIZE_SCORE_MIN: 0.2,
        SIZE_SCORE_MAX: 1.0,

        ENGAGEMENT_MIN: 0.0,
        ENGAGEMENT_MAX: 1.0,
    },

    // ===== ESTATÍSTICAS =====
    STATISTICS: {
        MIN_INTERACTIONS_FOR_STATS: 10,
        ENGAGEMENT_RATE_WEIGHT: 0.4,
        GROWTH_RATE_WEIGHT: 0.3,
        RETENTION_RATE_WEIGHT: 0.3,

        GROWTH_RATE_PERIOD_DAYS: 7,
        RETENTION_PERIOD_DAYS: 30,
    },

    // ===== VALIDAÇÃO =====
    VALIDATION: {
        MAX_NAME_LENGTH: 100,
        MAX_DESCRIPTION_LENGTH: 500,
        MAX_TOPICS: 20,
        MIN_TOPICS: 1,

        MAX_CENTROID_MAGNITUDE: 10.0,
        MIN_SIMILARITY: 0.0,
        MAX_SIMILARITY: 1.0,

        REQUIRED_FIELDS: ["centroid", "dimension"],
    },

    // ===== ATRIBUIÇÕES =====
    ASSIGNMENT: {
        MIN_SIMILARITY_THRESHOLD: 0.5,
        GOOD_SIMILARITY_THRESHOLD: 0.7,
        EXCELLENT_SIMILARITY_THRESHOLD: 0.85,

        MIN_CONFIDENCE: 0.0,
        MAX_CONFIDENCE: 1.0,

        AUTO_ASSIGN_THRESHOLD: 0.8,
        MANUAL_REVIEW_THRESHOLD: 0.6,
    },

    // ===== ANÁLISE E RECOMENDAÇÕES =====
    ANALYSIS: {
        LOW_COHERENCE_THRESHOLD: 0.4,
        LOW_DENSITY_THRESHOLD: 0.2,
        OVERSIZED_THRESHOLD: 800,
        UNDERSIZED_THRESHOLD: 5,

        MERGE_RECOMMENDATION_CONFIDENCE: 0.7,
        SPLIT_RECOMMENDATION_CONFIDENCE: 0.6,
        RECOMPUTE_RECOMMENDATION_CONFIDENCE: 0.5,

        MAX_ISSUES_PER_ANALYSIS: 10,
        MAX_RECOMMENDATIONS_PER_ANALYSIS: 5,
    },

    // ===== CONFIGURAÇÕES PADRÃO =====
    DEFAULT_CONFIG: {
        minSize: 3,
        maxSize: 1000,
        recomputeInterval: 24,
        qualityThreshold: 0.5,
        autoArchive: true,
        autoMerge: false,
        mergeThreshold: 0.85,
    },

    // ===== MAPEAMENTO DE QUALIDADE =====
    QUALITY_MAPPING: {
        LOW: { min: 0.0, max: 0.4 },
        MEDIUM: { min: 0.4, max: 0.6 },
        HIGH: { min: 0.6, max: 0.8 },
        EXCELLENT: { min: 0.8, max: 1.0 },
    },
} as const

// ===== TIPOS DERIVADOS =====
export type ClusterRulesType = typeof ClusterRules
export type QualityThresholds = typeof ClusterRules.QUALITY_THRESHOLDS
export type ClusteringConfig = typeof ClusterRules.CLUSTERING
export type QualityCalculation = typeof ClusterRules.QUALITY_CALCULATION
export type StatisticsConfig = typeof ClusterRules.STATISTICS
export type ValidationRules = typeof ClusterRules.VALIDATION
export type AssignmentRules = typeof ClusterRules.ASSIGNMENT
export type AnalysisRules = typeof ClusterRules.ANALYSIS
export type DefaultConfig = typeof ClusterRules.DEFAULT_CONFIG
