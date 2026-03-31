import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  Flag,
  X,
  ArrowRight,
  ClipboardList,
  Eye,
  Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI, submissionAPI, tutorAPI } from '../api/axios';

const getPhaseStatus = (start, end) => {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (now < startDate) return 'upcoming';
  if (now > endDate) return 'completed';
  return 'active';
};

const formatDate = (date) => new Date(date).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

const getPhaseBatchLabel = (phase) => {
  if (phase.scope === 'all_batches') return 'All Batches';
  return `${phase.batch?.department || 'Batch'} ${phase.batch?.year || ''}`.trim();
};

const resolveSubmissionFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl === 'draft') return null;
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const serverBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

  if (fileUrl.startsWith('/')) {
    return `${serverBase}${fileUrl}`;
  }

  return `${serverBase}/${fileUrl}`;
};

const TaskPhases = () => {
  const { isTutor } = useAuth();
  const navigate = useNavigate();

  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [batchSortOrder, setBatchSortOrder] = useState('asc');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batches, setBatches] = useState([]);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    apply_to_all_batches: true,
    batch_id: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [selectedPhase, setSelectedPhase] = useState(null);
  const [submissionsModal, setSubmissionsModal] = useState({
    open: false,
    phase: null,
    items: [],
    loading: false,
    error: null
  });
  const [gradeInputs, setGradeInputs] = useState({});
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeActionError, setGradeActionError] = useState(null);
  const [viewSubmissionModal, setViewSubmissionModal] = useState({
    open: false,
    loading: false,
    error: null,
    item: null
  });

  useEffect(() => {
    fetchPhases();
  }, [isTutor]);

  const fetchPhases = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isTutor) {
        const [phasesRes, batchesRes] = await Promise.all([
          tutorAPI.getPhases(),
          tutorAPI.getBatches()
        ]);

        const data = phasesRes.data.data || [];
        const totalTeams = phasesRes.data.meta?.totalTeams || 0;
        setBatches(batchesRes.data?.data || []);
        setPhases(
          data.map((phase) => {
            const status = getPhaseStatus(phase.start_date, phase.end_date);
            const stats = phase.stats || {};
            const teams = stats.totalTeams ?? totalTeams;
            const progress = teams ? Math.round((stats.submissions / Math.max(teams, 1)) * 100) : 0;

            return {
              id: phase.phase_id,
              title: phase.title,
              description: phase.description,
              startDate: phase.start_date,
              endDate: phase.end_date,
              scope: phase.scope || (phase.batch_id ? 'specific_batch' : 'all_batches'),
              batch: phase.batch || null,
              status,
              stats: {
                submissions: stats.submissions || 0,
                graded: stats.graded || 0,
                flagged: stats.flagged || 0,
                totalTeams: teams,
                progress
              },
              studentProgress: null
            };
          })
        );
      } else {
        const response = await studentAPI.getTeamPhases();
        const data = response.data.data || [];
        setBatches([]);
        setPhases(
          data.map((phase) => {
            const status = getPhaseStatus(phase.start_date, phase.end_date);
            const submission = (phase.Submissions || [])[0];
            return {
              id: phase.phase_id,
              title: phase.title,
              description: phase.description,
              startDate: phase.start_date,
              endDate: phase.end_date,
              status,
              stats: null,
              studentProgress: {
                submitted: !!submission?.submitted_at,
                submittedAt: submission?.submitted_at,
                grade: submission?.group_marks,
                aiFlag: submission?.ai_similarity_flag,
                teamName: submission?.Team?.team_name,
                submissionId: submission?.submission_id
              }
            };
          })
        );
      }
    } catch (err) {
      console.error('Fetch phases error:', err);
      setError(err.response?.data?.message || 'Unable to load phases');
    } finally {
      setLoading(false);
    }
  };

  const filteredPhases = useMemo(() => {
    let result = [...phases];

    if (activeTab !== 'all') {
      result = result.filter((phase) => phase.status === activeTab);
    }

    if (isTutor) {
      if (batchFilter === 'common') {
        result = result.filter((phase) => phase.scope === 'all_batches');
      } else if (batchFilter !== 'all') {
        result = result.filter((phase) => String(phase.batch?.batch_id) === String(batchFilter));
      }

      result.sort((a, b) => {
        const batchCompare = getPhaseBatchLabel(a).localeCompare(getPhaseBatchLabel(b));
        if (batchCompare !== 0) {
          return batchSortOrder === 'asc' ? batchCompare : -batchCompare;
        }

        return new Date(a.startDate) - new Date(b.startDate);
      });
    }

    return result;
  }, [phases, activeTab, isTutor, batchFilter, batchSortOrder]);

  const summary = useMemo(() => {
    if (isTutor) {
      return {
        total: phases.length,
        active: phases.filter((p) => p.status === 'active').length,
        submissions: phases.reduce((sum, phase) => sum + (phase.stats?.submissions || 0), 0)
      };
    }

    return {
      total: phases.length,
      submitted: phases.filter((p) => p.studentProgress?.submitted).length,
      flagged: phases.filter((p) => p.studentProgress?.aiFlag).length
    };
  }, [isTutor, phases]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreatePhase = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.title || !createForm.start_date || !createForm.end_date) {
      setCreateError('Title, start date, and end date are required');
      return;
    }

    if (!createForm.apply_to_all_batches && !createForm.batch_id) {
      setCreateError('Please select a batch for a batch-specific phase');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title: createForm.title,
        description: createForm.description,
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        apply_to_all_batches: createForm.apply_to_all_batches,
        batch_id: createForm.apply_to_all_batches ? null : Number(createForm.batch_id)
      };

      await tutorAPI.createPhase(payload);
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        apply_to_all_batches: true,
        batch_id: ''
      });
      fetchPhases();
    } catch (err) {
      console.error('Create phase error:', err);
      setCreateError(err.response?.data?.message || 'Failed to create phase');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSubmissions = async (phase) => {
    if (!isTutor) {
      navigate('/workspace', { state: { phaseId: phase.id } });
      return;
    }

    setSubmissionsModal({
      open: true,
      phase,
      items: [],
      loading: true,
      error: null
    });

    try {
      const response = await tutorAPI.getPhaseSubmissions(phase.id);
      const items = response.data.data?.submissions || [];

      const nextInputs = {};
      items.forEach((item) => {
        nextInputs[item.submission_id] = item.group_marks ?? '';
      });

      setGradeInputs(nextInputs);
      setSubmissionsModal((prev) => ({
        ...prev,
        items,
        loading: false
      }));
    } catch (err) {
      console.error('Phase submissions error:', err);
      setSubmissionsModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Failed to load submissions'
      }));
    }
  };

  const handleSaveGrade = async (submissionId) => {
    setGradeActionError(null);
    const value = gradeInputs[submissionId];
    const marks = Number(value);

    if (value === '' || Number.isNaN(marks) || marks < 0 || marks > 100) {
      setGradeActionError('Please enter a valid grade between 0 and 100.');
      return;
    }

    setGradingSubmissionId(submissionId);
    try {
      await tutorAPI.gradeSubmission(submissionId, { group_marks: marks });

      setSubmissionsModal((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.submission_id === submissionId
            ? { ...item, group_marks: marks }
            : item
        )
      }));

      fetchPhases();
    } catch (err) {
      console.error('Save grade error:', err);
      setGradeActionError(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setGradingSubmissionId(null);
    }
  };

  const handleViewSubmission = async (submissionId) => {
    setViewSubmissionModal({ open: true, loading: true, error: null, item: null });
    try {
      const response = await submissionAPI.getById(submissionId);
      const item = response.data?.data || null;

      if (item) {
        const resolvedUrl = resolveSubmissionFileUrl(item.file_url);

        if (resolvedUrl) {
          try {
            const fileCheck = await fetch(resolvedUrl, { method: 'HEAD' });
            item.file_available = fileCheck.ok;
            item.resolved_file_url = resolvedUrl;
          } catch (fileErr) {
            item.file_available = false;
            item.resolved_file_url = resolvedUrl;
          }
        } else {
          item.file_available = false;
          item.resolved_file_url = null;
        }
      }

      setViewSubmissionModal({
        open: true,
        loading: false,
        error: null,
        item
      });
    } catch (err) {
      console.error('View submission error:', err);
      setViewSubmissionModal({
        open: true,
        loading: false,
        error: err.response?.data?.message || 'Failed to load submission details',
        item: null
      });
    }
  };

  const renderProgress = (phase) => {
    if (isTutor) {
      const progress = phase.stats?.progress || 0;
      return (
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {phase.stats?.submissions || 0}/{phase.stats?.totalTeams || 0} submissions
          </p>
        </div>
      );
    }

    const submitted = phase.studentProgress?.submitted;
    return (
      <div>
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Status</span>
          <span>{submitted ? 'Submitted' : 'Pending'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${submitted ? 'bg-green-600' : 'bg-yellow-500'} h-2 rounded-full transition-all`}
            style={{ width: submitted ? '100%' : '35%' }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {submitted ? 'Submitted for review' : 'Work in progress'}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Task Phases</h2>
          <p className="text-gray-600 mt-1">
            {isTutor
              ? 'Create new milestones and monitor submissions across your teams.'
              : 'Track tasks assigned by your tutor and monitor your submission status.'}
          </p>
        </div>
        {isTutor && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Phase</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
            <button className="text-sm text-red-600 underline mt-2" onClick={fetchPhases}>
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {['all', 'active', 'upcoming', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors whitespace-nowrap
                  ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
          {isTutor && (
            <div className="px-6 pb-4 flex flex-col md:flex-row gap-3">
              <div className="w-full md:w-64">
                <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Batch</label>
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All phases</option>
                  <option value="common">Common (All batches)</option>
                  {batches.map((batch) => (
                    <option key={batch.batch_id} value={batch.batch_id}>
                      {batch.department} {batch.year}
                      {batch.section ? ` - Section ${batch.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-56">
                <label className="block text-xs font-medium text-gray-600 mb-1">Sort by Batch</label>
                <select
                  value={batchSortOrder}
                  onChange={(e) => setBatchSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="asc">A → Z</option>
                  <option value="desc">Z → A</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-3" />
              Loading phases...
            </div>
          ) : filteredPhases.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {activeTab} phases {activeTab === 'all' ? 'available' : 'found'}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPhases.map((phase) => (
                <div key={phase.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{phase.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{phase.description || 'No description provided.'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(phase.status)}`}>
                          {phase.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                          </span>
                        </div>
                        {isTutor ? (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>{phase.stats?.totalTeams || 0} teams</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {phase.studentProgress?.submitted ? 'Submitted' : 'Pending submission'}
                            </span>
                          </div>
                        )}
                        {isTutor && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {phase.scope === 'all_batches'
                                ? 'All batches'
                                : `${phase.batch?.department || 'Batch'} ${phase.batch?.year || ''}`.trim()}
                            </span>
                          </div>
                        )}
                        {isTutor && (
                          <div className="flex items-center space-x-2">
                            <Flag className="w-4 h-4" />
                            <span>{phase.stats?.flagged || 0} flagged</span>
                          </div>
                        )}
                        {!isTutor && phase.studentProgress?.grade !== null && (
                          <div className="flex items-center space-x-2">
                            <ClipboardList className="w-4 h-4" />
                            <span>Score: {phase.studentProgress?.grade}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:w-72 space-y-4">
                      {renderProgress(phase)}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedPhase(phase)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleOpenSubmissions(phase)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors ${
                            isTutor
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <span>{isTutor ? 'Submissions' : 'Go to Workspace'}</span>
                          {!isTutor && <ArrowRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium mb-2">Total Phases</div>
          <div className="text-3xl font-bold text-gray-800">{summary.total}</div>
        </div>
        {isTutor ? (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium mb-2">Active Phases</div>
              <div className="text-3xl font-bold text-green-600">{summary.active}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium mb-2">Total Submissions</div>
              <div className="text-3xl font-bold text-blue-600">{summary.submissions}</div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium mb-2">Submitted</div>
              <div className="text-3xl font-bold text-green-600">{summary.submitted}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium mb-2">Flagged</div>
              <div className="text-3xl font-bold text-amber-600">{summary.flagged}</div>
            </div>
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Phase</h3>
            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                {createError}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleCreatePhase}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phase title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Phase Scope</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="phase_scope"
                      checked={createForm.apply_to_all_batches}
                      onChange={() =>
                        setCreateForm((prev) => ({ ...prev, apply_to_all_batches: true, batch_id: '' }))
                      }
                    />
                    <span>Common task for all batches</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="phase_scope"
                      checked={!createForm.apply_to_all_batches}
                      onChange={() =>
                        setCreateForm((prev) => ({ ...prev, apply_to_all_batches: false }))
                      }
                    />
                    <span>Only for one specific batch</span>
                  </label>
                </div>

                {!createForm.apply_to_all_batches && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch *</label>
                    <select
                      value={createForm.batch_id}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, batch_id: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Choose a batch</option>
                      {batches.map((batch) => (
                        <option key={batch.batch_id} value={batch.batch_id}>
                          {batch.department} {batch.year}
                          {batch.section ? ` - Section ${batch.section}` : ''}
                          {batch.branch ? ` (${batch.branch})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-white ${
                    creating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } flex items-center space-x-2`}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Phase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPhase && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setSelectedPhase(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-gray-900">{selectedPhase.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPhase.status)}`}>
                    {selectedPhase.status}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{selectedPhase.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs uppercase text-gray-500">Start Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedPhase.startDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs uppercase text-gray-500">End Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedPhase.endDate)}</p>
                </div>
              </div>

              {isTutor && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs uppercase text-gray-500">Scope</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedPhase.scope === 'all_batches'
                      ? 'All batches'
                      : `${selectedPhase.batch?.department || 'Batch'} ${selectedPhase.batch?.year || ''}`.trim()}
                  </p>
                </div>
              )}

              {isTutor ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs uppercase text-blue-600">Submissions</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedPhase.stats?.submissions || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs uppercase text-green-600">Graded</p>
                    <p className="text-2xl font-bold text-green-900">{selectedPhase.stats?.graded || 0}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-xs uppercase text-amber-600">Flagged</p>
                    <p className="text-2xl font-bold text-amber-900">{selectedPhase.stats?.flagged || 0}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Submission Status</p>
                  <div className="flex items-center space-x-3">
                    <CheckCircle
                      className={`w-5 h-5 ${
                        selectedPhase.studentProgress?.submitted ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedPhase.studentProgress?.submitted ? 'Submitted' : 'Not submitted yet'}
                      </p>
                      {selectedPhase.studentProgress?.submittedAt && (
                        <p className="text-xs text-gray-500">
                          Submitted at {new Date(selectedPhase.studentProgress.submittedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedPhase.studentProgress?.aiFlag && (
                    <p className="text-sm text-amber-700 mt-3">
                      ⚠️ This submission was flagged for similarity. Expect manual review.
                    </p>
                  )}
                  {selectedPhase.studentProgress?.grade !== null && (
                    <p className="text-sm text-gray-600 mt-3">
                      Grade: <span className="font-semibold text-gray-900">{selectedPhase.studentProgress.grade}%</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {submissionsModal.open && isTutor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative max-h-[80vh] overflow-hidden">
            <button
              onClick={() => setSubmissionsModal({ open: false, phase: null, items: [], loading: false, error: null })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">{submissionsModal.phase?.title}</h3>
              <p className="text-gray-500 text-sm">Recent submissions for this phase</p>
              {gradeActionError && (
                <div className="mt-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-2 text-sm">
                  {gradeActionError}
                </div>
              )}
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {submissionsModal.loading ? (
                <div className="py-8 flex flex-col items-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  Loading submissions...
                </div>
              ) : submissionsModal.error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                  {submissionsModal.error}
                </div>
              ) : submissionsModal.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No submissions yet.</div>
              ) : (
                <div className="space-y-3">
                  {submissionsModal.items.map((submission) => (
                    <div key={submission.submission_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{submission.Team?.team_name}</p>
                          <p className="text-sm text-gray-500">
                            Submitted {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '—'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            submission.group_marks !== null
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {submission.group_marks !== null ? `Graded: ${submission.group_marks}%` : 'Pending grade'}
                          </span>
                          {submission.ai_similarity_flag && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              Flagged
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Grade</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={gradeInputs[submission.submission_id] ?? ''}
                            onChange={(e) =>
                              setGradeInputs((prev) => ({
                                ...prev,
                                [submission.submission_id]: e.target.value
                              }))
                            }
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveGrade(submission.submission_id)}
                            disabled={gradingSubmissionId === submission.submission_id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
                          >
                            {gradingSubmissionId === submission.submission_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Save Grade
                          </button>
                        </div>

                        <div className="md:ml-auto">
                          <button
                            type="button"
                            onClick={() => handleViewSubmission(submission.submission_id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-3 h-3" />
                            View Submitted Content
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewSubmissionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative max-h-[85vh] overflow-hidden">
            <button
              onClick={() => setViewSubmissionModal({ open: false, loading: false, error: null, item: null })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Submitted Content</h3>

            <div className="overflow-y-auto max-h-[70vh] pr-1">
              {viewSubmissionModal.loading ? (
                <div className="py-8 flex flex-col items-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  Loading submission details...
                </div>
              ) : viewSubmissionModal.error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                  {viewSubmissionModal.error}
                </div>
              ) : viewSubmissionModal.item ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs uppercase text-gray-500">Team</p>
                      <p className="font-semibold text-gray-900">{viewSubmissionModal.item.Team?.team_name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs uppercase text-gray-500">Submitted At</p>
                      <p className="font-semibold text-gray-900">
                        {viewSubmissionModal.item.submitted_at
                          ? new Date(viewSubmissionModal.item.submitted_at).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs uppercase text-gray-500 mb-2">Team Members</p>
                    <div className="text-sm text-gray-800 space-y-1">
                      {(viewSubmissionModal.item.Team?.Students || []).map((student) => (
                        <div key={student.student_id}>• {student.name} ({student.email})</div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs uppercase text-gray-500 mb-2">AI Summary</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {viewSubmissionModal.item.ai_summary || 'No AI summary available.'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs uppercase text-gray-500 mb-2">Uploaded File</p>
                    {viewSubmissionModal.item.file_available && viewSubmissionModal.item.resolved_file_url ? (
                      <a
                        href={viewSubmissionModal.item.resolved_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 underline break-all"
                      >
                        {viewSubmissionModal.item.resolved_file_url}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">File is not available on server (missing upload or invalid path).</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPhases;
