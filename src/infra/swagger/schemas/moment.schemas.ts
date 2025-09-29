// ===== MOMENT SWAGGER SCHEMAS =====

export const CreateMomentSchema = {
    type: "object",
    properties: {
        description: {
            type: "string",
            minLength: 1,
            maxLength: 500,
            description: "Descrição do momento",
            example: "Meu primeiro vlog sobre tecnologia!",
        },
        hashtags: {
            type: "array",
            items: {
                type: "string",
            },
            maxItems: 10,
            description: "Lista de hashtags",
            example: ["tecnologia", "vlog", "programação"],
        },
        mentions: {
            type: "array",
            items: {
                type: "string",
            },
            maxItems: 10,
            description: "Lista de menções de usuários",
            example: ["@johndoe", "@janedoe"],
        },
        visibility: {
            type: "string",
            enum: ["public", "followers_only", "private", "unlisted"],
            default: "public",
            description: "Nível de visibilidade do momento",
        },
        ageRestriction: {
            type: "boolean",
            default: false,
            description: "Se o conteúdo tem restrição de idade",
        },
        contentWarning: {
            type: "boolean",
            default: false,
            description: "Se o conteúdo tem aviso de conteúdo sensível",
        },
    },
    required: [],
}

export const UpdateMomentSchema = {
    type: "object",
    properties: {
        description: {
            type: "string",
            minLength: 1,
            maxLength: 500,
            description: "Nova descrição do momento",
        },
        hashtags: {
            type: "array",
            items: {
                type: "string",
            },
            maxItems: 10,
            description: "Nova lista de hashtags",
        },
        mentions: {
            type: "array",
            items: {
                type: "string",
            },
            maxItems: 10,
            description: "Nova lista de menções",
        },
        visibility: {
            type: "string",
            enum: ["public", "followers_only", "private", "unlisted"],
            description: "Novo nível de visibilidade",
        },
        ageRestriction: {
            type: "boolean",
            description: "Nova configuração de restrição de idade",
        },
        contentWarning: {
            type: "boolean",
            description: "Nova configuração de aviso de conteúdo",
        },
    },
    required: [],
}

export const CommentSchema = {
    type: "object",
    properties: {
        content: {
            type: "string",
            minLength: 1,
            maxLength: 500,
            description: "Conteúdo do comentário",
            example: "Muito bom o vlog!",
        },
    },
    required: ["content"],
}

export const ReportSchema = {
    type: "object",
    properties: {
        reason: {
            type: "string",
            enum: [
                "spam",
                "inappropriate_content",
                "harassment",
                "violence",
                "hate_speech",
                "fake_news",
                "copyright_violation",
                "other",
            ],
            description: "Motivo do report",
            example: "inappropriate_content",
        },
        description: {
            type: "string",
            maxLength: 1000,
            description: "Descrição adicional do report",
            example: "Conteúdo inadequado para menores",
        },
    },
    required: ["reason"],
}

export const ListMomentsQuerySchema = {
    type: "object",
    properties: {
        page: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Número da página",
        },
        limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20,
            description: "Itens por página",
        },
        sortBy: {
            type: "string",
            enum: ["createdAt", "updatedAt", "likes", "views"],
            default: "createdAt",
            description: "Campo para ordenação",
        },
        sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
            description: "Ordem da ordenação",
        },
        status: {
            type: "string",
            enum: ["published", "archived", "deleted", "blocked", "under_review"],
            default: "published",
            description: "Status dos momentos",
        },
    },
    required: [],
}

export const SearchMomentsQuerySchema = {
    type: "object",
    properties: {
        q: {
            type: "string",
            minLength: 1,
            description: "Termo de busca",
            example: "tecnologia",
        },
        page: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Número da página",
        },
        limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20,
            description: "Itens por página",
        },
        type: {
            type: "string",
            enum: ["all", "text", "hashtag", "location"],
            default: "all",
            description: "Tipo de busca",
        },
    },
    required: ["q"],
}

export const MomentResponseSchema = {
    type: "object",
    properties: {
        id: {
            type: "string",
            description: "ID único do momento",
            example: "123456789",
        },
        ownerId: {
            type: "string",
            description: "ID do proprietário do momento",
            example: "987654321",
        },
        description: {
            type: "string",
            description: "Descrição do momento",
            example: "Meu primeiro vlog sobre tecnologia!",
        },
        hashtags: {
            type: "array",
            items: {
                type: "string",
            },
            description: "Lista de hashtags",
            example: ["tecnologia", "vlog", "programação"],
        },
        mentions: {
            type: "array",
            items: {
                type: "string",
            },
            description: "Lista de menções",
            example: ["@johndoe", "@janedoe"],
        },
        status: {
            type: "object",
            properties: {
                current: {
                    type: "string",
                    description: "Status atual",
                    example: "published",
                },
                previous: {
                    type: "string",
                    nullable: true,
                    description: "Status anterior",
                    example: "draft",
                },
                reason: {
                    type: "string",
                    nullable: true,
                    description: "Motivo da mudança de status",
                    example: "Aprovado pela moderação",
                },
                changedBy: {
                    type: "string",
                    nullable: true,
                    description: "ID de quem alterou o status",
                    example: "moderator_123",
                },
                changedAt: {
                    type: "string",
                    format: "date-time",
                    description: "Data da mudança de status",
                },
            },
            required: ["current", "changedAt"],
        },
        visibility: {
            type: "object",
            properties: {
                level: {
                    type: "string",
                    enum: ["public", "followers_only", "private", "unlisted"],
                    description: "Nível de visibilidade",
                    example: "public",
                },
                allowedUsers: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    description: "Usuários permitidos (para visibilidade privada)",
                },
                blockedUsers: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    description: "Usuários bloqueados",
                },
                ageRestriction: {
                    type: "boolean",
                    description: "Se tem restrição de idade",
                    example: false,
                },
                contentWarning: {
                    type: "boolean",
                    description: "Se tem aviso de conteúdo",
                    example: false,
                },
            },
            required: ["level", "ageRestriction", "contentWarning"],
        },
        metrics: {
            type: "object",
            properties: {
                views: {
                    type: "object",
                    properties: {
                        totalViews: {
                            type: "integer",
                            description: "Total de visualizações",
                            example: 1000,
                        },
                        uniqueViews: {
                            type: "integer",
                            description: "Visualizações únicas",
                            example: 800,
                        },
                        repeatViews: {
                            type: "integer",
                            description: "Visualizações repetidas",
                            example: 200,
                        },
                        completionViews: {
                            type: "integer",
                            description: "Visualizações completas",
                            example: 600,
                        },
                        averageWatchTime: {
                            type: "number",
                            description: "Tempo médio de visualização (segundos)",
                            example: 45.5,
                        },
                        averageCompletionRate: {
                            type: "number",
                            description: "Taxa média de conclusão",
                            example: 0.75,
                        },
                        bounceRate: {
                            type: "number",
                            description: "Taxa de rejeição",
                            example: 0.25,
                        },
                    },
                },
                engagement: {
                    type: "object",
                    properties: {
                        totalLikes: {
                            type: "integer",
                            description: "Total de curtidas",
                            example: 50,
                        },
                        totalComments: {
                            type: "integer",
                            description: "Total de comentários",
                            example: 25,
                        },
                        totalReports: {
                            type: "integer",
                            description: "Total de reports",
                            example: 0,
                        },
                        likeRate: {
                            type: "number",
                            description: "Taxa de curtidas",
                            example: 0.05,
                        },
                        commentRate: {
                            type: "number",
                            description: "Taxa de comentários",
                            example: 0.025,
                        },
                        reportRate: {
                            type: "number",
                            description: "Taxa de reports",
                            example: 0,
                        },
                    },
                },
                performance: {
                    type: "object",
                    properties: {
                        loadTime: {
                            type: "number",
                            description: "Tempo de carregamento (segundos)",
                            example: 2.5,
                        },
                        bufferTime: {
                            type: "number",
                            description: "Tempo de buffer (segundos)",
                            example: 0.5,
                        },
                        errorRate: {
                            type: "number",
                            description: "Taxa de erro",
                            example: 0.01,
                        },
                        qualitySwitches: {
                            type: "integer",
                            description: "Mudanças de qualidade",
                            example: 1,
                        },
                    },
                },
                viral: {
                    type: "object",
                    properties: {
                        viralScore: {
                            type: "number",
                            description: "Score viral",
                            example: 75,
                        },
                        trendingScore: {
                            type: "number",
                            description: "Score de tendência",
                            example: 80,
                        },
                        reachScore: {
                            type: "number",
                            description: "Score de alcance",
                            example: 70,
                        },
                        influenceScore: {
                            type: "number",
                            description: "Score de influência",
                            example: 65,
                        },
                        growthRate: {
                            type: "number",
                            description: "Taxa de crescimento",
                            example: 0.15,
                        },
                        totalReach: {
                            type: "integer",
                            description: "Alcance total",
                            example: 1500,
                        },
                    },
                },
                content: {
                    type: "object",
                    properties: {
                        contentQualityScore: {
                            type: "number",
                            description: "Score de qualidade do conteúdo",
                            example: 85,
                        },
                        audioQualityScore: {
                            type: "number",
                            description: "Score de qualidade do áudio",
                            example: 80,
                        },
                        videoQualityScore: {
                            type: "number",
                            description: "Score de qualidade do vídeo",
                            example: 90,
                        },
                        faceDetectionRate: {
                            type: "number",
                            description: "Taxa de detecção de faces",
                            example: 0.95,
                        },
                    },
                },
                lastMetricsUpdate: {
                    type: "string",
                    format: "date-time",
                    description: "Última atualização das métricas",
                },
                metricsVersion: {
                    type: "string",
                    description: "Versão das métricas",
                    example: "1.0.0",
                },
                dataQuality: {
                    type: "number",
                    description: "Qualidade dos dados",
                    example: 0.95,
                },
                confidenceLevel: {
                    type: "number",
                    description: "Nível de confiança",
                    example: 0.9,
                },
            },
        },
        createdAt: {
            type: "string",
            format: "date-time",
            description: "Data de criação",
        },
        updatedAt: {
            type: "string",
            format: "date-time",
            description: "Data de atualização",
        },
        publishedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Data de publicação",
        },
        archivedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Data de arquivamento",
        },
        deletedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Data de exclusão",
        },
    },
    required: [
        "id",
        "ownerId",
        "description",
        "hashtags",
        "mentions",
        "status",
        "visibility",
        "metrics",
        "createdAt",
        "updatedAt",
    ],
}

export const MomentListResponseSchema = {
    type: "array",
    items: {
        $ref: "#/components/schemas/MomentResponse",
    },
}

export const MomentErrorSchema = {
    type: "object",
    properties: {
        error: {
            type: "string",
            description: "Mensagem de erro",
            example: "Momento não encontrado",
        },
        code: {
            type: "string",
            description: "Código do erro",
            example: "MOMENT_NOT_FOUND",
        },
        details: {
            type: "object",
            description: "Detalhes adicionais do erro",
        },
    },
    required: ["error"],
}

// ===== MOMENT METRICS SCHEMAS =====

export const GetMomentMetricsQuerySchema = {
    type: "object",
    properties: {
        period: {
            type: "string",
            enum: ["hourly", "daily", "weekly", "monthly"],
            default: "daily",
            description: "Período das métricas",
        },
        startDate: {
            type: "string",
            format: "date-time",
            description: "Data de início",
        },
        endDate: {
            type: "string",
            format: "date-time",
            description: "Data de fim",
        },
        includeDetails: {
            type: "boolean",
            default: false,
            description: "Incluir detalhes adicionais",
        },
    },
    required: [],
}

export const GetAnalyticsQuerySchema = {
    type: "object",
    properties: {
        period: {
            type: "string",
            enum: ["daily", "weekly", "monthly", "yearly"],
            default: "daily",
            description: "Período dos analytics",
        },
        startDate: {
            type: "string",
            format: "date-time",
            description: "Data de início",
        },
        endDate: {
            type: "string",
            format: "date-time",
            description: "Data de fim",
        },
        userId: {
            type: "string",
            description: "ID do usuário (para analytics específicos)",
        },
        category: {
            type: "string",
            enum: [
                "views",
                "engagement",
                "performance",
                "viral",
                "audience",
                "content",
                "monetization",
            ],
            description: "Categoria dos analytics",
        },
        includeTrends: {
            type: "boolean",
            default: true,
            description: "Incluir tendências",
        },
        includeComparisons: {
            type: "boolean",
            default: false,
            description: "Incluir comparações",
        },
    },
    required: [],
}

export const MomentMetricsResponseSchema = {
    type: "object",
    properties: {
        momentId: {
            type: "string",
            description: "ID do momento",
            example: "123456789",
        },
        totalViews: {
            type: "integer",
            description: "Total de visualizações",
            example: 1000,
        },
        totalLikes: {
            type: "integer",
            description: "Total de curtidas",
            example: 50,
        },
        totalComments: {
            type: "integer",
            description: "Total de comentários",
            example: 25,
        },
        totalShares: {
            type: "integer",
            description: "Total de compartilhamentos",
            example: 10,
        },
        engagementRate: {
            type: "number",
            description: "Taxa de engajamento",
            example: 0.085,
        },
        averageWatchTime: {
            type: "number",
            description: "Tempo médio de visualização (segundos)",
            example: 45.5,
        },
        completionRate: {
            type: "number",
            description: "Taxa de conclusão",
            example: 0.75,
        },
        demographics: {
            type: "object",
            properties: {
                ageGroups: {
                    type: "object",
                    additionalProperties: {
                        type: "integer",
                    },
                    description: "Distribuição por faixa etária",
                    example: {
                        "18-24": 300,
                        "25-34": 400,
                        "35-44": 200,
                        "45+": 100,
                    },
                },
                genders: {
                    type: "object",
                    additionalProperties: {
                        type: "integer",
                    },
                    description: "Distribuição por gênero",
                    example: {
                        male: 600,
                        female: 350,
                        other: 50,
                    },
                },
                locations: {
                    type: "object",
                    additionalProperties: {
                        type: "integer",
                    },
                    description: "Distribuição por localização",
                    example: {
                        "São Paulo": 400,
                        "Rio de Janeiro": 300,
                        Brasília: 200,
                        Outros: 100,
                    },
                },
            },
        },
        timeline: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        format: "date",
                        description: "Data",
                    },
                    views: {
                        type: "integer",
                        description: "Visualizações na data",
                    },
                    likes: {
                        type: "integer",
                        description: "Curtidas na data",
                    },
                    comments: {
                        type: "integer",
                        description: "Comentários na data",
                    },
                    shares: {
                        type: "integer",
                        description: "Compartilhamentos na data",
                    },
                },
            },
            description: "Timeline das métricas",
        },
        topHashtags: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    hashtag: {
                        type: "string",
                        description: "Hashtag",
                    },
                    count: {
                        type: "integer",
                        description: "Número de ocorrências",
                    },
                },
            },
            description: "Top hashtags",
        },
        topMentions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    mention: {
                        type: "string",
                        description: "Menção",
                    },
                    count: {
                        type: "integer",
                        description: "Número de ocorrências",
                    },
                },
            },
            description: "Top menções",
        },
    },
    required: [
        "momentId",
        "totalViews",
        "totalLikes",
        "totalComments",
        "totalShares",
        "engagementRate",
        "averageWatchTime",
        "completionRate",
    ],
}

export const MomentsAnalyticsResponseSchema = {
    type: "object",
    properties: {
        overview: {
            type: "object",
            properties: {
                totalMoments: {
                    type: "integer",
                    description: "Total de momentos",
                    example: 50,
                },
                totalViews: {
                    type: "integer",
                    description: "Total de visualizações",
                    example: 50000,
                },
                totalLikes: {
                    type: "integer",
                    description: "Total de curtidas",
                    example: 2500,
                },
                totalComments: {
                    type: "integer",
                    description: "Total de comentários",
                    example: 1250,
                },
                totalShares: {
                    type: "integer",
                    description: "Total de compartilhamentos",
                    example: 500,
                },
                averageEngagementRate: {
                    type: "number",
                    description: "Taxa média de engajamento",
                    example: 0.085,
                },
                averageWatchTime: {
                    type: "number",
                    description: "Tempo médio de visualização",
                    example: 45.5,
                },
                averageCompletionRate: {
                    type: "number",
                    description: "Taxa média de conclusão",
                    example: 0.75,
                },
            },
        },
        trends: {
            type: "object",
            properties: {
                momentsCreated: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            date: {
                                type: "string",
                                format: "date",
                            },
                            count: {
                                type: "integer",
                            },
                        },
                    },
                },
                views: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            date: {
                                type: "string",
                                format: "date",
                            },
                            count: {
                                type: "integer",
                            },
                        },
                    },
                },
                likes: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            date: {
                                type: "string",
                                format: "date",
                            },
                            count: {
                                type: "integer",
                            },
                        },
                    },
                },
                comments: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            date: {
                                type: "string",
                                format: "date",
                            },
                            count: {
                                type: "integer",
                            },
                        },
                    },
                },
            },
        },
        topPerformers: {
            type: "object",
            properties: {
                mostViewed: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            momentId: {
                                type: "string",
                            },
                            title: {
                                type: "string",
                            },
                            views: {
                                type: "integer",
                            },
                        },
                    },
                },
                mostLiked: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            momentId: {
                                type: "string",
                            },
                            title: {
                                type: "string",
                            },
                            likes: {
                                type: "integer",
                            },
                        },
                    },
                },
                mostCommented: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            momentId: {
                                type: "string",
                            },
                            title: {
                                type: "string",
                            },
                            comments: {
                                type: "integer",
                            },
                        },
                    },
                },
            },
        },
        insights: {
            type: "object",
            properties: {
                bestPerformingDay: {
                    type: "string",
                    description: "Melhor dia de performance",
                    example: "monday",
                },
                bestPerformingHour: {
                    type: "integer",
                    description: "Melhor hora de performance",
                    example: 12,
                },
                averagePostingFrequency: {
                    type: "number",
                    description: "Frequência média de postagem",
                    example: 2.5,
                },
                audienceGrowth: {
                    type: "number",
                    description: "Crescimento da audiência",
                    example: 0.15,
                },
                engagementTrend: {
                    type: "string",
                    enum: ["increasing", "decreasing", "stable"],
                    description: "Tendência de engajamento",
                    example: "increasing",
                },
            },
        },
    },
    required: ["overview", "trends", "topPerformers", "insights"],
}
