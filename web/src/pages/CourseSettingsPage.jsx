import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useCourseUI } from '../contexts/CourseUIContext';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';
import IconPicker from '../components/settings/IconPicker';
import ColorPicker from '../components/settings/ColorPicker';
import ButtonEditor from '../components/settings/ButtonEditor';
import OverrideEditor from '../components/settings/OverrideEditor';

const CourseSettingsPage = () => {
  const { courseId } = useParams();
  const { course, setCourse } = useCourseUI();
  const [form, setForm] = useState({
    name: '', course_code: '', default_view: 'modules', ui_mode: 'standard',
    license: 'private', is_public: false,
  });
  const [buttons, setButtons] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (course) {
      setForm({
        name: course.name || '',
        course_code: course.course_code || '',
        default_view: course.default_view || 'modules',
        ui_mode: course.ui_mode || 'standard',
        license: course.license || 'private',
        is_public: course.is_public || false,
      });
    }
  }, [course]);

  useEffect(() => {
    if (courseId) {
      api.getCourseHomeButtons(courseId).then(r => setButtons(r.data || [])).catch(() => {});
      api.getTodaysLessonOverrides(courseId).then(r => setOverrides(r.data || [])).catch(() => {});
    }
  }, [courseId]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateCourse(courseId, form);
      setCourse(updated);
      setMessage('Settings saved.');
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
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={form.course_code}
                onChange={e => setForm(f => ({ ...f, course_code: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License</label>
              <select className="w-full border rounded px-3 py-2" value={form.license}
                onChange={e => setForm(f => ({ ...f, license: e.target.value }))}>
                <option value="private">Private</option>
                <option value="cc_by">CC BY</option>
                <option value="cc_by_sa">CC BY-SA</option>
                <option value="public_domain">Public Domain</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.is_public}
                onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} />
              <label className="text-sm text-gray-700">Public Course</label>
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
                  onChange={e => setForm(f => ({ ...f, default_view: e.target.value }))} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* UI Mode */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">UI Mode</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modeOptions.map(opt => (
              <label key={opt.value}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${form.ui_mode === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="ui_mode" value={opt.value} className="sr-only"
                  checked={form.ui_mode === opt.value}
                  onChange={e => setForm(f => ({ ...f, ui_mode: e.target.value }))} />
                <div className="font-semibold">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
              </label>
            ))}
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
          {message && <span className="text-sm text-gray-600">{message}</span>}
        </div>
      </div>
    </Layout>
  );
};

export default CourseSettingsPage;
