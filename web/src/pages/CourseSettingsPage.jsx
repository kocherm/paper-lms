import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import useIsTeacher from '../hooks/useIsTeacher';
import useUnsavedChanges from '../hooks/useUnsavedChanges';
import { useCourseUI } from '../contexts/CourseUIContext';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';
import IconPicker from '../components/settings/IconPicker';
import ColorPicker from '../components/settings/ColorPicker';
import ButtonEditor from '../components/settings/ButtonEditor';
import OverrideEditor from '../components/settings/OverrideEditor';

// All available CourseNav tabs in default order
const DEFAULT_NAV_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'modules', label: 'Modules' },
  { id: 'grades', label: 'Grades' },
  { id: 'people', label: 'People' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'discussions', label: 'Discussions' },
  { id: 'files', label: 'Files' },
  { id: 'pages', label: 'Pages' },
  { id: 'rubrics', label: 'Rubrics' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'groups', label: 'Groups' },
  { id: 'collaborations', label: 'Collaborations' },
  { id: 'conferences', label: 'Conferences' },
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'question_banks', label: 'Question Banks' },
  { id: 'accommodations', label: 'Accommodations' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'pacing', label: 'Pacing' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'audit_log', label: 'Audit Log' },
  { id: 'content_import', label: 'Import Content' },
  { id: 'external_tools', label: 'External Tools' },
  { id: 'settings', label: 'Settings' },
];

const CourseSettingsPage = () => {
  const { courseId } = useParams();
  const { course, setCourse } = useCourseUI();
  const isTeacher = useIsTeacher(courseId);
  const [form, setForm] = useState({
    name: '', course_code: '', default_view: 'modules', ui_mode: 'standard',
    license: 'private', is_public: false, start_at: '', end_at: '',
    apply_assignment_group_weights: false,
  });
  const [navTabs, setNavTabs] = useState(null); // null = not loaded yet
  const [buttons, setButtons] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [latePolicy, setLatePolicy] = useState({
    late_submission_deduction_enabled: false,
    late_submission_deduction: 0,
    late_submission_interval: 'day',
    late_submission_minimum_percent_enabled: false,
    late_submission_minimum_percent: 0,
    missing_submission_deduction_enabled: false,
    missing_submission_deduction: 0,
  });
  const [latePolicyExists, setLatePolicyExists] = useState(false);
  const [gradingScale, setGradingScale] = useState([
    ['A', 0.93], ['A-', 0.90], ['B+', 0.87], ['B', 0.83], ['B-', 0.80],
    ['C+', 0.77], ['C', 0.73], ['C-', 0.70], ['D+', 0.67], ['D', 0.63],
    ['D-', 0.60], ['F', 0.0],
  ]);
  const [gradingStandardId, setGradingStandardId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty);

  useEffect(() => {
    if (course) {
      const fmtDate = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      };
      setForm({
        name: course.name || '',
        course_code: course.course_code || '',
        default_view: course.default_view || 'modules',
        ui_mode: course.ui_mode || 'standard',
        license: course.license || 'private',
        is_public: course.is_public || false,
        start_at: fmtDate(course.start_at),
        end_at: fmtDate(course.end_at),
        apply_assignment_group_weights: course.apply_assignment_group_weights || false,
      });
      // Initialize navigation tabs from course data or defaults
      if (Array.isArray(course.navigation_tabs) && course.navigation_tabs.length > 0) {
        // Merge saved config with defaults (in case new tabs were added since last save)
        const savedIds = new Set(course.navigation_tabs.map(t => t.id));
        const merged = [
          ...course.navigation_tabs,
          ...DEFAULT_NAV_TABS
            .filter(t => !savedIds.has(t.id))
            .map((t, i) => ({ id: t.id, hidden: false, position: course.navigation_tabs.length + i })),
        ];
        setNavTabs(merged);
      } else {
        setNavTabs(DEFAULT_NAV_TABS.map((t, i) => ({ id: t.id, hidden: false, position: i })));
      }
    }
  }, [course]);

  useEffect(() => {
    if (courseId) {
      api.getCourseHomeButtons(courseId).then(r => setButtons(r.data || [])).catch(() => {});
      api.getTodaysLessonOverrides(courseId).then(r => setOverrides(r.data || [])).catch(() => {});
      api.getLatePolicy(courseId).then(data => {
        if (data && data.late_policy) {
          setLatePolicy(data.late_policy);
          setLatePolicyExists(true);
        } else if (data && data.id) {
          setLatePolicy(data);
          setLatePolicyExists(true);
        }
      }).catch(() => {});
      api.getGradingStandards(courseId).then(standards => {
        if (Array.isArray(standards) && standards.length > 0) {
          const latest = standards[standards.length - 1];
          setGradingStandardId(latest.id);
          if (Array.isArray(latest.data)) {
            setGradingScale(latest.data);
          }
        }
      }).catch(() => {});
    }
  }, [courseId]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = { ...form };
      if (payload.start_at) payload.start_at = new Date(payload.start_at).toISOString();
      else payload.start_at = null;
      if (payload.end_at) payload.end_at = new Date(payload.end_at).toISOString();
      else payload.end_at = null;
      // Include navigation tab ordering
      if (navTabs) {
        payload.navigation_tabs = navTabs.map((t, i) => ({ ...t, position: i }));
      }
      const updated = await api.updateCourse(courseId, payload);
      setCourse(updated);
      const saveErrors = [];
      // Save late policy
      try {
        if (latePolicyExists) {
          await api.updateLatePolicy(courseId, latePolicy);
        } else {
          await api.createLatePolicy(courseId, latePolicy);
          setLatePolicyExists(true);
        }
      } catch (lpErr) {
        try {
          if (!latePolicyExists) {
            await api.createLatePolicy(courseId, latePolicy);
            setLatePolicyExists(true);
          } else {
            saveErrors.push('late policy');
          }
        } catch {
          saveErrors.push('late policy');
        }
      }
      // Save grading scale
      try {
        if (gradingStandardId) {
          await api.updateGradingStandard(courseId, gradingStandardId, 'Course Grading Scale', gradingScale);
        } else {
          const created = await api.createGradingStandard(courseId, 'Course Grading Scale', gradingScale);
          if (created?.id) setGradingStandardId(created.id);
        }
      } catch {
        saveErrors.push('grading scale');
      }
      setIsDirty(false);
      if (saveErrors.length > 0) {
        setMessage(`Settings saved, but failed to save: ${saveErrors.join(', ')}. Please try again.`);
      } else {
        setMessage('Settings saved.');
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const viewOptions = [
    { value: 'modules', label: 'Modules' },
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'wiki', label: 'Front Page' },
    { value: 'announcements', label: 'Announcements' },
    { value: 'home_engine', label: 'Home Engine' },
  ];

  const modeOptions = [
    { value: 'standard', label: 'Standard', desc: 'Full LMS experience' },
    { value: 'k2', label: 'K-2', desc: 'Icons only, large touch targets, no text labels' },
    { value: '3-5', label: '3-5', desc: 'Icons + text, larger UI, simplified navigation' },
  ];

  // Block non-teachers from accessing settings
  if (isTeacher === false) {
    return <Navigate to={`/courses/${courseId}`} replace />;
  }
  if (isTeacher === null) {
    return <Layout><div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading...
</div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Course Settings</h2>
      </div>
      <CourseNav />

      <div className="space-y-6">
        {/* General */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setIsDirty(true); }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={form.course_code}
                onChange={e => { setForm(f => ({ ...f, course_code: e.target.value })); setIsDirty(true); }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License</label>
              <select className="w-full border rounded px-3 py-2" value={form.license}
                onChange={e => { setForm(f => ({ ...f, license: e.target.value })); setIsDirty(true); }}>
                <option value="private">Private</option>
                <option value="cc_by">CC BY</option>
                <option value="cc_by_sa">CC BY-SA</option>
                <option value="public_domain">Public Domain</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.is_public}
                onChange={e => { setForm(f => ({ ...f, is_public: e.target.checked })); setIsDirty(true); }} />
              <label className="text-sm text-gray-700">Public Course</label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.apply_assignment_group_weights}
                onChange={e => { setForm(f => ({ ...f, apply_assignment_group_weights: e.target.checked })); setIsDirty(true); }} />
              <label className="text-sm text-gray-700">Weight final grade based on assignment groups</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={form.start_at}
                onChange={e => { setForm(f => ({ ...f, start_at: e.target.value })); setIsDirty(true); }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={form.end_at}
                onChange={e => { setForm(f => ({ ...f, end_at: e.target.value })); setIsDirty(true); }} />
            </div>
          </div>
        </section>

        {/* Home Page */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Home Page</h3>
          <div className="space-y-2">
            {viewOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-2">
                <input type="radio" name="default_view" value={opt.value}
                  checked={form.default_view === opt.value}
                  onChange={e => { setForm(f => ({ ...f, default_view: e.target.value })); setIsDirty(true); }} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Navigation */}
        {navTabs && (
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-2">Navigation</h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag tabs up or down to reorder. Toggle visibility to show or hide tabs from students. The first 6 visible tabs appear in the primary navigation bar; the rest appear under "More".
            </p>
            <div className="space-y-1">
              {navTabs.map((tab, idx) => {
                const def = DEFAULT_NAV_TABS.find(d => d.id === tab.id);
                const label = def ? def.label : tab.id;
                return (
                  <div
                    key={tab.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded border ${tab.hidden ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-300'}`}
                  >
                    {/* Position number */}
                    <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}</span>

                    {/* Up/Down arrows */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                        aria-label={`Move ${label} up`}
                        onClick={() => {
                          const updated = [...navTabs];
                          [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                          setNavTabs(updated);
                          setIsDirty(true);
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={idx === navTabs.length - 1}
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                        aria-label={`Move ${label} down`}
                        onClick={() => {
                          const updated = [...navTabs];
                          [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                          setNavTabs(updated);
                          setIsDirty(true);
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Tab label */}
                    <span className={`flex-1 text-sm font-medium ${tab.hidden ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {label}
                    </span>

                    {/* Visibility toggle */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!tab.hidden}
                        onChange={() => {
                          const updated = navTabs.map((t, i) =>
                            i === idx ? { ...t, hidden: !t.hidden } : t
                          );
                          setNavTabs(updated);
                          setIsDirty(true);
                        }}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-2 text-xs text-gray-500">{tab.hidden ? 'Hidden' : 'Visible'}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* UI Mode */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">UI Mode</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modeOptions.map(opt => (
              <label key={opt.value}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${form.ui_mode === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="ui_mode" value={opt.value} className="sr-only"
                  checked={form.ui_mode === opt.value}
                  onChange={e => { setForm(f => ({ ...f, ui_mode: e.target.value })); setIsDirty(true); }} />
                <div className="font-semibold">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
              </label>
            ))}
          </div>
        </section>

        {/* Late Policies */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Late Policies</h3>
          <div className="space-y-4">
            {/* Late submission deduction */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="late-deduction-enabled"
                  checked={latePolicy.late_submission_deduction_enabled}
                  onChange={e => { setLatePolicy(p => ({ ...p, late_submission_deduction_enabled: e.target.checked })); setIsDirty(true); }} />
                <label htmlFor="late-deduction-enabled" className="text-sm font-medium text-gray-700">
                  Automatically deduct from late submissions
                </label>
              </div>
              {latePolicy.late_submission_deduction_enabled && (
                <div className="ml-6 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span>Deduct</span>
                  <input type="number" min="0" max="100" step="1" className="w-20 border rounded px-2 py-1"
                    value={latePolicy.late_submission_deduction}
                    onChange={e => { setLatePolicy(p => ({ ...p, late_submission_deduction: parseFloat(e.target.value) || 0 })); setIsDirty(true); }} />
                  <span>% for each late</span>
                  <select className="border rounded px-2 py-1"
                    value={latePolicy.late_submission_interval}
                    onChange={e => { setLatePolicy(p => ({ ...p, late_submission_interval: e.target.value })); setIsDirty(true); }}>
                    <option value="day">day</option>
                    <option value="hour">hour</option>
                  </select>
                </div>
              )}
            </div>

            {/* Minimum percentage for late submissions */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="min-percent-enabled"
                  checked={latePolicy.late_submission_minimum_percent_enabled}
                  onChange={e => { setLatePolicy(p => ({ ...p, late_submission_minimum_percent_enabled: e.target.checked })); setIsDirty(true); }} />
                <label htmlFor="min-percent-enabled" className="text-sm font-medium text-gray-700">
                  Set a minimum grade for late submissions
                </label>
              </div>
              {latePolicy.late_submission_minimum_percent_enabled && (
                <div className="ml-6 flex items-center gap-2 text-sm text-gray-600">
                  <span>Lowest possible grade:</span>
                  <input type="number" min="0" max="100" step="1" className="w-20 border rounded px-2 py-1"
                    value={latePolicy.late_submission_minimum_percent}
                    onChange={e => { setLatePolicy(p => ({ ...p, late_submission_minimum_percent: parseFloat(e.target.value) || 0 })); setIsDirty(true); }} />
                  <span>%</span>
                </div>
              )}
            </div>

            {/* Missing submission deduction */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="missing-deduction-enabled"
                  checked={latePolicy.missing_submission_deduction_enabled}
                  onChange={e => { setLatePolicy(p => ({ ...p, missing_submission_deduction_enabled: e.target.checked })); setIsDirty(true); }} />
                <label htmlFor="missing-deduction-enabled" className="text-sm font-medium text-gray-700">
                  Automatically apply a grade for missing submissions
                </label>
              </div>
              {latePolicy.missing_submission_deduction_enabled && (
                <div className="ml-6 flex items-center gap-2 text-sm text-gray-600">
                  <span>Grade missing submissions as</span>
                  <input type="number" min="0" max="100" step="1" className="w-20 border rounded px-2 py-1"
                    value={100 - (latePolicy.missing_submission_deduction || 0)}
                    onChange={e => { setLatePolicy(p => ({ ...p, missing_submission_deduction: 100 - (parseFloat(e.target.value) || 0) })); setIsDirty(true); }} />
                  <span>% of possible points</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Grading Scale */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Grading Scale</h3>
          <p className="text-sm text-gray-500 mb-4">
            Customize the letter grade boundaries for this course. Percentages are minimum thresholds (e.g., 93% means scores of 93% and above earn that grade).
          </p>
          <div className="space-y-2">
            {gradingScale.map(([name, value], idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  className="w-16 border rounded px-2 py-1 text-sm text-center font-medium"
                  value={name}
                  onChange={e => {
                    const updated = [...gradingScale];
                    updated[idx] = [e.target.value, value];
                    setGradingScale(updated);
                    setIsDirty(true);
                  }}
                />
                <span className="text-sm text-gray-500">&ge;</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  className="w-20 border rounded px-2 py-1 text-sm text-center"
                  value={Math.round(value * 100)}
                  onChange={e => {
                    const updated = [...gradingScale];
                    updated[idx] = [name, (parseFloat(e.target.value) || 0) / 100];
                    setGradingScale(updated);
                    setIsDirty(true);
                  }}
                />
                <span className="text-sm text-gray-500">%</span>
                {gradingScale.length > 2 && (
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-600 text-xs"
                    onClick={() => { setGradingScale(gradingScale.filter((_, i) => i !== idx)); setIsDirty(true); }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline mt-2"
              onClick={() => {
                const last = gradingScale[gradingScale.length - 1];
                const newValue = last ? Math.max((last[1] - 0.05), 0) : 0;
                setGradingScale([...gradingScale.slice(0, -1), ['New', newValue], gradingScale[gradingScale.length - 1]]);
                setIsDirty(true);
              }}
            >
              + Add grade level
            </button>
          </div>
        </section>

        {/* Home Buttons (visible when home_engine selected) */}
        {form.default_view === 'home_engine' && (
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Home Buttons</h3>
            <ButtonEditor courseId={courseId} buttons={buttons} setButtons={setButtons} />
          </section>
        )}

        {/* Today's Lesson Overrides (visible when home_engine selected) */}
        {form.default_view === 'home_engine' && (
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Today's Lesson Overrides</h3>
            <OverrideEditor courseId={courseId} overrides={overrides} setOverrides={setOverrides} />
          </section>
        )}

        {/* Save */}
        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {message && <span className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : message.includes('failed') ? 'text-yellow-700' : 'text-green-600'}`}>{message}</span>}
        </div>
      </div>
    </Layout>
  );
};

export default CourseSettingsPage;
