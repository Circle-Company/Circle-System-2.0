import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentFactory, MomentFactoryConfig, createMoment } from "../moment.factory"

import { DatabaseAdapter } from "../../../infra/database/adapter"

// Mock do DatabaseAdapter
const mockDatabaseAdapter = {
    query: vi.fn(),
    transaction: vi.fn(),
    close: vi.fn(),
} as unknown as DatabaseAdapter

describe("MomentFactory", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("createMomentRepository", () => {
        it("deve criar um MomentRepository com DatabaseAdapter", () => {
            // Act
            const repository = MomentFactory.createMomentRepository(mockDatabaseAdapter)

            // Assert
            expect(repository).toBeDefined()
            expect(typeof repository).toBe("object")
        })

        it("deve criar um MomentRepository com método isOwner", () => {
            // Act
            const repository = MomentFactory.createMomentRepository(mockDatabaseAdapter)

            // Assert
            expect(repository).toHaveProperty("isOwner")
            expect(typeof repository.isOwner).toBe("function")
        })
    })

    describe("createMomentRepository - Métodos específicos", () => {
        it("deve criar um MomentRepository com todos os métodos necessários", () => {
            // Act
            const repository = MomentFactory.createMomentRepository(mockDatabaseAdapter)

            // Assert - Verificar se o repository tem os métodos esperados
            expect(repository).toHaveProperty("create")
            expect(repository).toHaveProperty("findById")
            expect(repository).toHaveProperty("update")
            expect(repository).toHaveProperty("delete")
            expect(repository).toHaveProperty("findByOwnerId")
            expect(repository).toHaveProperty("findByStatus")
            expect(repository).toHaveProperty("findByVisibility")
            expect(repository).toHaveProperty("findByHashtag")
            expect(repository).toHaveProperty("findByMention")
            expect(repository).toHaveProperty("findPublished")
            expect(repository).toHaveProperty("findRecent")
            expect(repository).toHaveProperty("findByLocation")
            expect(repository).toHaveProperty("findByLocationWithDistance")
            expect(repository).toHaveProperty("findByBoundingBox")
            expect(repository).toHaveProperty("findNearbyMoments")
            expect(repository).toHaveProperty("findPendingProcessing")
            expect(repository).toHaveProperty("findFailedProcessing")
            expect(repository).toHaveProperty("countByOwnerId")
            expect(repository).toHaveProperty("countByStatus")
            expect(repository).toHaveProperty("countByVisibility")
            expect(repository).toHaveProperty("countPublished")
            expect(repository).toHaveProperty("exists")
            expect(repository).toHaveProperty("existsByOwnerId")
            expect(repository).toHaveProperty("createMany")
            expect(repository).toHaveProperty("updateMany")
            expect(repository).toHaveProperty("deleteMany")
            expect(repository).toHaveProperty("findPaginated")
            expect(repository).toHaveProperty("getAnalytics")
            expect(repository).toHaveProperty("getStats")
            expect(repository).toHaveProperty("isInteractable")
            expect(repository).toHaveProperty("isOwner")
        })
    })

    describe("createMomentMetricsRepository", () => {
        it("deve criar um MomentMetricsRepository com DatabaseAdapter", () => {
            // Act
            const repository = MomentFactory.createMomentMetricsRepository(mockDatabaseAdapter)

            // Assert
            expect(repository).toBeDefined()
            expect(typeof repository).toBe("object")
        })
    })

    describe("createUserRepository", () => {
        it("deve criar um UserRepository com DatabaseAdapter", () => {
            // Act
            const repository = MomentFactory.createUserRepository(mockDatabaseAdapter)

            // Assert
            expect(repository).toBeDefined()
            expect(typeof repository).toBe("object")
        })
    })

    describe("createMomentMapper", () => {
        it("deve criar um MomentMapper", () => {
            // Act
            const mapper = MomentFactory.createMomentMapper()

            // Assert
            expect(mapper).toBeDefined()
            expect(typeof mapper).toBe("object")
        })
    })

    describe("createMomentMetricsMapper", () => {
        it("deve criar um MomentMetricsMapper", () => {
            // Act
            const mapper = MomentFactory.createMomentMetricsMapper()

            // Assert
            expect(mapper).toBeDefined()
            expect(typeof mapper).toBe("object")
        })
    })

    describe("createMomentService", () => {
        it("deve criar um MomentService com todas as dependências", () => {
            // Act
            const service = MomentFactory.createMomentService(mockDatabaseAdapter)

            // Assert
            expect(service).toBeDefined()
            expect(typeof service).toBe("object")
        })
    })

    describe("createMomentMetricsService", () => {
        it("deve criar um MomentMetricsService com todas as dependências", () => {
            // Act
            const service = MomentFactory.createMomentMetricsService(mockDatabaseAdapter)

            // Assert
            expect(service).toBeDefined()
            expect(typeof service).toBe("object")
        })
    })

    describe("createMomentUseCases", () => {
        it("deve criar todos os use cases de Moment", () => {
            // Act
            const useCases = MomentFactory.createMomentUseCases(mockDatabaseAdapter)

            // Assert
            expect(useCases).toBeDefined()
            expect(typeof useCases).toBe("object")

            // Verificar se todos os use cases foram criados
            // CRUD Operations
            expect(useCases.createMoment).toBeDefined()
            expect(useCases.getMoment).toBeDefined()
            expect(useCases.deleteMoment).toBeDefined()

            // Listing and Search
            expect(useCases.getUserMoments).toBeDefined()

            // User Actions
            expect(useCases.likeMoment).toBeDefined()
            expect(useCases.unlikeMoment).toBeDefined()
            expect(useCases.getLikedMoments).toBeDefined()

            // Comments
            expect(useCases.commentMoment).toBeDefined()
            expect(useCases.getMomentComments).toBeDefined()
            expect(useCases.deleteMomentComment).toBeDefined()
            expect(useCases.getCommentedMoments).toBeDefined()

            // Reports
            expect(useCases.reportMoment).toBeDefined()
            expect(useCases.getMomentReports).toBeDefined()

            // Metrics
            expect(useCases.getMomentMetrics).toBeDefined()
            expect(useCases.getMomentsAnalytics).toBeDefined()

            // Admin Operations
            expect(useCases.adminBlockMoment).toBeDefined()
            expect(useCases.adminUnblockMoment).toBeDefined()
            expect(useCases.adminChangeMomentStatus).toBeDefined()
            expect(useCases.adminDeleteMoment).toBeDefined()
            expect(useCases.adminListAllMoments).toBeDefined()
        })
    })

    describe("createMomentUseCases - Métricas", () => {
        it("deve criar use cases de métricas corretamente", () => {
            // Act
            const useCases = MomentFactory.createMomentUseCases(mockDatabaseAdapter)

            // Assert
            expect(useCases.getMomentMetrics).toBeDefined()
            expect(useCases.getMomentsAnalytics).toBeDefined()
            expect(typeof useCases.getMomentMetrics).toBe("object")
            expect(typeof useCases.getMomentsAnalytics).toBe("object")
        })
    })

    describe("createMomentUseCases - Admin", () => {
        it("deve criar use cases admin corretamente", () => {
            // Act
            const useCases = MomentFactory.createMomentUseCases(mockDatabaseAdapter)

            // Assert
            expect(useCases.adminBlockMoment).toBeDefined()
            expect(useCases.adminUnblockMoment).toBeDefined()
            expect(useCases.adminChangeMomentStatus).toBeDefined()
            expect(useCases.adminDeleteMoment).toBeDefined()
            expect(useCases.adminListAllMoments).toBeDefined()
            expect(typeof useCases.adminBlockMoment).toBe("object")
            expect(typeof useCases.adminUnblockMoment).toBe("object")
            expect(typeof useCases.adminChangeMomentStatus).toBe("object")
            expect(typeof useCases.adminDeleteMoment).toBe("object")
            expect(typeof useCases.adminListAllMoments).toBe("object")
        })
    })

    describe("createMomentUseCases - Comments", () => {
        it("deve criar use cases de comentários com dependências corretas", () => {
            // Act
            const useCases = MomentFactory.createMomentUseCases(mockDatabaseAdapter)

            // Assert
            expect(useCases.commentMoment).toBeDefined()
            expect(useCases.getMomentComments).toBeDefined()
            expect(useCases.deleteMomentComment).toBeDefined()
            expect(useCases.getCommentedMoments).toBeDefined()
            expect(typeof useCases.commentMoment).toBe("object")
            expect(typeof useCases.getMomentComments).toBe("object")
            expect(typeof useCases.deleteMomentComment).toBe("object")
            expect(typeof useCases.getCommentedMoments).toBe("object")
        })
    })

    describe("createMomentUseCases - Dependências", () => {
        it("deve criar use cases com as dependências corretas", () => {
            // Act
            const useCases = MomentFactory.createMomentUseCases(mockDatabaseAdapter)

            // Assert - Verificar se os use cases têm as propriedades esperadas
            expect(useCases.createMoment).toHaveProperty("execute")
            expect(useCases.getMoment).toHaveProperty("execute")
            expect(useCases.deleteMoment).toHaveProperty("execute")
            expect(useCases.getUserMoments).toHaveProperty("execute")
            expect(useCases.likeMoment).toHaveProperty("execute")
            expect(useCases.unlikeMoment).toHaveProperty("execute")
            expect(useCases.getLikedMoments).toHaveProperty("execute")
            expect(useCases.commentMoment).toHaveProperty("execute")
            expect(useCases.getMomentComments).toHaveProperty("execute")
            expect(useCases.deleteMomentComment).toHaveProperty("execute")
            expect(useCases.getCommentedMoments).toHaveProperty("execute")
            expect(useCases.reportMoment).toHaveProperty("execute")
            expect(useCases.getMomentReports).toHaveProperty("execute")
            expect(useCases.getMomentMetrics).toHaveProperty("execute")
            expect(useCases.getMomentsAnalytics).toHaveProperty("execute")
            expect(useCases.adminBlockMoment).toHaveProperty("execute")
            expect(useCases.adminUnblockMoment).toHaveProperty("execute")
            expect(useCases.adminChangeMomentStatus).toHaveProperty("execute")
            expect(useCases.adminDeleteMoment).toHaveProperty("execute")
            expect(useCases.adminListAllMoments).toHaveProperty("execute")
        })
    })

    describe("createMomentController", () => {
        it("deve criar um MomentController com todas as dependências", () => {
            // Act
            const controller = MomentFactory.createMomentController(mockDatabaseAdapter)

            // Assert
            expect(controller).toBeDefined()
            expect(typeof controller).toBe("object")
        })

        it("deve criar um MomentController com métodos corretos", () => {
            // Act
            const controller = MomentFactory.createMomentController(mockDatabaseAdapter)

            // Assert - Verificar se o controller tem os métodos esperados
            expect(controller).toHaveProperty("createMoment")
            expect(controller).toHaveProperty("getMoment")
            expect(controller).toHaveProperty("deleteMoment")
            expect(controller).toHaveProperty("getUserMoments")
            expect(controller).toHaveProperty("likeMoment")
            expect(controller).toHaveProperty("unlikeMoment")
            expect(controller).toHaveProperty("getLikedMoments")
            expect(controller).toHaveProperty("reportMoment")
            expect(controller).toHaveProperty("getMomentReports")
        })
    })

    describe("createMomentMetricsController", () => {
        it("deve criar um MomentMetricsController com todas as dependências", () => {
            // Act
            const controller = MomentFactory.createMomentMetricsController(mockDatabaseAdapter)

            // Assert
            expect(controller).toBeDefined()
            expect(typeof controller).toBe("object")
        })

        it("deve criar um MomentMetricsController com métodos corretos", () => {
            // Act
            const controller = MomentFactory.createMomentMetricsController(mockDatabaseAdapter)

            // Assert - Verificar se o controller tem os métodos esperados
            expect(controller).toHaveProperty("getMomentMetrics")
            expect(controller).toHaveProperty("getMomentsAnalytics")
        })
    })

    describe("createForProduction", () => {
        it("deve criar componentes para ambiente de produção", () => {
            // Act
            const components = MomentFactory.createForProduction(mockDatabaseAdapter)

            // Assert
            expect(components).toBeDefined()
            expect(components.momentRepository).toBeDefined()
            expect(components.momentMetricsRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentMetricsService).toBeDefined()
            expect(components.momentController).toBeDefined()
            expect(components.momentMetricsController).toBeDefined()
            expect(components.useCases).toBeDefined()
        })
    })

    describe("createForTest", () => {
        it("deve criar componentes para ambiente de teste", () => {
            // Act
            const components = MomentFactory.createForTest(mockDatabaseAdapter)

            // Assert
            expect(components).toBeDefined()
            expect(components.momentRepository).toBeDefined()
            expect(components.momentMetricsRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentMetricsService).toBeDefined()
            expect(components.momentController).toBeDefined()
            expect(components.momentMetricsController).toBeDefined()
            expect(components.useCases).toBeDefined()
        })
    })

    describe("createForEnvironment", () => {
        it("deve criar componentes para ambiente de produção quando environment é 'production'", () => {
            // Act
            const components = MomentFactory.createForEnvironment("production", mockDatabaseAdapter)

            // Assert
            expect(components).toBeDefined()
            expect(components.momentRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentController).toBeDefined()
        })

        it("deve criar componentes para ambiente de teste quando environment é 'test'", () => {
            // Act
            const components = MomentFactory.createForEnvironment("test", mockDatabaseAdapter)

            // Assert
            expect(components).toBeDefined()
            expect(components.momentRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentController).toBeDefined()
        })

        it("deve criar componentes para ambiente de produção quando environment não é 'test'", () => {
            // Act
            const components = MomentFactory.createForEnvironment(
                "development",
                mockDatabaseAdapter,
            )

            // Assert
            expect(components).toBeDefined()
            expect(components.momentRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentController).toBeDefined()
        })
    })
})

describe("createMoment utility functions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("repository", () => {
        it("deve criar MomentRepository para produção", () => {
            // Act
            const repository = createMoment.repository(mockDatabaseAdapter)

            // Assert
            expect(repository).toBeDefined()
            expect(typeof repository).toBe("object")
        })
    })

    describe("metricsRepository", () => {
        it("deve criar MomentMetricsRepository para produção", () => {
            // Act
            const repository = createMoment.metricsRepository(mockDatabaseAdapter)

            // Assert
            expect(repository).toBeDefined()
            expect(typeof repository).toBe("object")
        })
    })

    describe("service", () => {
        it("deve criar MomentService para produção", () => {
            // Act
            const service = createMoment.service(mockDatabaseAdapter)

            // Assert
            expect(service).toBeDefined()
            expect(typeof service).toBe("object")
        })
    })

    describe("metricsService", () => {
        it("deve criar MomentMetricsService para produção", () => {
            // Act
            const service = createMoment.metricsService(mockDatabaseAdapter)

            // Assert
            expect(service).toBeDefined()
            expect(typeof service).toBe("object")
        })
    })

    describe("controller", () => {
        it("deve criar MomentController para produção", () => {
            // Act
            const controller = createMoment.controller(mockDatabaseAdapter)

            // Assert
            expect(controller).toBeDefined()
            expect(typeof controller).toBe("object")
        })
    })

    describe("metricsController", () => {
        it("deve criar MomentMetricsController para produção", () => {
            // Act
            const controller = createMoment.metricsController(mockDatabaseAdapter)

            // Assert
            expect(controller).toBeDefined()
            expect(typeof controller).toBe("object")
        })
    })

    describe("useCases", () => {
        it("deve criar todos os use cases", () => {
            // Act
            const useCases = createMoment.useCases(mockDatabaseAdapter)

            // Assert
            expect(useCases).toBeDefined()
            expect(typeof useCases).toBe("object")
            expect(useCases.createMoment).toBeDefined()
            expect(useCases.getMoment).toBeDefined()
        })
    })

    describe("production", () => {
        it("deve criar componentes para produção", () => {
            // Act
            const components = createMoment.production(mockDatabaseAdapter)

            // Assert
            expect(components).toBeDefined()
            expect(components.momentRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentController).toBeDefined()
        })
    })

    describe("test", () => {
        it("deve criar componentes para testes", () => {
            // Act
            const components = createMoment.test(mockDatabaseAdapter)

            // Assert
            expect(components).toBeDefined()
            expect(components.momentRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentController).toBeDefined()
        })
    })

    describe("forEnvironment", () => {
        it("deve criar componentes baseado no ambiente", () => {
            // Act
            const components = createMoment.forEnvironment("production", mockDatabaseAdapter)

            // Assert
            expect(components).toBeDefined()
            expect(components.momentRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentController).toBeDefined()
        })
    })
})

describe("MomentFactoryConfig", () => {
    describe("production config", () => {
        it("deve ter configurações corretas para produção", () => {
            // Assert
            expect(MomentFactoryConfig.production).toBeDefined()
            expect(MomentFactoryConfig.production.defaultLimit).toBe(20)
            expect(MomentFactoryConfig.production.defaultOffset).toBe(0)
            expect(MomentFactoryConfig.production.maxLimit).toBe(100)
            expect(MomentFactoryConfig.production.searchLimit).toBe(50)
            expect(MomentFactoryConfig.production.metricsCacheTime).toBe(300000)
        })
    })

    describe("test config", () => {
        it("deve ter configurações corretas para teste", () => {
            // Assert
            expect(MomentFactoryConfig.test).toBeDefined()
            expect(MomentFactoryConfig.test.defaultLimit).toBe(10)
            expect(MomentFactoryConfig.test.defaultOffset).toBe(0)
            expect(MomentFactoryConfig.test.maxLimit).toBe(50)
            expect(MomentFactoryConfig.test.searchLimit).toBe(25)
            expect(MomentFactoryConfig.test.metricsCacheTime).toBe(60000)
        })
    })

    describe("development config", () => {
        it("deve ter configurações corretas para desenvolvimento", () => {
            // Assert
            expect(MomentFactoryConfig.development).toBeDefined()
            expect(MomentFactoryConfig.development.defaultLimit).toBe(15)
            expect(MomentFactoryConfig.development.defaultOffset).toBe(0)
            expect(MomentFactoryConfig.development.maxLimit).toBe(75)
            expect(MomentFactoryConfig.development.searchLimit).toBe(30)
            expect(MomentFactoryConfig.development.metricsCacheTime).toBe(180000)
        })
    })
})

describe("Factory Integration Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("Component Dependencies", () => {
        it("deve criar componentes com dependências corretas", () => {
            // Act
            const components = MomentFactory.createForProduction(mockDatabaseAdapter)

            // Assert
            expect(components.momentRepository).toBeDefined()
            expect(components.momentMetricsRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentMetricsService).toBeDefined()
            expect(components.momentController).toBeDefined()
            expect(components.momentMetricsController).toBeDefined()
            expect(components.useCases).toBeDefined()

            // Verificar se os use cases têm acesso aos serviços
            expect(components.useCases.createMoment).toBeDefined()
            expect(components.useCases.getMomentMetrics).toBeDefined()
            expect(components.useCases.getMomentsAnalytics).toBeDefined()
            expect(components.useCases.adminBlockMoment).toBeDefined()
            expect(components.useCases.adminUnblockMoment).toBeDefined()
        })

        it("deve criar componentes com todas as funcionalidades implementadas", () => {
            // Act
            const components = MomentFactory.createForProduction(mockDatabaseAdapter)

            // Assert - Verificar se todos os componentes têm as funcionalidades esperadas
            expect(components.useCases).toHaveProperty("createMoment")
            expect(components.useCases).toHaveProperty("getMoment")
            expect(components.useCases).toHaveProperty("deleteMoment")
            expect(components.useCases).toHaveProperty("getUserMoments")
            expect(components.useCases).toHaveProperty("likeMoment")
            expect(components.useCases).toHaveProperty("unlikeMoment")
            expect(components.useCases).toHaveProperty("getLikedMoments")
            expect(components.useCases).toHaveProperty("commentMoment")
            expect(components.useCases).toHaveProperty("getMomentComments")
            expect(components.useCases).toHaveProperty("deleteMomentComment")
            expect(components.useCases).toHaveProperty("getCommentedMoments")
            expect(components.useCases).toHaveProperty("reportMoment")
            expect(components.useCases).toHaveProperty("getMomentReports")
            expect(components.useCases).toHaveProperty("getMomentMetrics")
            expect(components.useCases).toHaveProperty("getMomentsAnalytics")
            expect(components.useCases).toHaveProperty("adminBlockMoment")
            expect(components.useCases).toHaveProperty("adminUnblockMoment")
            expect(components.useCases).toHaveProperty("adminChangeMomentStatus")
            expect(components.useCases).toHaveProperty("adminDeleteMoment")
            expect(components.useCases).toHaveProperty("adminListAllMoments")
        })
    })

    describe("Singleton Behavior", () => {
        it("deve criar instâncias diferentes para cada chamada", () => {
            // Act
            const components1 = MomentFactory.createForProduction(mockDatabaseAdapter)
            const components2 = MomentFactory.createForProduction(mockDatabaseAdapter)

            // Assert
            expect(components1).not.toBe(components2)
            expect(components1.momentRepository).not.toBe(components2.momentRepository)
            expect(components1.momentService).not.toBe(components2.momentService)
            expect(components1.momentController).not.toBe(components2.momentController)
        })

        it("deve manter consistência entre instâncias", () => {
            // Act
            const components1 = MomentFactory.createForProduction(mockDatabaseAdapter)
            const components2 = MomentFactory.createForProduction(mockDatabaseAdapter)

            // Assert - Verificar se as estruturas são consistentes
            expect(Object.keys(components1)).toEqual(Object.keys(components2))
            expect(Object.keys(components1.useCases)).toEqual(Object.keys(components2.useCases))
        })
    })

    describe("Environment Consistency", () => {
        it("deve criar componentes consistentes para o mesmo ambiente", () => {
            // Act
            const prodComponents1 = MomentFactory.createForEnvironment(
                "production",
                mockDatabaseAdapter,
            )
            const prodComponents2 = MomentFactory.createForEnvironment(
                "production",
                mockDatabaseAdapter,
            )
            const testComponents1 = MomentFactory.createForEnvironment("test", mockDatabaseAdapter)
            const testComponents2 = MomentFactory.createForEnvironment("test", mockDatabaseAdapter)

            // Assert
            // Componentes de produção devem ter a mesma estrutura
            expect(Object.keys(prodComponents1)).toEqual(Object.keys(prodComponents2))

            // Componentes de teste devem ter a mesma estrutura
            expect(Object.keys(testComponents1)).toEqual(Object.keys(testComponents2))

            // Estrutura deve ser a mesma entre ambientes
            expect(Object.keys(prodComponents1)).toEqual(Object.keys(testComponents1))
        })

        it("deve criar componentes com configurações específicas por ambiente", () => {
            // Act
            const prodComponents = MomentFactory.createForEnvironment(
                "production",
                mockDatabaseAdapter,
            )
            const testComponents = MomentFactory.createForEnvironment("test", mockDatabaseAdapter)
            const devComponents = MomentFactory.createForEnvironment(
                "development",
                mockDatabaseAdapter,
            )

            // Assert - Verificar se todos os ambientes criam componentes válidos
            expect(prodComponents).toBeDefined()
            expect(testComponents).toBeDefined()
            expect(devComponents).toBeDefined()

            // Verificar se todos têm a mesma estrutura
            expect(Object.keys(prodComponents)).toEqual(Object.keys(testComponents))
            expect(Object.keys(testComponents)).toEqual(Object.keys(devComponents))
        })
    })

    describe("Error Handling", () => {
        it("deve criar componentes mesmo com DatabaseAdapter mockado", () => {
            // Act
            const components = MomentFactory.createForProduction(mockDatabaseAdapter)

            // Assert - Verificar se todos os componentes foram criados
            expect(components.momentRepository).toBeDefined()
            expect(components.momentService).toBeDefined()
            expect(components.momentController).toBeDefined()
            expect(components.momentMetricsController).toBeDefined()
            expect(components.useCases).toBeDefined()
        })

        it("deve criar componentes com DatabaseAdapter válido", () => {
            // Act
            const repository = MomentFactory.createMomentRepository(mockDatabaseAdapter)
            const service = MomentFactory.createMomentService(mockDatabaseAdapter)
            const controller = MomentFactory.createMomentController(mockDatabaseAdapter)

            // Assert - Verificar se todos os componentes foram criados
            expect(repository).toBeDefined()
            expect(service).toBeDefined()
            expect(controller).toBeDefined()
        })
    })
})
