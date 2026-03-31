const {
  sequelize,
  Team,
  Student,
  TaskPhase,
  Submission,
  DraftCommit,
  IndividualGrade
} = require('./models');

const DEFAULT_PASSWORD = 'password123';

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

async function ensurePasswordForAllStudents(transaction) {
  const students = await Student.findAll({
    attributes: ['student_id', 'password'],
    transaction
  });

  const ids = students.filter(s => !s.password).map(s => s.student_id);

  if (ids.length > 0) {
    await Student.update(
      { password: DEFAULT_PASSWORD },
      {
        where: { student_id: ids },
        individualHooks: true,
        transaction
      }
    );
  }

  return ids.length;
}

async function getOrCreateTutorPhases(tutorId, batchId, transaction) {
  const now = new Date();
  const defs = [
    {
      key: 'completed',
      title: '[Auto] Sprint 1 - Foundation',
      description: 'Initial planning, setup, and foundation work.',
      start_date: addDays(now, -24),
      end_date: addDays(now, -12)
    },
    {
      key: 'active',
      title: '[Auto] Sprint 2 - Implementation',
      description: 'Core implementation and iterative updates.',
      start_date: addDays(now, -8),
      end_date: addDays(now, 6)
    },
    {
      key: 'upcoming',
      title: '[Auto] Sprint 3 - Testing & Delivery',
      description: 'Final validation, testing, and release prep.',
      start_date: addDays(now, 7),
      end_date: addDays(now, 20)
    }
  ];

  const phaseMap = {};

  for (const def of defs) {
    const [phase] = await TaskPhase.findOrCreate({
      where: { tutor_id: tutorId, title: def.title },
      defaults: {
        tutor_id: tutorId,
        batch_id: batchId,
        title: def.title,
        description: def.description,
        start_date: def.start_date,
        end_date: def.end_date
      },
      transaction
    });

    await phase.update(
      {
        batch_id: batchId,
        description: def.description,
        start_date: def.start_date,
        end_date: def.end_date
      },
      { transaction }
    );

    phaseMap[def.key] = phase;
  }

  return phaseMap;
}

async function ensureSubmission(teamId, phaseId, payload, transaction) {
  const [submission, created] = await Submission.findOrCreate({
    where: { team_id: teamId, phase_id: phaseId },
    defaults: {
      team_id: teamId,
      phase_id: phaseId,
      ...payload
    },
    transaction
  });

  if (!created) {
    await submission.update(payload, { transaction });
  }

  return { submission, created };
}

async function ensureGrades(submissionId, students, targetMarks, transaction) {
  let created = 0;

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const marks = Math.max(0, Math.min(100, targetMarks + (i - 1) * 2));

    const [grade, wasCreated] = await IndividualGrade.findOrCreate({
      where: {
        submission_id: submissionId,
        student_id: s.student_id
      },
      defaults: {
        submission_id: submissionId,
        student_id: s.student_id,
        marks_awarded: marks,
        tutor_feedback: `Consistent contribution by ${s.name}.`
      },
      transaction
    });

    if (!wasCreated) {
      await grade.update(
        {
          marks_awarded: marks,
          tutor_feedback: `Consistent contribution by ${s.name}.`
        },
        { transaction }
      );
    } else {
      created += 1;
    }
  }

  return created;
}

async function ensureDrafts(submissionId, students, transaction) {
  const existing = await DraftCommit.count({
    where: { submission_id: submissionId },
    transaction
  });

  if (existing > 0) return 0;

  const rows = [];
  const now = new Date();

  for (let m = 0; m < students.length; m++) {
    const student = students[m];

    for (let i = 0; i < 5; i++) {
      const ts = addDays(now, -(7 - i));
      ts.setHours(9 + ((m + i) % 8), (m * 13 + i * 7) % 60, 0, 0);

      rows.push({
        student_id: student.student_id,
        submission_id: submissionId,
        timestamp: ts,
        lines_added: 10 + m * 4 + i * 3,
        lines_deleted: 2 + ((m + i) % 5)
      });
    }
  }

  await DraftCommit.bulkCreate(rows, { transaction });
  return rows.length;
}

async function seedAllTeamsFunctionalData() {
  const transaction = await sequelize.transaction();

  try {
    const teams = await Team.findAll({
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

    if (teams.length === 0) {
      throw new Error('No teams found in database.');
    }

    const passwordBackfilled = await ensurePasswordForAllStudents(transaction);

    const teamsByTutor = new Map();
    for (const team of teams) {
      if (!teamsByTutor.has(team.tutor_id)) teamsByTutor.set(team.tutor_id, []);
      teamsByTutor.get(team.tutor_id).push(team);
    }

    let phasesEnsured = 0;
    let submissionsEnsured = 0;
    let gradesEnsured = 0;
    let draftsEnsured = 0;

    for (const [tutorId, tutorTeams] of teamsByTutor.entries()) {
      const sampleStudent = tutorTeams.flatMap(t => t.Students).find(s => s.batch_id);
      const batchId = sampleStudent ? sampleStudent.batch_id : null;

      const phaseMap = await getOrCreateTutorPhases(tutorId, batchId, transaction);
      phasesEnsured += 3;

      for (let idx = 0; idx < tutorTeams.length; idx++) {
        const team = tutorTeams[idx];
        const members = team.Students;

        if (!members || members.length === 0) {
          continue;
        }

        const completedMarks = 74 + ((team.team_id * 3) % 21);

        const completed = await ensureSubmission(
          team.team_id,
          phaseMap.completed.phase_id,
          {
            file_url: `/uploads/auto_team_${team.team_id}_completed.pdf`,
            submitted_at: addDays(new Date(), -11),
            ai_summary: `${team.team_name} completed sprint foundation deliverables with clear ownership.`,
            ai_similarity_flag: false,
            group_marks: completedMarks
          },
          transaction
        );

        const active = await ensureSubmission(
          team.team_id,
          phaseMap.active.phase_id,
          {
            file_url: `/uploads/auto_team_${team.team_id}_active.zip`,
            submitted_at: addDays(new Date(), -1),
            ai_summary: `${team.team_name} is actively iterating with measurable progress in commits.`,
            ai_similarity_flag: false,
            group_marks: idx % 2 === 0 ? 86 : null
          },
          transaction
        );

        submissionsEnsured += completed.created ? 1 : 0;
        submissionsEnsured += active.created ? 1 : 0;

        gradesEnsured += await ensureGrades(
          completed.submission.submission_id,
          members,
          completedMarks,
          transaction
        );

        draftsEnsured += await ensureDrafts(active.submission.submission_id, members, transaction);
      }
    }

    await transaction.commit();

    console.log('✅ All-team functional data seeding complete');
    console.log(`   Teams processed: ${teams.length}`);
    console.log(`   Passwords backfilled: ${passwordBackfilled}`);
    console.log(`   Tutor phase sets ensured: ${phasesEnsured / 3}`);
    console.log(`   New submissions created: ${submissionsEnsured}`);
    console.log(`   Individual grades created: ${gradesEnsured}`);
    console.log(`   Draft commits created: ${draftsEnsured}`);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedAllTeamsFunctionalData();
