import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight, ChevronDown, Plus, Trash2, Eye, EyeOff,
  FileText, PenTool, HelpCircle, ExternalLink, Minus, Book,
  Award, Calendar, GripVertical, MessageSquare, X, Pencil, Check, Lock,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useIsTeacher from '../hooks/useIsTeacher';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';

const ITEM_ICONS = {
  Page: FileText,
  Assignment: PenTool,
  Quiz: HelpCircle,
  Discussion: MessageSquare,
  ExternalUrl: ExternalLink,
  SubHeader: Minus,
};

const ITEM_TYPE_OPTIONS = [
  { value: 'SubHeader', label: 'Text Header' },
  { value: 'Assignment', label: 'Assignment' },
  { value: 'Quiz', label: 'Quiz' },
  { value: 'Page', label: 'Page' },
  { value: 'Discussion', label: 'Discussion' },
  { value: 'ExternalUrl', label: 'External URL' },
];

// --- Sortable Module Component ---
const SortableModule = ({ module, children, isTeacher, disabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `module-${module.id}`, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: isTeacher ? { ...attributes, ...listeners } : {} })}
    </div>
  );
};

// --- Sortable Item Component ---
const SortableItem = ({ item, children, isTeacher, disabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.id}`, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: isTeacher ? { ...attributes, ...listeners } : {} })}
    </div>
  );
};

const ModulesPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [creating, setCreating] = useState(false);
  const [addingItemTo, setAddingItemTo] = useState(null);
  const [newItem, setNewItem] = useState({ title: '', type: 'SubHeader', external_url: '', new_tab: false });
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editModuleName, setEditModuleName] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [dragType, setDragType] = useState(null); // 'module' or 'item'
  const [prerequisites, setPrerequisites] = useState({}); // { moduleId: [prereqId, ...] }
  const [loadingPrereqs, setLoadingPrereqs] = useState({});

  const isTeacher = useIsTeacher(courseId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchModules = useCallback(async () => {
    try {
      const result = await api.getModules(courseId, 1, 100, true);
      const mods = result.data || [];
      setModules(mods);
      setExpandedModules(prev => {
        const merged = { ...prev };
        mods.forEach(m => {
          if (merged[m.id] === undefined) merged[m.id] = true;
        });
        return merged;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Fetch prerequisites for all modules once they are loaded
  useEffect(() => {
    if (modules.length === 0) return;
    const fetchAllPrereqs = async () => {
      const prereqMap = {};
      await Promise.all(
        modules.map(async (mod) => {
          try {
            const result = await api.getModulePrerequisites(courseId, mod.id);
            prereqMap[mod.id] = result?.prerequisite_module_ids || [];
          } catch {
            prereqMap[mod.id] = [];
          }
        })
      );
      setPrerequisites(prereqMap);
    };
    fetchAllPrereqs();
  }, [modules, courseId]);

  const handleAddPrerequisite = async (moduleId, prereqModuleId) => {
    if (!prereqModuleId) return;
    const current = prerequisites[moduleId] || [];
    if (current.includes(prereqModuleId)) return;
    const updated = [...current, prereqModuleId];
    setPrerequisites(prev => ({ ...prev, [moduleId]: updated }));
    setLoadingPrereqs(prev => ({ ...prev, [moduleId]: true }));
    try {
      await api.setModulePrerequisites(courseId, moduleId, updated);
    } catch (err) {
      setError(err.message);
      setPrerequisites(prev => ({ ...prev, [moduleId]: current }));
    } finally {
      setLoadingPrereqs(prev => ({ ...prev, [moduleId]: false }));
    }
  };

  const handleRemovePrerequisite = async (moduleId, prereqModuleId) => {
    const current = prerequisites[moduleId] || [];
    const updated = current.filter(id => id !== prereqModuleId);
    setPrerequisites(prev => ({ ...prev, [moduleId]: updated }));
    setLoadingPrereqs(prev => ({ ...prev, [moduleId]: true }));
    try {
      await api.setModulePrerequisites(courseId, moduleId, updated);
    } catch (err) {
      setError(err.message);
      setPrerequisites(prev => ({ ...prev, [moduleId]: current }));
    } finally {
      setLoadingPrereqs(prev => ({ ...prev, [moduleId]: false }));
    }
  };

  const getModuleName = (moduleId) => {
    const mod = modules.find(m => m.id === moduleId);
    return mod ? mod.name : `Module ${moduleId}`;
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    setCreating(true);
    try {
      await api.createModule(courseId, {
        name: newModuleName.trim(),
        position: modules.length + 1,
      });
      setNewModuleName('');
      setShowCreateModule(false);
      await fetchModules();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its items?')) return;
    try {
      await api.deleteModule(courseId, moduleId);
      await fetchModules();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTogglePublish = async (module) => {
    const newPublished = !module.published;
    try {
      await api.updateModule(courseId, module.id, { published: newPublished });
      setModules(prev => prev.map(m =>
        m.id === module.id ? { ...m, published: newPublished, workflow_state: newPublished ? 'active' : 'unpublished' } : m
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const startRenameModule = (module) => {
    setEditingModuleId(module.id);
    setEditModuleName(module.name);
  };

  const handleRenameModule = async (moduleId) => {
    if (!editModuleName.trim()) return;
    try {
      await api.updateModule(courseId, moduleId, { name: editModuleName.trim() });
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, name: editModuleName.trim() } : m))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setEditingModuleId(null);
      setEditModuleName('');
    }
  };

  const handleAddItem = async (e, moduleId) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;
    setCreating(true);
    try {
      const itemPayload = {
        title: newItem.title.trim(),
        type: newItem.type,
        position: (modules.find(m => m.id === moduleId)?.items?.length || 0) + 1,
      };
      if (newItem.type === 'ExternalUrl') {
        itemPayload.external_url = newItem.external_url;
        itemPayload.new_tab = newItem.new_tab;
      }
      await api.createModuleItem(courseId, moduleId, itemPayload);
      setAddingItemTo(null);
      setNewItem({ title: '', type: 'SubHeader', external_url: '', new_tab: false });
      await fetchModules();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteItem = async (moduleId, itemId) => {
    try {
      await api.deleteModuleItem(courseId, moduleId, itemId);
      await fetchModules();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleItemPublish = async (moduleId, item) => {
    const newPublished = !item.published;
    // Optimistic update
    setModules(prev => prev.map(m =>
      m.id === moduleId
        ? { ...m, items: (m.items || []).map(i =>
            i.id === item.id ? { ...i, published: newPublished, workflow_state: newPublished ? 'active' : 'unpublished' } : i
          )}
        : m
    ));
    try {
      await api.updateModuleItem(courseId, moduleId, item.id, { published: newPublished });
    } catch (err) {
      setError(err.message);
      await fetchModules();
    }
  };

  // --- Drag-and-Drop Handlers ---
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    if (String(active.id).startsWith('module-')) {
      setDragType('module');
    } else {
      setDragType('item');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setDragType(null);

    if (!over || active.id === over.id) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Module reorder
    if (activeIdStr.startsWith('module-') && overIdStr.startsWith('module-')) {
      const activeModuleId = parseInt(activeIdStr.replace('module-', ''));
      const overModuleId = parseInt(overIdStr.replace('module-', ''));

      const oldIndex = modules.findIndex(m => m.id === activeModuleId);
      const newIndex = modules.findIndex(m => m.id === overModuleId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newModules = arrayMove(modules, oldIndex, newIndex);
        setModules(newModules);

        try {
          await api.reorderModules(courseId, newModules.map(m => m.id));
        } catch (err) {
          setError(err.message);
          await fetchModules(); // Revert on error
        }
      }
      return;
    }

    // Item reorder within same module
    if (activeIdStr.startsWith('item-') && overIdStr.startsWith('item-')) {
      const activeItemId = parseInt(activeIdStr.replace('item-', ''));
      const overItemId = parseInt(overIdStr.replace('item-', ''));

      // Find which module contains the active item
      let sourceModule = null;
      let targetModule = null;
      for (const mod of modules) {
        if ((mod.items || []).find(i => i.id === activeItemId)) sourceModule = mod;
        if ((mod.items || []).find(i => i.id === overItemId)) targetModule = mod;
      }

      if (!sourceModule || !targetModule) return;

      if (sourceModule.id === targetModule.id) {
        // Same module reorder
        const items = [...(sourceModule.items || [])];
        const oldIndex = items.findIndex(i => i.id === activeItemId);
        const newIndex = items.findIndex(i => i.id === overItemId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          setModules(prev => prev.map(m =>
            m.id === sourceModule.id ? { ...m, items: newItems } : m
          ));

          try {
            await api.reorderModuleItems(courseId, sourceModule.id, newItems.map(i => i.id));
          } catch (err) {
            setError(err.message);
            await fetchModules();
          }
        }
      } else {
        // Cross-module move
        const activeItem = (sourceModule.items || []).find(i => i.id === activeItemId);
        if (!activeItem) return;

        const targetItems = [...(targetModule.items || [])];
        const overIndex = targetItems.findIndex(i => i.id === overItemId);
        const newPosition = overIndex + 1;

        // Optimistic update
        setModules(prev => prev.map(m => {
          if (m.id === sourceModule.id) {
            return { ...m, items: (m.items || []).filter(i => i.id !== activeItemId) };
          }
          if (m.id === targetModule.id) {
            const items = [...(m.items || [])];
            items.splice(overIndex, 0, { ...activeItem, module_id: targetModule.id });
            return { ...m, items };
          }
          return m;
        }));

        try {
          await api.moveModuleItem(courseId, sourceModule.id, activeItemId, targetModule.id, newPosition);
          // Re-fetch to get clean state
          await fetchModules();
        } catch (err) {
          setError(err.message);
          await fetchModules();
        }
      }
    }
  };

  const getItemIcon = (type) => {
    const Icon = ITEM_ICONS[type] || Book;
    return <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />;
  };

  const getItemLink = (item) => {
    if (item.type === 'Assignment' && item.content_id) {
      return `/courses/${courseId}/assignments/${item.content_id}`;
    }
    if (item.type === 'Quiz' && item.content_id) {
      return `/courses/${courseId}/quizzes/${item.content_id}/take`;
    }
    if (item.type === 'Page') {
      if (item.page_url) return `/courses/${courseId}/pages/${item.page_url}`;
      if (item.content_id) return `/courses/${courseId}/pages/${item.content_id}`;
    }
    if (item.type === 'Discussion' && item.content_id) {
      return `/courses/${courseId}/discussions/${item.content_id}`;
    }
    if (item.type === 'ExternalUrl' && item.url) {
      return item.url;
    }
    return null;
  };

  // Find the active drag item for the overlay
  const getActiveDragItem = () => {
    if (!activeId) return null;
    const idStr = String(activeId);
    if (idStr.startsWith('module-')) {
      const moduleId = parseInt(idStr.replace('module-', ''));
      return modules.find(m => m.id === moduleId);
    }
    if (idStr.startsWith('item-')) {
      const itemId = parseInt(idStr.replace('item-', ''));
      for (const mod of modules) {
        const item = (mod.items || []).find(i => i.id === itemId);
        if (item) return item;
      }
    }
    return null;
  };

  const renderModuleItem = (module, item, dragHandleProps = {}) => {
    const link = getItemLink(item);
    const isExternal = item.type === 'ExternalUrl';
    const indent = (item.indent || 0) * 1.5;

    const content = (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getItemIcon(item.type)}
        <span className={`text-sm flex-1 truncate ${item.type === 'SubHeader' ? 'font-semibold text-gray-700' : 'text-gray-900'}`}>
          {item.title}
        </span>
        {!item.published && isTeacher && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Unpublished</span>
        )}
      </div>
    );

    return (
      <div
        className="flex items-center py-2 px-4 hover:bg-gray-50 group"
        style={{ paddingLeft: `${1 + indent}rem` }}
      >
        {isTeacher && (
          <button
            className="w-4 h-4 text-gray-300 mr-2 flex-shrink-0 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder item"
            {...dragHandleProps}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        {link ? (
          isExternal ? (
            <a
              href={link}
              target={item.new_tab ? '_blank' : '_self'}
              rel={item.new_tab ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 flex-1 min-w-0 hover:text-blue-600"
            >
              {content}
            </a>
          ) : (
            <Link to={link} className="flex items-center gap-3 flex-1 min-w-0 hover:text-blue-600">
              {content}
            </Link>
          )
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {content}
          </div>
        )}
        {isTeacher && item.type !== 'SubHeader' && (
          <button
            onClick={() => handleToggleItemPublish(module.id, item)}
            className={`p-1 flex-shrink-0 opacity-0 group-hover:opacity-100 ${item.published ? 'text-green-600 hover:text-gray-400' : 'text-gray-400 hover:text-green-600'}`}
            title={item.published ? 'Unpublish item' : 'Publish item'}
          >
            {item.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        )}
        {isTeacher && (
          <button
            onClick={() => handleDeleteItem(module.id, item.id)}
            className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 flex-shrink-0"
            title="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <CourseNav />
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
          Loading modules...
        </div>
      </Layout>
    );
  }

  const activeDragItem = getActiveDragItem();

  return (
    <Layout>
      <CourseNav />
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
          &larr; Back to Course
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-gray-900">Modules</h2>
          {isTeacher && (
            <button
              onClick={() => setShowCreateModule(!showCreateModule)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              {showCreateModule ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showCreateModule ? 'Cancel' : 'Module'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      {/* Create Module Form */}
      {showCreateModule && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <form onSubmit={handleCreateModule} className="flex items-center gap-3">
            <input
              type="text"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              placeholder="Module name..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={creating || !newModuleName.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Add Module'}
            </button>
          </form>
        </div>
      )}

      {/* Module List */}
      {modules.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg mb-1">No modules yet</p>
          {isTeacher && (
            <p className="text-gray-400 text-sm">
              Click "+ Module" above to create your first module.
            </p>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={modules.map(m => `module-${m.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {modules.map((module) => (
                <SortableModule
                  key={module.id}
                  module={module}
                  isTeacher={isTeacher}
                  disabled={!isTeacher || dragType === 'item'}
                >
                  {({ dragHandleProps }) => (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      {/* Module Header */}
                      <div className="flex items-center border-b">
                        {isTeacher && (
                          <button
                            className="pl-3 pr-1 py-3 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
                            aria-label="Drag to reorder module"
                            {...dragHandleProps}
                          >
                            <GripVertical className="w-5 h-5" />
                          </button>
                        )}
                        {editingModuleId === module.id ? (
                          <div className="flex items-center gap-2 flex-1 px-4 py-2">
                            <input
                              type="text"
                              value={editModuleName}
                              onChange={(e) => setEditModuleName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameModule(module.id);
                                if (e.key === 'Escape') { setEditingModuleId(null); setEditModuleName(''); }
                              }}
                              className="flex-1 border border-blue-300 rounded-md px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameModule(module.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingModuleId(null); setEditModuleName(''); }}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="flex items-center gap-3 flex-1 px-4 py-3 text-left hover:bg-gray-50"
                            onClick={() => toggleModule(module.id)}
                            aria-expanded={!!expandedModules[module.id]}
                          >
                            {expandedModules[module.id] ? (
                              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="font-semibold text-gray-900">{module.name}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              {module.items_count || module.items?.length || 0} {(module.items_count || module.items?.length || 0) === 1 ? 'item' : 'items'}
                            </span>
                            {!module.published && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">Unpublished</span>
                            )}
                          </button>
                        )}
                        {isTeacher && editingModuleId !== module.id && (
                          <div className="flex items-center gap-1 px-3">
                            <button
                              onClick={() => startRenameModule(module)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Rename module"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setAddingItemTo(addingItemTo === module.id ? null : module.id);
                                setNewItem({ title: '', type: 'SubHeader', external_url: '', new_tab: false });
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Add item"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleTogglePublish(module)}
                              className={`p-1.5 rounded ${module.published ? 'text-green-600 hover:text-gray-400 hover:bg-gray-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                              title={module.published ? 'Unpublish module' : 'Publish module'}
                              aria-label={module.workflow_state === 'active' ? 'Unpublish module' : 'Publish module'}
                            >
                              {module.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteModule(module.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete module"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Prerequisites Section */}
                      {expandedModules[module.id] && (prerequisites[module.id]?.length > 0 || isTeacher) && (
                        <div className="border-b bg-gray-50 px-4 py-2">
                          {isTeacher ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prerequisites</span>
                                {(prerequisites[module.id] || []).map((prereqId) => (
                                  <span
                                    key={prereqId}
                                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
                                  >
                                    {getModuleName(prereqId)}
                                    <button
                                      onClick={() => handleRemovePrerequisite(module.id, prereqId)}
                                      className="hover:text-blue-900 ml-0.5"
                                      title={`Remove prerequisite: ${getModuleName(prereqId)}`}
                                      disabled={loadingPrereqs[module.id]}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                                {(prerequisites[module.id] || []).length === 0 && (
                                  <span className="text-xs text-gray-400 italic">None</span>
                                )}
                              </div>
                              {/* Dropdown to add a prerequisite */}
                              {modules.filter(m => m.id !== module.id && !(prerequisites[module.id] || []).includes(m.id)).length > 0 && (
                                <select
                                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  value=""
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (val) handleAddPrerequisite(module.id, val);
                                  }}
                                  disabled={loadingPrereqs[module.id]}
                                >
                                  <option value="">+ Add prerequisite...</option>
                                  {modules
                                    .filter(m => m.id !== module.id && !(prerequisites[module.id] || []).includes(m.id))
                                    .map(m => (
                                      <option key={m.id} value={m.id}>{m.name}</option>
                                    ))
                                  }
                                </select>
                              )}
                            </div>
                          ) : (
                            (prerequisites[module.id]?.length > 0) && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>
                                  Requires: {prerequisites[module.id].map(id => getModuleName(id)).join(', ')}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Module Items */}
                      {expandedModules[module.id] && (
                        <div>
                          {(!module.items || module.items.length === 0) ? (
                            <div className="py-4 px-6 text-sm text-gray-400 text-center">
                              No items in this module
                            </div>
                          ) : (
                            <SortableContext
                              items={(module.items || []).map(i => `item-${i.id}`)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="divide-y divide-gray-100">
                                {(module.items || []).map((item) => (
                                  <SortableItem
                                    key={item.id}
                                    item={item}
                                    isTeacher={isTeacher}
                                    disabled={!isTeacher || dragType === 'module'}
                                  >
                                    {({ dragHandleProps }) => renderModuleItem(module, item, dragHandleProps)}
                                  </SortableItem>
                                ))}
                              </div>
                            </SortableContext>
                          )}

                          {/* Add Item Form */}
                          {addingItemTo === module.id && (
                            <div className="border-t bg-gray-50 p-4">
                              <form onSubmit={(e) => handleAddItem(e, module.id)} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <select
                                    value={newItem.type}
                                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {ITEM_TYPE_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={newItem.title}
                                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                    placeholder="Item title..."
                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                </div>
                                {newItem.type === 'ExternalUrl' && (
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="url"
                                      value={newItem.external_url}
                                      onChange={(e) => setNewItem({ ...newItem, external_url: e.target.value })}
                                      placeholder="https://..."
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={newItem.new_tab}
                                        onChange={(e) => setNewItem({ ...newItem, new_tab: e.target.checked })}
                                        className="rounded border-gray-300"
                                      />
                                      New tab
                                    </label>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setAddingItemTo(null)}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={creating || !newItem.title.trim()}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                                  >
                                    {creating ? 'Adding...' : 'Add Item'}
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </SortableModule>
              ))}
            </div>
          </SortableContext>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId && activeDragItem && dragType === 'module' ? (
              <div className="bg-white rounded-lg shadow-lg border-2 border-blue-400 overflow-hidden opacity-90">
                <div className="flex items-center gap-3 px-4 py-3">
                  <GripVertical className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-gray-900">{activeDragItem.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {activeDragItem.items_count || activeDragItem.items?.length || 0} items
                  </span>
                </div>
              </div>
            ) : activeId && activeDragItem && dragType === 'item' ? (
              <div className="bg-white shadow-lg border-2 border-blue-400 rounded px-4 py-2 flex items-center gap-3 opacity-90">
                <GripVertical className="w-4 h-4 text-blue-400" />
                {getItemIcon(activeDragItem.type)}
                <span className="text-sm text-gray-900">{activeDragItem.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </Layout>
  );
};

export default ModulesPage;
