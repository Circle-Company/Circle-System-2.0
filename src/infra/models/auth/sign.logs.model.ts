import { SecurityRisk, SignStatus } from "@/domain/auth/auth.type"
import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

// Re-export para facilitar imports
export { SecurityRisk, SignStatus }

export enum SignType {
    SIGNIN = "signin",
    SIGNUP = "signup",
}

export interface SignLogAttributes {
    id?: bigint
    typed_username: string
    sign_type: SignType
    status: SignStatus
    security_risk: SecurityRisk
    ip_address: string
    user_agent: string
    machine_id?: string | null
    latitude?: number | null
    longitude?: number | null
    timezone?: string | null
    session_duration?: number | null
    created_at?: Date
    updated_at?: Date
}

export default class SignLog extends Model<SignLogAttributes> implements SignLogAttributes {
    public readonly id!: bigint
    public typed_username!: string
    public sign_type!: SignType
    public status!: SignStatus
    public security_risk!: SecurityRisk
    public ip_address!: string
    public user_agent!: string
    public machine_id?: string | null
    public latitude?: number | null
    public longitude?: number | null
    public timezone?: string | null
    public session_duration?: number | null

    static initialize(sequelize: Sequelize) {
        SignLog.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                typed_username: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
                sign_type: {
                    type: DataTypes.ENUM(...Object.values(SignType)),
                    allowNull: false,
                },
                status: {
                    type: DataTypes.ENUM(...Object.values(SignStatus)),
                    allowNull: false,
                },
                security_risk: {
                    type: DataTypes.ENUM(...Object.values(SecurityRisk)),
                    allowNull: false,
                    defaultValue: SecurityRisk.LOW,
                },
                ip_address: {
                    type: DataTypes.STRING(45), // Suporta IPv4 e IPv6
                    allowNull: false,
                },
                user_agent: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                machine_id: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                },
                latitude: {
                    type: DataTypes.DECIMAL(10, 8),
                    allowNull: true,
                },
                longitude: {
                    type: DataTypes.DECIMAL(11, 8),
                    allowNull: true,
                },
                timezone: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                session_duration: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    comment: "Duração da sessão em segundos",
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
            },
            {
                sequelize,
                modelName: "SignLog",
                tableName: "sign_logs",
                timestamps: false,
                // Índices serão criados automaticamente pelo Sequelize quando necessário
            },
        )
    }

    static associate(models: any) {
        // Modelo específico para mobile - sem associações com User
        // Registra apenas tentativas de login independente de usuário cadastrado
    }
}
