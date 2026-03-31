const {
  sequelize,
  Team,
  TeamMember,
  Student,
  TaskPhase,
  Submission,
  DraftCommit,
  IndividualGrade
} = require('./models');

const TARGET_TEAMS = ['Alpha Team', 'Beta Team', 'Gamma Team'];
const DEFAULT_PASSWORD = 'password123';

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function ensureStudentPasswords(studentIds, transaction) {
  const studentsWithoutPassword = await Student.findAll({
    where: { student_id: studentIds, password: null },
    attributes: ['student_id'],
    transaction
  });

  if (studentsWithoutPassword.length > 0) {
    await Student.update(
      { password: DEFAULT_PASSWORD },
      {
        where: { student_id: studentsWithoutPassword.map(s => s.student_id) },
        individualHooks: true,
        transaction
      }
    );
  }

  return studentsWithoutPassword.length;
}

async function findOrCreatePhase({ tutorId, batchId, title, description, startDate, endDate }, transaction) {
  const [phase, created] = await TaskPhase.findOrCreate({
    where: { tutor_id: tutorId, title },
    defaults: {
      tutor_id: tutorId,
      batch_id: batchId,
      title,
      description,
      start_date: startDate,
      end_date: endDate
    },
    transaction
  });

  if (!created) {
    await phase.update(
      {
        batch_id: batchId,
        description,
        start_date: startDate,
        end_date: endDate
      },
      { transaction }
    );
  }

  return { phase, created };
}

async function ensureSubmission({ teamId, phaseId, fileUrl, submittedAt, aiSummary, aiSimilarityFlag, groupMarks }, transaction) {
  const [submission, created] = await Submission.findOrCreate({
    where: { team_id: teamId, phase_id: phaseId },
    defaults: {
      team_id: teamId,
      phase_id: phaseId,
      file_url: fileUrl,
      submitted_at: submittedAt,
      ai_summary: aiSummary,
      ai_similarity_flag: aiSimilarityFlag,
      group_marks: groupMarks
    },
    transaction
  });

  if (!created) {
    await submission.update(
      {
        file_url: fileUrl,
        submitted_at: submittedAt,
        ai_summary: aiSummary,
        ai_similarity_flag: aiSimilarityFlag,
        group_marks: groupMarks
      },
      { transaction }
    );
  }

  return { submission, created };
}

async function ensureIndividualGrades(submissionId, members, baseMarks, transaction) {
  let created = 0;

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const marks = Math.max(0, Math.min(100, baseMarks + (i - 1) * 2));

    const [grade, wasCreated] = await IndividualGrade.findOrCreate({
      where: {
        submission_id: submissionId,
        student_id: member.student_id
      },
      defaults: {
        submission_id: submissionId,
        student_id: member.student_id,
        marks_awarded: marks,
        tutor_feedback: `Good contribution by ${member.name}.`
      },
      transaction
    });

    if (!wasCreated) {
      await grade.update(
        {
          marks_awarded: marks,
          tutor_feedback: `Good contribution by ${member.name}.`
        },
        { transaction }
      );
    } else {
      created += 1;
    }
  }

  return created;
}

async function ensureDraftCommits(submissionId, members, seedOffsetDays, transaction) {
  const existingCount = await DraftCommit.count({
    where: { submission_id: submissionId },
    transaction
  });

  if (existingCount > 0) {
    return 0;
  }

  const rows = [];

  for (let m = 0; m < members.length; m++) {
    const member = members[m];

    for (let i = 0; i < 6; i++) {
      const commitDate = daysFromNow(-(seedOffsetDays + (5 - i)));
      commitDate.setHours(10 + ((i + m) % 7), (i * 11) % 60, 0, 0);

      rows.push({
        student_id: member.student_id,
        submission_id: submissionId,
        timestamp: commitDate,
        lines_added: 12 + (m * 5) + (i * 3),
        lines_deleted: 3 + ((m + i) % 6)
      });
    }
  }

  await DraftCommit.bulkCreate(rows, { transaction });
  return rows.length;
}

async function seedFunctionalData() {
  const transaction = await sequelize.transaction();

  try {
    const teams = await Team.findAll({
      where: { team_name: TARGET_TEAMS },
      include: [
        {
          model: Student,
          through: { attributes: [] },
          attributes: ['student_id', 'name', 'email', 'batch_id']
        }
      ],
      order: [['team_id', 'ASC']],
      transaction
    });

    if (teams.length !== 3) {
      throw new Error('Expected exactly 3 teams: Alpha Team, Beta Team, Gamma Team.');
    }

    const tutorId = teams[0].tutor_id;
    const allMembers = teams.flatMap(t => t.Students);
    const allStudentIds = [...new Set(allMembers.map(s => s.student_id))];
    const batchId = allMembers[0]?.batch_id || null;

    if (!batchId) {
      throw new Error('Unable to resolve batch_id from team students.');
    }

    const passwordBackfilled = await ensureStudentPasswords(allStudentIds, transaction);

    const phaseDefs = [
      {
        title: 'Phase 1: Requirements & Planning',
        description: 'Requirements gathering, use-cases, and project planning artifacts.',
        startDate: daysFromNow(-25),
        endDate: daysFromNow(-14)
      },
      {
        title: 'Phase 2: Implementation & Drafting',
        description: 'Core implementation, iterative drafts, and progress tracking.',
        startDate: daysFromNow(-10),
        endDate: daysFromNow(7)
      },
      {
        title: 'Phase 3: Testing & Final Review',
        description: 'Final testing, polish, and documentation before final submission.',
        startDate: daysFromNow(8),
        endDate: daysFromNow(21)
      }
    ];

    const phases = [];
    for (const def of phaseDefs) {
      const result = await findOrCreatePhase(
        {
          tutorId,
          batchId,
          title: def.title,
          description: def.description,
          startDate: def.startDate,
          endDate: def.endDate
        },
        transaction
      );
      phases.push(result.phase);
    }

    let submissionsCreated = 0;
    let gradesCreated = 0;
    let commitsCreated = 0;

    for (let t = 0; t < teams.length; t++) {
      const team = teams[t];
      const members = team.Students;

      const phase1Marks = 82 + (t * 4);

      const phase1SubmissionResult = await ensureSubmission(
        {
          teamId: team.team_id,
          phaseId: phases[0].phase_id,
          fileUrl: `/uploads/team_${team.team_id}_phase1.pdf`,
          submittedAt: daysFromNow(-15),
          aiSummary: `${team.team_name} delivered a structured planning document with clear milestones.`,
          aiSimilarityFlag: false,
          groupMarks: phase1Marks
        },
        transaction
      );

      if (phase1SubmissionResult.created) submissionsCreated += 1;
      gradesCreated += await ensureIndividualGrades(
        phase1SubmissionResult.submission.submission_id,
        members,
        phase1Marks,
        transaction
      );

      const phase2SubmissionResult = await ensureSubmission(
        {
          teamId: team.team_id,
          phaseId: phases[1].phase_id,
          fileUrl: `/uploads/team_${team.team_id}_phase2.zip`,
          submittedAt: daysFromNow(-2),
          aiSummary: `${team.team_name} submitted iterative implementation drafts with active commit activity.`,
          aiSimilarityFlag: false,
          groupMarks: t === 0 ? 88 : null
        },
        transaction
      );

      if (phase2SubmissionResult.created) submissionsCreated += 1;
      commitsCreated += await ensureDraftCommits(
        phase2SubmissionResult.submission.submission_id,
        members,
        8 + t,
        transaction
      );

      // Keep phase 3 without submission intentionally (upcoming/pending)
    }

    await transaction.commit();

    console.log('✅ Functional data seeding complete');
    console.log(`   Teams processed: ${teams.length}`);
    console.log(`   Student passwords backfilled: ${passwordBackfilled}`);
    console.log(`   Phases ensured: ${phases.length}`);
    console.log(`   Submissions created: ${submissionsCreated}`);
    console.log(`   Individual grades created: ${gradesCreated}`);
    console.log(`   Draft commits created: ${commitsCreated}`);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Functional data seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedFunctionalData();
