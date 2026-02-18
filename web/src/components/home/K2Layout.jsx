import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Home } from 'lucide-react';

const K2Layout = ({ children }) => {
  const { courseId } = useParams();

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center">
      <header className="w-full flex items-center justify-center py-4">
        <Link
          to={`/courses/${courseId}`}
          className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
          aria-label="Home"
        >
          <Home className="w-8 h-8 text-white" />
        </Link>
      </header>
      <main className="w-full max-w-4xl px-4 py-4 flex-1">
        {children}
      </main>
    </div>
  );
};

export default K2Layout;
