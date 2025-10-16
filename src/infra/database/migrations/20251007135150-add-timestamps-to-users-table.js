'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Verificar se as colunas já existem antes de adicioná-las
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.created_at) {
      await queryInterface.addColumn('users', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      });
    }
    
    if (!tableDescription.updated_at) {
      await queryInterface.addColumn('users', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Remover as colunas se existirem
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.created_at) {
      await queryInterface.removeColumn('users', 'created_at');
    }
    
    if (tableDescription.updated_at) {
      await queryInterface.removeColumn('users', 'updated_at');
    }
  }
};
