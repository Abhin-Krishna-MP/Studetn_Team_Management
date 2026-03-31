const { sequelize, Tutor, Batch, Student, Team, TeamMember, TaskPhase, Submission, DraftCommit } = require('./models');

async function seedCompleteData() {
  try {
    console.log('🌱 Seeding complete database with sample data...');

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
      }
    ]);
    console.log(`✅ Created ${tutors.length} tutors`);

    // Create sample batches
    const batches = await Batch.bulkCreate([
      {
        year: 2024,
        department: 'Computer Science'
      }
    ]);
    console.log(`✅ Created ${batches.length} batches`);

    // Create students
    const students = await Student.bulkCreate([
      { name: 'Alice Johnson', email: 'alice@university.edu', batch_id: batches[0].batch_id },
      { name: 'Bob Smith', email: 'bob@university.edu', batch_id: batches[0].batch_id },
      { name: 'Charlie Brown', email: 'charlie@university.edu', batch_id: batches[0].batch_id },
      { name: 'Diana Prince', email: 'diana@university.edu', batch_id: batches[0].batch_id },
      { name: 'Ethan Hunt', email: 'ethan@university.edu', batch_id: batches[0].batch_id },
      { name: 'Fiona Green', email: 'fiona@university.edu', batch_id: batches[0].batch_id }
    ]);
    console.log(`✅ Created ${students.length} students`);

    // Create teams
    const teams = await Team.bulkCreate([
      { team_name: 'Alpha Team', tutor_id: tutors[0].tutor_id },
      { team_name: 'Beta Team', tutor_id: tutors[0].tutor_id }
    ]);
    console.log(`✅ Created ${teams.length} teams`);

    // Assign students to teams
    const teamMembers = await TeamMember.bulkCreate([
      // Alpha Team
      { team_id: teams[0].team_id, student_id: students[0].student_id },
      { team_id: teams[0].team_id, student_id: students[1].student_id },
      { team_id: teams[0].team_id, student_id: students[2].student_id },
      // Beta Team
      { team_id: teams[1].team_id, student_id: students[3].student_id },
      { team_id: teams[1].team_id, student_id: students[4].student_id },
      { team_id: teams[1].team_id, student_id: students[5].student_id }
    ]);
    console.log(`✅ Created ${teamMembers.length} team member associations`);

    // Create task phases
    const phases = await TaskPhase.bulkCreate([
      {
        tutor_id: tutors[0].tutor_id,
        title: 'Phase 1: Database Design',
        description: 'Design and implement the database schema',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      },
      {
        tutor_id: tutors[0].tutor_id,
        title: 'Phase 2: Backend Development',
        description: 'Develop REST API endpoints',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-28')
      }
    ]);
    console.log(`✅ Created ${phases.length} task phases`);

    // Create submissions
    const submissions = await Submission.bulkCreate([
      {
        team_id: teams[0].team_id,
        phase_id: phases[0].phase_id,
        file_url: 'https://github.com/alpha-team/phase1',
        submitted_at: new Date('2024-01-25'),
        ai_summary: 'Well-structured database schema with proper normalization',
        ai_similarity_flag: false,
        group_marks: 85
      },
      {
        team_id: teams[1].team_id,
        phase_id: phases[0].phase_id,
        file_url: 'https://github.com/beta-team/phase1',
        submitted_at: new Date('2024-01-28'),
        ai_summary: 'Good database design with room for improvement',
        ai_similarity_flag: false,
        group_marks: 78
      }
    ]);
    console.log(`✅ Created ${submissions.length} submissions`);

    // Create draft commits with realistic timestamps
    const baseDate = new Date('2024-01-20');
    const draftCommits = [];

    // Alpha Team - Alice (early bird, consistent)
    for (let day = 0; day < 5; day++) {
      for (let hour = 9; hour < 12; hour++) {
        const timestamp = new Date(baseDate);
        timestamp.setDate(timestamp.getDate() + day);
        timestamp.setHours(hour, Math.floor(Math.random() * 60), 0);
        
        draftCommits.push({
          student_id: students[0].student_id,
          submission_id: submissions[0].submission_id,
          timestamp: timestamp,
          lines_added: Math.floor(Math.random() * 50) + 10,
          lines_deleted: Math.floor(Math.random() * 20)
        });
      }
    }

    // Alpha Team - Bob (night owl)
    for (let day = 0; day < 4; day++) {
      for (let hour = 20; hour < 24; hour++) {
        const timestamp = new Date(baseDate);
        timestamp.setDate(timestamp.getDate() + day);
        timestamp.setHours(hour, Math.floor(Math.random() * 60), 0);
        
        draftCommits.push({
          student_id: students[1].student_id,
          submission_id: submissions[0].submission_id,
          timestamp: timestamp,
          lines_added: Math.floor(Math.random() * 80) + 20,
          lines_deleted: Math.floor(Math.random() * 30)
        });
      }
    }

    // Alpha Team - Charlie (afternoon worker)
    for (let day = 0; day < 5; day++) {
      for (let hour = 14; hour < 18; hour++) {
        const timestamp = new Date(baseDate);
        timestamp.setDate(timestamp.getDate() + day);
        timestamp.setHours(hour, Math.floor(Math.random() * 60), 0);
        
        draftCommits.push({
          student_id: students[2].student_id,
          submission_id: submissions[0].submission_id,
          timestamp: timestamp,
          lines_added: Math.floor(Math.random() * 60) + 15,
          lines_deleted: Math.floor(Math.random() * 25)
        });
      }
    }

    // Beta Team - Diana (consistent all-rounder)
    for (let day = 0; day < 6; day++) {
      for (let hour of [10, 14, 18]) {
        const timestamp = new Date(baseDate);
        timestamp.setDate(timestamp.getDate() + day);
        timestamp.setHours(hour, Math.floor(Math.random() * 60), 0);
        
        draftCommits.push({
          student_id: students[3].student_id,
          submission_id: submissions[1].submission_id,
          timestamp: timestamp,
          lines_added: Math.floor(Math.random() * 45) + 10,
          lines_deleted: Math.floor(Math.random() * 15)
        });
      }
    }

    await DraftCommit.bulkCreate(draftCommits);
    console.log(`✅ Created ${draftCommits.length} draft commits`);

    console.log('\n📊 Sample Data Summary:');
    console.log(`   Tutors: ${tutors.length}`);
    console.log(`   Batches: ${batches.length}`);
    console.log(`   Students: ${students.length}`);
    console.log(`   Teams: ${teams.length}`);
    console.log(`   Task Phases: ${phases.length}`);
    console.log(`   Submissions: ${submissions.length}`);
    console.log(`   Draft Commits: ${draftCommits.length}`);

    console.log('\n✅ Complete database seeded successfully!');
    console.log('\n📝 Test the velocity API with:');
    console.log(`   GET /api/teams/${teams[0].team_id}/velocity/${phases[0].phase_id}`);
    console.log('\n📝 Test draft commit creation with:');
    console.log(`   POST /api/drafts`);
    console.log(`   Body: { "student_id": ${students[0].student_id}, "submission_id": ${submissions[0].submission_id}, "lines_added": 50, "lines_deleted": 10 }`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedCompleteData();
