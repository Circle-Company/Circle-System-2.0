// Use Cases
import {
    AdminBlockMomentUseCase,
    AdminChangeMomentStatusUseCase,
    AdminDeleteMomentUseCase,
    AdminUnblockMomentUseCase,
    CommentMomentUseCase,
    CreateMomentUseCase,
    DeleteMomentCommentUseCase,
    DeleteMomentUseCase,
    GetAccountMomentsUseCase,

    GetLikedMomentsUseCase,
    GetMomentCommentsUseCase,
    GetMomentMetricsUseCase,
    GetMomentReportsUseCase,
    GetMomentUseCase,
    GetMomentsAnalyticsUseCase,
    GetUserMomentsUseCase,
    LikeMomentUseCase,
    ReportMomentUseCase,
    UnlikeMomentUseCase,
} from "@/application/moment/use.cases"
import { DatabaseAdapter, DatabaseAdapterFactory } from "@/infra/database/adapter"

import { MomentMetricsService } from "@/application/moment/services/moment.metrics.service"
import { MomentService } from "@/application/moment/services/moment.service"
import { ContentBlocker } from "@/core/content.moderation/content/blocker"
import { ContentDetector } from "@/core/content.moderation/content/detector"
import { ModerationEngineFactory } from "@/core/content.moderation/factory"
import { ModerationEngine } from "@/core/content.moderation/moderation"
import type {
    ContentStorage,
    ModerationEngineConfig,
    ModerationRepository
} from "@/core/content.moderation/types"
import { StorageAdapterFactory } from "@/core/content.processor/storage.adapter"
import { MomentMapper } from "@/domain/moment/moment.mapper"
import { ICommentRepository } from "@/domain/moment/repositories/comment.repository"
import { IMomentMetricsRepository } from "@/domain/moment/repositories/moment.metrics.repository"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { MomentCommentController } from "@/infra/controllers/moment/moment.comment.controller"
import { MomentController } from "@/infra/controllers/moment/moment.controller"
import { MomentMetricsController } from "@/infra/controllers/moment/moment.metrics.controller"
import { CommentRepositoryImpl } from "@/infra/repository.impl/comment.repository.impl"
import { MomentMetricsRepositoryImpl } from "@/infra/repository.impl/moment.metrics.repository.impl"
import { MomentRepositoryImpl } from "@/infra/repository.impl/moment.repository.impl"
import { UserRepositoryImpl } from "@/infra/repository.impl/user.repository.impl"

/**
 * Factory para criar componentes relacionados ao Moment
 */
export class MomentFactory {
    private static momentController: MomentController | null = null
    private static momentMetricsController: MomentMetricsController | null = null
    private static momentCommentController: MomentCommentController | null = null
    /**
     * Cria um MomentRepository com DatabaseAdapter
     */
    static createMomentRepository(database: DatabaseAdapter): IMomentRepository {
        return new MomentRepositoryImpl(database) as IMomentRepository
    }

    /**
     * Cria um MomentMetricsRepository com DatabaseAdapter
     */
    static createMomentMetricsRepository(database: DatabaseAdapter): IMomentMetricsRepository {
        return new MomentMetricsRepositoryImpl(database)
    }

    /**
     * Cria um UserRepository com DatabaseAdapter
     */
    static createUserRepository(database: DatabaseAdapter): IUserRepository {
        return new UserRepositoryImpl(database) as unknown as IUserRepository
    }

    /**
     * Cria um CommentRepository com DatabaseAdapter
     */
    static createCommentRepository(database: DatabaseAdapter): ICommentRepository {
        return new CommentRepositoryImpl(database) as unknown as ICommentRepository
    }

    /**
     * Cria um MomentMapper
     */
    static createMomentMapper(): MomentMapper {
        return new MomentMapper()
    }

    /**
     * Cria um MomentMetricsMapper (usando MomentMapper por enquanto)
     */
    static createMomentMetricsMapper(): MomentMapper {
        return new MomentMapper()
    }

    /**
     * Cria um MomentService com todas as dependências
     */
    static createMomentService(database: DatabaseAdapter): MomentService {
        const momentRepository = this.createMomentRepository(database)
        const storageAdapter = StorageAdapterFactory.create("local")
        return new MomentService(momentRepository, undefined, storageAdapter)
    }

    /**
     * Cria um MomentMetricsService com todas as dependências
     */
    static createMomentMetricsService(database: DatabaseAdapter): MomentMetricsService {
        const momentMetricsRepository = this.createMomentMetricsRepository(database)
        return new MomentMetricsService(momentMetricsRepository)
    }

    /**
     * Cria um ModerationEngine para moderação de comentários
     */
    static createModerationEngine(): ModerationEngine {
        // Criar mocks simples para as dependências não utilizadas em moderação de comentários
        const mockModerationRepository: ModerationRepository = {
            save: async (moderation) => moderation,
            findById: async () => null,
            findByContentId: async () => null,
            update: async (id, updates) => ({ ...updates, id } as any),
            delete: async () => {},
        }

        const mockContentStorage: ContentStorage = {
            store: async () => "",
            retrieve: async () => null,
            delete: async () => {},
        }

        const config: ModerationEngineConfig = ModerationEngineFactory.createDefaultConfig()

        // Criar ContentDetector e ContentBlocker
        const contentDetector = new ContentDetector(config)
        const contentBlocker = new ContentBlocker(mockModerationRepository, config)

        // Criar ModerationEngine diretamente (sem httpAdapter que não é usado em moderação de comentários)
        return new ModerationEngine(
            contentDetector,
            contentBlocker,
            mockModerationRepository,
            mockContentStorage,
            config,
        )
    }

    /**
     * Cria todos os use cases de Moment
     */
    static createMomentUseCases(database: DatabaseAdapter) {
        const momentRepository = this.createMomentRepository(database)
        const userRepository = this.createUserRepository(database)
        const moderationEngine = this.createModerationEngine()
        const commentRepository = this.createCommentRepository(database)
        const momentService = this.createMomentService(database)
        const momentMetricsService = this.createMomentMetricsService(database)

        return {
            // CRUD Operations
            createMoment: new CreateMomentUseCase(momentService, userRepository),
            getMoment: new GetMomentUseCase(userRepository, momentRepository),
            deleteMoment: new DeleteMomentUseCase(momentRepository, momentService),

            // User Actions
            getUserMoments: new GetUserMomentsUseCase(momentRepository, userRepository),
            getAccountMoments: new GetAccountMomentsUseCase(momentRepository),
            likeMoment: new LikeMomentUseCase(
                momentRepository,
                userRepository,
                momentMetricsService,
                momentService,
            ),
            unlikeMoment: new UnlikeMomentUseCase(
                momentRepository,
                userRepository,
                momentMetricsService,
                momentService,
            ),
            getLikedMoments: new GetLikedMomentsUseCase(momentRepository, momentService),

            // Comments
            commentMoment: new CommentMomentUseCase(
                moderationEngine,
                commentRepository,
                momentRepository,
                userRepository,
            ),  
            getMomentComments: new GetMomentCommentsUseCase(commentRepository, userRepository),
            deleteMomentComment: new DeleteMomentCommentUseCase(commentRepository, userRepository),

            // Reports
            reportMoment: new ReportMomentUseCase(momentRepository, momentService),
            getMomentReports: new GetMomentReportsUseCase(momentRepository, momentService),

            // Metrics
            getMomentMetrics: new GetMomentMetricsUseCase(momentRepository, momentService),
            getMomentsAnalytics: new GetMomentsAnalyticsUseCase(momentRepository, momentService),

            // Admin Operations
            adminBlockMoment: new AdminBlockMomentUseCase(momentService),
            adminUnblockMoment: new AdminUnblockMomentUseCase(momentService),
            adminChangeMomentStatus: new AdminChangeMomentStatusUseCase(momentService),
            adminDeleteMoment: new AdminDeleteMomentUseCase(momentService),
        }
    }

    /**
     * Cria um MomentController com todas as dependências
     */
    static createMomentController(database: DatabaseAdapter): MomentController {
        const useCases = this.createMomentUseCases(database)

        return new MomentController(
            useCases.createMoment,
            useCases.getMoment,
            useCases.deleteMoment,
            useCases.getUserMoments,
            useCases.getAccountMoments,
            useCases.likeMoment,
            useCases.unlikeMoment,
            useCases.getLikedMoments,
            useCases.reportMoment,
            useCases.getMomentReports,
        )
    }

    /**
     * Obtém uma instância singleton do MomentController
     */
    static getMomentController(): MomentController {
        if (!this.momentController) {
            const database = DatabaseAdapterFactory.createForEnvironment(
                process.env.NODE_ENV || "development",
            )
            this.momentController = this.createMomentController(database)
        }
        return this.momentController
    }

    /**
     * Cria um MomentMetricsController com todas as dependências
     */
    static createMomentMetricsController(database: DatabaseAdapter): MomentMetricsController {
        const useCases = this.createMomentUseCases(database)

        return new MomentMetricsController(useCases.getMomentMetrics, useCases.getMomentsAnalytics)
    }

    /**
     * Obtém uma instância singleton do MomentMetricsController
     */
    static getMomentMetricsController(): MomentMetricsController {
        if (!this.momentMetricsController) {
            const database = DatabaseAdapterFactory.createForEnvironment(
                process.env.NODE_ENV || "development",
            )
            this.momentMetricsController = this.createMomentMetricsController(database)
        }
        return this.momentMetricsController
    }

    /**
     * Cria um MomentCommentController com todas as dependências
     */
    static createMomentCommentController(database: DatabaseAdapter): MomentCommentController {
        const useCases = this.createMomentUseCases(database)

        return new MomentCommentController(
            useCases.commentMoment,
            useCases.getMomentComments,
            useCases.deleteMomentComment,
        )
    }

    /**
     * Obtém uma instância singleton do MomentCommentController
     */
    static getMomentCommentController(): MomentCommentController {
        if (!this.momentCommentController) {
            const database = DatabaseAdapterFactory.createForEnvironment(
                process.env.NODE_ENV || "development",
            )
            this.momentCommentController = this.createMomentCommentController(database)
        }
        return this.momentCommentController
    }

    /**
     * Cria componentes para ambiente de produção
     */
    static createForProduction(database: DatabaseAdapter): {
        momentRepository: IMomentRepository
        momentMetricsRepository: IMomentMetricsRepository
        commentRepository: ICommentRepository
        momentService: MomentService
        momentMetricsService: MomentMetricsService
        momentController: MomentController
        momentMetricsController: MomentMetricsController
        momentCommentController: MomentCommentController
        useCases: ReturnType<typeof MomentFactory.createMomentUseCases>
    } {
        const momentRepository = this.createMomentRepository(database)
        const momentMetricsRepository = this.createMomentMetricsRepository(database)
        const commentRepository = this.createCommentRepository(database)
        const momentService = this.createMomentService(database)
        const momentMetricsService = this.createMomentMetricsService(database)
        const momentController = this.createMomentController(database)
        const momentMetricsController = this.createMomentMetricsController(database)
        const momentCommentController = this.createMomentCommentController(database)
        const useCases = this.createMomentUseCases(database)

        return {
            momentRepository,
            momentMetricsRepository,
            commentRepository,
            momentService,
            momentMetricsService,
            momentController,
            momentMetricsController,
            momentCommentController,
            useCases,
        }
    }

    /**
     * Cria componentes para ambiente de teste
     */
    static createForTest(database: DatabaseAdapter): {
        momentRepository: IMomentRepository
        momentMetricsRepository: IMomentMetricsRepository
        commentRepository: ICommentRepository
        momentService: MomentService
        momentMetricsService: MomentMetricsService
        momentController: MomentController
        momentMetricsController: MomentMetricsController
        momentCommentController: MomentCommentController
        useCases: ReturnType<typeof MomentFactory.createMomentUseCases>
    } {
        // Para testes, podemos usar a mesma implementação ou uma versão mock
        return this.createForProduction(database)
    }

    /**
     * Cria componentes baseado no ambiente
     */
    static createForEnvironment(
        environment: string,
        database: DatabaseAdapter,
    ): {
        momentRepository: IMomentRepository
        momentMetricsRepository: IMomentMetricsRepository
        commentRepository: ICommentRepository
        momentService: MomentService
        momentMetricsService: MomentMetricsService
        momentController: MomentController
        momentMetricsController: MomentMetricsController
        momentCommentController: MomentCommentController
        useCases: ReturnType<typeof MomentFactory.createMomentUseCases>
    } {
        return environment === "test"
            ? this.createForTest(database)
            : this.createForProduction(database)
    }
}

/**
 * Funções utilitárias para criação rápida de componentes de Moment
 */
export const createMoment = {
    /**
     * Cria MomentRepository para produção
     */
    repository: (database: DatabaseAdapter) => MomentFactory.createMomentRepository(database),

    /**
     * Cria MomentMetricsRepository para produção
     */
    metricsRepository: (database: DatabaseAdapter) =>
        MomentFactory.createMomentMetricsRepository(database),

    /**
     * Cria CommentRepository para produção
     */
    commentRepository: (database: DatabaseAdapter) =>
        MomentFactory.createCommentRepository(database),

    /**
     * Cria MomentService para produção
     */
    service: (database: DatabaseAdapter) => MomentFactory.createMomentService(database),

    /**
     * Cria MomentMetricsService para produção
     */
    metricsService: (database: DatabaseAdapter) =>
        MomentFactory.createMomentMetricsService(database),

    /**
     * Cria MomentController para produção
     */
    controller: (database: DatabaseAdapter) => MomentFactory.createMomentController(database),

    /**
     * Cria MomentMetricsController para produção
     */
    metricsController: (database: DatabaseAdapter) =>
        MomentFactory.createMomentMetricsController(database),

    /**
     * Cria MomentCommentController para produção
     */
    commentController: (database: DatabaseAdapter) =>
        MomentFactory.createMomentCommentController(database),

    /**
     * Cria todos os use cases
     */
    useCases: (database: DatabaseAdapter) => MomentFactory.createMomentUseCases(database),

    /**
     * Cria componentes para produção
     */
    production: (database: DatabaseAdapter) => MomentFactory.createForProduction(database),

    /**
     * Cria componentes para testes
     */
    test: (database: DatabaseAdapter) => MomentFactory.createForTest(database),

    /**
     * Cria componentes baseado no ambiente
     */
    forEnvironment: (env: string, database: DatabaseAdapter) =>
        MomentFactory.createForEnvironment(env, database),
}

/**
 * Configurações padrão para diferentes ambientes
 */
export const MomentFactoryConfig = {
    production: {
        defaultLimit: 20,
        defaultOffset: 0,
        maxLimit: 100,
        searchLimit: 50,
        metricsCacheTime: 300000, // 5 minutos
    },
    test: {
        defaultLimit: 10,
        defaultOffset: 0,
        maxLimit: 50,
        searchLimit: 25,
        metricsCacheTime: 60000, // 1 minuto
    },
    development: {
        defaultLimit: 15,
        defaultOffset: 0,
        maxLimit: 75,
        searchLimit: 30,
        metricsCacheTime: 180000, // 3 minutos
    },
} as const

/**
 * Tipo para configuração do factory
 */
export type MomentFactoryConfigType = keyof typeof MomentFactoryConfig
