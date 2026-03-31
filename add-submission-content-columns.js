const { sequelize } = require('./models');

async function addSubmissionContentColumns() {
  try {
    console.log('Adding submission content columns...');

    const [tableInfo] = await sequelize.query('SHOW COLUMNS FROM `Submission`');
    const existing = new Set(tableInfo.map((col) => col.Field));

    if (!existing.has('title')) {
      await sequelize.query('ALTER TABLE `Submission` ADD COLUMN `title` VARCHAR(255) NULL AFTER `phase_id`');
      console.log('✅ Added `title` column');
    } else {
      console.log('ℹ️ `title` column already exists');
    }

    if (!existing.has('submission_text')) {
      await sequelize.query('ALTER TABLE `Submission` ADD COLUMN `submission_text` LONGTEXT NULL AFTER `title`');
      console.log('✅ Added `submission_text` column');
    } else {
      console.log('ℹ️ `submission_text` column already exists');
    }

    console.log('✅ Submission schema update complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update Submission schema:', error.message);
    process.exit(1);
  }
}

addSubmissionContentColumns();
