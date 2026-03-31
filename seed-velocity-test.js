const { Submission, DraftCommit, Team, TaskPhase, Student, TeamMember } = require('./models');

async function seedVelocityTestData() {
  try {
    console.log('🌱 Seeding velocity test data...');

    // Get team with ID 1
    const team = await Team.findByPk(1, {
      include: [
        {
          model: TeamMember,
          include: [Student]
        }
      ]
    });

    if (!team) {
      console.log('⚠️  No teams found. Please create a team first.');
      process.exit(1);
    }

    console.log(`✅ Using team: ${team.team_name}`);

    // Get first task phase
    const phase = await TaskPhase.findOne();
    
    if (!phase) {
      console.log('⚠️  No task phases found. Run seed-phases.js first.');
      process.exit(1);
    }

    console.log(`✅ Using phase: ${phase.title}`);

    // Create a submission for this team and phase
    const submission = await Submission.create({
      team_id: team.team_id,
      phase_id: phase.phase_id,
      file_url: 'https://github.com/test/phase1',
      submitted_at: new Date(),
      ai_summary: 'Test submission for velocity tracking',
      ai_similarity_flag: false,
      group_marks: 0
    });

    console.log(`✅ Created submission ID: ${submission.submission_id}`);

    // Create sample draft commits for team members
    if (!team.Team_Members || team.Team_Members.length === 0) {
      console.log('⚠️  No team members found for this team.');
      process.exit(1);
    }

    const draftCommits = [];
    const now = new Date();
    
    // Create commits over the last 7 days for each team member
    for (const member of team.Team_Members) {
      for (let day = 6; day >= 0; day--) {
        const commitDate = new Date(now);
        commitDate.setDate(commitDate.getDate() - day);
        
        // Random number of commits per day (0-5)
        const commitsPerDay = Math.floor(Math.random() * 6);
        
        for (let i = 0; i < commitsPerDay; i++) {
          const commitTime = new Date(commitDate);
          commitTime.setHours(9 + Math.floor(Math.random() * 10)); // Random hour between 9am-7pm
          
          draftCommits.push({
            student_id: member.student_id,
            submission_id: submission.submission_id,
            lines_added: Math.floor(Math.random() * 100),
            lines_deleted: Math.floor(Math.random() * 50),
            timestamp: commitTime
          });
        }
      }
    }

    const createdCommits = await DraftCommit.bulkCreate(draftCommits);
    console.log(`✅ Created ${createdCommits.length} draft commits`);
    console.log(`   Team members: ${team.Team_Members.map(m => m.Student.name).join(', ')}`);

    console.log('\n✅ Velocity test data ready!');
    console.log(`   Team ID: ${team.team_id}`);
    console.log(`   Phase ID: ${phase.phase_id}`);
    console.log(`   URL: http://localhost:5173 (select team ${team.team_id} and phase ${phase.phase_id})`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding velocity test data:', error);
    process.exit(1);
  }
}

seedVelocityTestData();
