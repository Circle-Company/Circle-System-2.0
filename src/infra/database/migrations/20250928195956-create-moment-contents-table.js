"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_contents", {
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
            duration: {
                type: Sequelize.FLOAT,
                allowNull: false,
                comment: "Duração em segundos",
            },
            size: {
                type: Sequelize.BIGINT,
                allowNull: false,
                comment: "Tamanho em bytes",
            },
            format: {
                type: Sequelize.STRING(10),
                allowNull: false,
                comment: "Formato do arquivo (mp4, webm, etc)",
            },
            has_audio: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            codec: {
                type: Sequelize.STRING(20),
                allowNull: false,
                comment: "Codec usado (h264, h265, vp9, etc)",
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
        await queryInterface.addIndex("moment_contents", ["moment_id"])
        await queryInterface.addIndex("moment_contents", ["format"])
        await queryInterface.addIndex("moment_contents", ["codec"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_contents")
    },
}
