const { TaskPhase, Tutor } = require('./models');

async function seedTaskPhases() {
  try {
    console.log('🌱 Seeding task phases...');

    // Find an existing tutor
    const tutor = await Tutor.findOne();
    
    if (!tutor) {
      console.log('⚠️  No tutors found. Please create a tutor first.');
      process.exit(1);
    }

    console.log(`✅ Using tutor: ${tutor.name}`);

    // Create task phases
    const phases = await TaskPhase.bulkCreate([
      {
        tutor_id: tutor.tutor_id,
        title: 'Phase 1: Database Design',
        description: 'Design and implement the database schema',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      },
      {
        tutor_id: tutor.tutor_id,
        title: 'Phase 2: Backend Development',
        description: 'Develop REST API endpoints',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-28')
      },
      {
        tutor_id: tutor.tutor_id,
        title: 'Phase 3: Frontend Development',
        description: 'Build user interface components',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-03-31')
      }
    ]);

    console.log(`✅ Created ${phases.length} task phases:`);
    phases.forEach(p => {
      console.log(`   - ${p.phase_id}: ${p.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding task phases:', error);
    process.exit(1);
  }
}

seedTaskPhases();
