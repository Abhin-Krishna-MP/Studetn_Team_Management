/**
 * Migration: Add branch/section to Batch, add batch_id to Task_Phase
 * Run with: node migrate-batch-phase.js
 */
require('dotenv').config();
const sequelize = require('./config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const queryInterface = sequelize.getQueryInterface();

    // ---- Batch table ----
    const batchCols = await queryInterface.describeTable('Batch');

    if (!batchCols.branch) {
      await sequelize.query('ALTER TABLE `Batch` ADD COLUMN `branch` VARCHAR(100) NULL AFTER `department`');
      console.log('✅ Added Batch.branch');
    } else {
      console.log('⏭  Batch.branch already exists');
    }

    if (!batchCols.section) {
      await sequelize.query('ALTER TABLE `Batch` ADD COLUMN `section` VARCHAR(50) NULL AFTER `branch`');
      console.log('✅ Added Batch.section');
    } else {
      console.log('⏭  Batch.section already exists');
    }

    // ---- Task_Phase table ----
    const phaseCols = await queryInterface.describeTable('Task_Phase');

    if (!phaseCols.batch_id) {
      await sequelize.query(
        'ALTER TABLE `Task_Phase` ADD COLUMN `batch_id` INT NULL, ADD CONSTRAINT `fk_phase_batch` FOREIGN KEY (`batch_id`) REFERENCES `Batch`(`batch_id`) ON DELETE SET NULL'
      );
      console.log('✅ Added Task_Phase.batch_id');
    } else {
      console.log('⏭  Task_Phase.batch_id already exists');
    }

    console.log('\n🎉 Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
