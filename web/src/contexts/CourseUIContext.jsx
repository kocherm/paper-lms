import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

const CourseUIContext = createContext(null);

export const useCourseUI = () => {
  const ctx = useContext(CourseUIContext);
  if (!ctx) return { course: null, uiMode: 'standard', isK2: false, is35: false, isSimplified: false };
  return ctx;
};

export const CourseUIProvider = ({ children }) => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    api.getCourse(courseId).then(data => {
      setCourse(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId]);

  const uiMode = course?.ui_mode || 'standard';
  const isK2 = uiMode === 'k2';
  const is35 = uiMode === '3-5';
  const isSimplified = isK2 || is35;

  return (
    <CourseUIContext.Provider value={{ course, setCourse, loading, uiMode, isK2, is35, isSimplified }}>
      {children}
    </CourseUIContext.Provider>
  );
};
