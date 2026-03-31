const { sequelize } = require('./models');

async function cleanDatabase() {
  try {
    console.log('🗑️  Cleaning database...');
    
    // Delete all data from tables (in correct order to respect foreign keys)
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await sequelize.query('TRUNCATE TABLE Individual_Grade');
    await sequelize.query('TRUNCATE TABLE Draft_Commit');
    await sequelize.query('TRUNCATE TABLE Submission');
    await sequelize.query('TRUNCATE TABLE Task_Phase');
    await sequelize.query('TRUNCATE TABLE Team_Member');
    await sequelize.query('TRUNCATE TABLE Team');
    await sequelize.query('TRUNCATE TABLE Student');
    await sequelize.query('TRUNCATE TABLE Batch');
    await sequelize.query('TRUNCATE TABLE Tutor');
    
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ All data deleted successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
