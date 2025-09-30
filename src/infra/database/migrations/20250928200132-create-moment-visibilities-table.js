"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_visibilities", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            moment_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: "moments",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            level: {
                type: Sequelize.ENUM("public", "followers_only", "private", "unlisted"),
                allowNull: false,
                comment: "Nível de visibilidade do momento",
            },
            allowed_users: {
                type: Sequelize.JSON,
                defaultValue: [],
                comment: "IDs de usuários específicos (para privado)",
            },
            blocked_users: {
                type: Sequelize.JSON,
                defaultValue: [],
                comment: "IDs de usuários bloqueados",
            },
            age_restriction: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: "Se tem restrição de idade",
            },
            content_warning: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: "Se tem aviso de conteúdo",
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        })

        // Índices
        await queryInterface.addIndex("moment_visibilities", ["moment_id"])
        await queryInterface.addIndex("moment_visibilities", ["level"])
        await queryInterface.addIndex("moment_visibilities", ["age_restriction"])
        await queryInterface.addIndex("moment_visibilities", ["content_warning"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_visibilities")
    },
}
