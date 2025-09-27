import { IDAdapter, SnowflakeAdapter } from "./id.adapter"

/**
 * Classe principal para geração de IDs
 * Usa o padrão Adapter para permitir diferentes implementações
 */
export class IDGenerator {
    private static instance: IDGenerator
    private adapter: IDAdapter

    private constructor(adapter?: IDAdapter) {
        this.adapter = adapter || new SnowflakeAdapter()
    }

    /**
     * Obtém a instância singleton do IDGenerator
     */
    static getInstance(adapter?: IDAdapter): IDGenerator {
        if (!IDGenerator.instance) {
            IDGenerator.instance = new IDGenerator(adapter)
        }
        return IDGenerator.instance
    }

    /**
     * Define um novo adapter para geração de IDs
     */
    setAdapter(adapter: IDAdapter): void {
        this.adapter = adapter
    }

    /**
     * Gera um novo ID usando o adapter configurado
     */
    generate(): string {
        return this.adapter.generate()
    }

    /**
     * Reseta a instância singleton (útil para testes)
     */
    static reset(): void {
        IDGenerator.instance = undefined as any
    }
}

/**
 * Função utilitária para geração rápida de IDs
 * Usa o adapter padrão (Snowflake)
 */
export function generateId(): string {
    return IDGenerator.getInstance().generate()
}

/**
 * Função utilitária para criar um IDGenerator com configurações específicas
 */
export function createIDGenerator(workerId?: number, epoch?: number): IDGenerator {
    const adapter = new SnowflakeAdapter(workerId, epoch)
    return IDGenerator.getInstance(adapter)
}
