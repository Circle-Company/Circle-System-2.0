import { ClusterInfo, RecommendationContext } from "../../../../types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    calculateDetailedTemporalMetrics,
    calculateTemporalScore,
    getDefaultTemporalFactors,
} from "../temporal"

// Mock do logger
vi.mock("../../utils/logger", () => ({
    getLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    })),
}))

describe("TemporalMetrics", () => {
    let mockCluster: ClusterInfo
    let mockContext: RecommendationContext
    let defaultFactors: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock do cluster
        mockCluster = {
            id: "cluster-456",
            name: "Technology Cluster",
            centroid: new Array(384).fill(0.2),
            members: ["post-1", "post-2", "post-3"],
            radius: 0.5,
            density: 0.8,
            size: 15,
            topics: ["technology", "AI", "programming"],
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Mock do contexto de recomendação
        mockContext = {
            timeOfDay: 14, // 2 PM
            dayOfWeek: 1, // Monday
            userTimezone: "America/Sao_Paulo",
            sessionDuration: 30,
            previousInteractions: 5,
        }

        // Fatores padrão para temporal
        defaultFactors = {
            hourOfDayWeights: {
                morning: 0.8,
                midday: 0.6,
                afternoon: 0.7,
                evening: 0.9,
                night: 0.5,
            },
            dayOfWeekWeights: {
                weekday: 0.7,
                weekend: 0.9,
            },
            contentFreshnessWeight: 0.4,
            temporalEventWeight: 0.2,
            contentHalfLifeHours: 24,
            eventDecayFactor: 0.8,
            historicalDays: 30,
        }
    })

    describe("calculateTemporalScore", () => {
        it("should calculate temporal score with valid data", () => {
            const score = calculateTemporalScore(mockCluster, mockContext, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should return neutral score when context is null", () => {
            const score = calculateTemporalScore(mockCluster, null, defaultFactors)

            expect(score).toBe(0.5) // Neutral score
        })

        it("should return neutral score when context is undefined", () => {
            const score = calculateTemporalScore(mockCluster, undefined, defaultFactors)

            expect(score).toBe(0.5) // Neutral score
        })

        it("should handle morning hours correctly", () => {
            const morningContext = {
                ...mockContext,
                timeOfDay: 8, // 8 AM
            }

            const score = calculateTemporalScore(mockCluster, morningContext, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle evening hours correctly", () => {
            const eveningContext = {
                ...mockContext,
                timeOfDay: 20, // 8 PM
            }

            const score = calculateTemporalScore(mockCluster, eveningContext, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle night hours correctly", () => {
            const nightContext = {
                ...mockContext,
                timeOfDay: 2, // 2 AM
            }

            const score = calculateTemporalScore(mockCluster, nightContext, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle weekend days correctly", () => {
            const weekendContext = {
                ...mockContext,
                dayOfWeek: 0, // Sunday
            }

            const score = calculateTemporalScore(mockCluster, weekendContext, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle weekday days correctly", () => {
            const weekdayContext = {
                ...mockContext,
                dayOfWeek: 3, // Wednesday
            }

            const score = calculateTemporalScore(mockCluster, weekdayContext, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle context without timeOfDay", () => {
            const contextWithoutTime = {
                ...mockContext,
                timeOfDay: undefined,
            }

            const score = calculateTemporalScore(mockCluster, contextWithoutTime, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle context without dayOfWeek", () => {
            const contextWithoutDay = {
                ...mockContext,
                dayOfWeek: undefined,
            }

            const score = calculateTemporalScore(mockCluster, contextWithoutDay, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should use default factors when not provided", () => {
            const score = calculateTemporalScore(mockCluster, mockContext)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle custom factors correctly", () => {
            const customFactors = {
                hourOfDayWeights: {
                    morning: 0.9,
                    midday: 0.7,
                    afternoon: 0.8,
                    evening: 1.0,
                    night: 0.6,
                },
                dayOfWeekWeights: {
                    weekday: 0.8,
                    weekend: 1.0,
                },
                contentFreshnessWeight: 0.5,
                temporalEventWeight: 0.3,
                contentHalfLifeHours: 12,
                eventDecayFactor: 0.9,
                historicalDays: 14,
            }

            const score = calculateTemporalScore(mockCluster, mockContext, customFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })
    })

    describe("calculateDetailedTemporalMetrics", () => {
        it("should return detailed metrics for valid data", () => {
            const metrics = calculateDetailedTemporalMetrics(
                mockCluster,
                mockContext,
                defaultFactors,
            )

            expect(metrics).toBeDefined()
            expect(metrics.hourRelevance).toBeDefined()
            expect(metrics.dayRelevance).toBeDefined()
            expect(metrics.contentFreshness).toBeDefined()
            expect(metrics.eventRelevance).toBeDefined()
            expect(metrics.overallTemporalScore).toBeDefined()

            // All metrics should be in range [0, 1]
            Object.values(metrics).forEach((value) => {
                expect(typeof value).toBe("number")
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            })
        })

        it("should handle context without timeOfDay in detailed metrics", () => {
            const contextWithoutTime = {
                ...mockContext,
                timeOfDay: undefined,
            }

            const metrics = calculateDetailedTemporalMetrics(
                mockCluster,
                contextWithoutTime,
                defaultFactors,
            )

            expect(metrics.hourRelevance).toBe(0.5) // Neutral value
        })

        it("should handle context without dayOfWeek in detailed metrics", () => {
            const contextWithoutDay = {
                ...mockContext,
                dayOfWeek: undefined,
            }

            const metrics = calculateDetailedTemporalMetrics(
                mockCluster,
                contextWithoutDay,
                defaultFactors,
            )

            expect(metrics.dayRelevance).toBe(0.5) // Neutral value
        })

        it("should handle errors gracefully in detailed metrics", () => {
            const invalidCluster = {
                ...mockCluster,
                createdAt: null as any,
            }

            const metrics = calculateDetailedTemporalMetrics(
                invalidCluster,
                mockContext,
                defaultFactors,
            )

            expect(metrics).toBeDefined()
            // Should return neutral values on error (mas não necessariamente 0.5 para todos)
            expect(metrics.hourRelevance).toBeDefined()
            expect(metrics.dayRelevance).toBeDefined()
            expect(metrics.contentFreshness).toBeDefined()
            expect(metrics.eventRelevance).toBeDefined()
            expect(metrics.overallTemporalScore).toBeDefined()
            expect(typeof metrics.hourRelevance).toBe("number")
            expect(typeof metrics.dayRelevance).toBe("number")
            expect(typeof metrics.contentFreshness).toBe("number")
            expect(typeof metrics.eventRelevance).toBe("number")
            expect(typeof metrics.overallTemporalScore).toBe("number")
        })

        it("should calculate hour relevance correctly", () => {
            const metrics = calculateDetailedTemporalMetrics(
                mockCluster,
                mockContext,
                defaultFactors,
            )

            expect(metrics.hourRelevance).toBeDefined()
            expect(typeof metrics.hourRelevance).toBe("number")
            expect(metrics.hourRelevance).toBeGreaterThanOrEqual(0)
            expect(metrics.hourRelevance).toBeLessThanOrEqual(1)
        })

        it("should calculate day relevance correctly", () => {
            const metrics = calculateDetailedTemporalMetrics(
                mockCluster,
                mockContext,
                defaultFactors,
            )

            expect(metrics.dayRelevance).toBeDefined()
            expect(typeof metrics.dayRelevance).toBe("number")
            expect(metrics.dayRelevance).toBeGreaterThanOrEqual(0)
            expect(metrics.dayRelevance).toBeLessThanOrEqual(1)
        })

        it("should calculate content freshness correctly", () => {
            const metrics = calculateDetailedTemporalMetrics(
                mockCluster,
                mockContext,
                defaultFactors,
            )

            expect(metrics.contentFreshness).toBeDefined()
            expect(typeof metrics.contentFreshness).toBe("number")
            expect(metrics.contentFreshness).toBeGreaterThanOrEqual(0)
            expect(metrics.contentFreshness).toBeLessThanOrEqual(1)
        })

        it("should calculate event relevance correctly", () => {
            const metrics = calculateDetailedTemporalMetrics(
                mockCluster,
                mockContext,
                defaultFactors,
            )

            expect(metrics.eventRelevance).toBeDefined()
            expect(typeof metrics.eventRelevance).toBe("number")
            expect(metrics.eventRelevance).toBeGreaterThanOrEqual(0)
            expect(metrics.eventRelevance).toBeLessThanOrEqual(1)
        })

        it("should calculate overall temporal score correctly", () => {
            const metrics = calculateDetailedTemporalMetrics(
                mockCluster,
                mockContext,
                defaultFactors,
            )

            expect(metrics.overallTemporalScore).toBeDefined()
            expect(typeof metrics.overallTemporalScore).toBe("number")
            expect(metrics.overallTemporalScore).toBeGreaterThanOrEqual(0)
            expect(metrics.overallTemporalScore).toBeLessThanOrEqual(1)
        })
    })

    describe("getDefaultTemporalFactors", () => {
        it("should return valid default factors", () => {
            const factors = getDefaultTemporalFactors()

            expect(factors).toBeDefined()
            expect(factors.hourOfDayWeights).toBeDefined()
            expect(factors.dayOfWeekWeights).toBeDefined()
            expect(factors.contentFreshnessWeight).toBe(0.4)
            expect(factors.temporalEventWeight).toBe(0.2)
            expect(factors.contentHalfLifeHours).toBe(24)
            expect(factors.eventDecayFactor).toBe(0.8)
            expect(factors.historicalDays).toBe(30)

            // Hour weights should be in range [0, 1]
            Object.values(factors.hourOfDayWeights).forEach((weight) => {
                expect(typeof weight).toBe("number")
                expect(weight).toBeGreaterThanOrEqual(0)
                expect(weight).toBeLessThanOrEqual(1)
            })

            // Day weights should be in range [0, 1]
            Object.values(factors.dayOfWeekWeights).forEach((weight) => {
                expect(typeof weight).toBe("number")
                expect(weight).toBeGreaterThanOrEqual(0)
                expect(weight).toBeLessThanOrEqual(1)
            })
        })

        it("should have reasonable default hour weights", () => {
            const factors = getDefaultTemporalFactors()

            expect(factors.hourOfDayWeights.morning).toBe(0.8)
            expect(factors.hourOfDayWeights.midday).toBe(0.6)
            expect(factors.hourOfDayWeights.afternoon).toBe(0.7)
            expect(factors.hourOfDayWeights.evening).toBe(0.9)
            expect(factors.hourOfDayWeights.night).toBe(0.5)
        })

        it("should have reasonable default day weights", () => {
            const factors = getDefaultTemporalFactors()

            expect(factors.dayOfWeekWeights.weekday).toBe(0.7)
            expect(factors.dayOfWeekWeights.weekend).toBe(0.9)
        })
    })

    describe("Hour Relevance Calculation", () => {
        it("should handle morning hours (6-10)", () => {
            const morningHours = [6, 7, 8, 9, 10]

            morningHours.forEach((hour) => {
                const context = { ...mockContext, timeOfDay: hour }
                const metrics = calculateDetailedTemporalMetrics(
                    mockCluster,
                    context,
                    defaultFactors,
                )

                expect(metrics.hourRelevance).toBe(0.8) // Should be morning weight
            })
        })

        it("should handle midday hours (11-13)", () => {
            const middayHours = [11, 12, 13]

            middayHours.forEach((hour) => {
                const context = { ...mockContext, timeOfDay: hour }
                const metrics = calculateDetailedTemporalMetrics(
                    mockCluster,
                    context,
                    defaultFactors,
                )

                expect(metrics.hourRelevance).toBe(0.6) // Should be midday weight
            })
        })

        it("should handle afternoon hours (14-17)", () => {
            const afternoonHours = [14, 15, 16, 17]

            afternoonHours.forEach((hour) => {
                const context = { ...mockContext, timeOfDay: hour }
                const metrics = calculateDetailedTemporalMetrics(
                    mockCluster,
                    context,
                    defaultFactors,
                )

                expect(metrics.hourRelevance).toBe(0.7) // Should be afternoon weight
            })
        })

        it("should handle evening hours (18-21)", () => {
            const eveningHours = [18, 19, 20, 21]

            eveningHours.forEach((hour) => {
                const context = { ...mockContext, timeOfDay: hour }
                const metrics = calculateDetailedTemporalMetrics(
                    mockCluster,
                    context,
                    defaultFactors,
                )

                expect(metrics.hourRelevance).toBe(0.9) // Should be evening weight
            })
        })

        it("should handle night hours (22-5)", () => {
            const nightHours = [22, 23, 0, 1, 2, 3, 4, 5]

            nightHours.forEach((hour) => {
                const context = { ...mockContext, timeOfDay: hour }
                const metrics = calculateDetailedTemporalMetrics(
                    mockCluster,
                    context,
                    defaultFactors,
                )

                expect(metrics.hourRelevance).toBe(0.5) // Should be night weight
            })
        })
    })

    describe("Day Relevance Calculation", () => {
        it("should handle weekday days", () => {
            const weekdayDays = [1, 2, 3, 4, 5] // Monday to Friday

            weekdayDays.forEach((day) => {
                const context = { ...mockContext, dayOfWeek: day }
                const metrics = calculateDetailedTemporalMetrics(
                    mockCluster,
                    context,
                    defaultFactors,
                )

                expect(metrics.dayRelevance).toBeGreaterThanOrEqual(0.6) // Should be weekday weight with adjustments
                expect(metrics.dayRelevance).toBeLessThanOrEqual(0.9) // Allow for Friday boost
            })
        })

        it("should handle weekend days", () => {
            const weekendDays = [0, 6] // Sunday and Saturday

            weekendDays.forEach((day) => {
                const context = { ...mockContext, dayOfWeek: day }
                const metrics = calculateDetailedTemporalMetrics(
                    mockCluster,
                    context,
                    defaultFactors,
                )

                expect(metrics.dayRelevance).toBeGreaterThanOrEqual(0.9) // Should be weekend weight with adjustments
                expect(metrics.dayRelevance).toBeLessThanOrEqual(1.0)
            })
        })

        it("should apply day-specific adjustments", () => {
            const sundayContext = { ...mockContext, dayOfWeek: 0 }
            const mondayContext = { ...mockContext, dayOfWeek: 1 }
            const fridayContext = { ...mockContext, dayOfWeek: 5 }
            const saturdayContext = { ...mockContext, dayOfWeek: 6 }

            const sundayMetrics = calculateDetailedTemporalMetrics(
                mockCluster,
                sundayContext,
                defaultFactors,
            )
            const mondayMetrics = calculateDetailedTemporalMetrics(
                mockCluster,
                mondayContext,
                defaultFactors,
            )
            const fridayMetrics = calculateDetailedTemporalMetrics(
                mockCluster,
                fridayContext,
                defaultFactors,
            )
            const saturdayMetrics = calculateDetailedTemporalMetrics(
                mockCluster,
                saturdayContext,
                defaultFactors,
            )

            expect(fridayMetrics.dayRelevance).toBeGreaterThanOrEqual(mondayMetrics.dayRelevance) // Friday boost
            expect(sundayMetrics.dayRelevance).toBeGreaterThanOrEqual(saturdayMetrics.dayRelevance) // Sunday boost
        })
    })

    describe("Edge Cases", () => {
        it("should handle invalid hour values", () => {
            const invalidHours = [-1, 24, 25, 100]

            invalidHours.forEach((hour) => {
                const context = { ...mockContext, timeOfDay: hour }
                const score = calculateTemporalScore(mockCluster, context, defaultFactors)

                expect(score).toBeDefined()
                expect(typeof score).toBe("number")
                expect(score).toBeGreaterThanOrEqual(0)
                expect(score).toBeLessThanOrEqual(1)
            })
        })

        it("should handle invalid day values", () => {
            const invalidDays = [-1, 7, 8, 100]

            invalidDays.forEach((day) => {
                const context = { ...mockContext, dayOfWeek: day }
                const score = calculateTemporalScore(mockCluster, context, defaultFactors)

                expect(score).toBeDefined()
                expect(typeof score).toBe("number")
                expect(score).toBeGreaterThanOrEqual(0)
                expect(score).toBeLessThanOrEqual(1)
            })
        })

        it("should handle very large half-life values", () => {
            const factorsWithLargeHalfLife = {
                ...defaultFactors,
                contentHalfLifeHours: 1000,
            }

            const score = calculateTemporalScore(mockCluster, mockContext, factorsWithLargeHalfLife)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle zero half-life values", () => {
            const factorsWithZeroHalfLife = {
                ...defaultFactors,
                contentHalfLifeHours: 0,
            }

            const score = calculateTemporalScore(mockCluster, mockContext, factorsWithZeroHalfLife)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle negative half-life values", () => {
            const factorsWithNegativeHalfLife = {
                ...defaultFactors,
                contentHalfLifeHours: -10,
            }

            const score = calculateTemporalScore(
                mockCluster,
                mockContext,
                factorsWithNegativeHalfLife,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })
    })

    describe("Performance Tests", () => {
        it("should calculate temporal score efficiently", () => {
            const startTime = performance.now()

            // Calculate multiple scores
            for (let i = 0; i < 100; i++) {
                calculateTemporalScore(mockCluster, mockContext, defaultFactors)
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            // Should complete 100 calculations in reasonable time (< 1 second)
            expect(duration).toBeLessThan(1000)
        })

        it("should handle detailed metrics calculation efficiently", () => {
            const startTime = performance.now()

            // Calculate multiple detailed metrics
            for (let i = 0; i < 100; i++) {
                calculateDetailedTemporalMetrics(mockCluster, mockContext, defaultFactors)
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            // Should complete 100 calculations in reasonable time (< 1 second)
            expect(duration).toBeLessThan(1000)
        })
    })

    describe("Mathematical Properties", () => {
        it("should maintain score bounds", () => {
            const testCases = [
                { timeOfDay: 0, dayOfWeek: 0 },
                { timeOfDay: 12, dayOfWeek: 3 },
                { timeOfDay: 20, dayOfWeek: 6 },
            ]

            testCases.forEach((testCase) => {
                const context = {
                    ...mockContext,
                    timeOfDay: testCase.timeOfDay,
                    dayOfWeek: testCase.dayOfWeek,
                }
                const score = calculateTemporalScore(mockCluster, context, defaultFactors)

                expect(score).toBeGreaterThanOrEqual(0)
                expect(score).toBeLessThanOrEqual(1)
            })
        })

        it("should be consistent for same time and day", () => {
            const context1 = { ...mockContext, timeOfDay: 14, dayOfWeek: 1 }
            const context2 = { ...mockContext, timeOfDay: 14, dayOfWeek: 1 }

            const score1 = calculateTemporalScore(mockCluster, context1, defaultFactors)
            const score2 = calculateTemporalScore(mockCluster, context2, defaultFactors)

            expect(score1).toBe(score2)
        })

        it("should be monotonic with respect to hour weights", () => {
            const eveningContext = { ...mockContext, timeOfDay: 20 } // Evening
            const nightContext = { ...mockContext, timeOfDay: 2 } // Night

            const eveningScore = calculateTemporalScore(mockCluster, eveningContext, defaultFactors)
            const nightScore = calculateTemporalScore(mockCluster, nightContext, defaultFactors)

            expect(eveningScore).toBeGreaterThan(nightScore) // Evening should score higher than night
        })

        it("should be monotonic with respect to day weights", () => {
            const weekdayContext = { ...mockContext, dayOfWeek: 1 } // Monday
            const weekendContext = { ...mockContext, dayOfWeek: 0 } // Sunday

            const weekdayScore = calculateTemporalScore(mockCluster, weekdayContext, defaultFactors)
            const weekendScore = calculateTemporalScore(mockCluster, weekendContext, defaultFactors)

            expect(weekendScore).toBeGreaterThan(weekdayScore) // Weekend should score higher than weekday
        })
    })
})
