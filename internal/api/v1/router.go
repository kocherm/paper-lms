package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/handlers"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
)

type Router struct {
	userHandler            *handlers.UserHandler
	accountHandler         *handlers.AccountHandler
	courseHandler           *handlers.CourseHandler
	sectionHandler         *handlers.SectionHandler
	enrollmentHandler      *handlers.EnrollmentHandler
	moduleHandler          *handlers.ModuleHandler
	moduleItemHandler      *handlers.ModuleItemHandler
	pageHandler            *handlers.PageHandler
	assignmentHandler      *handlers.AssignmentHandler
	assignmentGroupHandler *handlers.AssignmentGroupHandler
	submissionHandler      *handlers.SubmissionHandler
	gradebookHandler       *handlers.GradebookHandler
	gradingStandardHandler *handlers.GradingStandardHandler
	developerKeyHandler    *handlers.DeveloperKeyHandler
	accessTokenHandler     *handlers.AccessTokenHandler
	oauth2Handler          *handlers.OAuth2Handler
	externalToolHandler    *handlers.ExternalToolHandler
	ltiHandler             *handlers.LTIHandler
	discussionHandler      *handlers.DiscussionHandler
	discussionEntryHandler *handlers.DiscussionEntryHandler
	fileHandler            *handlers.FileHandler
	folderHandler          *handlers.FolderHandler
	sisImportHandler       *handlers.SISImportHandler
	// Phase 5
	quizHandler               *handlers.QuizHandler
	quizQuestionHandler       *handlers.QuizQuestionHandler
	quizSubmissionHandler     *handlers.QuizSubmissionHandler
	rubricHandler             *handlers.RubricHandler
	rubricAssessmentHandler   *handlers.RubricAssessmentHandler
	gradingPeriodHandler      *handlers.GradingPeriodHandler
	assignmentOverrideHandler *handlers.AssignmentOverrideHandler
	latePolicyHandler         *handlers.LatePolicyHandler
	// Phase 6
	calendarEventHandler  *handlers.CalendarEventHandler
	conversationHandler   *handlers.ConversationHandler
	notificationHandler   *handlers.NotificationHandler
	// Phase 7
	contentMigrationHandler *handlers.ContentMigrationHandler
	learningOutcomeHandler  *handlers.LearningOutcomeHandler
	speedGraderHandler      *handlers.SpeedGraderHandler
	// Phase 8
	groupHandler         *handlers.GroupHandler
	blueprintHandler     *handlers.BlueprintHandler
	coursePaceHandler    *handlers.CoursePaceHandler
	// Phase 8B
	collaborationHandler *handlers.CollaborationHandler
	conferenceHandler    *handlers.ConferenceHandler
	analyticsHandler     *handlers.AnalyticsHandler
	observerHandler      *handlers.ObserverHandler
	// Phase 8C
	graphqlHandler      *handlers.GraphQLHandler
	authProviderHandler *handlers.AuthProviderHandler
	authMiddleware      *middleware.AuthMiddleware
}

func NewRouter(
	userHandler *handlers.UserHandler,
	accountHandler *handlers.AccountHandler,
	courseHandler *handlers.CourseHandler,
	sectionHandler *handlers.SectionHandler,
	enrollmentHandler *handlers.EnrollmentHandler,
	moduleHandler *handlers.ModuleHandler,
	moduleItemHandler *handlers.ModuleItemHandler,
	pageHandler *handlers.PageHandler,
	assignmentHandler *handlers.AssignmentHandler,
	assignmentGroupHandler *handlers.AssignmentGroupHandler,
	submissionHandler *handlers.SubmissionHandler,
	gradebookHandler *handlers.GradebookHandler,
	gradingStandardHandler *handlers.GradingStandardHandler,
	developerKeyHandler *handlers.DeveloperKeyHandler,
	accessTokenHandler *handlers.AccessTokenHandler,
	oauth2Handler *handlers.OAuth2Handler,
	externalToolHandler *handlers.ExternalToolHandler,
	ltiHandler *handlers.LTIHandler,
	discussionHandler *handlers.DiscussionHandler,
	discussionEntryHandler *handlers.DiscussionEntryHandler,
	fileHandler *handlers.FileHandler,
	folderHandler *handlers.FolderHandler,
	sisImportHandler *handlers.SISImportHandler,
	// Phase 5
	quizHandler *handlers.QuizHandler,
	quizQuestionHandler *handlers.QuizQuestionHandler,
	quizSubmissionHandler *handlers.QuizSubmissionHandler,
	rubricHandler *handlers.RubricHandler,
	rubricAssessmentHandler *handlers.RubricAssessmentHandler,
	gradingPeriodHandler *handlers.GradingPeriodHandler,
	assignmentOverrideHandler *handlers.AssignmentOverrideHandler,
	latePolicyHandler *handlers.LatePolicyHandler,
	// Phase 6
	calendarEventHandler *handlers.CalendarEventHandler,
	conversationHandler *handlers.ConversationHandler,
	notificationHandler *handlers.NotificationHandler,
	// Phase 7
	contentMigrationHandler *handlers.ContentMigrationHandler,
	learningOutcomeHandler *handlers.LearningOutcomeHandler,
	speedGraderHandler *handlers.SpeedGraderHandler,
	// Phase 8
	groupHandler *handlers.GroupHandler,
	blueprintHandler *handlers.BlueprintHandler,
	coursePaceHandler *handlers.CoursePaceHandler,
	// Phase 8B
	collaborationHandler *handlers.CollaborationHandler,
	conferenceHandler *handlers.ConferenceHandler,
	analyticsHandler *handlers.AnalyticsHandler,
	observerHandler *handlers.ObserverHandler,
	// Phase 8C
	graphqlHandler *handlers.GraphQLHandler,
	authProviderHandler *handlers.AuthProviderHandler,
	authMiddleware *middleware.AuthMiddleware,
) *Router {
	return &Router{
		userHandler:            userHandler,
		accountHandler:         accountHandler,
		courseHandler:           courseHandler,
		sectionHandler:         sectionHandler,
		enrollmentHandler:      enrollmentHandler,
		moduleHandler:          moduleHandler,
		moduleItemHandler:      moduleItemHandler,
		pageHandler:            pageHandler,
		assignmentHandler:      assignmentHandler,
		assignmentGroupHandler: assignmentGroupHandler,
		submissionHandler:      submissionHandler,
		gradebookHandler:       gradebookHandler,
		gradingStandardHandler: gradingStandardHandler,
		developerKeyHandler:    developerKeyHandler,
		accessTokenHandler:     accessTokenHandler,
		oauth2Handler:          oauth2Handler,
		externalToolHandler:    externalToolHandler,
		ltiHandler:             ltiHandler,
		discussionHandler:      discussionHandler,
		discussionEntryHandler: discussionEntryHandler,
		fileHandler:            fileHandler,
		folderHandler:          folderHandler,
		sisImportHandler:          sisImportHandler,
		quizHandler:               quizHandler,
		quizQuestionHandler:       quizQuestionHandler,
		quizSubmissionHandler:     quizSubmissionHandler,
		rubricHandler:             rubricHandler,
		rubricAssessmentHandler:   rubricAssessmentHandler,
		gradingPeriodHandler:      gradingPeriodHandler,
		assignmentOverrideHandler: assignmentOverrideHandler,
		latePolicyHandler:         latePolicyHandler,
		calendarEventHandler:       calendarEventHandler,
		conversationHandler:        conversationHandler,
		notificationHandler:        notificationHandler,
		contentMigrationHandler:    contentMigrationHandler,
		learningOutcomeHandler:     learningOutcomeHandler,
		speedGraderHandler:         speedGraderHandler,
		groupHandler:               groupHandler,
		blueprintHandler:           blueprintHandler,
		coursePaceHandler:          coursePaceHandler,
		collaborationHandler:       collaborationHandler,
		conferenceHandler:          conferenceHandler,
		analyticsHandler:           analyticsHandler,
		observerHandler:            observerHandler,
		graphqlHandler:             graphqlHandler,
		authProviderHandler:        authProviderHandler,
		authMiddleware:             authMiddleware,
	}
}

func (r *Router) Register(app *fiber.App) {
	api := app.Group("/api/v1", middleware.PaginationParams())

	// Public auth routes
	api.Post("/login", r.userHandler.Login)
	api.Post("/register", r.userHandler.Register)

	// Public OAuth2 token endpoint (no auth required)
	api.Post("/login/oauth2/token", r.oauth2Handler.Token)

	// Public LTI endpoints (no auth required)
	api.Get("/lti/jwks", r.ltiHandler.JWKS)
	api.Post("/lti/oidc/login", r.ltiHandler.OIDCLogin)
	api.Post("/lti/launch", r.ltiHandler.LaunchDirect)

	// Protected routes
	protected := api.Group("", r.authMiddleware.Protected())

	// Users
	protected.Get("/users/self", r.userHandler.GetSelf)
	protected.Get("/users", r.userHandler.ListUsers)
	protected.Get("/users/:id", r.userHandler.GetUser)
	protected.Get("/users/:id/profile", r.userHandler.GetUserProfile)
	protected.Put("/users/:id", r.userHandler.UpdateUser)

	// Personal Access Tokens
	protected.Get("/users/:user_id/tokens", r.accessTokenHandler.ListAccessTokens)
	protected.Post("/users/:user_id/tokens", r.accessTokenHandler.CreateAccessToken)
	protected.Delete("/users/:user_id/tokens/:id", r.accessTokenHandler.DeleteAccessToken)

	// Accounts
	protected.Get("/accounts", r.accountHandler.ListAccounts)
	protected.Get("/accounts/:id", r.accountHandler.GetAccount)

	// Developer Keys
	protected.Get("/accounts/:account_id/developer_keys", r.developerKeyHandler.ListDeveloperKeys)
	protected.Post("/accounts/:account_id/developer_keys", r.developerKeyHandler.CreateDeveloperKey)
	protected.Get("/accounts/:account_id/developer_keys/:id", r.developerKeyHandler.GetDeveloperKey)
	protected.Put("/accounts/:account_id/developer_keys/:id", r.developerKeyHandler.UpdateDeveloperKey)
	protected.Delete("/accounts/:account_id/developer_keys/:id", r.developerKeyHandler.DeleteDeveloperKey)

	// OAuth2 Authorization (requires auth for consent)
	protected.Get("/login/oauth2/auth", r.oauth2Handler.Authorize)
	protected.Post("/login/oauth2/auth", r.oauth2Handler.AuthorizePost)

	// Courses
	protected.Get("/courses", r.courseHandler.ListCourses)
	protected.Post("/courses", r.courseHandler.CreateCourse)
	protected.Get("/courses/:id", r.courseHandler.GetCourse)
	protected.Put("/courses/:id", r.courseHandler.UpdateCourse)
	protected.Delete("/courses/:id", r.courseHandler.DeleteCourse)

	// External Tools
	protected.Get("/courses/:course_id/external_tools", r.externalToolHandler.ListExternalTools)
	protected.Post("/courses/:course_id/external_tools", r.externalToolHandler.CreateExternalTool)
	protected.Get("/courses/:course_id/external_tools/:id", r.externalToolHandler.GetExternalTool)
	protected.Put("/courses/:course_id/external_tools/:id", r.externalToolHandler.UpdateExternalTool)
	protected.Delete("/courses/:course_id/external_tools/:id", r.externalToolHandler.DeleteExternalTool)

	// Sections
	protected.Get("/courses/:course_id/sections", r.sectionHandler.ListSections)
	protected.Post("/courses/:course_id/sections", r.sectionHandler.CreateSection)
	protected.Get("/sections/:id", r.sectionHandler.GetSection)

	// Enrollments
	protected.Get("/courses/:course_id/enrollments", r.enrollmentHandler.ListEnrollments)
	protected.Post("/courses/:course_id/enrollments", r.enrollmentHandler.CreateEnrollment)

	// Modules
	protected.Get("/courses/:course_id/modules", r.moduleHandler.ListModules)
	protected.Post("/courses/:course_id/modules", r.moduleHandler.CreateModule)
	protected.Get("/courses/:course_id/modules/:id", r.moduleHandler.GetModule)
	protected.Put("/courses/:course_id/modules/:id", r.moduleHandler.UpdateModule)
	protected.Delete("/courses/:course_id/modules/:id", r.moduleHandler.DeleteModule)

	// Module Items
	protected.Get("/courses/:course_id/modules/:module_id/items", r.moduleItemHandler.ListModuleItems)
	protected.Post("/courses/:course_id/modules/:module_id/items", r.moduleItemHandler.CreateModuleItem)
	protected.Get("/courses/:course_id/modules/:module_id/items/:item_id", r.moduleItemHandler.GetModuleItem)

	// Pages
	protected.Get("/courses/:course_id/pages", r.pageHandler.ListPages)
	protected.Post("/courses/:course_id/pages", r.pageHandler.CreatePage)
	protected.Get("/courses/:course_id/pages/:url_or_id", r.pageHandler.GetPage)
	protected.Put("/courses/:course_id/pages/:url_or_id", r.pageHandler.UpdatePage)
	protected.Delete("/courses/:course_id/pages/:url_or_id", r.pageHandler.DeletePage)

	// Assignments
	protected.Get("/courses/:course_id/assignments", r.assignmentHandler.ListAssignments)
	protected.Post("/courses/:course_id/assignments", r.assignmentHandler.CreateAssignment)
	protected.Get("/courses/:course_id/assignments/:id", r.assignmentHandler.GetAssignment)
	protected.Put("/courses/:course_id/assignments/:id", r.assignmentHandler.UpdateAssignment)
	protected.Delete("/courses/:course_id/assignments/:id", r.assignmentHandler.DeleteAssignment)

	// Assignment Groups
	protected.Get("/courses/:course_id/assignment_groups", r.assignmentGroupHandler.ListAssignmentGroups)
	protected.Post("/courses/:course_id/assignment_groups", r.assignmentGroupHandler.CreateAssignmentGroup)
	protected.Get("/courses/:course_id/assignment_groups/:id", r.assignmentGroupHandler.GetAssignmentGroup)
	protected.Put("/courses/:course_id/assignment_groups/:id", r.assignmentGroupHandler.UpdateAssignmentGroup)
	protected.Delete("/courses/:course_id/assignment_groups/:id", r.assignmentGroupHandler.DeleteAssignmentGroup)

	// Submissions
	protected.Get("/courses/:course_id/assignments/:assignment_id/submissions", r.submissionHandler.ListSubmissions)
	protected.Post("/courses/:course_id/assignments/:assignment_id/submissions", r.submissionHandler.CreateSubmission)
	protected.Get("/courses/:course_id/assignments/:assignment_id/submissions/:user_id", r.submissionHandler.GetSubmission)
	protected.Put("/courses/:course_id/assignments/:assignment_id/submissions/:user_id", r.submissionHandler.UpdateSubmission)

	// Submission Comments
	protected.Get("/courses/:course_id/assignments/:assignment_id/submissions/:user_id/comments", r.submissionHandler.ListSubmissionComments)
	protected.Post("/courses/:course_id/assignments/:assignment_id/submissions/:user_id/comments", r.submissionHandler.CreateSubmissionComment)

	// Gradebook
	protected.Get("/courses/:course_id/gradebook", r.gradebookHandler.GetGradebook)
	protected.Get("/courses/:course_id/students/:student_id/grade", r.gradebookHandler.GetStudentGrade)

	// Grading Standards
	protected.Get("/courses/:course_id/grading_standards", r.gradingStandardHandler.ListGradingStandards)
	protected.Post("/courses/:course_id/grading_standards", r.gradingStandardHandler.CreateGradingStandard)

	// LTI AGS (Assignment and Grade Services) - protected via OAuth2 token
	protected.Get("/lti/courses/:course_id/line_items", r.ltiHandler.ListLineItems)
	protected.Post("/lti/courses/:course_id/line_items", r.ltiHandler.CreateLineItem)
	protected.Get("/lti/courses/:course_id/line_items/:id", r.ltiHandler.GetLineItem)
	protected.Put("/lti/courses/:course_id/line_items/:id", r.ltiHandler.UpdateLineItem)
	protected.Delete("/lti/courses/:course_id/line_items/:id", r.ltiHandler.DeleteLineItem)
	protected.Post("/lti/courses/:course_id/line_items/:id/scores", r.ltiHandler.PostScore)
	protected.Get("/lti/courses/:course_id/line_items/:id/results", r.ltiHandler.GetResults)

	// LTI NRPS (Names and Role Provisioning Services) - protected via OAuth2 token
	protected.Get("/lti/courses/:course_id/memberships", r.ltiHandler.GetMemberships)

	// Phase 4: Discussion Topics
	protected.Get("/courses/:course_id/discussion_topics", r.discussionHandler.ListTopics)
	protected.Post("/courses/:course_id/discussion_topics", r.discussionHandler.CreateTopic)
	protected.Get("/courses/:course_id/discussion_topics/:topic_id", r.discussionHandler.GetTopic)
	protected.Put("/courses/:course_id/discussion_topics/:topic_id", r.discussionHandler.UpdateTopic)
	protected.Delete("/courses/:course_id/discussion_topics/:topic_id", r.discussionHandler.DeleteTopic)
	protected.Get("/courses/:course_id/discussion_topics/:topic_id/view", r.discussionHandler.GetFullView)

	// Discussion Entries
	protected.Get("/courses/:course_id/discussion_topics/:topic_id/entries", r.discussionEntryHandler.ListEntries)
	protected.Post("/courses/:course_id/discussion_topics/:topic_id/entries", r.discussionEntryHandler.CreateEntry)
	protected.Put("/courses/:course_id/discussion_topics/:topic_id/entries/:id", r.discussionEntryHandler.UpdateEntry)
	protected.Delete("/courses/:course_id/discussion_topics/:topic_id/entries/:id", r.discussionEntryHandler.DeleteEntry)
	protected.Get("/courses/:course_id/discussion_topics/:topic_id/entries/:entry_id/replies", r.discussionEntryHandler.ListReplies)
	protected.Post("/courses/:course_id/discussion_topics/:topic_id/entries/:entry_id/replies", r.discussionEntryHandler.CreateReply)
	protected.Post("/courses/:course_id/discussion_topics/:topic_id/entries/:entry_id/rating", r.discussionEntryHandler.RateEntry)

	// Phase 4: Files
	protected.Get("/courses/:course_id/files", r.fileHandler.ListCourseFiles)
	protected.Post("/courses/:course_id/files", r.fileHandler.UploadCourseFile)
	protected.Get("/courses/:course_id/files/:id", r.fileHandler.GetFile)
	protected.Delete("/courses/:course_id/files/:id", r.fileHandler.DeleteFile)
	protected.Get("/files/:id/download", r.fileHandler.DownloadFile)
	protected.Get("/folders/:folder_id/files", r.fileHandler.ListFolderFiles)

	// Folders
	protected.Get("/courses/:course_id/folders", r.folderHandler.ListCourseFolders)
	protected.Post("/courses/:course_id/folders", r.folderHandler.CreateCourseFolder)
	protected.Get("/folders/:id", r.folderHandler.GetFolder)
	protected.Put("/folders/:id", r.folderHandler.UpdateFolder)
	protected.Delete("/folders/:id", r.folderHandler.DeleteFolder)
	protected.Get("/folders/:folder_id/folders", r.folderHandler.ListSubfolders)

	// Phase 4: SIS Import/Export
	protected.Post("/accounts/:account_id/sis_imports", r.sisImportHandler.CreateSISImport)
	protected.Get("/accounts/:account_id/sis_imports", r.sisImportHandler.ListSISImports)
	protected.Get("/accounts/:account_id/sis_imports/:id", r.sisImportHandler.GetSISImport)
	protected.Get("/accounts/:account_id/sis_imports/:id/errors", r.sisImportHandler.GetSISImportErrors)
	protected.Get("/accounts/:account_id/sis_exports/users.csv", r.sisImportHandler.ExportUsersCSV)
	protected.Get("/accounts/:account_id/sis_exports/courses.csv", r.sisImportHandler.ExportCoursesCSV)
	protected.Get("/accounts/:account_id/sis_exports/sections.csv", r.sisImportHandler.ExportSectionsCSV)
	protected.Get("/accounts/:account_id/sis_exports/enrollments.csv", r.sisImportHandler.ExportEnrollmentsCSV)

	// Phase 5: Quizzes
	protected.Get("/courses/:course_id/quizzes", r.quizHandler.ListQuizzes)
	protected.Post("/courses/:course_id/quizzes", r.quizHandler.CreateQuiz)
	protected.Get("/courses/:course_id/quizzes/:id", r.quizHandler.GetQuiz)
	protected.Put("/courses/:course_id/quizzes/:id", r.quizHandler.UpdateQuiz)
	protected.Delete("/courses/:course_id/quizzes/:id", r.quizHandler.DeleteQuiz)

	// Quiz Questions
	protected.Get("/courses/:course_id/quizzes/:quiz_id/questions", r.quizQuestionHandler.ListQuestions)
	protected.Post("/courses/:course_id/quizzes/:quiz_id/questions", r.quizQuestionHandler.CreateQuestion)
	protected.Get("/courses/:course_id/quizzes/:quiz_id/questions/:question_id", r.quizQuestionHandler.GetQuestion)
	protected.Put("/courses/:course_id/quizzes/:quiz_id/questions/:question_id", r.quizQuestionHandler.UpdateQuestion)
	protected.Delete("/courses/:course_id/quizzes/:quiz_id/questions/:question_id", r.quizQuestionHandler.DeleteQuestion)

	// Quiz Submissions
	protected.Post("/courses/:course_id/quizzes/:quiz_id/submissions", r.quizSubmissionHandler.StartSubmission)
	protected.Get("/courses/:course_id/quizzes/:quiz_id/submissions", r.quizSubmissionHandler.ListSubmissions)
	protected.Get("/courses/:course_id/quizzes/:quiz_id/submissions/:submission_id", r.quizSubmissionHandler.GetSubmission)
	protected.Put("/courses/:course_id/quizzes/:quiz_id/submissions/:submission_id/questions/:question_id", r.quizSubmissionHandler.AnswerQuestion)
	protected.Post("/courses/:course_id/quizzes/:quiz_id/submissions/:submission_id/complete", r.quizSubmissionHandler.CompleteSubmission)

	// Phase 5: Rubrics
	protected.Get("/courses/:course_id/rubrics", r.rubricHandler.ListCourseRubrics)
	protected.Post("/courses/:course_id/rubrics", r.rubricHandler.CreateCourseRubric)
	protected.Get("/courses/:course_id/rubrics/:rubric_id", r.rubricHandler.GetRubric)
	protected.Put("/courses/:course_id/rubrics/:rubric_id", r.rubricHandler.UpdateRubric)
	protected.Delete("/courses/:course_id/rubrics/:rubric_id", r.rubricHandler.DeleteRubric)
	protected.Post("/courses/:course_id/rubrics/:rubric_id/associations", r.rubricHandler.AssociateRubric)

	// Rubric Assessments
	protected.Get("/courses/:course_id/rubric_associations/:association_id/rubric_assessments", r.rubricAssessmentHandler.ListAssessments)
	protected.Post("/courses/:course_id/rubric_associations/:association_id/rubric_assessments", r.rubricAssessmentHandler.CreateAssessment)
	protected.Get("/courses/:course_id/rubric_associations/:association_id/rubric_assessments/:assessment_id", r.rubricAssessmentHandler.GetAssessment)
	protected.Put("/courses/:course_id/rubric_associations/:association_id/rubric_assessments/:assessment_id", r.rubricAssessmentHandler.UpdateAssessment)

	// Phase 5: Grading Periods
	protected.Get("/accounts/:account_id/grading_period_groups", r.gradingPeriodHandler.ListGroups)
	protected.Post("/accounts/:account_id/grading_period_groups", r.gradingPeriodHandler.CreateGroup)
	protected.Get("/accounts/:account_id/grading_period_groups/:group_id", r.gradingPeriodHandler.GetGroup)
	protected.Put("/accounts/:account_id/grading_period_groups/:group_id", r.gradingPeriodHandler.UpdateGroup)
	protected.Delete("/accounts/:account_id/grading_period_groups/:group_id", r.gradingPeriodHandler.DeleteGroup)
	protected.Get("/accounts/:account_id/grading_period_groups/:group_id/grading_periods", r.gradingPeriodHandler.ListPeriods)
	protected.Post("/accounts/:account_id/grading_period_groups/:group_id/grading_periods", r.gradingPeriodHandler.CreatePeriod)
	protected.Get("/accounts/:account_id/grading_period_groups/:group_id/grading_periods/:period_id", r.gradingPeriodHandler.GetPeriod)
	protected.Put("/accounts/:account_id/grading_period_groups/:group_id/grading_periods/:period_id", r.gradingPeriodHandler.UpdatePeriod)
	protected.Delete("/accounts/:account_id/grading_period_groups/:group_id/grading_periods/:period_id", r.gradingPeriodHandler.DeletePeriod)

	// Phase 5: Assignment Overrides
	protected.Get("/courses/:course_id/assignments/:assignment_id/overrides", r.assignmentOverrideHandler.ListOverrides)
	protected.Post("/courses/:course_id/assignments/:assignment_id/overrides", r.assignmentOverrideHandler.CreateOverride)
	protected.Get("/courses/:course_id/assignments/:assignment_id/overrides/:override_id", r.assignmentOverrideHandler.GetOverride)
	protected.Put("/courses/:course_id/assignments/:assignment_id/overrides/:override_id", r.assignmentOverrideHandler.UpdateOverride)
	protected.Delete("/courses/:course_id/assignments/:assignment_id/overrides/:override_id", r.assignmentOverrideHandler.DeleteOverride)

	// Phase 5: Late Policy
	protected.Get("/courses/:course_id/late_policy", r.latePolicyHandler.GetLatePolicy)
	protected.Post("/courses/:course_id/late_policy", r.latePolicyHandler.CreateLatePolicy)
	protected.Put("/courses/:course_id/late_policy", r.latePolicyHandler.UpdateLatePolicy)
	protected.Delete("/courses/:course_id/late_policy", r.latePolicyHandler.DeleteLatePolicy)

	// Phase 6: Calendar Events
	protected.Get("/calendar_events", r.calendarEventHandler.ListEvents)
	protected.Get("/calendar_events.ics", r.calendarEventHandler.ExportAsICal)
	protected.Post("/calendar_events", r.calendarEventHandler.CreateEvent)
	protected.Get("/calendar_events/:id", r.calendarEventHandler.GetEvent)
	protected.Put("/calendar_events/:id", r.calendarEventHandler.UpdateEvent)
	protected.Delete("/calendar_events/:id", r.calendarEventHandler.DeleteEvent)
	protected.Get("/courses/:course_id/calendar_events", r.calendarEventHandler.ListEvents)

	// Phase 6: Conversations
	protected.Get("/conversations", r.conversationHandler.ListConversations)
	protected.Post("/conversations", r.conversationHandler.CreateConversation)
	protected.Get("/conversations/:id", r.conversationHandler.GetConversation)
	protected.Put("/conversations/:id", r.conversationHandler.UpdateConversation)
	protected.Get("/conversations/:id/messages", r.conversationHandler.ListMessages)
	protected.Post("/conversations/:id/messages", r.conversationHandler.CreateMessage)
	protected.Put("/conversations/:id/mark_as_read", r.conversationHandler.MarkAsRead)

	// Phase 6: Notifications
	protected.Get("/notifications", r.notificationHandler.ListNotifications)
	protected.Put("/notifications/mark_all_as_read", r.notificationHandler.MarkAllAsRead)
	protected.Put("/notifications/:id/mark_as_read", r.notificationHandler.MarkAsRead)
	protected.Get("/users/self/notification_preferences", r.notificationHandler.GetPreferences)
	protected.Put("/users/self/notification_preferences", r.notificationHandler.UpdatePreferences)

	// Phase 7: Content Migrations
	protected.Get("/courses/:course_id/content_migrations", r.contentMigrationHandler.ListMigrations)
	protected.Post("/courses/:course_id/content_migrations", r.contentMigrationHandler.CreateMigration)
	protected.Get("/courses/:course_id/content_migrations/:id", r.contentMigrationHandler.GetMigration)
	protected.Put("/courses/:course_id/content_migrations/:id", r.contentMigrationHandler.UpdateMigration)

	// Phase 7: Learning Outcomes
	protected.Get("/courses/:course_id/outcome_groups", r.learningOutcomeHandler.ListGroups)
	protected.Post("/courses/:course_id/outcome_groups", r.learningOutcomeHandler.CreateGroup)
	protected.Get("/courses/:course_id/outcome_groups/:group_id", r.learningOutcomeHandler.GetGroup)
	protected.Put("/courses/:course_id/outcome_groups/:group_id", r.learningOutcomeHandler.UpdateGroup)
	protected.Delete("/courses/:course_id/outcome_groups/:group_id", r.learningOutcomeHandler.DeleteGroup)
	protected.Get("/courses/:course_id/outcome_groups/:group_id/outcomes", r.learningOutcomeHandler.ListOutcomes)
	protected.Post("/courses/:course_id/outcome_groups/:group_id/outcomes", r.learningOutcomeHandler.CreateOutcome)
	protected.Get("/courses/:course_id/outcomes/:outcome_id", r.learningOutcomeHandler.GetOutcome)
	protected.Put("/courses/:course_id/outcomes/:outcome_id", r.learningOutcomeHandler.UpdateOutcome)
	protected.Delete("/courses/:course_id/outcomes/:outcome_id", r.learningOutcomeHandler.DeleteOutcome)
	protected.Get("/courses/:course_id/outcome_results", r.learningOutcomeHandler.ListResults)
	protected.Post("/courses/:course_id/outcome_results", r.learningOutcomeHandler.CreateResult)
	protected.Get("/courses/:course_id/outcome_rollups", r.learningOutcomeHandler.GetMasteryGradebook)

	// Phase 7: SpeedGrader
	protected.Get("/courses/:course_id/assignments/:assignment_id/speedgrader", r.speedGraderHandler.GetSpeedGraderData)
	protected.Get("/courses/:course_id/assignments/:assignment_id/speedgrader/submissions/:user_id", r.speedGraderHandler.GetStudentSubmission)

	// Phase 8: Groups
	protected.Get("/courses/:course_id/group_categories", r.groupHandler.ListGroupCategories)
	protected.Post("/courses/:course_id/group_categories", r.groupHandler.CreateGroupCategory)
	protected.Get("/group_categories/:id", r.groupHandler.GetGroupCategory)
	protected.Put("/group_categories/:id", r.groupHandler.UpdateGroupCategory)
	protected.Delete("/group_categories/:id", r.groupHandler.DeleteGroupCategory)
	protected.Get("/group_categories/:group_category_id/groups", r.groupHandler.ListGroupsByCategory)
	protected.Post("/group_categories/:group_category_id/groups", r.groupHandler.CreateGroup)
	protected.Get("/groups/:id", r.groupHandler.GetGroup)
	protected.Put("/groups/:id", r.groupHandler.UpdateGroup)
	protected.Delete("/groups/:id", r.groupHandler.DeleteGroup)
	protected.Get("/groups/:group_id/memberships", r.groupHandler.ListGroupMemberships)
	protected.Post("/groups/:group_id/memberships", r.groupHandler.CreateGroupMembership)
	protected.Put("/groups/:group_id/memberships/:membership_id", r.groupHandler.UpdateGroupMembership)
	protected.Delete("/groups/:group_id/memberships/:membership_id", r.groupHandler.DeleteGroupMembership)
	protected.Get("/users/self/groups", r.groupHandler.ListUserGroups)

	// Phase 8: Blueprint Courses
	protected.Get("/courses/:course_id/blueprint_templates", r.blueprintHandler.ListTemplates)
	protected.Post("/courses/:course_id/blueprint_templates", r.blueprintHandler.CreateTemplate)
	protected.Get("/courses/:course_id/blueprint_templates/default", r.blueprintHandler.GetDefaultTemplate)
	protected.Put("/courses/:course_id/blueprint_templates/default", r.blueprintHandler.UpdateDefaultTemplate)
	protected.Get("/courses/:course_id/blueprint_templates/default/associated_courses", r.blueprintHandler.GetAssociatedCourses)
	protected.Put("/courses/:course_id/blueprint_templates/default/associated_courses", r.blueprintHandler.UpdateAssociations)
	protected.Get("/courses/:course_id/blueprint_templates/default/migrations", r.blueprintHandler.ListMigrations)
	protected.Post("/courses/:course_id/blueprint_templates/default/migrations", r.blueprintHandler.CreateMigration)
	protected.Get("/courses/:course_id/blueprint_templates/default/migrations/:migration_id", r.blueprintHandler.GetMigration)
	protected.Get("/courses/:course_id/blueprint_templates/default/unsynced_changes", r.blueprintHandler.GetUnsyncedChanges)
	protected.Get("/courses/:course_id/blueprint_subscriptions", r.blueprintHandler.ListSubscriptions)
	protected.Get("/courses/:course_id/blueprint_subscriptions/:subscription_id/migrations", r.blueprintHandler.GetSubscriptionMigrations)
	protected.Get("/courses/:course_id/blueprint_subscriptions/:subscription_id/migrations/:migration_id", r.blueprintHandler.GetSubscriptionMigration)

	// Phase 8: Course Pacing
	protected.Get("/courses/:course_id/course_pacing", r.coursePaceHandler.ListCoursePaces)
	protected.Post("/courses/:course_id/course_pacing", r.coursePaceHandler.CreateCoursePace)
	protected.Get("/courses/:course_id/course_pacing/:id", r.coursePaceHandler.GetCoursePace)
	protected.Put("/courses/:course_id/course_pacing/:id", r.coursePaceHandler.UpdateCoursePace)
	protected.Delete("/courses/:course_id/course_pacing/:id", r.coursePaceHandler.DeleteCoursePace)
	protected.Post("/courses/:course_id/course_pacing/:id/publish", r.coursePaceHandler.PublishCoursePace)
	protected.Get("/courses/:course_id/course_pacing/:id/module_items", r.coursePaceHandler.GetPaceModuleItems)
	protected.Put("/courses/:course_id/course_pacing/:id/module_items", r.coursePaceHandler.UpdatePaceModuleItems)

	// Phase 8B: Collaborations
	protected.Get("/courses/:course_id/collaborations", r.collaborationHandler.ListCollaborations)
	protected.Post("/courses/:course_id/collaborations", r.collaborationHandler.CreateCollaboration)
	protected.Get("/collaborations/:id", r.collaborationHandler.GetCollaboration)
	protected.Put("/collaborations/:id", r.collaborationHandler.UpdateCollaboration)
	protected.Delete("/collaborations/:id", r.collaborationHandler.DeleteCollaboration)

	// Phase 8B: Conferences
	protected.Get("/courses/:course_id/conferences", r.conferenceHandler.ListConferences)
	protected.Post("/courses/:course_id/conferences", r.conferenceHandler.CreateConference)
	protected.Get("/conferences/:id", r.conferenceHandler.GetConference)
	protected.Put("/conferences/:id", r.conferenceHandler.UpdateConference)
	protected.Delete("/conferences/:id", r.conferenceHandler.DeleteConference)
	protected.Post("/conferences/:id/join", r.conferenceHandler.JoinConference)
	protected.Post("/conferences/:id/end", r.conferenceHandler.EndConference)
	protected.Get("/conferences/:id/recordings", r.conferenceHandler.GetRecordings)
	protected.Get("/conferences/:id/participants", r.conferenceHandler.GetParticipants)

	// Phase 8B: Analytics
	protected.Get("/courses/:course_id/analytics/activity", r.analyticsHandler.GetCourseActivity)
	protected.Get("/courses/:course_id/analytics/assignments", r.analyticsHandler.GetCourseAssignmentStats)
	protected.Get("/courses/:course_id/analytics/student_summaries", r.analyticsHandler.GetStudentSummaries)
	protected.Get("/courses/:course_id/analytics/users/:user_id/activity", r.analyticsHandler.GetStudentActivity)
	protected.Get("/courses/:course_id/analytics/users/:user_id/assignments", r.analyticsHandler.GetStudentAssignments)
	protected.Get("/accounts/:account_id/analytics/current/activity", r.analyticsHandler.GetDepartmentActivity)
	protected.Get("/accounts/:account_id/analytics/current/grades", r.analyticsHandler.GetDepartmentGrades)
	protected.Get("/accounts/:account_id/analytics/current/statistics", r.analyticsHandler.GetDepartmentStatistics)
	protected.Post("/page_views", r.analyticsHandler.CreatePageView)
	protected.Get("/users/self/page_views", r.analyticsHandler.ListUserPageViews)

	// Phase 8B: Observer/Parent Role
	protected.Post("/users/:user_id/observees", r.observerHandler.LinkObservee)
	protected.Delete("/users/:user_id/observees/:observee_id", r.observerHandler.UnlinkObservee)
	protected.Get("/users/:user_id/observees", r.observerHandler.ListObservees)
	protected.Get("/users/:user_id/observees/:observee_id/courses", r.observerHandler.GetObserveeCourses)

	// Phase 8C: GraphQL
	protected.Post("/graphql", r.graphqlHandler.HandleQuery)

	// Phase 8C: Authentication Providers
	protected.Get("/accounts/:account_id/authentication_providers", r.authProviderHandler.ListProviders)
	protected.Post("/accounts/:account_id/authentication_providers", r.authProviderHandler.CreateProvider)
	protected.Get("/accounts/:account_id/authentication_providers/:id", r.authProviderHandler.GetProvider)
	protected.Put("/accounts/:account_id/authentication_providers/:id", r.authProviderHandler.UpdateProvider)
	protected.Delete("/accounts/:account_id/authentication_providers/:id", r.authProviderHandler.DeleteProvider)
	protected.Post("/accounts/:account_id/authentication_providers/:id/test", r.authProviderHandler.TestConnection)
}
