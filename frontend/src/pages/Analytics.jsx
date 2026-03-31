import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, TrendingUp, Users, Clock, FileText, Activity, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api, { studentAPI, tutorAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

/**
 * Analytics Component
 * Displays submission analysis with AI summaries and velocity heatmaps
 */
const Analytics = () => {
  const { isTutor } = useAuth();
  
  // dynamic select data
  const [teams, setTeams] = useState([]);
  const [phases, setPhases] = useState([]);

  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState(null);

  // Velocity data state
  const [velocityData, setVelocityData] = useState(null);
  const [loadingVelocity, setLoadingVelocity] = useState(false);
  const [velocityError, setVelocityError] = useState(null);

  // Filters
  const [selectedTeam, setSelectedTeam] = useState(1);
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [chartType, setChartType] = useState('line'); // 'line' or 'scatter'
  const [selectedMember, setSelectedMember] = useState('all');

  // Student colors for visualization
  const studentColorPalette = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#22c55e', // lime
    '#6366f1', // indigo
  ];

  /**
   * Fetch submissions for current phase
   */
  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    setSubmissionsError(null);

    try {
      const response = await api.get(`/submissions/phase/${selectedPhase}`);
      setSubmissions(response.data.data || []);
    } catch (err) {
      console.error('Fetch submissions error:', err);
      setSubmissionsError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  /**
   * Fetch velocity data for team and phase
   */
  const fetchVelocityData = async () => {
    setLoadingVelocity(true);
    setVelocityError(null);

    try {
      const response = await api.get(`/teams/${selectedTeam}/velocity/${selectedPhase}`);
      setVelocityData(response.data.data);
    } catch (err) {
      console.error('Fetch velocity error:', err);
      setVelocityError(err.response?.data?.message || 'Failed to load velocity data');
    } finally {
      setLoadingVelocity(false);
    }
  };

  /**
   * Fetch data on mount and when filters change
   */
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        let fetchedTeams = [];
        let fetchedPhases = [];
        
        if (isTutor) {
          const [teamsRes, phasesRes] = await Promise.all([
            tutorAPI.getTeams(),
            tutorAPI.getPhases()
          ]);
          fetchedTeams = teamsRes.data?.data || [];
          fetchedPhases = phasesRes.data?.data || [];
        } else {
          const [teamsRes, phasesRes] = await Promise.all([
            studentAPI.getMyTeam(),
            studentAPI.getTeamPhases()
          ]);
          fetchedTeams = [teamsRes.data?.data].filter(Boolean);
          fetchedPhases = phasesRes.data?.data || [];
        }
        
        setTeams(fetchedTeams);
        setPhases(fetchedPhases);
        
        if (fetchedTeams.length > 0) setSelectedTeam(fetchedTeams[0].team_id || fetchedTeams[0].id);
        if (fetchedPhases.length > 0) setSelectedPhase(fetchedPhases[0].phase_id || fetchedPhases[0].id);
        
      } catch(e) {
          console.error('Error fetching analytics meta', e);
      }
    };
    fetchMetadata();
  }, [isTutor]);

  useEffect(() => {
    if(selectedPhase) fetchSubmissions();
  }, [selectedPhase]);

  useEffect(() => {
    if(selectedTeam && selectedPhase) fetchVelocityData();
  }, [selectedTeam, selectedPhase]);

  /**
   * Format timestamp for chart display
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  /**
   * Format date for chart display
   */
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  /**
   * Custom tooltip for charts
   */
  const ScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">
            {data.student_name || `Student ${data.student_id}`}
          </p>
          <p className="text-xs text-gray-600">
            {formatDate(data.timestamp || data.timestampMs)} at {formatTime(data.timestamp || data.timestampMs)}
          </p>
          <p className="text-sm text-gray-800 mt-1">
            Lines Changed: <span className="font-semibold">{data.lines_changed}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            +{data.lines_added || 0} / -{data.lines_deleted || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  const uniqueStudents = useMemo(() => {
    if (!velocityData) return [];

    if (Array.isArray(velocityData.students) && velocityData.students.length > 0) {
      return velocityData.students
        .filter((s) => (s.total_commits ?? 0) > 0)
        .map((s, index) => ({
          id: s.student_id,
          name: s.name || `Student ${s.student_id}`,
          color: studentColorPalette[index % studentColorPalette.length],
          total_commits: s.total_commits ?? 0,
          total_lines_added: s.total_lines_added ?? 0,
          total_lines_deleted: s.total_lines_deleted ?? 0,
        }));
    }

    const studentIds = [...new Set((velocityData.timeline || []).map(d => d.student_id))];
    return studentIds.map((id, index) => ({
      id,
      name: velocityData.timeline.find(d => d.student_id === id)?.student_name || `Student ${id}`,
      color: studentColorPalette[index % studentColorPalette.length],
      total_commits: (velocityData.timeline || []).filter(d => d.student_id === id).length,
      total_lines_added: (velocityData.timeline || []).filter(d => d.student_id === id).reduce((sum, d) => sum + (d.lines_added || 0), 0),
      total_lines_deleted: (velocityData.timeline || []).filter(d => d.student_id === id).reduce((sum, d) => sum + (d.lines_deleted || 0), 0),
    }));
  }, [velocityData]);

  const studentColorById = useMemo(() => {
    const colorMap = {};
    uniqueStudents.forEach(student => {
      colorMap[student.id] = student.color;
    });
    return colorMap;
  }, [uniqueStudents]);

  useEffect(() => {
    if (selectedMember === 'all') return;

    const exists = uniqueStudents.some((student) => student.id === Number(selectedMember));
    if (!exists) {
      setSelectedMember('all');
    }
  }, [uniqueStudents, selectedMember]);

  const displayedStudents = useMemo(() => {
    if (selectedMember === 'all') return uniqueStudents;
    return uniqueStudents.filter((student) => student.id === Number(selectedMember));
  }, [uniqueStudents, selectedMember]);

  const lineChartData = useMemo(() => {
    if (!velocityData?.timeline?.length) return [];

    const groupedByTimestamp = new Map();

    velocityData.timeline.forEach((entry) => {
      const timestampMs = new Date(entry.timestamp).getTime();

      if (!groupedByTimestamp.has(timestampMs)) {
        groupedByTimestamp.set(timestampMs, {
          timestamp: entry.timestamp,
          timestampMs,
        });
      }

      const row = groupedByTimestamp.get(timestampMs);
      const key = `student_${entry.student_id}`;
      row[key] = (row[key] || 0) + (entry.lines_changed || 0);
    });

    return Array.from(groupedByTimestamp.values()).sort((a, b) => a.timestampMs - b.timestampMs);
  }, [velocityData]);

  const scatterData = useMemo(() => {
    if (!velocityData?.timeline?.length) return [];
    return velocityData.timeline.map((entry) => ({
      ...entry,
      timestampMs: new Date(entry.timestamp).getTime(),
    }));
  }, [velocityData]);

  const LineTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="text-xs text-gray-600 mb-2">
          {formatDate(label)} at {formatTime(label)}
        </p>
        <div className="space-y-1">
          {payload
            .filter(item => item.value !== undefined && item.value !== null)
            .map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium" style={{ color: item.color }}>{item.name}</span>
                <span className="text-gray-900 font-semibold">{item.value}</span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Analytics Dashboard</h2>
        <p className="text-purple-100">Review submissions and track team velocity</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team
            </label>
            <select
              value={selectedTeam || ''}
              onChange={(e) => setSelectedTeam(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {teams.length === 0 && <option value="">No teams available</option>}
              {teams.map(team => (
                <option key={team.team_id || team.id} value={team.team_id || team.id}>{team.team_name || team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Phase
            </label>
            <select
              value={selectedPhase || ''}
              onChange={(e) => setSelectedPhase(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {phases.length === 0 && <option value="">No phases available</option>}
              {phases.map(phase => (
                <option key={phase.phase_id || phase.id} value={phase.phase_id || phase.id}>{phase.title || phase.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="line">Line Chart</option>
              <option value="scatter">Scatter Plot</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member View
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Members</option>
              {uniqueStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Velocity Heatmap */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">Velocity Heatmap</h3>
                <p className="text-sm text-gray-600">Track coding activity over time</p>
              </div>
            </div>
            <button
              onClick={fetchVelocityData}
              disabled={loadingVelocity}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingVelocity ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loadingVelocity ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading velocity data...</p>
              </div>
            </div>
          ) : velocityError ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-600">{velocityError}</p>
              </div>
            </div>
          ) : velocityData?.timeline?.length > 0 ? (
            <>
              {/* Chart */}
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'line' ? (
                  <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTime}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'Lines Changed', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<LineTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {displayedStudents.map(student => (
                      <Line
                        key={student.id}
                        type="monotone"
                        dataKey={`student_${student.id}`}
                        name={student.name}
                        stroke={student.color}
                        strokeWidth={2}
                        dot={{ r: 4, fill: student.color }}
                        activeDot={{ r: 6 }}
                        connectNulls={true}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="timestampMs" 
                      tickFormatter={formatTime}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                      type="number"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis 
                      dataKey="lines_changed"
                      label={{ value: 'Lines Changed', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<ScatterTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {displayedStudents.map(student => (
                      <Scatter
                        key={student.id}
                        name={student.name}
                        data={scatterData.filter(d => d.student_id === student.id)}
                        fill={student.color}
                      />
                    ))}
                  </ScatterChart>
                )}
              </ResponsiveContainer>

              {/* Summary Stats */}
              {velocityData?.summary && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Commits</p>
                    <p className="text-2xl font-bold text-blue-900">{velocityData.summary.total_commits}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Total Lines Added</p>
                    <p className="text-2xl font-bold text-green-900">+{velocityData.summary.total_lines_added}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Total Lines Deleted</p>
                    <p className="text-2xl font-bold text-red-900">-{velocityData.summary.total_lines_deleted}</p>
                  </div>
                </div>
              )}

              {/* Student Breakdown */}
              {displayedStudents.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Student Contributions</h4>
                  <div className="space-y-3">
                    {displayedStudents.map((student) => (
                      <div key={student.id} className="flex items-center space-x-4">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: studentColorById[student.id] || '#6b7280' }}
                        ></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {student.name || `Student ${student.id}`}
                            </span>
                            <span className="text-sm text-gray-600">
                              {student.total_commits || 0} commits
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${velocityData.summary?.total_commits ? ((student.total_commits || 0) / velocityData.summary.total_commits) * 100 : 0}%`,
                                backgroundColor: studentColorById[student.id] || '#6b7280'
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <div>+{student.total_lines_added || 0}</div>
                          <div>-{student.total_lines_deleted || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No velocity data available for this team and phase</p>
                <p className="text-sm text-gray-500 mt-1">Students need to save drafts to generate velocity data</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submissions Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">Submission Analysis</h3>
                <p className="text-sm text-gray-600">AI-powered submission review and plagiarism detection</p>
              </div>
            </div>
            <button
              onClick={fetchSubmissions}
              disabled={loadingSubmissions}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSubmissions ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loadingSubmissions ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading submissions...</p>
              </div>
            </div>
          ) : submissionsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{submissionsError}</p>
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <div 
                  key={submission.submission_id || index} 
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Team {submission.team_id} - {submission.title || 'Untitled Submission'}
                        </h4>
                        {submission.ai_similarity_flag && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            High Similarity Detected
                          </span>
                        )}
                        {!submission.ai_similarity_flag && submission.ai_summary && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* AI Summary - Rich structured display */}
                  {submission.ai_summary && (() => {
                    // Parse structured fields from stored text
                    const text = submission.ai_summary;
                    const summaryMatch = text.match(/Summary:\s*([\s\S]*?)(?:\n\nContribution Balance:|$)/);
                    const balanceMatch = text.match(/Contribution Balance:\s*([\s\S]*?)(?:\nBalance Score:|$)/);
                    const scoreMatch = text.match(/Balance Score:\s*(\d+)\/10/);
                    const flagsMatch = text.match(/Red Flags:\n([\s\S]*?)$/);
                    
                    const summary = summaryMatch?.[1]?.trim();
                    const balance = balanceMatch?.[1]?.trim();
                    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
                    const flags = flagsMatch?.[1]?.trim().split('\n- ').filter(Boolean).map(f => f.replace(/^- /, ''));

                    return (
                      <div className="mt-4 space-y-3">
                        {/* Summary */}
                        {summary && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-2">
                              <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h5 className="text-sm font-semibold text-blue-900 mb-1">AI Summary</h5>
                                <p className="text-sm text-blue-800">{summary}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Balance Score + Contribution */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {score !== null && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h5 className="text-sm font-semibold text-purple-900 mb-2">Contribution Balance</h5>
                              <div className="flex items-center space-x-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div
                                    className={`h-3 rounded-full transition-all ${
                                      score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${score * 10}%` }}
                                  />
                                </div>
                                <span className={`text-lg font-bold ${
                                  score >= 7 ? 'text-green-700' : score >= 4 ? 'text-yellow-700' : 'text-red-700'
                                }`}>{score}/10</span>
                              </div>
                              {balance && <p className="text-xs text-purple-700 mt-2">{balance}</p>}
                            </div>
                          )}

                          {/* Red Flags */}
                          {flags && flags.length > 0 ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h5 className="text-sm font-semibold text-red-900 mb-2 flex items-center space-x-1">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Red Flags ({flags.length})</span>
                              </h5>
                              <ul className="space-y-1">
                                {flags.map((flag, i) => (
                                  <li key={i} className="text-xs text-red-800 flex items-start space-x-1">
                                    <span className="mt-0.5 flex-shrink-0">•</span>
                                    <span>{flag}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h5 className="text-sm font-semibold text-green-900 mb-1 flex items-center space-x-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>No Issues Found</span>
                              </h5>
                              <p className="text-xs text-green-700">No contribution imbalance or red flags detected.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Similarity Warning */}
                  {submission.ai_similarity_flag && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-semibold text-red-900 mb-1">Plagiarism Alert</h5>
                          <p className="text-sm text-red-800">
                            This submission shows high similarity with other submissions. Manual review recommended.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submission Preview */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Submission Text Preview</h5>
                    <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-800 max-h-48 overflow-y-auto">
                      {submission.submission_text?.substring(0, 500)}
                      {submission.submission_text?.length > 500 && '...'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No submissions found for this phase</p>
                <p className="text-sm text-gray-500 mt-1">Submissions will appear here once students submit their work</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
