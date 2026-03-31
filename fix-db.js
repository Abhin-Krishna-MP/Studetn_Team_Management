const sequelize = require('./config/database');

async function fixSubmissionTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB Connected');
    await sequelize.query('ALTER TABLE `Submission` MODIFY COLUMN `submitted_at` DATETIME NULL');
    console.log('✅ Altered submitted_at to allow NULL');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error modifying table:', err);
    process.exit(1);
  }
}
fixSubmissionTable();
