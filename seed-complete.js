const { 
  Batch, 
  Tutor, 
  Student, 
  Team, 
  TeamMember, 
  TaskPhase, 
  Submission,
  DraftCommit,
  IndividualGrade
} = require('./models');

async function seedCompleteData() {
  try {
    console.log('🌱 Starting comprehensive data seeding...\n');

    // 1. Create Batches
    console.log('📚 Creating batches...');
    const batch2024 = await Batch.create({
      year: 2024,
      department: 'Computer Science'
    });
    
    const batch2023 = await Batch.create({
      year: 2023,
      department: 'Computer Science'
    });
    
    console.log('✅ Created 2 batches\n');

    // 2. Create Tutors
    console.log('👨‍🏫 Creating tutors...');
    const tutor1 = await Tutor.create({
      name: 'Dr. John Smith',
      email: 'john.smith@university.edu',
      password: 'password123',
      department: 'Computer Science'
    });
    
    const tutor2 = await Tutor.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      password: 'password123',
      department: 'Computer Science'
    });
    
    console.log('✅ Created 2 tutors');
    console.log('   - john.smith@university.edu / password123');
    console.log('   - sarah.johnson@university.edu / password123\n');

    // 3. Create Students
    console.log('👨‍🎓 Creating students...');
    const students = await Student.bulkCreate([
      // Batch 2024 students
      { name: 'Alice Johnson', email: 'alice@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Bob Smith', email: 'bob@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Charlie Brown', email: 'charlie@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Diana Prince', email: 'diana@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Eve Martinez', email: 'eve@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Frank Wilson', email: 'frank@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Grace Lee', email: 'grace@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Henry Davis', email: 'henry@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Iris Chen', email: 'iris@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Jack Robinson', email: 'jack@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Kelly Thompson', email: 'kelly@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      { name: 'Leo Garcia', email: 'leo@university.edu', password: 'password123', batch_id: batch2024.batch_id },
      // Batch 2023 students
      { name: 'Mike Anderson', email: 'mike@university.edu', password: 'password123', batch_id: batch2023.batch_id },
      { name: 'Nina Patel', email: 'nina@university.edu', password: 'password123', batch_id: batch2023.batch_id },
      { name: 'Oscar Kim', email: 'oscar@university.edu', password: 'password123', batch_id: batch2023.batch_id },
      { name: 'Paula Santos', email: 'paula@university.edu', password: 'password123', batch_id: batch2023.batch_id },
    ], { individualHooks: true });
    
    console.log(`✅ Created ${students.length} students (all with password: password123)\n`);

    // 4. Create Teams for Tutor 1
    console.log('👥 Creating teams...');
    
    // Team 1 - Alpha Team (Tutor 1)
    const team1 = await Team.create({
      team_name: 'Alpha Team',
      tutor_id: tutor1.tutor_id
    });
    
    await TeamMember.bulkCreate([
      { team_id: team1.team_id, student_id: students[0].student_id }, // Alice
      { team_id: team1.team_id, student_id: students[1].student_id }, // Bob
      { team_id: team1.team_id, student_id: students[2].student_id }, // Charlie
    ]);

    // Team 2 - Beta Team (Tutor 1)
    const team2 = await Team.create({
      team_name: 'Beta Team',
      tutor_id: tutor1.tutor_id
    });
    
    await TeamMember.bulkCreate([
      { team_id: team2.team_id, student_id: students[3].student_id }, // Diana
      { team_id: team2.team_id, student_id: students[4].student_id }, // Eve
      { team_id: team2.team_id, student_id: students[5].student_id }, // Frank
    ]);

    // Team 3 - Gamma Team (Tutor 1)
    const team3 = await Team.create({
      team_name: 'Gamma Team',
      tutor_id: tutor1.tutor_id
    });
    
    await TeamMember.bulkCreate([
      { team_id: team3.team_id, student_id: students[6].student_id }, // Grace
      { team_id: team3.team_id, student_id: students[7].student_id }, // Henry
      { team_id: team3.team_id, student_id: students[8].student_id }, // Iris
    ]);

    // Team 4 - Delta Team (Tutor 2)
    const team4 = await Team.create({
      team_name: 'Delta Team',
      tutor_id: tutor2.tutor_id
    });
    
    await TeamMember.bulkCreate([
      { team_id: team4.team_id, student_id: students[9].student_id },  // Jack
      { team_id: team4.team_id, student_id: students[10].student_id }, // Kelly
      { team_id: team4.team_id, student_id: students[11].student_id }, // Leo
    ]);

    // Team 5 - Epsilon Team (Tutor 2)
    const team5 = await Team.create({
      team_name: 'Epsilon Team',
      tutor_id: tutor2.tutor_id
    });
    
    await TeamMember.bulkCreate([
      { team_id: team5.team_id, student_id: students[12].student_id }, // Mike
      { team_id: team5.team_id, student_id: students[13].student_id }, // Nina
      { team_id: team5.team_id, student_id: students[14].student_id }, // Oscar
    ]);

    console.log('✅ Created 5 teams with 3 members each\n');

    // 5. Create Task Phases
    console.log('📋 Creating task phases...');
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(now);
    nextMonth.setDate(nextMonth.getDate() + 30);

    // Phases for Tutor 1
    const phase1 = await TaskPhase.create({
      tutor_id: tutor1.tutor_id,
      title: 'Project Planning & Requirements',
      description: 'Define project scope, create requirements document, and plan the architecture',
      start_date: lastWeek,
      end_date: yesterday
    });

    const phase2 = await TaskPhase.create({
      tutor_id: tutor1.tutor_id,
      title: 'Database Design & Setup',
      description: 'Design database schema, create ER diagrams, and implement database',
      start_date: yesterday,
      end_date: nextWeek
    });

    const phase3 = await TaskPhase.create({
      tutor_id: tutor1.tutor_id,
      title: 'Backend Development',
      description: 'Develop REST APIs, implement business logic, and write unit tests',
      start_date: nextWeek,
      end_date: nextMonth
    });

    // Phases for Tutor 2
    const phase4 = await TaskPhase.create({
      tutor_id: tutor2.tutor_id,
      title: 'Frontend Development',
      description: 'Build user interface, implement responsive design, and integrate with APIs',
      start_date: lastWeek,
      end_date: nextWeek
    });

    const phase5 = await TaskPhase.create({
      tutor_id: tutor2.tutor_id,
      title: 'Testing & Documentation',
      description: 'Write test cases, perform integration testing, and create documentation',
      start_date: nextWeek,
      end_date: nextMonth
    });

    console.log('✅ Created 5 task phases\n');

    // 6. Create Submissions
    console.log('📝 Creating submissions...');
    
    // Submissions for Phase 1 (completed phase)
    const submission1 = await Submission.create({
      team_id: team1.team_id,
      phase_id: phase1.phase_id,
      file_url: '/uploads/team1_phase1_requirements.pdf',
      submitted_at: new Date(yesterday.getTime() - 2 * 60 * 60 * 1000), // 2 hours before deadline
      ai_summary: 'Comprehensive requirements document covering functional and non-functional requirements. Well-structured with clear use cases and user stories.',
      ai_similarity_flag: false,
      group_marks: 85
    });

    const submission2 = await Submission.create({
      team_id: team2.team_id,
      phase_id: phase1.phase_id,
      file_url: '/uploads/team2_phase1_requirements.pdf',
      submitted_at: new Date(yesterday.getTime() - 1 * 60 * 60 * 1000), // 1 hour before deadline
      ai_summary: 'Good requirements document with detailed specifications. Some areas need more clarification on system constraints.',
      ai_similarity_flag: false,
      group_marks: 78
    });

    const submission3 = await Submission.create({
      team_id: team3.team_id,
      phase_id: phase1.phase_id,
      file_url: '/uploads/team3_phase1_requirements.pdf',
      submitted_at: yesterday,
      ai_summary: 'Complete requirements document. Excellent coverage of edge cases and error handling scenarios.',
      ai_similarity_flag: false,
      group_marks: 92
    });

    // Submissions for Phase 2 (current phase)
    const submission4 = await Submission.create({
      team_id: team1.team_id,
      phase_id: phase2.phase_id,
      file_url: '/uploads/team1_phase2_dbdesign.pdf',
      submitted_at: now,
      ai_summary: 'Solid database design with normalized tables. ER diagram is clear and comprehensive.',
      ai_similarity_flag: false,
      group_marks: null // Not graded yet
    });

    const submission5 = await Submission.create({
      team_id: team2.team_id,
      phase_id: phase2.phase_id,
      file_url: '/uploads/team2_phase2_dbdesign.pdf',
      submitted_at: now,
      ai_summary: 'Good database structure. Consider adding indexes for frequently queried columns.',
      ai_similarity_flag: false,
      group_marks: null
    });

    // Submissions for Tutor 2's phases
    const submission6 = await Submission.create({
      team_id: team4.team_id,
      phase_id: phase4.phase_id,
      file_url: '/uploads/team4_phase4_frontend.zip',
      submitted_at: now,
      ai_summary: 'Modern and responsive UI implementation. Great use of component architecture.',
      ai_similarity_flag: false,
      group_marks: 88
    });

    const submission7 = await Submission.create({
      team_id: team5.team_id,
      phase_id: phase4.phase_id,
      file_url: '/uploads/team5_phase4_frontend.zip',
      submitted_at: now,
      ai_summary: 'Clean frontend code with good accessibility features. UI/UX is intuitive.',
      ai_similarity_flag: false,
      group_marks: 90
    });

    console.log('✅ Created 7 submissions\n');

    // 7. Create Draft Commits (for velocity tracking)
    console.log('💻 Creating draft commits...');
    
    const draftCommits = [];
    const daysAgo = 7;
    
    // Create commits for Team 1 members over the past week (for current phase submission)
    for (let day = daysAgo; day >= 0; day--) {
      const commitDate = new Date();
      commitDate.setDate(commitDate.getDate() - day);
      
      // Alice commits (consistent contributor)
      if (day % 2 === 0) {
        draftCommits.push({
          student_id: students[0].student_id,
          submission_id: submission4.submission_id,
          commit_hash: `abc${day}def${students[0].student_id}`,
          commit_message: `Implemented database schema - day ${7-day}`,
          lines_added: Math.floor(Math.random() * 100) + 20,
          lines_deleted: Math.floor(Math.random() * 30) + 5,
          timestamp: commitDate
        });
      }
      
      // Bob commits (moderate contributor)
      if (day % 3 === 0) {
        draftCommits.push({
          student_id: students[1].student_id,
          submission_id: submission4.submission_id,
          commit_hash: `xyz${day}abc${students[1].student_id}`,
          commit_message: `Added migration files - day ${7-day}`,
          lines_added: Math.floor(Math.random() * 80) + 15,
          lines_deleted: Math.floor(Math.random() * 20) + 2,
          timestamp: commitDate
        });
      }
      
      // Charlie commits (less active)
      if (day % 4 === 0) {
        draftCommits.push({
          student_id: students[2].student_id,
          submission_id: submission4.submission_id,
          commit_hash: `mno${day}pqr${students[2].student_id}`,
          commit_message: `Updated documentation - day ${7-day}`,
          lines_added: Math.floor(Math.random() * 50) + 10,
          lines_deleted: Math.floor(Math.random() * 15) + 1,
          timestamp: commitDate
        });
      }
    }

    // Create commits for Team 2 members
    for (let day = 5; day >= 0; day--) {
      const commitDate = new Date();
      commitDate.setDate(commitDate.getDate() - day);
      
      draftCommits.push({
        student_id: students[3].student_id,
        submission_id: submission5.submission_id,
        commit_hash: `dia${day}abc${students[3].student_id}`,
        commit_message: `Database optimization - day ${5-day}`,
        lines_added: Math.floor(Math.random() * 90) + 25,
        lines_deleted: Math.floor(Math.random() * 25) + 5,
        timestamp: commitDate
      });
    }

    await DraftCommit.bulkCreate(draftCommits);
    console.log(`✅ Created ${draftCommits.length} draft commits for velocity tracking\n`);

    // 8. Create Individual Grades
    console.log('📊 Creating individual grades...');
    
    const individualGrades = [];
    
    // Grades for Team 1, Phase 1
    individualGrades.push(
      { student_id: students[0].student_id, submission_id: submission1.submission_id, individual_marks: 88 },
      { student_id: students[1].student_id, submission_id: submission1.submission_id, individual_marks: 82 },
      { student_id: students[2].student_id, submission_id: submission1.submission_id, individual_marks: 85 }
    );
    
    // Grades for Team 2, Phase 1
    individualGrades.push(
      { student_id: students[3].student_id, submission_id: submission2.submission_id, individual_marks: 80 },
      { student_id: students[4].student_id, submission_id: submission2.submission_id, individual_marks: 76 },
      { student_id: students[5].student_id, submission_id: submission2.submission_id, individual_marks: 78 }
    );
    
    // Grades for Team 3, Phase 1
    individualGrades.push(
      { student_id: students[6].student_id, submission_id: submission3.submission_id, individual_marks: 94 },
      { student_id: students[7].student_id, submission_id: submission3.submission_id, individual_marks: 90 },
      { student_id: students[8].student_id, submission_id: submission3.submission_id, individual_marks: 92 }
    );

    await IndividualGrade.bulkCreate(individualGrades);
    console.log(`✅ Created ${individualGrades.length} individual grades\n`);

    // Print Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 COMPLETE DATA SEEDING SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   • Batches: 2`);
    console.log(`   • Tutors: 2`);
    console.log(`   • Students: ${students.length}`);
    console.log(`   • Teams: 5`);
    console.log(`   • Task Phases: 5`);
    console.log(`   • Submissions: 7`);
    console.log(`   • Draft Commits: ${draftCommits.length}`);
    console.log(`   • Individual Grades: ${individualGrades.length}\n`);
    
    console.log('👤 Login Credentials:');
    console.log('\n   TUTORS:');
    console.log('   ├─ john.smith@university.edu / password123');
    console.log('   └─ sarah.johnson@university.edu / password123\n');
    console.log('   STUDENTS (all have password: password123):');
    console.log('   ├─ alice@university.edu (Team Alpha)');
    console.log('   ├─ bob@university.edu (Team Alpha)');
    console.log('   ├─ charlie@university.edu (Team Alpha)');
    console.log('   ├─ diana@university.edu (Team Beta)');
    console.log('   ├─ eve@university.edu (Team Beta)');
    console.log('   ├─ frank@university.edu (Team Beta)');
    console.log('   ├─ grace@university.edu (Team Gamma)');
    console.log('   ├─ henry@university.edu (Team Gamma)');
    console.log('   ├─ iris@university.edu (Team Gamma)');
    console.log('   ├─ jack@university.edu (Team Delta)');
    console.log('   ├─ kelly@university.edu (Team Delta)');
    console.log('   ├─ leo@university.edu (Team Delta)');
    console.log('   ├─ mike@university.edu (Team Epsilon)');
    console.log('   ├─ nina@university.edu (Team Epsilon)');
    console.log('   └─ oscar@university.edu (Team Epsilon)\n');
    
    console.log('✨ You can now test all features of the application!');
    console.log('═══════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seeding
seedCompleteData();
