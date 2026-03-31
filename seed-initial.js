const { Batch, Tutor, Student } = require('./models');

async function seedInitialData() {
  try {
    console.log('🌱 Seeding initial data...');

    // Create batches
    const batch1 = await Batch.create({
      year: 2024,
      department: 'Computer Science'
    });
    
    const batch2 = await Batch.create({
      year: 2023,
      department: 'Computer Science'
    });
    
    console.log('✅ Created batches');

    // Create a tutor
    const tutor = await Tutor.create({
      name: 'Dr. John Smith',
      email: 'john.smith@university.edu',
      password: 'password123',
      department: 'Computer Science'
    });
    
    console.log('✅ Created tutor');
    console.log('  Email: john.smith@university.edu');
    console.log('  Password: password123');

    // Create a student
    const student = await Student.create({
      name: 'Alice Johnson',
      email: 'alice@university.edu',
      password: 'password123',
      batch_id: batch1.batch_id
    });
    
    console.log('✅ Created student');
    console.log('  Email: alice@university.edu');
    console.log('  Password: password123');

    console.log('\n📝 Summary:');
    console.log('  Batches: 2');
    console.log('  Tutors: 1');
    console.log('  Students: 1');
    console.log('\n🎉 Initial data seeded successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedInitialData();
