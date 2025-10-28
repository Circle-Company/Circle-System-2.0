"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        // Adicionar novos valores ao ENUM existente
        await queryInterface.sequelize.query(`
            ALTER TYPE enum_moment_processings_status ADD VALUE IF NOT EXISTS 'uploaded';
            ALTER TYPE enum_moment_processings_status ADD VALUE IF NOT EXISTS 'media_processed';
            ALTER TYPE enum_moment_processings_status ADD VALUE IF NOT EXISTS 'embeddings_queued';
            ALTER TYPE enum_moment_processings_status ADD VALUE IF NOT EXISTS 'embeddings_processed';
        `)

        console.log(
            "✅ ENUM enum_moment_processings_status atualizado com novos valores: uploaded, media_processed, embeddings_queued, embeddings_processed",
        )
    },

    async down(queryInterface, Sequelize) {
        // Não é possível remover valores de ENUM no PostgreSQL facilmente
        // Seria necessário recriar a coluna/tabela
        console.log(
            "⚠️ Rollback não implementado - remover valores de ENUM requer recriar a tabela",
        )
    },
}

