// Use Cases
import {
    CommentMomentUseCase,
    CreateMomentUseCase,
    DeleteMomentCommentUseCase,
    DeleteMomentUseCase,
    EditMomentCommentUseCase,
    GetCommentedMomentsUseCase,
    GetLikedMomentsUseCase,
    GetMomentCommentsUseCase,
    GetMomentMetricsUseCase,
    GetMomentReportsUseCase,
    GetMomentUseCase,
    GetMomentsAnalyticsUseCase,
    GetUserMomentReportsUseCase,
    GetUserMomentsUseCase,
    GetUserReportedMomentsUseCase,
    LikeMomentUseCase,
    ListMomentsUseCase,
    PublishMomentUseCase,
    ReportMomentUseCase,
    SearchMomentsUseCase,
    UnlikeMomentUseCase,
} from "@/application/moment/use.cases"
import { DatabaseAdapter, DatabaseAdapterFactory } from "@/infra/database/adapter"

import { MomentMetricsService } from "@/application/moment/services/moment.metrics.service"
import { MomentService } from "@/application/moment/services/moment.service"
import { MomentMapper } from "@/domain/moment/mappers/moment.mapper"
import { IMomentMetricsRepository } from "@/domain/moment/repositories/moment.metrics.repository"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentController } from "@/infra/controllers/moment/moment.controller"
import { MomentMetricsController } from "@/infra/controllers/moment/moment.metrics.controller"
import { MomentMetricsRepositoryImpl } from "@/infra/repository.impl/moment.metrics.repository.impl"
import { MomentRepositoryImpl } from "@/infra/repository.impl/moment.repository.impl"

/**
 * Factory para criar componentes relacionados ao Moment
 */
export class MomentFactory {
    private static momentController: MomentController | null = null
    private static momentMetricsController: MomentMetricsController | null = null
    /**
     * Cria um MomentRepository com DatabaseAdapter
     */
    static createMomentRepository(database: DatabaseAdapter): IMomentRepository {
        return new MomentRepositoryImpl(database) as unknown as IMomentRepository
    }

    /**
     * Cria um MomentMetricsRepository com DatabaseAdapter
     */
    static createMomentMetricsRepository(database: DatabaseAdapter): IMomentMetricsRepository {
        return new MomentMetricsRepositoryImpl(database)
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
        const momentMetricsService = this.createMomentMetricsService(database)
        return new MomentService(momentRepository, momentMetricsService)
    }

    /**
     * Cria um MomentMetricsService com todas as dependências
     */
    static createMomentMetricsService(database: DatabaseAdapter): MomentMetricsService {
        const momentMetricsRepository = this.createMomentMetricsRepository(database)
        return new MomentMetricsService(momentMetricsRepository)
    }

    /**
     * Cria todos os use cases de Moment
     */
    static createMomentUseCases(database: DatabaseAdapter) {
        const momentRepository = this.createMomentRepository(database)
        const momentService = this.createMomentService(database)
        const momentMetricsService = this.createMomentMetricsService(database)

        return {
            // CRUD Operations
            createMoment: new CreateMomentUseCase(momentRepository, momentService),
            getMoment: new GetMomentUseCase(momentRepository, momentService),
            deleteMoment: new DeleteMomentUseCase(momentRepository, momentService),
            publishMoment: new PublishMomentUseCase(momentRepository, momentService),

            // Listing and Search
            listMoments: new ListMomentsUseCase(momentRepository, momentService),
            getUserMoments: new GetUserMomentsUseCase(momentRepository, momentService),
            searchMoments: new SearchMomentsUseCase(momentRepository, momentService),

            // User Actions
            likeMoment: new LikeMomentUseCase(momentRepository, momentService),
            unlikeMoment: new UnlikeMomentUseCase(momentRepository, momentService),
            getLikedMoments: new GetLikedMomentsUseCase(momentRepository, momentService),

            // Comments
            commentMoment: new CommentMomentUseCase(momentRepository, momentService),
            getMomentComments: new GetMomentCommentsUseCase(momentService),
            editMomentComment: new EditMomentCommentUseCase(momentService),
            deleteMomentComment: new DeleteMomentCommentUseCase(momentService),
            getCommentedMoments: new GetCommentedMomentsUseCase(momentRepository, momentService),

            // Reports
            reportMoment: new ReportMomentUseCase(momentRepository, momentService),
            getMomentReports: new GetMomentReportsUseCase(momentRepository, momentService),
            getUserMomentReports: new GetUserMomentReportsUseCase(momentRepository, momentService),
            getUserReportedMoments: new GetUserReportedMomentsUseCase(
                momentRepository,
                momentService,
            ),

            // Metrics
            getMomentMetrics: new GetMomentMetricsUseCase(momentRepository, momentService),
            getMomentsAnalytics: new GetMomentsAnalyticsUseCase(momentRepository, momentService),
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
            useCases.publishMoment,
            useCases.listMoments,
            useCases.getUserMoments,
            useCases.searchMoments,
            useCases.likeMoment,
            useCases.unlikeMoment,
            useCases.getLikedMoments,
            useCases.commentMoment,
            useCases.getMomentComments,
            useCases.editMomentComment,
            useCases.deleteMomentComment,
            useCases.getCommentedMoments,
            useCases.reportMoment,
            useCases.getMomentReports,
            useCases.getUserMomentReports,
            useCases.getUserReportedMoments,
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
     * Cria componentes para ambiente de produção
     */
    static createForProduction(database: DatabaseAdapter): {
        momentRepository: IMomentRepository
        momentMetricsRepository: IMomentMetricsRepository
        momentService: MomentService
        momentMetricsService: MomentMetricsService
        momentController: MomentController
        momentMetricsController: MomentMetricsController
        useCases: ReturnType<typeof MomentFactory.createMomentUseCases>
    } {
        const momentRepository = this.createMomentRepository(database)
        const momentMetricsRepository = this.createMomentMetricsRepository(database)
        const momentService = this.createMomentService(database)
        const momentMetricsService = this.createMomentMetricsService(database)
        const momentController = this.createMomentController(database)
        const momentMetricsController = this.createMomentMetricsController(database)
        const useCases = this.createMomentUseCases(database)

        return {
            momentRepository,
            momentMetricsRepository,
            momentService,
            momentMetricsService,
            momentController,
            momentMetricsController,
            useCases,
        }
    }

    /**
     * Cria componentes para ambiente de teste
     */
    static createForTest(database: DatabaseAdapter): {
        momentRepository: IMomentRepository
        momentMetricsRepository: IMomentMetricsRepository
        momentService: MomentService
        momentMetricsService: MomentMetricsService
        momentController: MomentController
        momentMetricsController: MomentMetricsController
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
        momentService: MomentService
        momentMetricsService: MomentMetricsService
        momentController: MomentController
        momentMetricsController: MomentMetricsController
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
