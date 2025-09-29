import { DatabaseManager } from "./index"
import { Sequelize } from "sequelize"

/**
 * Interface para adapters de banco de dados
 * Permite trocar implementações sem afetar a lógica da aplicação
 */
export interface DatabaseAdapter {
    connect(): Promise<void>
    disconnect(): Promise<void>
    getConnection(): Sequelize
    isConnected(): boolean
}

/**
 * Adapter para Sequelize
 * Implementa a interface DatabaseAdapter usando Sequelize
 */
export class SequelizeAdapter implements DatabaseAdapter {
    private databaseManager: DatabaseManager
    private isConnectedFlag = false

    constructor() {
        this.databaseManager = DatabaseManager.getInstance()
    }

    async connect(): Promise<void> {
        try {
            await this.databaseManager.initialize()
            this.isConnectedFlag = true
        } catch (error) {
            this.isConnectedFlag = false
            throw error
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.databaseManager.close()
            this.isConnectedFlag = false
        } catch (error) {
            throw error
        }
    }

    getConnection(): Sequelize {
        return this.databaseManager.getSequelize()
    }

    isConnected(): boolean {
        return this.isConnectedFlag
    }
}

/**
 * Adapter Mock para testes
 * Implementa a interface DatabaseAdapter sem conexão real
 */
export class MockDatabaseAdapter implements DatabaseAdapter {
    private mockConnection: any
    private isConnectedFlag = false

    constructor() {
        this.mockConnection = {
            authenticate: () => Promise.resolve(),
            close: () => Promise.resolve(),
            models: {},
        }
    }

    async connect(): Promise<void> {
        this.isConnectedFlag = true
    }

    async disconnect(): Promise<void> {
        this.isConnectedFlag = false
    }

    getConnection(): any {
        return this.mockConnection
    }

    isConnected(): boolean {
        return this.isConnectedFlag
    }
}

/**
 * Factory para criar adapters de banco de dados
 */
export class DatabaseAdapterFactory {
    static create(type: "sequelize" | "mock" = "sequelize"): DatabaseAdapter {
        switch (type) {
            case "sequelize":
                return new SequelizeAdapter()
            case "mock":
                return new MockDatabaseAdapter()
            default:
                throw new Error(`Unknown database adapter type: ${type}`)
        }
    }

    static createForEnvironment(environment: string): DatabaseAdapter {
        if (environment === "test") {
            return this.create("mock")
        }
        return this.create("sequelize")
    }
}
