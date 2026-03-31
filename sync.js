const { sequelize } = require('./models');

async function syncDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models with the database
    // { force: true } drops existing tables and recreates them - USE WITH CAUTION
    // { alter: true } attempts to modify existing tables to match models
    // Remove both options to only create tables that don't exist
    
    console.log('🔄 Synchronizing models with database...');
    await sequelize.sync({ force: false, alter: false });
    
    console.log('✅ All models synchronized successfully!');
    console.log('\n📊 Database tables created:');
    console.log('  - Tutor');
    console.log('  - Batch');
    console.log('  - Student');
    console.log('  - Team');
    console.log('  - Team_Member');
    console.log('  - Task_Phase');
    console.log('  - Submission');
    console.log('  - Draft_Commit');
    console.log('  - Individual_Grade');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    process.exit(1);
  }
}

syncDatabase();
