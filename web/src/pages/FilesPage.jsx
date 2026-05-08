import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Folder, File, Upload, Trash2, ChevronRight, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import useIsTeacher from '../hooks/useIsTeacher';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';
import { Skeleton } from '@/components/ui/skeleton';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const FilesPage = () => {
  const { courseId } = useParams();
  const isTeacher = useIsTeacher(courseId);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchContents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let folderResult;
      let fileResult;

      if (currentFolderId) {
        const [subfolders, folderFiles] = await Promise.all([
          api.getSubfolders(currentFolderId),
          api.getFolderFiles(currentFolderId),
        ]);
        folderResult = subfolders;
        fileResult = folderFiles;
      } else {
        const [courseFolders, courseFiles] = await Promise.all([
          api.getCourseFolders(courseId),
          api.getCourseFiles(courseId),
        ]);
        folderResult = courseFolders;
        fileResult = courseFiles;
      }

      setFolders(folderResult.data || []);
      setFiles(fileResult.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, currentFolderId]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const navigateToFolder = async (folderId, folderName) => {
    if (folderId === null) {
      setBreadcrumbs([]);
      setCurrentFolderId(null);
      return;
    }

    setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
    setCurrentFolderId(folderId);
  };

  const navigateToBreadcrumb = (index) => {
    if (index === -1) {
      setBreadcrumbs([]);
      setCurrentFolderId(null);
      return;
    }

    const crumb = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setCurrentFolderId(crumb.id);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await api.createCourseFolder(courseId, {
        name: newFolderName.trim(),
        parent_folder_id: currentFolderId || null,
      });
      setNewFolderName('');
      setShowNewFolder(false);
      fetchContents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      await api.uploadCourseFile(courseId, file);
      e.target.value = '';
      fetchContents();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.deleteFile(courseId, fileId);
      fetchContents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) return;

    try {
      await api.deleteFolder(folderId);
      fetchContents();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <CourseNav />
        <div className="space-y-3 p-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CourseNav />
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">&larr; Back to Course</Link>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Files</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
        <button
          onClick={() => navigateToBreadcrumb(-1)}
          className="hover:text-blue-600 font-medium"
        >
          Files
        </button>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => navigateToBreadcrumb(index)}
              className="hover:text-blue-600 font-medium"
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Actions bar */}
      {isTeacher && (
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => setShowNewFolder(true)}
            className="inline-flex items-center space-x-1 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
          <label className="inline-flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm font-medium shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {/* New folder form */}
      {showNewFolder && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <form onSubmit={handleCreateFolder} className="flex items-center space-x-3">
            <Folder className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Content list */}
      <div className="bg-white rounded-lg shadow">
        {folders.length === 0 && files.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No files or folders yet.</div>
        ) : (
          <div className="divide-y">
            {/* Folders */}
            {folders.map((folder) => (
              <div
                key={`folder-${folder.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <button
                  onClick={() => navigateToFolder(folder.id, folder.name)}
                  className="flex items-center space-x-3 flex-1 text-left"
                >
                  <Folder className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">{folder.name}</span>
                </button>
                {isTeacher && (
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Delete folder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {/* Files */}
            {files.map((file) => (
              <div
                key={`file-${file.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <File className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.display_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} &middot; {file.content_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={file.url}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    download
                  >
                    Download
                  </a>
                  {isTeacher && (
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FilesPage;
