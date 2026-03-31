const { sequelize, Tutor, Batch } = require('./models');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Create sample tutors
    const tutors = await Tutor.bulkCreate([
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        department: 'Computer Science'
      },
      {
        name: 'Prof. Michael Chen',
        email: 'michael.chen@university.edu',
        department: 'Computer Science'
      },
      {
        name: 'Dr. Emily Davis',
        email: 'emily.davis@university.edu',
        department: 'Information Technology'
      }
    ]);

    console.log(`✅ Created ${tutors.length} tutors`);

    // Create sample batches
    const batches = await Batch.bulkCreate([
      {
        year: 2024,
        department: 'Computer Science'
      },
      {
        year: 2023,
        department: 'Computer Science'
      },
      {
        year: 2024,
        department: 'Information Technology'
      }
    ]);

    console.log(`✅ Created ${batches.length} batches`);

    console.log('\n📊 Sample Data Created:');
    console.log('\nTutors:');
    tutors.forEach(t => {
      console.log(`  ID: ${t.tutor_id} - ${t.name} (${t.email})`);
    });

    console.log('\nBatches:');
    batches.forEach(b => {
      console.log(`  ID: ${b.batch_id} - ${b.department} ${b.year}`);
    });

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 You can now test the CSV upload with:');
    console.log(`   tutor_id: ${tutors[0].tutor_id}`);
    console.log(`   batch_id: ${batches[0].batch_id}`);
    console.log(`   group_size: 3`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
