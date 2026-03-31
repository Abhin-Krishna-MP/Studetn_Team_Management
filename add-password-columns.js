const { sequelize } = require('./models');

async function addPasswordColumns() {
  try {
    console.log('Adding password columns to database...\n');

    // Add password column to Student table
    try {
      await sequelize.query(`
        ALTER TABLE Student 
        ADD COLUMN password VARCHAR(255) NULL
        AFTER email
      `);
      console.log('✅ Added password column to Student table');
    } catch (error) {
      if (error.original?.errno === 1060) {
        console.log('ℹ️  Password column already exists in Student table');
      } else {
        throw error;
      }
    }

    // Add password column to Tutor table
    try {
      await sequelize.query(`
        ALTER TABLE Tutor 
        ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ''
        AFTER email
      `);
      console.log('✅ Added password column to Tutor table');
    } catch (error) {
      if (error.original?.errno === 1060) {
        console.log('ℹ️  Password column already exists in Tutor table');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Password columns added successfully!');
    console.log('\nNow run: node seed-initial.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding password columns:', error.message);
    process.exit(1);
  }
}

addPasswordColumns();
