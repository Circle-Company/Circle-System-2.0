import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentFactory, MomentFactoryConfig, createMoment } from "../moment.factory"

import { DatabaseAdapter } from "@/infra/database/adapter"

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
            expect(useCases.createMoment).toBeDefined()
            expect(useCases.getMoment).toBeDefined()
            expect(useCases.publishMoment).toBeDefined()
            expect(useCases.listMoments).toBeDefined()
            expect(useCases.getUserMoments).toBeDefined()
            expect(useCases.searchMoments).toBeDefined()
            expect(useCases.likeMoment).toBeDefined()
            expect(useCases.unlikeMoment).toBeDefined()
            expect(useCases.getLikedMoments).toBeDefined()
            expect(useCases.commentMoment).toBeDefined()
            expect(useCases.getMomentComments).toBeDefined()
            expect(useCases.editMomentComment).toBeDefined()
            expect(useCases.deleteMomentComment).toBeDefined()
            expect(useCases.getCommentedMoments).toBeDefined()
            expect(useCases.reportMoment).toBeDefined()
            expect(useCases.getMomentReports).toBeDefined()
            expect(useCases.getUserMomentReports).toBeDefined()
            expect(useCases.getUserReportedMoments).toBeDefined()
            expect(useCases.getMomentMetrics).toBeDefined()
            expect(useCases.getMomentsAnalytics).toBeDefined()
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
    })

    describe("createMomentMetricsController", () => {
        it("deve criar um MomentMetricsController com todas as dependências", () => {
            // Act
            const controller = MomentFactory.createMomentMetricsController(mockDatabaseAdapter)

            // Assert
            expect(controller).toBeDefined()
            expect(typeof controller).toBe("object")
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
            expect(useCases.publishMoment).toBeDefined()
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
    })
})
