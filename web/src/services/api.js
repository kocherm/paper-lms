const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function parseLinkHeader(header) {
  if (!header) return {};
  const links = {};
  const parts = header.split(',');
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      links[match[2]] = match[1];
    }
  }
  return links;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.errors?.[0]?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const linkHeader = response.headers.get('Link');
  const pagination = parseLinkHeader(linkHeader);

  return { data, pagination };
}

async function requestRaw(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.errors?.[0]?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return response;
}

async function uploadFile(path, formData) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.errors?.[0]?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return response.json();
}

export const api = {
  // Auth
  login: async (email, password) => {
    const { data } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return data;
  },

  register: async (name, email, password) => {
    const { data } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return data;
  },

  // Users
  getSelf: async () => {
    const { data } = await request('/users/self');
    return data;
  },

  getUser: async (id) => {
    const { data } = await request(`/users/${id}`);
    return data;
  },

  // Courses
  getCourses: async (page = 1, perPage = 10) => {
    return request(`/courses?page=${page}&per_page=${perPage}`);
  },

  getCourse: async (id) => {
    const { data } = await request(`/courses/${id}`);
    return data;
  },

  createCourse: async (course) => {
    const { data } = await request('/courses', {
      method: 'POST',
      body: JSON.stringify({ course }),
    });
    return data;
  },

  updateCourse: async (id, course) => {
    const { data } = await request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ course }),
    });
    return data;
  },

  deleteCourse: async (id) => {
    const { data } = await request(`/courses/${id}`, { method: 'DELETE' });
    return data;
  },

  // Sections
  getSections: async (courseId, page = 1, perPage = 10) => {
    return request(`/courses/${courseId}/sections?page=${page}&per_page=${perPage}`);
  },

  createSection: async (courseId, courseSection) => {
    const { data } = await request(`/courses/${courseId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ course_section: courseSection }),
    });
    return data;
  },

  // Enrollments
  getEnrollments: async (courseId, page = 1, perPage = 10) => {
    return request(`/courses/${courseId}/enrollments?page=${page}&per_page=${perPage}`);
  },

  createEnrollment: async (courseId, enrollment) => {
    const { data } = await request(`/courses/${courseId}/enrollments`, {
      method: 'POST',
      body: JSON.stringify({ enrollment }),
    });
    return data;
  },

  // Modules
  getModules: async (courseId, page = 1, perPage = 10, includeItems = true) => {
    const include = includeItems ? '&include[]=items' : '';
    return request(`/courses/${courseId}/modules?page=${page}&per_page=${perPage}${include}`);
  },

  getModule: async (courseId, moduleId) => {
    const { data } = await request(`/courses/${courseId}/modules/${moduleId}`);
    return data;
  },

  createModule: async (courseId, module) => {
    const { data } = await request(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify({ module }),
    });
    return data;
  },

  updateModule: async (courseId, moduleId, module) => {
    const { data } = await request(`/courses/${courseId}/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify({ module }),
    });
    return data;
  },

  deleteModule: async (courseId, moduleId) => {
    const { data } = await request(`/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });
    return data;
  },

  // Module Items
  getModuleItems: async (courseId, moduleId, page = 1, perPage = 10) => {
    return request(`/courses/${courseId}/modules/${moduleId}/items?page=${page}&per_page=${perPage}`);
  },

  createModuleItem: async (courseId, moduleId, moduleItem) => {
    const { data } = await request(`/courses/${courseId}/modules/${moduleId}/items`, {
      method: 'POST',
      body: JSON.stringify({ module_item: moduleItem }),
    });
    return data;
  },

  // Pages
  getPages: async (courseId, page = 1, perPage = 10) => {
    return request(`/courses/${courseId}/pages?page=${page}&per_page=${perPage}`);
  },

  getPage: async (courseId, urlOrId) => {
    const { data } = await request(`/courses/${courseId}/pages/${urlOrId}`);
    return data;
  },

  createPage: async (courseId, wikiPage) => {
    const { data } = await request(`/courses/${courseId}/pages`, {
      method: 'POST',
      body: JSON.stringify({ wiki_page: wikiPage }),
    });
    return data;
  },

  updatePage: async (courseId, urlOrId, wikiPage) => {
    const { data } = await request(`/courses/${courseId}/pages/${urlOrId}`, {
      method: 'PUT',
      body: JSON.stringify({ wiki_page: wikiPage }),
    });
    return data;
  },

  deletePage: async (courseId, urlOrId) => {
    const { data } = await request(`/courses/${courseId}/pages/${urlOrId}`, { method: 'DELETE' });
    return data;
  },

  // Assignments
  getAssignments: async (courseId, page = 1, perPage = 10) => {
    return request(`/courses/${courseId}/assignments?page=${page}&per_page=${perPage}`);
  },

  getAssignment: async (courseId, assignmentId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}`);
    return data;
  },

  createAssignment: async (courseId, assignment) => {
    const { data } = await request(`/courses/${courseId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({ assignment }),
    });
    return data;
  },

  updateAssignment: async (courseId, assignmentId, assignment) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ assignment }),
    });
    return data;
  },

  deleteAssignment: async (courseId, assignmentId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}`, { method: 'DELETE' });
    return data;
  },

  // Assignment Groups
  getAssignmentGroups: async (courseId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/assignment_groups?page=${page}&per_page=${perPage}`);
  },
  createAssignmentGroup: async (courseId, assignmentGroup) => {
    const { data } = await request(`/courses/${courseId}/assignment_groups`, {
      method: 'POST', body: JSON.stringify({ assignment_group: assignmentGroup }),
    });
    return data;
  },

  // Submissions
  getSubmissions: async (courseId, assignmentId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/assignments/${assignmentId}/submissions?page=${page}&per_page=${perPage}`);
  },
  getSubmission: async (courseId, assignmentId, userId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`);
    return data;
  },
  createSubmission: async (courseId, assignmentId, submission) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/submissions`, {
      method: 'POST', body: JSON.stringify({ submission }),
    });
    return data;
  },
  gradeSubmission: async (courseId, assignmentId, userId, submission) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`, {
      method: 'PUT', body: JSON.stringify({ submission }),
    });
    return data;
  },

  // Submission Comments
  getSubmissionComments: async (courseId, assignmentId, userId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/comments`);
    return data;
  },
  createSubmissionComment: async (courseId, assignmentId, userId, comment) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/comments`, {
      method: 'POST', body: JSON.stringify({ comment }),
    });
    return data;
  },

  // Gradebook
  getGradebook: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/gradebook`);
    return data;
  },
  getStudentGrade: async (courseId, studentId) => {
    const { data } = await request(`/courses/${courseId}/students/${studentId}/grade`);
    return data;
  },

  // Developer Keys
  getDeveloperKeys: async (accountId = 1, page = 1, perPage = 10) => {
    return request(`/accounts/${accountId}/developer_keys?page=${page}&per_page=${perPage}`);
  },
  createDeveloperKey: async (accountId = 1, developerKey) => {
    const { data } = await request(`/accounts/${accountId}/developer_keys`, {
      method: 'POST', body: JSON.stringify({ developer_key: developerKey }),
    });
    return data;
  },
  updateDeveloperKey: async (accountId, keyId, developerKey) => {
    const { data } = await request(`/accounts/${accountId}/developer_keys/${keyId}`, {
      method: 'PUT', body: JSON.stringify({ developer_key: developerKey }),
    });
    return data;
  },
  deleteDeveloperKey: async (accountId, keyId) => {
    const { data } = await request(`/accounts/${accountId}/developer_keys/${keyId}`, { method: 'DELETE' });
    return data;
  },

  // Personal Access Tokens
  getAccessTokens: async (userId, page = 1, perPage = 10) => {
    return request(`/users/${userId}/tokens?page=${page}&per_page=${perPage}`);
  },
  createAccessToken: async (userId, token) => {
    const { data } = await request(`/users/${userId}/tokens`, {
      method: 'POST', body: JSON.stringify({ token }),
    });
    return data;
  },
  deleteAccessToken: async (userId, tokenId) => {
    const { data } = await request(`/users/${userId}/tokens/${tokenId}`, { method: 'DELETE' });
    return data;
  },

  // External Tools
  getExternalTools: async (courseId, page = 1, perPage = 10) => {
    return request(`/courses/${courseId}/external_tools?page=${page}&per_page=${perPage}`);
  },
  createExternalTool: async (courseId, externalTool) => {
    const { data } = await request(`/courses/${courseId}/external_tools`, {
      method: 'POST', body: JSON.stringify({ external_tool: externalTool }),
    });
    return data;
  },
  updateExternalTool: async (courseId, toolId, externalTool) => {
    const { data } = await request(`/courses/${courseId}/external_tools/${toolId}`, {
      method: 'PUT', body: JSON.stringify({ external_tool: externalTool }),
    });
    return data;
  },
  deleteExternalTool: async (courseId, toolId) => {
    const { data } = await request(`/courses/${courseId}/external_tools/${toolId}`, { method: 'DELETE' });
    return data;
  },

  // Discussion Topics
  getDiscussionTopics: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/discussion_topics?page=${page}&per_page=${perPage}`);
  },
  getDiscussionTopic: async (courseId, topicId) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}`);
    return data;
  },
  createDiscussionTopic: async (courseId, topic) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics`, {
      method: 'POST', body: JSON.stringify({ discussion_topic: topic }),
    });
    return data;
  },
  updateDiscussionTopic: async (courseId, topicId, topic) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}`, {
      method: 'PUT', body: JSON.stringify({ discussion_topic: topic }),
    });
    return data;
  },
  deleteDiscussionTopic: async (courseId, topicId) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}`, { method: 'DELETE' });
    return data;
  },
  getDiscussionTopicView: async (courseId, topicId) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/view`);
    return data;
  },

  // Discussion Entries
  getDiscussionEntries: async (courseId, topicId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/discussion_topics/${topicId}/entries?page=${page}&per_page=${perPage}`);
  },
  createDiscussionEntry: async (courseId, topicId, message) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/entries`, {
      method: 'POST', body: JSON.stringify({ message }),
    });
    return data;
  },
  updateDiscussionEntry: async (courseId, topicId, entryId, message) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}`, {
      method: 'PUT', body: JSON.stringify({ message }),
    });
    return data;
  },
  deleteDiscussionEntry: async (courseId, topicId, entryId) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}`, { method: 'DELETE' });
    return data;
  },
  getDiscussionEntryReplies: async (courseId, topicId, entryId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}/replies?page=${page}&per_page=${perPage}`);
  },
  createDiscussionReply: async (courseId, topicId, entryId, message) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}/replies`, {
      method: 'POST', body: JSON.stringify({ message }),
    });
    return data;
  },
  rateDiscussionEntry: async (courseId, topicId, entryId, rating) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}/rating`, {
      method: 'POST', body: JSON.stringify({ rating }),
    });
    return data;
  },

  // Files
  getCourseFiles: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/files?page=${page}&per_page=${perPage}`);
  },
  uploadCourseFile: async (courseId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadFile(`/courses/${courseId}/files`, formData);
  },
  getFile: async (courseId, fileId) => {
    const { data } = await request(`/courses/${courseId}/files/${fileId}`);
    return data;
  },
  deleteFile: async (courseId, fileId) => {
    const { data } = await request(`/courses/${courseId}/files/${fileId}`, { method: 'DELETE' });
    return data;
  },
  getFileDownloadUrl: (fileId) => `${API_URL}/files/${fileId}/download`,
  getFolderFiles: async (folderId, page = 1, perPage = 20) => {
    return request(`/folders/${folderId}/files?page=${page}&per_page=${perPage}`);
  },

  // Folders
  getCourseFolders: async (courseId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/folders?page=${page}&per_page=${perPage}`);
  },
  createCourseFolder: async (courseId, folder) => {
    const { data } = await request(`/courses/${courseId}/folders`, {
      method: 'POST', body: JSON.stringify(folder),
    });
    return data;
  },
  getFolder: async (folderId) => {
    const { data } = await request(`/folders/${folderId}`);
    return data;
  },
  updateFolder: async (folderId, folder) => {
    const { data } = await request(`/folders/${folderId}`, {
      method: 'PUT', body: JSON.stringify(folder),
    });
    return data;
  },
  deleteFolder: async (folderId) => {
    const { data } = await request(`/folders/${folderId}`, { method: 'DELETE' });
    return data;
  },
  getSubfolders: async (folderId, page = 1, perPage = 50) => {
    return request(`/folders/${folderId}/folders?page=${page}&per_page=${perPage}`);
  },

  // SIS Imports
  createSISImport: async (accountId, importType, file) => {
    const formData = new FormData();
    formData.append('import_type', importType);
    formData.append('attachment', file);
    return uploadFile(`/accounts/${accountId}/sis_imports`, formData);
  },
  getSISImports: async (accountId = 1, page = 1, perPage = 20) => {
    return request(`/accounts/${accountId}/sis_imports?page=${page}&per_page=${perPage}`);
  },
  getSISImport: async (accountId, importId) => {
    const { data } = await request(`/accounts/${accountId}/sis_imports/${importId}`);
    return data;
  },
  getSISImportErrors: async (accountId, importId) => {
    const { data } = await request(`/accounts/${accountId}/sis_imports/${importId}/errors`);
    return data;
  },
  getSISExportUrl: (accountId, type) => `${API_URL}/accounts/${accountId}/sis_exports/${type}.csv`,

  // Quizzes
  getQuizzes: async (courseId, page = 1, perPage = 10) => {
    return request(`/courses/${courseId}/quizzes?page=${page}&per_page=${perPage}`);
  },
  getQuiz: async (courseId, quizId) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}`);
    return data;
  },
  createQuiz: async (courseId, quiz) => {
    const { data } = await request(`/courses/${courseId}/quizzes`, {
      method: 'POST', body: JSON.stringify({ quiz }),
    });
    return data;
  },
  updateQuiz: async (courseId, quizId, quiz) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}`, {
      method: 'PUT', body: JSON.stringify({ quiz }),
    });
    return data;
  },
  deleteQuiz: async (courseId, quizId) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}`, { method: 'DELETE' });
    return data;
  },

  // Quiz Questions
  getQuizQuestions: async (courseId, quizId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/quizzes/${quizId}/questions?page=${page}&per_page=${perPage}`);
  },
  getQuizQuestion: async (courseId, quizId, questionId) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`);
    return data;
  },
  createQuizQuestion: async (courseId, quizId, question) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}/questions`, {
      method: 'POST', body: JSON.stringify({ question }),
    });
    return data;
  },
  updateQuizQuestion: async (courseId, quizId, questionId, question) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT', body: JSON.stringify({ question }),
    });
    return data;
  },
  deleteQuizQuestion: async (courseId, quizId, questionId) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`, { method: 'DELETE' });
    return data;
  },

  // Quiz Submissions
  startQuizSubmission: async (courseId, quizId) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}/submissions`, { method: 'POST' });
    return data;
  },
  getQuizSubmission: async (courseId, quizId, submissionId) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}/submissions/${submissionId}`);
    return data;
  },
  answerQuizQuestion: async (courseId, quizId, submissionId, questionId, answer) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}/submissions/${submissionId}/questions/${questionId}`, {
      method: 'PUT', body: JSON.stringify({ answer }),
    });
    return data;
  },
  completeQuizSubmission: async (courseId, quizId, submissionId) => {
    const { data } = await request(`/courses/${courseId}/quizzes/${quizId}/submissions/${submissionId}/complete`, { method: 'POST' });
    return data;
  },
  getQuizSubmissions: async (courseId, quizId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/quizzes/${quizId}/submissions?page=${page}&per_page=${perPage}`);
  },

  // Rubrics
  getCourseRubrics: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/rubrics?page=${page}&per_page=${perPage}`);
  },
  getCourseRubric: async (courseId, rubricId) => {
    const { data } = await request(`/courses/${courseId}/rubrics/${rubricId}`);
    return data;
  },
  createCourseRubric: async (courseId, rubric) => {
    const { data } = await request(`/courses/${courseId}/rubrics`, {
      method: 'POST', body: JSON.stringify({ rubric }),
    });
    return data;
  },
  updateCourseRubric: async (courseId, rubricId, rubric) => {
    const { data } = await request(`/courses/${courseId}/rubrics/${rubricId}`, {
      method: 'PUT', body: JSON.stringify({ rubric }),
    });
    return data;
  },
  deleteCourseRubric: async (courseId, rubricId) => {
    const { data } = await request(`/courses/${courseId}/rubrics/${rubricId}`, { method: 'DELETE' });
    return data;
  },
  createRubricAssociation: async (courseId, rubricId, association) => {
    const { data } = await request(`/courses/${courseId}/rubrics/${rubricId}/associations`, {
      method: 'POST', body: JSON.stringify({ rubric_association: association }),
    });
    return data;
  },

  // Rubric Assessments
  getRubricAssessments: async (courseId, associationId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/rubric_associations/${associationId}/rubric_assessments?page=${page}&per_page=${perPage}`);
  },
  getRubricAssessment: async (courseId, associationId, assessmentId) => {
    const { data } = await request(`/courses/${courseId}/rubric_associations/${associationId}/rubric_assessments/${assessmentId}`);
    return data;
  },
  createRubricAssessment: async (courseId, associationId, assessment) => {
    const { data } = await request(`/courses/${courseId}/rubric_associations/${associationId}/rubric_assessments`, {
      method: 'POST', body: JSON.stringify({ rubric_assessment: assessment }),
    });
    return data;
  },
  updateRubricAssessment: async (courseId, associationId, assessmentId, assessment) => {
    const { data } = await request(`/courses/${courseId}/rubric_associations/${associationId}/rubric_assessments/${assessmentId}`, {
      method: 'PUT', body: JSON.stringify({ rubric_assessment: assessment }),
    });
    return data;
  },

  // Grading Period Groups
  getGradingPeriodGroups: async (accountId = 1, page = 1, perPage = 20) => {
    return request(`/accounts/${accountId}/grading_period_groups?page=${page}&per_page=${perPage}`);
  },
  getGradingPeriodGroup: async (accountId, groupId) => {
    const { data } = await request(`/accounts/${accountId}/grading_period_groups/${groupId}`);
    return data;
  },
  createGradingPeriodGroup: async (accountId, group) => {
    const { data } = await request(`/accounts/${accountId}/grading_period_groups`, {
      method: 'POST', body: JSON.stringify({ grading_period_group: group }),
    });
    return data;
  },
  updateGradingPeriodGroup: async (accountId, groupId, group) => {
    const { data } = await request(`/accounts/${accountId}/grading_period_groups/${groupId}`, {
      method: 'PUT', body: JSON.stringify({ grading_period_group: group }),
    });
    return data;
  },
  deleteGradingPeriodGroup: async (accountId, groupId) => {
    const { data } = await request(`/accounts/${accountId}/grading_period_groups/${groupId}`, { method: 'DELETE' });
    return data;
  },

  // Grading Periods
  getGradingPeriods: async (accountId, groupId) => {
    const { data } = await request(`/accounts/${accountId}/grading_period_groups/${groupId}/grading_periods`);
    return data;
  },
  getGradingPeriod: async (accountId, groupId, periodId) => {
    const { data } = await request(`/accounts/${accountId}/grading_period_groups/${groupId}/grading_periods/${periodId}`);
    return data;
  },
  createGradingPeriod: async (accountId, groupId, period) => {
    const { data } = await request(`/accounts/${accountId}/grading_period_groups/${groupId}/grading_periods`, {
      method: 'POST', body: JSON.stringify({ grading_period: period }),
    });
    return data;
  },
  updateGradingPeriod: async (accountId, groupId, periodId, period) => {
    const { data } = await request(`/accounts/${accountId}/grading_period_groups/${groupId}/grading_periods/${periodId}`, {
      method: 'PUT', body: JSON.stringify({ grading_period: period }),
    });
    return data;
  },
  deleteGradingPeriod: async (accountId, groupId, periodId) => {
    const { data } = await request(`/accounts/${accountId}/grading_period_groups/${groupId}/grading_periods/${periodId}`, { method: 'DELETE' });
    return data;
  },

  // Assignment Overrides
  getAssignmentOverrides: async (courseId, assignmentId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/overrides`);
    return data;
  },
  getAssignmentOverride: async (courseId, assignmentId, overrideId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/overrides/${overrideId}`);
    return data;
  },
  createAssignmentOverride: async (courseId, assignmentId, override) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/overrides`, {
      method: 'POST', body: JSON.stringify({ assignment_override: override }),
    });
    return data;
  },
  updateAssignmentOverride: async (courseId, assignmentId, overrideId, override) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/overrides/${overrideId}`, {
      method: 'PUT', body: JSON.stringify({ assignment_override: override }),
    });
    return data;
  },
  deleteAssignmentOverride: async (courseId, assignmentId, overrideId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/overrides/${overrideId}`, { method: 'DELETE' });
    return data;
  },

  // Late Policy
  getLatePolicy: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/late_policy`);
    return data;
  },
  createLatePolicy: async (courseId, policy) => {
    const { data } = await request(`/courses/${courseId}/late_policy`, {
      method: 'POST', body: JSON.stringify({ late_policy: policy }),
    });
    return data;
  },
  updateLatePolicy: async (courseId, policy) => {
    const { data } = await request(`/courses/${courseId}/late_policy`, {
      method: 'PUT', body: JSON.stringify({ late_policy: policy }),
    });
    return data;
  },
  deleteLatePolicy: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/late_policy`, { method: 'DELETE' });
    return data;
  },

  // Calendar Events
  getCalendarEvents: async (page = 1, perPage = 20) => {
    return request(`/calendar_events?page=${page}&per_page=${perPage}`);
  },
  getCourseCalendarEvents: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/calendar_events?page=${page}&per_page=${perPage}`);
  },
  getCalendarEvent: async (id) => {
    const { data } = await request(`/calendar_events/${id}`);
    return data;
  },
  createCalendarEvent: async (event) => {
    const { data } = await request('/calendar_events', {
      method: 'POST', body: JSON.stringify({ calendar_event: event }),
    });
    return data;
  },
  updateCalendarEvent: async (id, event) => {
    const { data } = await request(`/calendar_events/${id}`, {
      method: 'PUT', body: JSON.stringify({ calendar_event: event }),
    });
    return data;
  },
  deleteCalendarEvent: async (id) => {
    const { data } = await request(`/calendar_events/${id}`, { method: 'DELETE' });
    return data;
  },
  getCalendarICalUrl: () => `${API_URL}/calendar_events.ics`,

  // Conversations
  getConversations: async (page = 1, perPage = 20) => {
    return request(`/conversations?page=${page}&per_page=${perPage}`);
  },
  getConversation: async (id) => {
    const { data } = await request(`/conversations/${id}`);
    return data;
  },
  createConversation: async (conversation) => {
    const { data } = await request('/conversations', {
      method: 'POST', body: JSON.stringify({ conversation }),
    });
    return data;
  },
  updateConversation: async (id, conversation) => {
    const { data } = await request(`/conversations/${id}`, {
      method: 'PUT', body: JSON.stringify({ conversation }),
    });
    return data;
  },
  getConversationMessages: async (conversationId, page = 1, perPage = 50) => {
    return request(`/conversations/${conversationId}/messages?page=${page}&per_page=${perPage}`);
  },
  createConversationMessage: async (conversationId, message) => {
    const { data } = await request(`/conversations/${conversationId}/messages`, {
      method: 'POST', body: JSON.stringify({ message }),
    });
    return data;
  },
  markConversationAsRead: async (conversationId) => {
    const { data } = await request(`/conversations/${conversationId}/mark_as_read`, {
      method: 'PUT', body: JSON.stringify({}),
    });
    return data;
  },

  // Notifications
  getNotifications: async (page = 1, perPage = 20, unread = false) => {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (unread) params.append('unread', 'true');
    return request(`/notifications?${params.toString()}`);
  },
  markNotificationAsRead: async (id) => {
    const { data } = await request(`/notifications/${id}/mark_as_read`, {
      method: 'PUT', body: JSON.stringify({}),
    });
    return data;
  },
  markAllNotificationsAsRead: async () => {
    const { data } = await request('/notifications/mark_all_as_read', {
      method: 'PUT', body: JSON.stringify({}),
    });
    return data;
  },
  getNotificationPreferences: async () => {
    const { data } = await request('/users/self/notification_preferences');
    return data;
  },
  updateNotificationPreferences: async (prefs) => {
    const { data } = await request('/users/self/notification_preferences', {
      method: 'PUT', body: JSON.stringify({ notification_preference: prefs }),
    });
    return data;
  },

  // Content Migrations
  getContentMigrations: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/content_migrations?page=${page}&per_page=${perPage}`);
  },
  getContentMigration: async (courseId, migrationId) => {
    const { data } = await request(`/courses/${courseId}/content_migrations/${migrationId}`);
    return data;
  },
  createContentMigration: async (courseId, migration) => {
    const { data } = await request(`/courses/${courseId}/content_migrations`, {
      method: 'POST', body: JSON.stringify({ content_migration: migration }),
    });
    return data;
  },
  updateContentMigration: async (courseId, migrationId, migration) => {
    const { data } = await request(`/courses/${courseId}/content_migrations/${migrationId}`, {
      method: 'PUT', body: JSON.stringify({ content_migration: migration }),
    });
    return data;
  },
  uploadContentMigration: async (courseId, migrationType, file) => {
    const formData = new FormData();
    formData.append('migration_type', migrationType);
    formData.append('attachment', file);
    return uploadFile(`/courses/${courseId}/content_migrations`, formData);
  },

  // Learning Outcome Groups
  getCourseOutcomeGroups: async (courseId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/outcome_groups?page=${page}&per_page=${perPage}`);
  },
  getCourseOutcomeGroup: async (courseId, groupId) => {
    const { data } = await request(`/courses/${courseId}/outcome_groups/${groupId}`);
    return data;
  },
  createCourseOutcomeGroup: async (courseId, group) => {
    const { data } = await request(`/courses/${courseId}/outcome_groups`, {
      method: 'POST', body: JSON.stringify(group),
    });
    return data;
  },
  updateCourseOutcomeGroup: async (courseId, groupId, group) => {
    const { data } = await request(`/courses/${courseId}/outcome_groups/${groupId}`, {
      method: 'PUT', body: JSON.stringify(group),
    });
    return data;
  },
  deleteCourseOutcomeGroup: async (courseId, groupId) => {
    const { data } = await request(`/courses/${courseId}/outcome_groups/${groupId}`, { method: 'DELETE' });
    return data;
  },

  // Learning Outcomes
  getOutcomeGroupOutcomes: async (courseId, groupId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/outcome_groups/${groupId}/outcomes?page=${page}&per_page=${perPage}`);
  },
  createOutcome: async (courseId, groupId, outcome) => {
    const { data } = await request(`/courses/${courseId}/outcome_groups/${groupId}/outcomes`, {
      method: 'POST', body: JSON.stringify(outcome),
    });
    return data;
  },
  getOutcome: async (courseId, outcomeId) => {
    const { data } = await request(`/courses/${courseId}/outcomes/${outcomeId}`);
    return data;
  },
  updateOutcome: async (courseId, outcomeId, outcome) => {
    const { data } = await request(`/courses/${courseId}/outcomes/${outcomeId}`, {
      method: 'PUT', body: JSON.stringify(outcome),
    });
    return data;
  },
  deleteOutcome: async (courseId, outcomeId) => {
    const { data } = await request(`/courses/${courseId}/outcomes/${outcomeId}`, { method: 'DELETE' });
    return data;
  },

  // Learning Outcome Results
  getOutcomeResults: async (courseId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/outcome_results?page=${page}&per_page=${perPage}`);
  },
  createOutcomeResult: async (courseId, result) => {
    const { data } = await request(`/courses/${courseId}/outcome_results`, {
      method: 'POST', body: JSON.stringify(result),
    });
    return data;
  },
  getOutcomeRollups: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/outcome_rollups`);
    return data;
  },

  // SpeedGrader
  getSpeedGraderData: async (courseId, assignmentId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/speedgrader`);
    return data;
  },
  getSpeedGraderStudentSubmission: async (courseId, assignmentId, userId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/speedgrader/submissions/${userId}`);
    return data;
  },

  // Phase 8: Groups
  getGroupCategories: async (courseId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/group_categories?page=${page}&per_page=${perPage}`);
  },
  createGroupCategory: async (courseId, category) => {
    const { data } = await request(`/courses/${courseId}/group_categories`, {
      method: 'POST', body: JSON.stringify({ group_category: category }),
    });
    return data;
  },
  getGroupCategory: async (categoryId) => {
    const { data } = await request(`/group_categories/${categoryId}`);
    return data;
  },
  updateGroupCategory: async (categoryId, category) => {
    const { data } = await request(`/group_categories/${categoryId}`, {
      method: 'PUT', body: JSON.stringify({ group_category: category }),
    });
    return data;
  },
  deleteGroupCategory: async (categoryId) => {
    const { data } = await request(`/group_categories/${categoryId}`, { method: 'DELETE' });
    return data;
  },
  getGroupsByCategory: async (categoryId, page = 1, perPage = 50) => {
    return request(`/group_categories/${categoryId}/groups?page=${page}&per_page=${perPage}`);
  },
  createGroup: async (categoryId, group) => {
    const { data } = await request(`/group_categories/${categoryId}/groups`, {
      method: 'POST', body: JSON.stringify({ group }),
    });
    return data;
  },
  getGroup: async (groupId) => {
    const { data } = await request(`/groups/${groupId}`);
    return data;
  },
  updateGroup: async (groupId, group) => {
    const { data } = await request(`/groups/${groupId}`, {
      method: 'PUT', body: JSON.stringify({ group }),
    });
    return data;
  },
  deleteGroup: async (groupId) => {
    const { data } = await request(`/groups/${groupId}`, { method: 'DELETE' });
    return data;
  },
  getGroupMemberships: async (groupId, page = 1, perPage = 50) => {
    return request(`/groups/${groupId}/memberships?page=${page}&per_page=${perPage}`);
  },
  createGroupMembership: async (groupId, membership) => {
    const { data } = await request(`/groups/${groupId}/memberships`, {
      method: 'POST', body: JSON.stringify({ membership }),
    });
    return data;
  },
  updateGroupMembership: async (groupId, membershipId, membership) => {
    const { data } = await request(`/groups/${groupId}/memberships/${membershipId}`, {
      method: 'PUT', body: JSON.stringify({ membership }),
    });
    return data;
  },
  deleteGroupMembership: async (groupId, membershipId) => {
    const { data } = await request(`/groups/${groupId}/memberships/${membershipId}`, { method: 'DELETE' });
    return data;
  },
  getUserGroups: async (page = 1, perPage = 50) => {
    return request(`/users/self/groups?page=${page}&per_page=${perPage}`);
  },

  // Phase 8: Blueprint Courses
  getBlueprintTemplates: async (courseId, page = 1, perPage = 10) => {
    return request(`/courses/${courseId}/blueprint_templates?page=${page}&per_page=${perPage}`);
  },
  createBlueprintTemplate: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/blueprint_templates`, { method: 'POST' });
    return data;
  },
  getDefaultBlueprintTemplate: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/blueprint_templates/default`);
    return data;
  },
  updateDefaultBlueprintTemplate: async (courseId, template) => {
    const { data } = await request(`/courses/${courseId}/blueprint_templates/default`, {
      method: 'PUT', body: JSON.stringify({ blueprint_template: template }),
    });
    return data;
  },
  getBlueprintAssociatedCourses: async (courseId, page = 1, perPage = 50) => {
    return request(`/courses/${courseId}/blueprint_templates/default/associated_courses?page=${page}&per_page=${perPage}`);
  },
  updateBlueprintAssociations: async (courseId, courseIdsToAdd, courseIdsToRemove) => {
    const { data } = await request(`/courses/${courseId}/blueprint_templates/default/associated_courses`, {
      method: 'PUT', body: JSON.stringify({ course_ids_to_add: courseIdsToAdd, course_ids_to_remove: courseIdsToRemove }),
    });
    return data;
  },
  getBlueprintMigrations: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/blueprint_templates/default/migrations?page=${page}&per_page=${perPage}`);
  },
  createBlueprintMigration: async (courseId, comment) => {
    const { data } = await request(`/courses/${courseId}/blueprint_templates/default/migrations`, {
      method: 'POST', body: JSON.stringify({ comment }),
    });
    return data;
  },
  getBlueprintMigration: async (courseId, migrationId) => {
    const { data } = await request(`/courses/${courseId}/blueprint_templates/default/migrations/${migrationId}`);
    return data;
  },
  getBlueprintUnsyncedChanges: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/blueprint_templates/default/unsynced_changes`);
    return data;
  },
  getBlueprintSubscriptions: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/blueprint_subscriptions?page=${page}&per_page=${perPage}`);
  },

  // Phase 8: Course Pacing
  getCoursePaces: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/course_pacing?page=${page}&per_page=${perPage}`);
  },
  createCoursePace: async (courseId, pace) => {
    const { data } = await request(`/courses/${courseId}/course_pacing`, {
      method: 'POST', body: JSON.stringify({ course_pace: pace }),
    });
    return data;
  },
  getCoursePace: async (courseId, paceId) => {
    const { data } = await request(`/courses/${courseId}/course_pacing/${paceId}`);
    return data;
  },
  updateCoursePace: async (courseId, paceId, pace) => {
    const { data } = await request(`/courses/${courseId}/course_pacing/${paceId}`, {
      method: 'PUT', body: JSON.stringify({ course_pace: pace }),
    });
    return data;
  },
  deleteCoursePace: async (courseId, paceId) => {
    const { data } = await request(`/courses/${courseId}/course_pacing/${paceId}`, { method: 'DELETE' });
    return data;
  },
  publishCoursePace: async (courseId, paceId) => {
    const { data } = await request(`/courses/${courseId}/course_pacing/${paceId}/publish`, { method: 'POST' });
    return data;
  },
  getCoursePaceModuleItems: async (courseId, paceId) => {
    const { data } = await request(`/courses/${courseId}/course_pacing/${paceId}/module_items`);
    return data;
  },
  updateCoursePaceModuleItems: async (courseId, paceId, items) => {
    const { data } = await request(`/courses/${courseId}/course_pacing/${paceId}/module_items`, {
      method: 'PUT', body: JSON.stringify({ module_items: items }),
    });
    return data;
  },
  getCoursePaceTimeline: async (courseId, paceId) => {
    return request(`/courses/${courseId}/course_pacing/${paceId}/module_items`);
  },

  // Phase 8B: Collaborations
  getCollaborations: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/collaborations?page=${page}&per_page=${perPage}`);
  },
  createCollaboration: async (courseId, collaboration) => {
    const { data } = await request(`/courses/${courseId}/collaborations`, {
      method: 'POST', body: JSON.stringify({ collaboration }),
    });
    return data;
  },
  getCollaboration: async (id) => {
    const { data } = await request(`/collaborations/${id}`);
    return data;
  },
  updateCollaboration: async (id, collaboration) => {
    const { data } = await request(`/collaborations/${id}`, {
      method: 'PUT', body: JSON.stringify({ collaboration }),
    });
    return data;
  },
  deleteCollaboration: async (id) => {
    const { data } = await request(`/collaborations/${id}`, { method: 'DELETE' });
    return data;
  },

  // Phase 8B: Conferences
  getConferences: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/conferences?page=${page}&per_page=${perPage}`);
  },
  createConference: async (courseId, conference) => {
    const { data } = await request(`/courses/${courseId}/conferences`, {
      method: 'POST', body: JSON.stringify({ conference }),
    });
    return data;
  },
  getConference: async (id) => {
    const { data } = await request(`/conferences/${id}`);
    return data;
  },
  updateConference: async (id, conference) => {
    const { data } = await request(`/conferences/${id}`, {
      method: 'PUT', body: JSON.stringify({ conference }),
    });
    return data;
  },
  deleteConference: async (id) => {
    const { data } = await request(`/conferences/${id}`, { method: 'DELETE' });
    return data;
  },
  joinConference: async (id) => {
    const { data } = await request(`/conferences/${id}/join`, { method: 'POST' });
    return data;
  },
  endConference: async (id) => {
    const { data } = await request(`/conferences/${id}/end`, { method: 'POST' });
    return data;
  },
  getConferenceRecordings: async (id) => {
    const { data } = await request(`/conferences/${id}/recordings`);
    return data;
  },
  getConferenceParticipants: async (id) => {
    const { data } = await request(`/conferences/${id}/participants`);
    return data;
  },

  // Phase 8B: Analytics
  getCourseAnalyticsActivity: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/analytics/activity`);
    return data;
  },
  getCourseAnalyticsAssignments: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/analytics/assignments`);
    return data;
  },
  getCourseAnalyticsStudentSummaries: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/analytics/student_summaries`);
    return data;
  },
  getStudentAnalyticsActivity: async (courseId, userId) => {
    const { data } = await request(`/courses/${courseId}/analytics/users/${userId}/activity`);
    return data;
  },
  getStudentAnalyticsAssignments: async (courseId, userId) => {
    const { data } = await request(`/courses/${courseId}/analytics/users/${userId}/assignments`);
    return data;
  },
  getDepartmentAnalyticsActivity: async (accountId = 1) => {
    const { data } = await request(`/accounts/${accountId}/analytics/current/activity`);
    return data;
  },
  getDepartmentAnalyticsGrades: async (accountId = 1) => {
    const { data } = await request(`/accounts/${accountId}/analytics/current/grades`);
    return data;
  },
  getDepartmentAnalyticsStatistics: async (accountId = 1) => {
    const { data } = await request(`/accounts/${accountId}/analytics/current/statistics`);
    return data;
  },
  createPageView: async (pageView) => {
    const { data } = await request('/page_views', {
      method: 'POST', body: JSON.stringify({ page_view: pageView }),
    });
    return data;
  },
  getUserPageViews: async (page = 1, perPage = 50) => {
    return request(`/users/self/page_views?page=${page}&per_page=${perPage}`);
  },

  // Phase 8B: Observer/Parent Role
  linkObservee: async (userId, observeeId) => {
    const { data } = await request(`/users/${userId}/observees`, {
      method: 'POST', body: JSON.stringify({ observee_id: observeeId }),
    });
    return data;
  },
  unlinkObservee: async (userId, observeeId) => {
    const { data } = await request(`/users/${userId}/observees/${observeeId}`, { method: 'DELETE' });
    return data;
  },
  getObservees: async (userId) => {
    const { data } = await request(`/users/${userId}/observees`);
    return data;
  },
  getObserveeCourses: async (userId, observeeId) => {
    const { data } = await request(`/users/${userId}/observees/${observeeId}/courses`);
    return data;
  },

  // Phase 8C: GraphQL
  graphql: async (query, variables = {}) => {
    const { data } = await request('/graphql', {
      method: 'POST', body: JSON.stringify({ query, variables }),
    });
    return data;
  },

  // Phase 8C: Authentication Providers
  getAuthProviders: async (accountId = 1, page = 1, perPage = 20) => {
    return request(`/accounts/${accountId}/authentication_providers?page=${page}&per_page=${perPage}`);
  },
  getAuthProvider: async (accountId, providerId) => {
    const { data } = await request(`/accounts/${accountId}/authentication_providers/${providerId}`);
    return data;
  },
  createAuthProvider: async (accountId, provider) => {
    const { data } = await request(`/accounts/${accountId}/authentication_providers`, {
      method: 'POST', body: JSON.stringify({ authentication_provider: provider }),
    });
    return data;
  },
  updateAuthProvider: async (accountId, providerId, provider) => {
    const { data } = await request(`/accounts/${accountId}/authentication_providers/${providerId}`, {
      method: 'PUT', body: JSON.stringify({ authentication_provider: provider }),
    });
    return data;
  },
  deleteAuthProvider: async (accountId, providerId) => {
    const { data } = await request(`/accounts/${accountId}/authentication_providers/${providerId}`, { method: 'DELETE' });
    return data;
  },
  testAuthProviderConnection: async (accountId, providerId) => {
    const { data } = await request(`/accounts/${accountId}/authentication_providers/${providerId}/test`, { method: 'POST' });
    return data;
  },

  // Phase 9: Discussion V2 (enhanced)
  getDiscussionFullViewV2: async (courseId, topicId) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/view_v2`);
    return data;
  },
  markDiscussionEntryRead: async (courseId, topicId, entryId) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}/read`, { method: 'POST' });
    return data;
  },
  markDiscussionTopicRead: async (courseId, topicId) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/mark_all_read`, { method: 'POST' });
    return data;
  },
  getDiscussionUnreadCount: async (courseId, topicId) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/unread_count`);
    return data;
  },
  toggleDiscussionSubscription: async (courseId, topicId, subscribed) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/subscription`, {
      method: 'PUT', body: JSON.stringify({ subscribed }),
    });
    return data;
  },
  getDiscussionEntryVersions: async (courseId, topicId, entryId) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}/versions`);
    return data;
  },
  updateDiscussionEntryV2: async (courseId, topicId, entryId, message) => {
    const { data } = await request(`/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}/v2`, {
      method: 'PUT', body: JSON.stringify({ message }),
    });
    return data;
  },

  // Phase 9: Content Import (IMSCC/Common Cartridge)
  importContentPackage: async (courseId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadFile(`/courses/${courseId}/content_imports`, formData);
  },

  // Phase 9: Batch Operations
  cloneCourse: async (sourceCourseId, name, accountId = 1, include = {}) => {
    const { data } = await request('/courses/clone', {
      method: 'POST', body: JSON.stringify({ source_course_id: sourceCourseId, name, account_id: accountId, include }),
    });
    return data;
  },
  bulkDateShift: async (courseId, oldStartDate, newStartDate, dayShift) => {
    const { data } = await request(`/courses/${courseId}/date_shift`, {
      method: 'POST', body: JSON.stringify({ old_start_date: oldStartDate, new_start_date: newStartDate, day_shift: dayShift }),
    });
    return data;
  },
  bulkSendMessage: async (courseId, enrollmentTypes, subject, body) => {
    const { data } = await request('/conversations/bulk', {
      method: 'POST', body: JSON.stringify({ course_id: courseId, enrollment_types: enrollmentTypes, subject, body }),
    });
    return data;
  },
  bulkEnrollUsers: async (courseId, enrollments) => {
    const { data } = await request(`/courses/${courseId}/enrollments/bulk`, {
      method: 'POST', body: JSON.stringify({ enrollments }),
    });
    return data;
  },
  bulkUpdateAssignmentDates: async (courseId, updates) => {
    const { data } = await request(`/courses/${courseId}/assignments/bulk_update_dates`, {
      method: 'POST', body: JSON.stringify({ updates }),
    });
    return data;
  },

  // Phase 10: Announcements
  getCourseAnnouncements: async (courseId, page = 1, perPage = 20) => {
    return request(`/courses/${courseId}/announcements?page=${page}&per_page=${perPage}`);
  },
  createCourseAnnouncement: async (courseId, announcement) => {
    const { data } = await request(`/courses/${courseId}/announcements`, {
      method: 'POST', body: JSON.stringify({ announcement }),
    });
    return data;
  },
  getAnnouncement: async (id) => {
    const { data } = await request(`/announcements/${id}`);
    return data;
  },
  updateAnnouncement: async (id, announcement) => {
    const { data } = await request(`/announcements/${id}`, {
      method: 'PUT', body: JSON.stringify({ announcement }),
    });
    return data;
  },
  deleteAnnouncement: async (id) => {
    const { data } = await request(`/announcements/${id}`, { method: 'DELETE' });
    return data;
  },
  markAnnouncementRead: async (id) => {
    const { data } = await request(`/announcements/${id}/read`, { method: 'POST' });
    return data;
  },
  acknowledgeAnnouncement: async (id) => {
    const { data } = await request(`/announcements/${id}/acknowledge`, { method: 'POST' });
    return data;
  },
  getAnnouncementReadReceipts: async (id, page = 1, perPage = 50) => {
    return request(`/announcements/${id}/read_receipts?page=${page}&per_page=${perPage}`);
  },
  getAccountAnnouncements: async (accountId = 1, page = 1, perPage = 20) => {
    return request(`/accounts/${accountId}/announcements?page=${page}&per_page=${perPage}`);
  },
  createAccountAnnouncement: async (accountId, announcement) => {
    const { data } = await request(`/accounts/${accountId}/announcements`, {
      method: 'POST', body: JSON.stringify({ announcement }),
    });
    return data;
  },

  // Phase 10: Enrollment Terms
  getEnrollmentTerms: async (accountId = 1, page = 1, perPage = 20) => {
    return request(`/accounts/${accountId}/terms?page=${page}&per_page=${perPage}`);
  },
  createEnrollmentTerm: async (accountId, term) => {
    const { data } = await request(`/accounts/${accountId}/terms`, {
      method: 'POST', body: JSON.stringify({ enrollment_term: term }),
    });
    return data;
  },
  getEnrollmentTerm: async (accountId, termId) => {
    const { data } = await request(`/accounts/${accountId}/terms/${termId}`);
    return data;
  },
  updateEnrollmentTerm: async (accountId, termId, term) => {
    const { data } = await request(`/accounts/${accountId}/terms/${termId}`, {
      method: 'PUT', body: JSON.stringify({ enrollment_term: term }),
    });
    return data;
  },
  deleteEnrollmentTerm: async (accountId, termId) => {
    const { data } = await request(`/accounts/${accountId}/terms/${termId}`, { method: 'DELETE' });
    return data;
  },
  getCurrentEnrollmentTerm: async (accountId = 1) => {
    const { data } = await request(`/accounts/${accountId}/terms/current`);
    return data;
  },

  // Phase 10: Syllabus
  getCourseSyllabus: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/syllabus`);
    return data;
  },

  // Phase 10B: Notification Delivery
  getNotificationDeliveries: async (page = 1, perPage = 20, status = '') => {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (status) params.append('status', status);
    return request(`/users/self/notification_deliveries?${params.toString()}`);
  },
  getNotificationDeliveryStats: async () => {
    const { data } = await request('/admin/notification_stats');
    return data;
  },
  retryFailedDeliveries: async () => {
    const { data } = await request('/admin/notification_deliveries/retry', { method: 'POST' });
    return data;
  },

  // Phase 10B: Communication Channels
  getCommunicationChannels: async () => {
    const { data } = await request('/users/self/communication_channels');
    return data;
  },
  createCommunicationChannel: async (channelType, address) => {
    const { data } = await request('/users/self/communication_channels', {
      method: 'POST', body: JSON.stringify({ communication_channel: { channel_type: channelType, address } }),
    });
    return data;
  },
  deleteCommunicationChannel: async (id) => {
    const { data } = await request(`/users/self/communication_channels/${id}`, { method: 'DELETE' });
    return data;
  },

  // Phase 10B: Audit Logs
  getCourseAuditLog: async (courseId, page = 1, perPage = 20, filters = {}) => {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (filters.event_type) params.append('event_type', filters.event_type);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    return request(`/courses/${courseId}/audit_log?${params.toString()}`);
  },
  getCourseGradeChangeLog: async (courseId, page = 1, perPage = 20, filters = {}) => {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (filters.student_id) params.append('student_id', filters.student_id);
    if (filters.grader_id) params.append('grader_id', filters.grader_id);
    if (filters.assignment_id) params.append('assignment_id', filters.assignment_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    return request(`/courses/${courseId}/grade_change_log?${params.toString()}`);
  },
  getAccountAuditLog: async (accountId = 1, page = 1, perPage = 20, filters = {}) => {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (filters.event_type) params.append('event_type', filters.event_type);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    return request(`/accounts/${accountId}/audit_log?${params.toString()}`);
  },
  getAuditLogSummary: async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    const { data } = await request(`/admin/audit_log/summary?${params.toString()}`);
    return data;
  },
  exportCourseAuditLogCSV: (courseId) => `${API_URL}/courses/${courseId}/audit_log.csv`,
  exportCourseGradeChangeLogCSV: (courseId) => `${API_URL}/courses/${courseId}/grade_change_log.csv`,

  // Phase 10C: Custom Roles
  getCustomRoles: async (accountId = 1, page = 1, perPage = 20) => {
    return request(`/accounts/${accountId}/roles?page=${page}&per_page=${perPage}`);
  },
  createCustomRole: async (accountId, role) => {
    const { data } = await request(`/accounts/${accountId}/roles`, {
      method: 'POST', body: JSON.stringify({ role }),
    });
    return data;
  },
  getCustomRole: async (accountId, roleId) => {
    const { data } = await request(`/accounts/${accountId}/roles/${roleId}`);
    return data;
  },
  updateCustomRole: async (accountId, roleId, role) => {
    const { data } = await request(`/accounts/${accountId}/roles/${roleId}`, {
      method: 'PUT', body: JSON.stringify({ role }),
    });
    return data;
  },
  deleteCustomRole: async (accountId, roleId) => {
    const { data } = await request(`/accounts/${accountId}/roles/${roleId}`, { method: 'DELETE' });
    return data;
  },
  cloneCustomRole: async (accountId, roleId, name) => {
    const { data } = await request(`/accounts/${accountId}/roles/${roleId}/clone`, {
      method: 'POST', body: JSON.stringify({ name }),
    });
    return data;
  },
  getPermissionPresets: async (accountId = 1) => {
    const { data } = await request(`/accounts/${accountId}/roles/presets`);
    return data;
  },
  getRoleOverrides: async (accountId, roleId) => {
    const { data } = await request(`/accounts/${accountId}/roles/${roleId}/overrides`);
    return data;
  },
  bulkSetRoleOverrides: async (accountId, roleId, overrides) => {
    const { data } = await request(`/accounts/${accountId}/roles/${roleId}/overrides`, {
      method: 'PUT', body: JSON.stringify({ overrides }),
    });
    return data;
  },
  getCoursePermissions: async (courseId) => {
    const { data } = await request(`/courses/${courseId}/permissions`);
    return data;
  },

  // Phase 10C: OneRoster
  getOneRosterConnections: async (accountId = 1, page = 1, perPage = 20) => {
    return request(`/accounts/${accountId}/oneroster_connections?page=${page}&per_page=${perPage}`);
  },
  createOneRosterConnection: async (accountId, connection) => {
    const { data } = await request(`/accounts/${accountId}/oneroster_connections`, {
      method: 'POST', body: JSON.stringify({ connection }),
    });
    return data;
  },
  getOneRosterConnection: async (accountId, connectionId) => {
    const { data } = await request(`/accounts/${accountId}/oneroster_connections/${connectionId}`);
    return data;
  },
  updateOneRosterConnection: async (accountId, connectionId, connection) => {
    const { data } = await request(`/accounts/${accountId}/oneroster_connections/${connectionId}`, {
      method: 'PUT', body: JSON.stringify({ connection }),
    });
    return data;
  },
  deleteOneRosterConnection: async (accountId, connectionId) => {
    const { data } = await request(`/accounts/${accountId}/oneroster_connections/${connectionId}`, { method: 'DELETE' });
    return data;
  },
  testOneRosterConnection: async (accountId, connectionId) => {
    const { data } = await request(`/accounts/${accountId}/oneroster_connections/${connectionId}/test`, { method: 'POST' });
    return data;
  },
  syncOneRosterFull: async (accountId, connectionId) => {
    const { data } = await request(`/accounts/${accountId}/oneroster_connections/${connectionId}/sync`, { method: 'POST' });
    return data;
  },
  syncOneRosterIncremental: async (accountId, connectionId) => {
    const { data } = await request(`/accounts/${accountId}/oneroster_connections/${connectionId}/sync_incremental`, { method: 'POST' });
    return data;
  },
  getOneRosterSyncLogs: async (accountId, connectionId, page = 1, perPage = 20) => {
    return request(`/accounts/${accountId}/oneroster_connections/${connectionId}/sync_logs?page=${page}&per_page=${perPage}`);
  },

  // Phase 10C: Document Annotations
  getAnnotations: async (courseId, assignmentId, userId, page = 1, perPage = 100) => {
    return request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/annotations?page=${page}&per_page=${perPage}`);
  },
  createAnnotation: async (courseId, assignmentId, userId, annotation) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/annotations`, {
      method: 'POST', body: JSON.stringify({ annotation }),
    });
    return data;
  },
  getAnnotation: async (id) => {
    const { data } = await request(`/annotations/${id}`);
    return data;
  },
  updateAnnotation: async (id, annotation) => {
    const { data } = await request(`/annotations/${id}`, {
      method: 'PUT', body: JSON.stringify({ annotation }),
    });
    return data;
  },
  deleteAnnotation: async (id, courseId) => {
    const { data } = await request(`/annotations/${id}?course_id=${courseId}`, { method: 'DELETE' });
    return data;
  },
  resolveAnnotation: async (id) => {
    const { data } = await request(`/annotations/${id}/resolve`, { method: 'POST' });
    return data;
  },
  unresolveAnnotation: async (id) => {
    const { data } = await request(`/annotations/${id}/resolve`, { method: 'DELETE' });
    return data;
  },
  replyToAnnotation: async (id, content, courseId) => {
    const { data } = await request(`/annotations/${id}/replies?course_id=${courseId}`, {
      method: 'POST', body: JSON.stringify({ annotation: { content } }),
    });
    return data;
  },
  getAnnotationSummary: async (courseId, assignmentId, userId) => {
    const { data } = await request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/annotation_summary`);
    return data;
  },

  // Phase 9: SSO
  getSAMLLoginUrl: (providerId) => `${API_URL}/auth/saml/login?provider_id=${providerId}`,
  getSAMLMetadataUrl: () => `${API_URL}/auth/saml/metadata`,
  getCASLoginUrl: (providerId) => `${API_URL}/auth/cas/login?provider_id=${providerId}`,
  ldapLogin: async (providerId, username, password) => {
    const { data } = await request('/auth/ldap/login', {
      method: 'POST', body: JSON.stringify({ provider_id: providerId, username, password }),
    });
    return data;
  },
};
