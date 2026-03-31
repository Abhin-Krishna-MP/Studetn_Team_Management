const { sequelize, Tutor, Batch, Student, TaskPhase, Team, TeamMember } = require('./models');
const bcrypt = require('bcryptjs');

async function seedProductionDatabase() {
  try {
    console.log('🌱 Seeding production database...');

    // Find or create tutors (won't duplicate if email exists)
    const tutors = await Promise.all([
      Tutor.findOrCreate({
        where: { email: 'john.smith@university.edu' },
        defaults: {
          name: 'John Smith',
          email: 'john.smith@university.edu',
          department: 'Computer Science',
          password: await bcrypt.hash('password123', 10)
        }
      }),
      Tutor.findOrCreate({
        where: { email: 'sarah.johnson@university.edu' },
        defaults: {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@university.edu',
          department: 'Computer Science',
          password: await bcrypt.hash('password123', 10)
        }
      })
    ]);

    console.log('✅ Tutors ready');

    // Find or create batches
    const batch = await Batch.findOrCreate({
      where: { year: 2024, department: 'Computer Science' },
      defaults: {
        year: 2024,
        department: 'Computer Science',
        branch: 'A',
        section: 'I'
      }
    });

    console.log('✅ Batches ready');

    // Find or create students
    const students = await Promise.all([
      Student.findOrCreate({
        where: { email: 'alice@university.edu' },
        defaults: {
          name: 'Alice Johnson',
          email: 'alice@university.edu',
          batch_id: batch[0].batch_id,
          password: await bcrypt.hash('password123', 10)
        }
      }),
      Student.findOrCreate({
        where: { email: 'bob@university.edu' },
        defaults: {
          name: 'Bob Smith',
          email: 'bob@university.edu',
          batch_id: batch[0].batch_id,
          password: await bcrypt.hash('password123', 10)
        }
      })
    ]);

    console.log('✅ Students ready');

    // Create task phases
    const phase = await TaskPhase.findOrCreate({
      where: { batch_id: batch[0].batch_id, name: 'Assignment 1' },
      defaults: {
        batch_id: batch[0].batch_id,
        name: 'Assignment 1',
        description: 'Complete the first assignment',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    console.log('✅ Task Phases ready');

    // Create team and assign members
    const team = await Team.findOrCreate({
      where: { batch_id: batch[0].batch_id, name: 'Team 1' },
      defaults: {
        batch_id: batch[0].batch_id,
        name: 'Team 1'
      }
    });

    await TeamMember.findOrCreate({
      where: { team_id: team[0].team_id, student_id: students[0][0].student_id },
      defaults: {
        team_id: team[0].team_id,
        student_id: students[0][0].student_id,
        role: 'member'
      }
    });

    await TeamMember.findOrCreate({
      where: { team_id: team[0].team_id, student_id: students[1][0].student_id },
      defaults: {
        team_id: team[0].team_id,
        student_id: students[1][0].student_id,
        role: 'member'
      }
    });

    console.log('✅ Teams and members ready');

    console.log('\n✨ Production database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('  Student: alice@university.edu / password123');
    console.log('  Tutor: john.smith@university.edu / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedProductionDatabase();
