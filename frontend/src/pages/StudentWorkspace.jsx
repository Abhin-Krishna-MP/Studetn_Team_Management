import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Save,
  Send,
  Users,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { draftAPI, studentAPI, submissionAPI } from '../api/axios';
import useTextDiff from '../hooks/useTextDiff';

const StudentWorkspace = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Editor state
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  // Workspace data
  const [team, setTeam] = useState(null);
  const [phases, setPhases] = useState([]);
  const [activePhaseId, setActivePhaseId] = useState(null);

  // UI state
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingPhase, setRefreshingPhase] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Statistics
  const [draftCount, setDraftCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    totalLinesAdded: 0,
    totalLinesDeleted: 0,
    totalDrafts: 0
  });

  const { calculateDiff, updateBaseline } = useTextDiff();

  useEffect(() => {
    initializeWorkspace();
    updateBaseline('');
  }, []);

  const initializeWorkspace = async () => {
    try {
      setWorkspaceLoading(true);
      setInitError(null);

      const [teamRes, phasesRes] = await Promise.all([
        studentAPI.getMyTeam(),
        studentAPI.getTeamPhases()
      ]);

      const teamData = teamRes.data.data;
      const phaseData = phasesRes.data.data || [];
      setTeam(teamData);
      setPhases(phaseData);

      const requestedPhaseId = location.state?.phaseId;
      const resolvedPhaseId = requestedPhaseId && phaseData.some((p) => p.phase_id === requestedPhaseId)
        ? requestedPhaseId
        : phaseData[0]?.phase_id || null;
      setActivePhaseId(resolvedPhaseId);
    } catch (err) {
      console.error('Workspace init error:', err);
      setInitError(err.response?.data?.message || 'Failed to load workspace data');
      setTeam(null);
      setPhases([]);
      setActivePhaseId(null);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const refreshPhaseDetails = async () => {
    try {
      setRefreshingPhase(true);
      const response = await studentAPI.getTeamPhases();
      setPhases(response.data.data || []);
    } catch (err) {
      console.error('Refresh phases error:', err);
    } finally {
      setRefreshingPhase(false);
    }
  };

  const activePhase = useMemo(
    () => phases.find((phase) => phase.phase_id === activePhaseId),
    [phases, activePhaseId]
  );

  const activeSubmission = activePhase?.Submissions?.[0];
  const teamMembers = team?.Students || [];
  const tutor = team?.Tutor;

  useEffect(() => {
    const sharedTitle = activeSubmission?.title || '';
    const sharedContent = activeSubmission?.submission_text || '';
    setTitle(sharedTitle);
    setContent(sharedContent);
    updateBaseline(sharedContent);
  }, [activePhaseId, activeSubmission?.submission_id]);

  const currentDiff = useMemo(() => {
    if (!content) return { lines_added: 0, lines_deleted: 0 };
    return calculateDiff(content);
  }, [content, calculateDiff]);

  const guardWorkspaceReady = () => {
    if (!team) {
      setError('You are not assigned to a team yet. Please contact your tutor.');
      return false;
    }
    if (!activePhaseId) {
      setError('Select a phase before saving drafts or submitting.');
      return false;
    }
    if (!user) {
      setError('You must be logged in to perform this action.');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    setMessage(null);
    setError(null);

    if (!content.trim()) {
      setError('Cannot save empty draft');
      return;
    }

    if (!guardWorkspaceReady()) return;

    setSavingDraft(true);
    try {
      const { lines_added, lines_deleted } = calculateDiff(content);
      const payload = {
        student_id: user.id,
        team_id: team.team_id,
        phase_id: activePhaseId,
        title,
        content,
        lines_added,
        lines_deleted
      };

      await draftAPI.createCommit(payload);
      updateBaseline(content);

      setSessionStats((prev) => ({
        totalLinesAdded: prev.totalLinesAdded + lines_added,
        totalLinesDeleted: prev.totalLinesDeleted + lines_deleted,
        totalDrafts: prev.totalDrafts + 1
      }));
      setDraftCount((prev) => prev + 1);
      setLastSaved(new Date().toLocaleTimeString());
      setMessage({
        type: 'success',
        text: `Draft saved! +${lines_added} lines, -${lines_deleted} lines`
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Save draft error:', err);
      setError(err.response?.data?.message || 'Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleFinalSubmit = async () => {
    setMessage(null);
    setError(null);

    if (!content.trim()) {
      setError('Cannot submit empty content');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a submission title');
      return;
    }

    if (!guardWorkspaceReady()) return;

    if (!window.confirm('Submit final work? This will trigger AI analysis and similarity checks.')) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        team_id: team.team_id,
        phase_id: activePhaseId,
        submission_text: content,
        submitted_by: user.id,
        title
      };

      const response = await submissionAPI.submit(payload);
      setMessage({
        type: 'success',
        text: 'Submission successful! Your work has been submitted for review.'
      });

      if (response.data.data?.ai_analysis?.summary) {
        setTimeout(() => {
          setMessage({
            type: 'info',
            text: `AI Analysis: ${response.data.data.ai_analysis.summary}`
          });
        }, 3000);
      }

      setTimeout(() => {
        setContent('');
        setTitle('');
        updateBaseline('');
      }, 2000);

      refreshPhaseDetails();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-600">
        <Loader2 className="w-10 h-10 animate-spin mb-3" />
        Loading workspace...
      </div>
    );
  }

  if (initError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col space-y-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">{initError}</p>
            <p className="text-sm text-red-700">Check your connection or contact your tutor.</p>
          </div>
        </div>
        <button
          onClick={initializeWorkspace}
          className="self-start px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800 font-medium">No team assignment yet.</p>
        <p className="text-sm text-yellow-700 mt-1">
          Once your tutor assigns you to a team, your workspace will unlock automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg p-4 flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <CheckCircle2
            className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              message.type === 'success' ? 'text-green-600' : 'text-blue-600'
            }`}
          />
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-blue-800'}`}>
            {message.text}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Workspace</h2>
            <p className="text-gray-600 mt-1">
              Draft with your team and submit final work for tutor review.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft || !content.trim() || !activePhaseId}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                savingDraft || !content.trim() || !activePhaseId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {savingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </>
              )}
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={
                submitting || !content.trim() || !title.trim() || !activePhaseId
              }
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                submitting || !content.trim() || !title.trim() || !activePhaseId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Final Submit</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-xs uppercase text-gray-500">Team</p>
            <p className="text-xl font-semibold text-gray-900">{team.team_name}</p>
            <p className="text-sm text-gray-500 mt-1">{teamMembers.length} members</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-xs uppercase text-gray-500">Tutor</p>
            <p className="text-lg font-semibold text-gray-900">{tutor?.name || '—'}</p>
            <p className="text-sm text-gray-500">{tutor?.email || 'Email unavailable'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="text-xs uppercase text-gray-500" htmlFor="phase-select">
              Active Phase
            </label>
            <select
              id="phase-select"
              value={activePhaseId || ''}
              onChange={(e) => setActivePhaseId(Number(e.target.value) || null)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a phase</option>
              {phases.map((phase) => (
                <option key={phase.phase_id} value={phase.phase_id}>
                  {phase.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-2 text-blue-600 mb-1">
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Drafts Saved</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{sessionStats.totalDrafts}</p>
            {lastSaved && (
              <p className="text-xs text-blue-600 mt-1">Last: {lastSaved}</p>
            )}
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center space-x-2 text-green-600 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Lines Added</span>
            </div>
            <p className="text-2xl font-bold text-green-900">+{sessionStats.totalLinesAdded}</p>
            <p className="text-xs text-green-600 mt-1">Current: +{currentDiff.lines_added}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <div className="flex items-center space-x-2 text-red-600 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Lines Deleted</span>
            </div>
            <p className="text-2xl font-bold text-red-900">-{sessionStats.totalLinesDeleted}</p>
            <p className="text-xs text-red-600 mt-1">Current: -{currentDiff.lines_deleted}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center space-x-2 text-purple-600 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Total Lines</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{content.split('\n').length}</p>
            <p className="text-xs text-purple-600 mt-1">
              {content.trim().split(/\s+/).filter((w) => w.length > 0).length} words
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Submission Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter submission title (e.g., 'Database Design Implementation')"
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Code Editor</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Every save tracks your coding velocity for the heatmap
                </p>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-500">Lines: {content.split('\n').length}</span>
                <span className="text-gray-500">Characters: {content.length}</span>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[500px] p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
                placeholder={`Start writing your code here...\n\n// Example:\nfunction calculateAverage(numbers) {\n  const sum = numbers.reduce((a, b) => a + b, 0);\n  return sum / numbers.length;\n}\n\n// Your implementation goes here...`}
                disabled={submitting}
                spellCheck={false}
              />

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start space-x-2">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">💡 Tips for tracking velocity:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Save drafts frequently to capture contribution data.</li>
                      <li>Use Final Submit when your team agrees on the output.</li>
                      <li>Draft history powers the analytics dashboard for your tutor.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Team Members</h3>
              </div>
              <span className="text-xs text-gray-500">{teamMembers.length} people</span>
            </div>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.student_id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {member.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <p className="text-sm text-gray-500">No teammates assigned yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Current Phase</h3>
              </div>
              <button
                onClick={refreshPhaseDetails}
                disabled={refreshingPhase}
                className={`text-xs flex items-center space-x-1 ${
                  refreshingPhase ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${refreshingPhase ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            {activePhase ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Phase</p>
                  <p className="font-medium text-gray-900">{activePhase.title}</p>
                  <p className="text-xs text-gray-500">{activePhase.description || 'No description provided.'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-medium text-gray-900">
                    {new Date(activePhase.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submission</p>
                  {activeSubmission ? (
                    <div>
                      <p className="font-medium text-gray-900">Submitted</p>
                      <p className="text-xs text-gray-500">
                        {activeSubmission.submitted_at
                          ? new Date(activeSubmission.submitted_at).toLocaleString()
                          : 'Draft in progress'}
                      </p>
                      {activeSubmission.group_marks !== null && (
                        <p className="text-sm text-gray-600 mt-1">
                          Grade: <span className="font-semibold text-gray-900">{activeSubmission.group_marks}%</span>
                        </p>
                      )}
                      {activeSubmission.ai_similarity_flag && (
                        <p className="text-xs text-amber-700 mt-1">⚠️ Similarity flag raised. Await tutor review.</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">Not submitted</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a phase to view its details.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentWorkspace;
