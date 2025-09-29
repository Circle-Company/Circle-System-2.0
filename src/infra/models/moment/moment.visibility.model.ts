import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentVisibilityAttributes {
    id: bigint
    momentId: bigint | null
    level: string
    allowedUsers: string[]
    blockedUsers: string[]
    ageRestriction: boolean
    contentWarning: boolean
    createdAt: Date
    updatedAt: Date
}

interface MomentVisibilityCreationAttributes
    extends Omit<MomentVisibilityAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

export default class MomentVisibility
    extends Model<MomentVisibilityAttributes, MomentVisibilityCreationAttributes>
    implements MomentVisibilityAttributes
{
    public id!: bigint
    public momentId!: bigint | null
    public level!: string
    public allowedUsers!: string[]
    public blockedUsers!: string[]
    public ageRestriction!: boolean
    public contentWarning!: boolean
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    static initialize(sequelize: Sequelize): void {
        MomentVisibility.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                momentId: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                    field: "moment_id",
                },
                level: {
                    type: DataTypes.ENUM("public", "followers_only", "private", "unlisted"),
                    allowNull: false,
                    comment: "Nível de visibilidade do momento",
                },
                allowedUsers: {
                    type: DataTypes.JSON,
                    defaultValue: "[]",
                    field: "allowed_users",
                    comment: "IDs de usuários específicos (para privado)",
                },
                blockedUsers: {
                    type: DataTypes.JSON,
                    defaultValue: "[]",
                    field: "blocked_users",
                    comment: "IDs de usuários bloqueados",
                },
                ageRestriction: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    field: "age_restriction",
                    comment: "Se tem restrição de idade",
                },
                contentWarning: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    field: "content_warning",
                    comment: "Se tem aviso de conteúdo",
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: "created_at",
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: "updated_at",
                },
            },
            {
                sequelize,
                tableName: "moment_visibilities",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["level"],
                    },
                    {
                        fields: ["age_restriction"],
                    },
                    {
                        fields: ["content_warning"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentVisibility.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }
    }
}
