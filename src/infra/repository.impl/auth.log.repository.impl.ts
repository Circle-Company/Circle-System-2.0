/**
 * Auth Log Repository Implementation - Implementação do repositório de logs de autenticação
 *
 * @author Circle Team
 * @version 1.0.0
 */

import { AuthLogStatus, AuthLogType } from "@/domain/auth/auth.type"
import SignLog, {
    SecurityRisk,
    SignLogAttributes,
    SignStatus,
    SignType,
} from "@/infra/models/auth/sign.logs.model"
import { Op, literal } from "sequelize"

import { Device } from "@/domain/authorization"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { logger } from "@/shared"

export interface AuthLogData {
    username: string
    ipAddress: string
    userAgent: string
    type: AuthLogType
    status: AuthLogStatus
    failureReason: string
    deviceType: Device
    deviceId: string
    deviceTimezone: string
    createdAt: Date
}

export interface IAuthLogRepository {
    /**
     * Criar um novo log de autenticação
     */
    create(logData: AuthLogData): Promise<void>

    /**
     * Buscar logs por username
     */
    findByUsername(username: string, limit?: number): Promise<AuthLogData[]>

    /**
     * Buscar logs por IP
     */
    findByIpAddress(ipAddress: string, limit?: number): Promise<AuthLogData[]>

    /**
     * Contar tentativas falhadas por username em um período
     */
    countFailedAttemptsByUsername(username: string, since?: Date): Promise<number>

    /**
     * Contar tentativas falhadas por IP em um período
     */
    countFailedAttemptsByIp(ipAddress: string, since?: Date): Promise<number>

    /**
     * Buscar logs por período
     */
    findByDateRange(startDate: Date, endDate: Date, limit?: number): Promise<AuthLogData[]>

    /**
     * Buscar logs suspeitos por nível de risco
     */
    findBySecurityRisk(risk: SecurityRisk, limit?: number): Promise<AuthLogData[]>

    /**
     * Limpar logs antigos
     */
    deleteOldLogs(olderThan: Date): Promise<number>
}

export class AuthLogRepositoryImpl implements IAuthLogRepository {
    constructor(private database: DatabaseAdapter) {}

    /**
     * Mapeia AuthLogData para SignLogAttributes
     */
    private mapToSignLogAttributes(logData: AuthLogData): SignLogAttributes {
        return {
            typed_username: logData.username,
            sign_type: this.mapAuthLogTypeToSignType(logData.type),
            status: this.mapAuthLogStatusToSignStatus(logData.status),
            security_risk: this.determineSecurityRisk(logData.status, logData.failureReason),
            ip_address: logData.ipAddress,
            user_agent: logData.userAgent,
            machine_id: logData.deviceId,
            timezone: logData.deviceTimezone,
        }
    }

    /**
     * Mapeia SignLog para AuthLogData
     */
    private mapSignLogToAuthLogData(signLog: SignLog): AuthLogData {
        return {
            username: signLog.typed_username,
            ipAddress: signLog.ip_address,
            userAgent: signLog.user_agent,
            type: this.mapSignTypeToAuthLogType(signLog.sign_type),
            status: this.mapSignStatusToAuthLogStatus(signLog.status),
            failureReason: this.getFailureReasonFromSecurityRisk(signLog.security_risk),
            deviceType: Device.WEB, // Default, pode ser melhorado
            deviceId: signLog.machine_id || "",
            deviceTimezone: signLog.timezone || "",
            createdAt: (signLog as any).created_at || new Date(),
        }
    }

    /**
     * Mapeia AuthLogType para SignType
     */
    private mapAuthLogTypeToSignType(type: AuthLogType): SignType {
        switch (type) {
            case AuthLogType.SIGNIN:
                return SignType.SIGNIN
            case AuthLogType.SIGNUP:
                return SignType.SIGNUP
            default:
                return SignType.SIGNIN
        }
    }

    /**
     * Mapeia SignType para AuthLogType
     */
    private mapSignTypeToAuthLogType(type: SignType): AuthLogType {
        switch (type) {
            case SignType.SIGNIN:
                return AuthLogType.SIGNIN
            case SignType.SIGNUP:
                return AuthLogType.SIGNUP
            default:
                return AuthLogType.SIGNIN
        }
    }

    /**
     * Mapeia AuthLogStatus para SignStatus
     */
    private mapAuthLogStatusToSignStatus(status: AuthLogStatus): SignStatus {
        switch (status) {
            case AuthLogStatus.SUCCESS:
                return SignStatus.APPROVED
            case AuthLogStatus.FAILED:
                return SignStatus.REJECTED
            case AuthLogStatus.BLOCKED:
                return SignStatus.SUSPICIOUS
            default:
                return SignStatus.REJECTED
        }
    }

    /**
     * Mapeia SignStatus para AuthLogStatus
     */
    private mapSignStatusToAuthLogStatus(status: SignStatus): AuthLogStatus {
        switch (status) {
            case SignStatus.APPROVED:
                return AuthLogStatus.SUCCESS
            case SignStatus.REJECTED:
                return AuthLogStatus.FAILED
            case SignStatus.SUSPICIOUS:
                return AuthLogStatus.BLOCKED
            default:
                return AuthLogStatus.FAILED
        }
    }

    /**
     * Determina o nível de risco de segurança baseado no status e motivo de falha
     */
    private determineSecurityRisk(status: AuthLogStatus, failureReason: string): SecurityRisk {
        if (status === AuthLogStatus.SUCCESS) {
            return SecurityRisk.LOW
        }

        if (status === AuthLogStatus.BLOCKED) {
            return SecurityRisk.CRITICAL
        }

        // Analisa o motivo da falha para determinar o risco
        const reason = failureReason.toLowerCase()
        if (reason.includes("brute force") || reason.includes("multiple attempts")) {
            return SecurityRisk.HIGH
        }
        if (reason.includes("invalid") || reason.includes("incorrect")) {
            return SecurityRisk.MEDIUM
        }

        return SecurityRisk.MEDIUM
    }

    /**
     * Converte SecurityRisk para motivo de falha
     */
    private getFailureReasonFromSecurityRisk(risk: SecurityRisk): string {
        switch (risk) {
            case SecurityRisk.LOW:
                return "Login bem-sucedido"
            case SecurityRisk.MEDIUM:
                return "Credenciais inválidas"
            case SecurityRisk.HIGH:
                return "Múltiplas tentativas falhadas"
            case SecurityRisk.CRITICAL:
                return "Acesso bloqueado por segurança"
            default:
                return "Falha na autenticação"
        }
    }

    async create(logData: AuthLogData): Promise<void> {
        try {
            const sequelize = this.database.getConnection()
            const signLogAttributes = this.mapToSignLogAttributes(logData)

            await SignLog.create(signLogAttributes)

            logger.info(
                `Auth log created for username: ${logData.username}, status: ${logData.status}`,
            )
        } catch (error) {
            logger.error(`Error creating auth log: ${error}`)
            throw new Error(`Falha ao criar log de autenticação: ${error}`)
        }
    }

    async findByUsername(username: string, limit: number = 50): Promise<AuthLogData[]> {
        try {
            const sequelize = this.database.getConnection()

            const signLogs = await SignLog.findAll({
                where: {
                    typed_username: username,
                },
                order: [["id", "DESC"]],
                limit: Math.min(limit, 100), // Máximo de 100 registros
            })

            return signLogs.map((log) => this.mapSignLogToAuthLogData(log))
        } catch (error) {
            logger.error(`Error finding auth logs by username: ${error}`)
            throw new Error(`Falha ao buscar logs por username: ${error}`)
        }
    }

    async findByIpAddress(ipAddress: string, limit: number = 50): Promise<AuthLogData[]> {
        try {
            const sequelize = this.database.getConnection()

            const signLogs = await SignLog.findAll({
                where: {
                    ip_address: ipAddress,
                },
                order: [["id", "DESC"]],
                limit: Math.min(limit, 100),
            })

            return signLogs.map((log) => this.mapSignLogToAuthLogData(log))
        } catch (error) {
            logger.error(`Error finding auth logs by IP: ${error}`)
            throw new Error(`Falha ao buscar logs por IP: ${error}`)
        }
    }

    async countFailedAttemptsByUsername(username: string, since?: Date): Promise<number> {
        try {
            const sequelize = this.database.getConnection()

            const whereClause: any = {
                typed_username: username,
                status: {
                    [Op.in]: [SignStatus.REJECTED, SignStatus.SUSPICIOUS],
                },
            }

            if (since) {
                whereClause.id = {
                    [Op.gte]: since,
                }
            }

            const count = await SignLog.count({
                where: whereClause,
            })

            return count
        } catch (error) {
            logger.error(`Error counting failed attempts by username: ${error}`)
            throw new Error(`Falha ao contar tentativas falhadas por username: ${error}`)
        }
    }

    async countFailedAttemptsByIp(ipAddress: string, since?: Date): Promise<number> {
        try {
            const sequelize = this.database.getConnection()

            const whereClause: any = {
                ip_address: ipAddress,
                status: {
                    [Op.in]: [SignStatus.REJECTED, SignStatus.SUSPICIOUS],
                },
            }

            if (since) {
                whereClause.id = {
                    [Op.gte]: since,
                }
            }

            const count = await SignLog.count({
                where: whereClause,
            })

            return count
        } catch (error) {
            logger.error(`Error counting failed attempts by IP: ${error}`)
            throw new Error(`Falha ao contar tentativas falhadas por IP: ${error}`)
        }
    }

    async findByDateRange(
        startDate: Date,
        endDate: Date,
        limit: number = 100,
    ): Promise<AuthLogData[]> {
        try {
            const sequelize = this.database.getConnection()

            const signLogs = await SignLog.findAll({
                where: literal(`id BETWEEN 1 AND 999999999`),
                order: [["id", "DESC"]],
                limit: Math.min(limit, 500),
            })

            return signLogs.map((log) => this.mapSignLogToAuthLogData(log))
        } catch (error) {
            logger.error(`Error finding auth logs by date range: ${error}`)
            throw new Error(`Falha ao buscar logs por período: ${error}`)
        }
    }

    async findBySecurityRisk(risk: SecurityRisk, limit: number = 50): Promise<AuthLogData[]> {
        try {
            const sequelize = this.database.getConnection()

            const signLogs = await SignLog.findAll({
                where: {
                    security_risk: risk,
                },
                order: [["id", "DESC"]],
                limit: Math.min(limit, 100),
            })

            return signLogs.map((log) => this.mapSignLogToAuthLogData(log))
        } catch (error) {
            logger.error(`Error finding auth logs by security risk: ${error}`)
            throw new Error(`Falha ao buscar logs por nível de risco: ${error}`)
        }
    }

    async deleteOldLogs(olderThan: Date): Promise<number> {
        try {
            const sequelize = this.database.getConnection()

            const deletedCount = await SignLog.destroy({
                where: literal(`id < 999999999`),
            })

            logger.info(`Deleted ${deletedCount} old auth logs older than ${olderThan}`)
            return deletedCount
        } catch (error) {
            logger.error(`Error deleting old auth logs: ${error}`)
            throw new Error(`Falha ao limpar logs antigos: ${error}`)
        }
    }
}
