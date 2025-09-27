import { LogLevel, Logger, logger } from "../index"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("Logger", () => {
    let mockConsole: {
        debug: ReturnType<typeof vi.fn>
        info: ReturnType<typeof vi.fn>
        warn: ReturnType<typeof vi.fn>
        error: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock console methods
        mockConsole = {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        }

        // Replace console methods with mocks
        vi.spyOn(console, "debug").mockImplementation(mockConsole.debug)
        vi.spyOn(console, "info").mockImplementation(mockConsole.info)
        vi.spyOn(console, "warn").mockImplementation(mockConsole.warn)
        vi.spyOn(console, "error").mockImplementation(mockConsole.error)
    })

    describe("LogLevel enum", () => {
        it("should have correct values", () => {
            expect(LogLevel.DEBUG).toBe("debug")
            expect(LogLevel.INFO).toBe("info")
            expect(LogLevel.WARN).toBe("warn")
            expect(LogLevel.ERROR).toBe("error")
        })

        it("should have all expected levels", () => {
            const levels = Object.values(LogLevel)
            expect(levels).toHaveLength(4)
            expect(levels).toContain("debug")
            expect(levels).toContain("info")
            expect(levels).toContain("warn")
            expect(levels).toContain("error")
        })
    })

    describe("Logger constructor", () => {
        it("should create logger with valid configuration", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: true,
                showComponent: true,
                enabled: true,
            })

            expect(testLogger).toBeDefined()
            expect(testLogger).toBeInstanceOf(Logger)
        })

        it("should create logger with minimal configuration", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.DEBUG,
                showTimestamp: false,
                showComponent: false,
                enabled: false,
            })

            expect(testLogger).toBeDefined()
            expect(testLogger).toBeInstanceOf(Logger)
        })
    })

    describe("Logger methods", () => {
        let testLogger: Logger

        beforeEach(() => {
            testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.DEBUG,
                showTimestamp: true,
                showComponent: true,
                enabled: true,
            })
        })

        describe("debug", () => {
            it("should log debug message", () => {
                testLogger.debug("Debug message")

                expect(mockConsole.debug).toHaveBeenCalledTimes(1)
                expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringContaining("[DEBUG]"))
                expect(mockConsole.debug).toHaveBeenCalledWith(
                    expect.stringContaining("[TestComponent]"),
                )
                expect(mockConsole.debug).toHaveBeenCalledWith(
                    expect.stringContaining("Debug message"),
                )
            })

            it("should log debug message with data", () => {
                const testData = { key: "value", number: 123 }
                testLogger.debug("Debug message", testData)

                expect(mockConsole.debug).toHaveBeenCalledTimes(2)
                expect(mockConsole.debug).toHaveBeenNthCalledWith(
                    1,
                    expect.stringContaining("Debug message"),
                )
                expect(mockConsole.debug).toHaveBeenNthCalledWith(2, testData)
            })
        })

        describe("info", () => {
            it("should log info message", () => {
                testLogger.info("Info message")

                expect(mockConsole.info).toHaveBeenCalledTimes(1)
                expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining("[INFO]"))
                expect(mockConsole.info).toHaveBeenCalledWith(
                    expect.stringContaining("[TestComponent]"),
                )
                expect(mockConsole.info).toHaveBeenCalledWith(
                    expect.stringContaining("Info message"),
                )
            })

            it("should log info message with data", () => {
                const testData = { status: "success" }
                testLogger.info("Info message", testData)

                expect(mockConsole.info).toHaveBeenCalledTimes(2)
                expect(mockConsole.info).toHaveBeenNthCalledWith(
                    1,
                    expect.stringContaining("Info message"),
                )
                expect(mockConsole.info).toHaveBeenNthCalledWith(2, testData)
            })
        })

        describe("warn", () => {
            it("should log warn message", () => {
                testLogger.warn("Warning message")

                expect(mockConsole.warn).toHaveBeenCalledTimes(1)
                expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining("[WARN]"))
                expect(mockConsole.warn).toHaveBeenCalledWith(
                    expect.stringContaining("[TestComponent]"),
                )
                expect(mockConsole.warn).toHaveBeenCalledWith(
                    expect.stringContaining("Warning message"),
                )
            })

            it("should log warn message with data", () => {
                const testData = { warning: "deprecated" }
                testLogger.warn("Warning message", testData)

                expect(mockConsole.warn).toHaveBeenCalledTimes(2)
                expect(mockConsole.warn).toHaveBeenNthCalledWith(
                    1,
                    expect.stringContaining("Warning message"),
                )
                expect(mockConsole.warn).toHaveBeenNthCalledWith(2, testData)
            })
        })

        describe("error", () => {
            it("should log error message", () => {
                testLogger.error("Error message")

                expect(mockConsole.error).toHaveBeenCalledTimes(1)
                expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining("[ERROR]"))
                expect(mockConsole.error).toHaveBeenCalledWith(
                    expect.stringContaining("[TestComponent]"),
                )
                expect(mockConsole.error).toHaveBeenCalledWith(
                    expect.stringContaining("Error message"),
                )
            })

            it("should log error message with data", () => {
                const testData = { error: "validation failed" }
                testLogger.error("Error message", testData)

                expect(mockConsole.error).toHaveBeenCalledTimes(2)
                expect(mockConsole.error).toHaveBeenNthCalledWith(
                    1,
                    expect.stringContaining("Error message"),
                )
                expect(mockConsole.error).toHaveBeenNthCalledWith(2, testData)
            })
        })
    })

    describe("Log level filtering", () => {
        it("should log all levels when minLevel is DEBUG", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.DEBUG,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.debug("Debug message")
            testLogger.info("Info message")
            testLogger.warn("Warning message")
            testLogger.error("Error message")

            expect(mockConsole.debug).toHaveBeenCalledTimes(1)
            expect(mockConsole.info).toHaveBeenCalledTimes(1)
            expect(mockConsole.warn).toHaveBeenCalledTimes(1)
            expect(mockConsole.error).toHaveBeenCalledTimes(1)
        })

        it("should log INFO and above when minLevel is INFO", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.debug("Debug message")
            testLogger.info("Info message")
            testLogger.warn("Warning message")
            testLogger.error("Error message")

            expect(mockConsole.debug).not.toHaveBeenCalled()
            expect(mockConsole.info).toHaveBeenCalledTimes(1)
            expect(mockConsole.warn).toHaveBeenCalledTimes(1)
            expect(mockConsole.error).toHaveBeenCalledTimes(1)
        })

        it("should log WARN and above when minLevel is WARN", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.WARN,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.debug("Debug message")
            testLogger.info("Info message")
            testLogger.warn("Warning message")
            testLogger.error("Error message")

            expect(mockConsole.debug).not.toHaveBeenCalled()
            expect(mockConsole.info).not.toHaveBeenCalled()
            expect(mockConsole.warn).toHaveBeenCalledTimes(1)
            expect(mockConsole.error).toHaveBeenCalledTimes(1)
        })

        it("should log only ERROR when minLevel is ERROR", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.ERROR,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.debug("Debug message")
            testLogger.info("Info message")
            testLogger.warn("Warning message")
            testLogger.error("Error message")

            expect(mockConsole.debug).not.toHaveBeenCalled()
            expect(mockConsole.info).not.toHaveBeenCalled()
            expect(mockConsole.warn).not.toHaveBeenCalled()
            expect(mockConsole.error).toHaveBeenCalledTimes(1)
        })
    })

    describe("Logger configuration", () => {
        it("should not log when disabled", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.DEBUG,
                showTimestamp: false,
                showComponent: false,
                enabled: false,
            })

            testLogger.debug("Debug message")
            testLogger.info("Info message")
            testLogger.warn("Warning message")
            testLogger.error("Error message")

            expect(mockConsole.debug).not.toHaveBeenCalled()
            expect(mockConsole.info).not.toHaveBeenCalled()
            expect(mockConsole.warn).not.toHaveBeenCalled()
            expect(mockConsole.error).not.toHaveBeenCalled()
        })

        it("should show timestamp when enabled", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: true,
                showComponent: false,
                enabled: true,
            })

            testLogger.info("Info message")

            expect(mockConsole.info).toHaveBeenCalledWith(
                expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/),
            )
        })

        it("should not show timestamp when disabled", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.info("Info message")

            expect(mockConsole.info).toHaveBeenCalledWith(
                expect.not.stringMatching(
                    /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{2}:\d{2}:\d{2}\.\d{3}Z\]/,
                ),
            )
        })

        it("should show component when enabled", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: true,
                enabled: true,
            })

            testLogger.info("Info message")

            expect(mockConsole.info).toHaveBeenCalledWith(
                expect.stringContaining("[TestComponent]"),
            )
        })

        it("should not show component when disabled", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.info("Info message")

            expect(mockConsole.info).toHaveBeenCalledWith(
                expect.not.stringContaining("[TestComponent]"),
            )
        })

        it("should format message correctly with all options enabled", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: true,
                showComponent: true,
                enabled: true,
            })

            testLogger.info("Test message")

            const call = mockConsole.info.mock.calls[0][0]
            expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
            expect(call).toContain("[INFO]")
            expect(call).toContain("[TestComponent]")
            expect(call).toContain("Test message")
        })

        it("should format message correctly with minimal options", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.info("Test message")

            const call = mockConsole.info.mock.calls[0][0]
            expect(call).not.toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
            expect(call).toContain("[INFO]")
            expect(call).not.toContain("[TestComponent]")
            expect(call).toContain("Test message")
        })
    })

    describe("Message formatting", () => {
        it("should include ANSI color codes", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.DEBUG,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.debug("Debug message")
            testLogger.info("Info message")
            testLogger.warn("Warning message")
            testLogger.error("Error message")

            // Check for ANSI color codes
            expect(mockConsole.debug).toHaveBeenCalledWith(
                expect.stringContaining("\x1b[90m"), // Gray for DEBUG
            )
            expect(mockConsole.info).toHaveBeenCalledWith(
                expect.stringContaining("\x1b[36m"), // Cyan for INFO
            )
            expect(mockConsole.warn).toHaveBeenCalledWith(
                expect.stringContaining("\x1b[33m"), // Yellow for WARN
            )
            expect(mockConsole.error).toHaveBeenCalledWith(
                expect.stringContaining("\x1b[31m"), // Red for ERROR
            )

            // Check for reset codes
            expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringContaining("\x1b[0m"))
            expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining("\x1b[0m"))
            expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining("\x1b[0m"))
            expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining("\x1b[0m"))
        })

        it("should handle empty messages", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.info("")

            expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining("[INFO]"))
        })

        it("should handle special characters in messages", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            const specialMessage = "Message with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?"
            testLogger.info(specialMessage)

            expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining(specialMessage))
        })

        it("should handle unicode characters", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            const unicodeMessage = "Mensagem com acentos: ção, ñ, é, í, ó, ú"
            testLogger.info(unicodeMessage)

            expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining(unicodeMessage))
        })
    })

    describe("Data handling", () => {
        it("should handle undefined data", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.info("Message", undefined)

            expect(mockConsole.info).toHaveBeenCalledTimes(1)
            expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining("Message"))
        })

        it("should handle null data", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.info("Message", null)

            expect(mockConsole.info).toHaveBeenCalledTimes(1)
            expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining("Message"))
            // null is falsy, so it's not logged as data
        })

        it("should handle object data", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            const data = { key: "value", nested: { prop: 123 } }
            testLogger.info("Message", data)

            expect(mockConsole.info).toHaveBeenCalledTimes(2)
            expect(mockConsole.info).toHaveBeenNthCalledWith(2, data)
        })

        it("should handle array data", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            const data = [1, 2, 3, "test", { key: "value" }]
            testLogger.info("Message", data)

            expect(mockConsole.info).toHaveBeenCalledTimes(2)
            expect(mockConsole.info).toHaveBeenNthCalledWith(2, data)
        })

        it("should handle primitive data types", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            testLogger.info("String", "string data")
            testLogger.info("Number", 42)
            testLogger.info("Boolean", true)
            testLogger.info("Symbol", Symbol("test"))

            expect(mockConsole.info).toHaveBeenCalledTimes(8) // 4 messages + 4 data
            expect(mockConsole.info).toHaveBeenNthCalledWith(2, "string data")
            expect(mockConsole.info).toHaveBeenNthCalledWith(4, 42)
            expect(mockConsole.info).toHaveBeenNthCalledWith(6, true)
            expect(mockConsole.info).toHaveBeenNthCalledWith(8, expect.any(Symbol))
        })
    })

    describe("Default logger instance", () => {
        it("should be created with correct configuration", () => {
            expect(logger).toBeDefined()
            expect(logger).toBeInstanceOf(Logger)
        })

        it("should log when NODE_ENV is not production", () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = "development"

            // Create a new logger instance to test the environment check
            const testLogger = new Logger("Api", {
                minLevel: LogLevel.INFO,
                showTimestamp: true,
                showComponent: true,
                enabled: process.env.NODE_ENV !== "production",
            })

            testLogger.info("Test message")

            expect(mockConsole.info).toHaveBeenCalledTimes(1)

            // Restore original environment
            process.env.NODE_ENV = originalEnv
        })

        it("should not log when NODE_ENV is production", () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = "production"

            // Create a new logger instance to test the environment check
            const testLogger = new Logger("Api", {
                minLevel: LogLevel.INFO,
                showTimestamp: true,
                showComponent: true,
                enabled: process.env.NODE_ENV !== "production",
            })

            testLogger.info("Test message")

            expect(mockConsole.info).not.toHaveBeenCalled()

            // Restore original environment
            process.env.NODE_ENV = originalEnv
        })
    })

    describe("Edge cases", () => {
        it("should handle very long messages", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            const longMessage = "A".repeat(10000)
            testLogger.info(longMessage)

            expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining(longMessage))
        })

        it("should handle messages with newlines", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            const multilineMessage = "Line 1\nLine 2\nLine 3"
            testLogger.info(multilineMessage)

            expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining(multilineMessage))
        })

        it("should handle circular references in data", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            const circularData: any = { name: "test" }
            circularData.self = circularData

            // This should not throw an error
            expect(() => {
                testLogger.info("Message", circularData)
            }).not.toThrow()

            expect(mockConsole.info).toHaveBeenCalledTimes(2)
        })

        it("should handle complex nested objects", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            const complexData = {
                level1: {
                    level2: {
                        level3: {
                            array: [1, 2, { nested: true }],
                            func: () => "test",
                            date: new Date(),
                        },
                    },
                },
            }

            testLogger.info("Message", complexData)

            expect(mockConsole.info).toHaveBeenCalledTimes(2)
            expect(mockConsole.info).toHaveBeenNthCalledWith(2, complexData)
        })
    })

    describe("Performance", () => {
        it("should handle multiple rapid log calls", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            const startTime = performance.now()

            // Log 1000 messages rapidly
            for (let i = 0; i < 1000; i++) {
                testLogger.info(`Message ${i}`)
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            expect(mockConsole.info).toHaveBeenCalledTimes(1000)
            expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
        })

        it("should handle disabled logger efficiently", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: true,
                showComponent: true,
                enabled: false, // Disabled
            })

            const startTime = performance.now()

            // Try to log 1000 messages
            for (let i = 0; i < 1000; i++) {
                testLogger.info(`Message ${i}`)
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            expect(mockConsole.info).not.toHaveBeenCalled()
            expect(duration).toBeLessThan(100) // Should be very fast when disabled
        })
    })

    describe("Type safety", () => {
        it("should accept string messages", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            expect(() => {
                testLogger.info("String message")
            }).not.toThrow()
        })

        it("should accept any data type", () => {
            const testLogger = new Logger("TestComponent", {
                minLevel: LogLevel.INFO,
                showTimestamp: false,
                showComponent: false,
                enabled: true,
            })

            expect(() => {
                testLogger.info("Message", "string")
                testLogger.info("Message", 123)
                testLogger.info("Message", true)
                testLogger.info("Message", {})
                testLogger.info("Message", [])
                testLogger.info("Message", null)
                testLogger.info("Message", undefined)
            }).not.toThrow()
        })
    })
})
