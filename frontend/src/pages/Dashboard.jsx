import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, tutorAPI } from '../api/axios';

/**
 * Dashboard Component
 * Provides tutor overview + student summary with CSV upload workflow
 */
const Dashboard = () => {
  const { user, isTutor } = useAuth();

  // Form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [batchId, setBatchId] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [batches, setBatches] = useState([]);
  const [activeTutorTab, setActiveTutorTab] = useState('team');
  const [batchForm, setBatchForm] = useState({
    year: new Date().getFullYear().toString(),
    department: '',
    branch: '',
    section: ''
  });
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchCreateError, setBatchCreateError] = useState(null);
  const [batchCreateSuccess, setBatchCreateSuccess] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);

  // Data sets
  const [overview, setOverview] = useState(null);
  const [studentSummary, setStudentSummary] = useState(null);
  const [tutorTeams, setTutorTeams] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isTutor) {
      fetchTutorOverview();
      fetchBatches();
      fetchTutorTeams();
    } else {
      fetchStudentSummary();
    }
  }, [isTutor]);

  const fetchTutorOverview = async () => {
    try {
      setOverviewLoading(true);
      setDataError(null);
      const response = await tutorAPI.getOverview();
      setOverview(response.data.data);
    } catch (err) {
      console.error('Tutor overview error:', err);
      setDataError(err.response?.data?.message || 'Unable to load tutor overview');
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchStudentSummary = async () => {
    try {
      setStudentLoading(true);
      setDataError(null);
      const [teamRes, submissionsRes] = await Promise.all([
        studentAPI.getMyTeam(),
        studentAPI.getMySubmissions()
      ]);
      setStudentSummary({
        team: teamRes.data.data,
        submissions: submissionsRes.data.data || []
      });
    } catch (err) {
      console.error('Student summary error:', err);
      setDataError(err.response?.data?.message || 'Unable to load your dashboard data');
      setStudentSummary(null);
    } finally {
      setStudentLoading(false);
    }
  };

  const fetchTutorTeams = async () => {
    try {
      const response = await tutorAPI.getTeams();
      setTutorTeams(response.data?.data || []);
    } catch (err) {
      console.error('Fetch tutor teams error:', err);
      setTutorTeams([]);
    }
  };

  const fetchBatches = async () => {
    try {
      setBatchesLoading(true);
      const response = await studentAPI.getBatches();
      setBatches(response.data.data || []);
    } catch (err) {
      console.error('Fetch batches error:', err);
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (isTutor) {
      return [
        {
          title: 'Total Teams',
          value: overview?.totals?.teams ?? '—',
          icon: Users,
          color: 'bg-blue-500',
          change: `${overview?.totals?.students ?? 0} students`
        },
        {
          title: 'Active Phases',
          value: overview?.totals?.activePhases ?? '—',
          icon: Clock,
          color: 'bg-yellow-500',
          change: `${overview?.totals?.phases ?? 0} total phases`
        },
        {
          title: 'Submissions',
          value: overview?.totals?.submissions ?? '—',
          icon: CheckCircle,
          color: 'bg-green-500',
          change: `${overview?.totals?.upcomingPhases ?? 0} upcoming phases`
        },
        {
          title: 'Average Score',
          value:
            overview?.totals?.averageScore !== undefined && overview?.totals?.averageScore !== null
              ? `${overview.totals.averageScore}%`
              : '—',
          icon: TrendingUp,
          color: 'bg-purple-500',
          change: overview?.totals?.averageScore === null ? 'Awaiting grades' : 'Across graded submissions'
        }
      ];
    }

    const gradedSubmission = (studentSummary?.submissions || []).find(
      (submission) => submission.group_marks !== null
    );

    return [
      {
        title: 'My Team',
        value: studentSummary?.team?.team_name ?? 'Not assigned',
        icon: Users,
        color: 'bg-blue-500',
        change: `${studentSummary?.team?.Students?.length ?? 0} members`
      },
      {
        title: 'Tutor',
        value: studentSummary?.team?.Tutor?.name ?? '—',
        icon: GraduationCap,
        color: 'bg-indigo-500',
        change: studentSummary?.team?.Tutor?.email ?? 'Contact not available'
      },
      {
        title: 'Submissions',
        value: studentSummary?.submissions?.length ?? 0,
        icon: CheckCircle,
        color: 'bg-green-500',
        change: `${(studentSummary?.submissions || []).filter((s) => s.group_marks !== null).length} graded`
      },
      {
        title: 'Latest Score',
        value: gradedSubmission ? `${gradedSubmission.group_marks}%` : 'Pending',
        icon: TrendingUp,
        color: 'bg-purple-500',
        change: gradedSubmission?.Task_Phase?.title || 'Awaiting evaluation'
      }
    ];
  }, [isTutor, overview, studentSummary]);

  const recentActivity = useMemo(() => {
    const formatStatus = (item) => {
      if (item.ai_similarity_flag) return 'warning';
      if (item.group_marks !== null) return 'success';
      return 'info';
    };

    if (isTutor) {
      return (overview?.recentActivity || []).map((activity) => ({
        team: activity.team_name,
        action: activity.phase_title,
        time: activity.submitted_at ? new Date(activity.submitted_at).toLocaleString() : '',
        status: formatStatus(activity)
      }));
    }

    return (studentSummary?.submissions || [])
      .slice(0, 4)
      .map((submission) => ({
        team: studentSummary?.team?.team_name,
        action: submission.Task_Phase?.title || `Phase ${submission.phase_id}`,
        time: submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '',
        status: submission.ai_similarity_flag ? 'warning' : submission.group_marks !== null ? 'success' : 'info'
      }));
  }, [isTutor, overview, studentSummary]);

  /**
   * File input helpers
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setSelectedFile(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please drop a valid CSV file');
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle CSV upload
   */
  const handleUpload = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isTutor || !user) {
      setError('Only tutors can upload student rosters');
      return;
    }

    if (!selectedFile) {
      setError('Please select a CSV file');
      return;
    }

    if (!batchId || !groupSize) {
      setError('Please fill in all fields');
      return;
    }

    const groupSizeNum = parseInt(groupSize, 10);
    if (Number.isNaN(groupSizeNum) || groupSizeNum < 1) {
      setError('Group size must be at least 1');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('batch_id', batchId);
    formData.append('group_size', groupSize);
    formData.append('tutor_id', user.id);

    setLoading(true);
    try {
      const response = await studentAPI.uploadCSV(formData);
      setSuccess(response.data);
      setSelectedFile(null);
      setBatchId('');
      setGroupSize('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchTutorOverview();
    } catch (err) {
      console.error('Upload error:', err);
      if (err.response?.data) {
        setError(err.response.data.message || 'An error occurred during upload');
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setBatchCreateError(null);
    setBatchCreateSuccess(null);

    if (!batchForm.year || !batchForm.department.trim()) {
      setBatchCreateError('Year and department are required');
      return;
    }

    setBatchCreating(true);
    try {
      const payload = {
        year: Number(batchForm.year),
        department: batchForm.department.trim(),
        branch: batchForm.branch.trim() || null,
        section: batchForm.section.trim() || null
      };

      const response = await tutorAPI.createBatch(payload);
      setBatchCreateSuccess(`Batch created: ${response.data?.data?.department} ${response.data?.data?.year}`);
      setBatchForm({
        year: new Date().getFullYear().toString(),
        department: '',
        branch: '',
        section: ''
      });
      await fetchBatches();
    } catch (err) {
      console.error('Create batch error:', err);
      setBatchCreateError(err.response?.data?.message || 'Failed to create batch');
    } finally {
      setBatchCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3 animate-slide-in">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-green-900 font-semibold mb-1">Groups Created Successfully!</h3>
            <p className="text-green-800 text-sm mb-2">
              {success.data?.students_created} students uploaded and {success.data?.teams_created} teams created
            </p>
            {success.data?.teams && (
              <div className="mt-3 space-y-2">
                {success.data.teams.map((team, index) => (
                  <div key={index} className="bg-white rounded p-2 text-xs">
                    <span className="font-medium text-gray-800">{team.team_name}</span>
                    <span className="text-gray-600"> - {team.member_count} members</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 animate-slide-in">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-900 font-semibold mb-1">Upload Failed</h3>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">
          {isTutor ? `Welcome back, ${user?.name || 'Tutor'}!` : 'Student Dashboard'}
        </h2>
        <p className="text-blue-100">
          {isTutor
            ? 'Upload student CSVs, track submissions, and monitor team progress.'
            : 'Track your team progress, submissions, and tutor updates in one place.'}
        </p>
      </div>

      {dataError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-900">Data warning</h3>
            <p className="text-yellow-800 text-sm">{dataError}</p>
          </div>
        </div>
      )}

      {/* CSV Upload Card */}
      {isTutor ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTutorTab('team')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTutorTab === 'team'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Team Creation
            </button>
            <button
              type="button"
              onClick={() => setActiveTutorTab('batch')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTutorTab === 'batch'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Batch Management
            </button>
          </div>

          {activeTutorTab === 'team' ? (
            <>
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Upload Students & Create Groups</h3>
                <p className="text-blue-100 text-sm">Import CSV file to automatically generate teams</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpload} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student CSV File *</label>
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center transition-all
                  ${dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : selectedFile
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />

                {!selectedFile ? (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div className="text-gray-600">
                      <p className="font-medium">Drop your CSV file here or click to browse</p>
                      <p className="text-sm text-gray-500 mt-1">CSV file with columns: name, email</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 text-green-600 mx-auto" />
                    <div>
                      <p className="font-medium text-gray-800">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove file
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">💡 CSV format: name, email (one student per row)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Uploading as</label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  {user?.name} (ID: {user?.id})
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch *</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading || batchesLoading || batches.length === 0}
                >
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch.batch_id} value={batch.batch_id}>
                      {batch.department} - {batch.year}
                    </option>
                  ))}
                </select>
                {batchesLoading && <p className="text-xs text-gray-500 mt-1">Loading batches...</p>}
                {!batchesLoading && batches.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No batches available. Create one from tutor settings.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Size *</label>
                <input
                  type="number"
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Students per team"
                  required
                  disabled={loading}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Required fields marked with *</span>
              </div>
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all
                  ${loading || !selectedFile
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'}
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Groups...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Generate Groups</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="bg-blue-50 border-t border-blue-100 p-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>CSV File Requirements</span>
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>File must be in CSV format (.csv extension)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Required columns: name, email</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Students are randomly shuffled into teams</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Maximum file size: 5MB</span>
              </li>
            </ul>
          </div>
            </>
          ) : (
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create Batch</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add batches here. They will appear in team creation and task assignment dropdowns.
                </p>
              </div>

              {batchCreateError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {batchCreateError}
                </div>
              )}

              {batchCreateSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  {batchCreateSuccess}
                </div>
              )}

              <form onSubmit={handleCreateBatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={batchForm.year}
                    onChange={(e) => setBatchForm((prev) => ({ ...prev, year: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <input
                    type="text"
                    value={batchForm.department}
                    onChange={(e) => setBatchForm((prev) => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Computer Science"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch (optional)</label>
                  <input
                    type="text"
                    value={batchForm.branch}
                    onChange={(e) => setBatchForm((prev) => ({ ...prev, branch: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. AI & DS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section (optional)</label>
                  <input
                    type="text"
                    value={batchForm.section}
                    onChange={(e) => setBatchForm((prev) => ({ ...prev, section: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. A"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={batchCreating}
                    className={`px-5 py-2 rounded-lg text-white font-medium ${
                      batchCreating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {batchCreating ? 'Creating...' : 'Create Batch'}
                  </button>
                </div>
              </form>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Available Batches</h4>
                {batchesLoading ? (
                  <p className="text-sm text-gray-500">Loading batches...</p>
                ) : batches.length === 0 ? (
                  <p className="text-sm text-gray-500">No batches found.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {batches.map((batch) => (
                      <div key={batch.batch_id} className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-900">{batch.department} {batch.year}</span>
                        {batch.section ? <span className="text-gray-600"> • Section {batch.section}</span> : null}
                        {batch.branch ? <span className="text-gray-600"> • {batch.branch}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 flex items-start space-x-4">
          <ShieldCheck className="w-10 h-10 text-blue-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Roster upload restricted</h3>
            <p className="text-gray-600 mt-2">
              Only tutors can upload student rosters and auto-create teams. Reach out to your tutor if your batch or team needs to be updated.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-2">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {isTutor ? 'Recent Activity' : 'My Recent Submissions'}
            </h3>
            <p className="text-gray-500 text-sm">
              {isTutor ? 'Latest submissions and draft commits' : 'Latest submissions from your team'}
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {(isTutor && overviewLoading) || (!isTutor && studentLoading) ? (
            <div className="p-6 text-center text-gray-500">Loading activity...</div>
          ) : recentActivity.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No activity to display yet.</div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={`${activity.team}-${index}`} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{activity.team}</p>
                  <p className="text-sm text-gray-500">{activity.action}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'success'
                      ? 'bg-green-50 text-green-700'
                      : activity.status === 'warning'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-blue-50 text-blue-700'
                  }`}>
                    {activity.status === 'success' && 'Completed'}
                    {activity.status === 'warning' && 'Attention'}
                    {activity.status === 'info' && 'In Progress'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Team Members Visibility */}
      {isTutor ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Teams & Members</h3>
          {tutorTeams.length === 0 ? (
            <p className="text-sm text-gray-500">No teams available yet.</p>
          ) : (
            <div className="space-y-4">
              {tutorTeams.map((team) => (
                <div key={team.team_id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{team.team_name}</p>
                  <p className="text-xs text-gray-500 mb-2">{team.Students?.length || 0} members</p>
                  {team.Students?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {team.Students.map((member) => (
                        <div key={member.student_id} className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                          {member.name} <span className="text-gray-500">({member.email})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No members assigned.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">My Team Members</h3>
          {studentSummary?.team?.Students?.length ? (
            <div className="space-y-2">
              {studentSummary.team.Students.map((member) => (
                <div key={member.student_id} className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                  {member.name} <span className="text-gray-500">({member.email})</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No team members available yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
