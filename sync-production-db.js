const { sequelize } = require('./models');

async function syncDatabase() {
  try {
    console.log('🔄 Syncing database schema...');
    
    // Sync all models and create tables if they don't exist
    await sequelize.sync({ alter: false });
    
    console.log('✅ Database schema synced successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Call the seed endpoint:');
    console.log('   curl -X POST https://studetn-team-management.onrender.com/api/seed');
    console.log('\n2. Or seed locally: node seed-production.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncDatabase();
