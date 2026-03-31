const sequelize = require('../config/database');

// Import all models
const Tutor = require('./Tutor');
const Batch = require('./Batch');
const Student = require('./Student');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const TaskPhase = require('./TaskPhase');
const Submission = require('./Submission');
const DraftCommit = require('./DraftCommit');
const IndividualGrade = require('./IndividualGrade');

// Define Associations

// Batch - Student (One-to-Many)
Batch.hasMany(Student, { foreignKey: 'batch_id', onDelete: 'CASCADE' });
Student.belongsTo(Batch, { foreignKey: 'batch_id' });

// Tutor - Team (One-to-Many)
Tutor.hasMany(Team, { foreignKey: 'tutor_id', onDelete: 'CASCADE' });
Team.belongsTo(Tutor, { foreignKey: 'tutor_id' });

// Tutor - TaskPhase (One-to-Many)
Tutor.hasMany(TaskPhase, { foreignKey: 'tutor_id', onDelete: 'CASCADE' });
TaskPhase.belongsTo(Tutor, { foreignKey: 'tutor_id' });

// Batch - TaskPhase (One-to-Many, optional scope)
Batch.hasMany(TaskPhase, { foreignKey: 'batch_id', onDelete: 'SET NULL' });
TaskPhase.belongsTo(Batch, { foreignKey: 'batch_id' });

// Team - Student (Many-to-Many through Team_Member)
Team.belongsToMany(Student, { 
  through: TeamMember, 
  foreignKey: 'team_id',
  otherKey: 'student_id',
  onDelete: 'CASCADE'
});
Student.belongsToMany(Team, { 
  through: TeamMember, 
  foreignKey: 'student_id',
  otherKey: 'team_id',
  onDelete: 'CASCADE'
});

// Direct associations for TeamMember
Team.hasMany(TeamMember, { foreignKey: 'team_id', onDelete: 'CASCADE' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id' });

Student.hasMany(TeamMember, { foreignKey: 'student_id', onDelete: 'CASCADE' });
TeamMember.belongsTo(Student, { foreignKey: 'student_id' });

// Team - Submission (One-to-Many)
Team.hasMany(Submission, { foreignKey: 'team_id', onDelete: 'CASCADE' });
Submission.belongsTo(Team, { foreignKey: 'team_id' });

// TaskPhase - Submission (One-to-Many)
TaskPhase.hasMany(Submission, { foreignKey: 'phase_id', onDelete: 'CASCADE' });
Submission.belongsTo(TaskPhase, { foreignKey: 'phase_id' });

// Submission - DraftCommit (One-to-Many)
Submission.hasMany(DraftCommit, { foreignKey: 'submission_id', onDelete: 'CASCADE' });
DraftCommit.belongsTo(Submission, { foreignKey: 'submission_id' });

// Student - DraftCommit (One-to-Many)
Student.hasMany(DraftCommit, { foreignKey: 'student_id', onDelete: 'CASCADE' });
DraftCommit.belongsTo(Student, { foreignKey: 'student_id' });

// Submission - IndividualGrade (One-to-Many)
Submission.hasMany(IndividualGrade, { foreignKey: 'submission_id', onDelete: 'CASCADE' });
IndividualGrade.belongsTo(Submission, { foreignKey: 'submission_id' });

// Student - IndividualGrade (One-to-Many)
Student.hasMany(IndividualGrade, { foreignKey: 'student_id', onDelete: 'CASCADE' });
IndividualGrade.belongsTo(Student, { foreignKey: 'student_id' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  Tutor,
  Batch,
  Student,
  Team,
  TeamMember,
  TaskPhase,
  Submission,
  DraftCommit,
  IndividualGrade
};
