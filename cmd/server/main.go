package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	v1 "github.com/kocherm/paper-lms/internal/api/v1"
	"github.com/kocherm/paper-lms/internal/api/v1/handlers"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/config"
	"github.com/kocherm/paper-lms/internal/db"
	"github.com/kocherm/paper-lms/internal/graphql"
	"github.com/kocherm/paper-lms/internal/repository/postgres"
	"github.com/kocherm/paper-lms/internal/service"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	// Connect to PostgreSQL
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate schema
	if err := db.AutoMigrate(database); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Seed default data
	if err := db.SeedDefaultAccount(database); err != nil {
		log.Fatalf("Failed to seed database: %v", err)
	}

	// Initialize repositories
	userRepo := postgres.NewUserRepository(database)
	accountRepo := postgres.NewAccountRepository(database)
	courseRepo := postgres.NewCourseRepository(database)
	sectionRepo := postgres.NewSectionRepository(database)
	enrollmentRepo := postgres.NewEnrollmentRepository(database)
	moduleRepo := postgres.NewModuleRepository(database)
	moduleItemRepo := postgres.NewModuleItemRepository(database)
	pageRepo := postgres.NewPageRepository(database)
	assignmentRepo := postgres.NewAssignmentRepository(database)
	assignmentGroupRepo := postgres.NewAssignmentGroupRepository(database)
	submissionRepo := postgres.NewSubmissionRepository(database)
	submissionCommentRepo := postgres.NewSubmissionCommentRepository(database)
	gradingStandardRepo := postgres.NewGradingStandardRepository(database)
	devKeyRepo := postgres.NewDeveloperKeyRepository(database)
	accessTokenRepo := postgres.NewAccessTokenRepository(database)
	externalToolRepo := postgres.NewContextExternalToolRepository(database)
	ltiConfigRepo := postgres.NewLTIToolConfigurationRepository(database)
	lineItemRepo := postgres.NewLTILineItemRepository(database)
	resultRepo := postgres.NewLTIResultRepository(database)
	nonceRepo := postgres.NewNonceRepository(database)
	// Phase 4 repositories
	discussionTopicRepo := postgres.NewDiscussionTopicRepository(database)
	discussionEntryRepo := postgres.NewDiscussionEntryRepository(database)
	discussionRatingRepo := postgres.NewDiscussionEntryRatingRepository(database)
	folderRepo := postgres.NewFolderRepository(database)
	attachmentRepo := postgres.NewAttachmentRepository(database)
	sisBatchRepo := postgres.NewSISBatchRepository(database)
	sisBatchErrorRepo := postgres.NewSISBatchErrorRepository(database)
	// Phase 5 repositories
	quizRepo := postgres.NewQuizRepository(database)
	quizQuestionRepo := postgres.NewQuizQuestionRepository(database)
	quizSubmissionRepo := postgres.NewQuizSubmissionRepository(database)
	quizSubmissionAnswerRepo := postgres.NewQuizSubmissionAnswerRepository(database)
	rubricRepo := postgres.NewRubricRepository(database)
	rubricAssocRepo := postgres.NewRubricAssociationRepository(database)
	rubricAssessRepo := postgres.NewRubricAssessmentRepository(database)
	gradingPeriodGroupRepo := postgres.NewGradingPeriodGroupRepository(database)
	gradingPeriodRepo := postgres.NewGradingPeriodRepository(database)
	assignmentOverrideRepo := postgres.NewAssignmentOverrideRepository(database)
	assignmentOverrideStudentRepo := postgres.NewAssignmentOverrideStudentRepository(database)
	latePolicyRepo := postgres.NewLatePolicyRepository(database)
	// Phase 6 repositories
	calendarEventRepo := postgres.NewCalendarEventRepository(database)
	conversationRepo := postgres.NewConversationRepository(database)
	conversationParticipantRepo := postgres.NewConversationParticipantRepository(database)
	conversationMessageRepo := postgres.NewConversationMessageRepository(database)
	notificationPrefRepo := postgres.NewNotificationPreferenceRepository(database)
	notificationRepo := postgres.NewNotificationRepository(database)
	// Phase 7 repositories
	contentMigrationRepo := postgres.NewContentMigrationRepository(database)
	outcomeGroupRepo := postgres.NewLearningOutcomeGroupRepository(database)
	outcomeRepo := postgres.NewLearningOutcomeRepository(database)
	outcomeResultRepo := postgres.NewLearningOutcomeResultRepository(database)
	// Phase 8 repositories
	groupCategoryRepo := postgres.NewGroupCategoryRepository(database)
	groupRepo := postgres.NewGroupRepository(database)
	groupMembershipRepo := postgres.NewGroupMembershipRepository(database)
	blueprintTemplateRepo := postgres.NewBlueprintTemplateRepository(database)
	blueprintSubscriptionRepo := postgres.NewBlueprintSubscriptionRepository(database)
	blueprintMigrationRepo := postgres.NewBlueprintMigrationRepository(database)
	coursePaceRepo := postgres.NewCoursePaceRepository(database)
	coursePaceModuleItemRepo := postgres.NewCoursePaceModuleItemRepository(database)
	// Phase 8B repositories
	collaborationRepo := postgres.NewCollaborationRepository(database)
	conferenceRepo := postgres.NewConferenceRepository(database)
	conferenceParticipantRepo := postgres.NewConferenceParticipantRepository(database)
	pageViewRepo := postgres.NewPageViewRepository(database)
	// Phase 8C repositories
	authProviderRepo := postgres.NewAuthenticationProviderRepository(database)

	// Initialize services
	userService := service.NewUserService(userRepo)
	courseService := service.NewCourseService(courseRepo, enrollmentRepo, sectionRepo)
	enrollmentService := service.NewEnrollmentService(enrollmentRepo)
	moduleService := service.NewModuleService(moduleRepo, moduleItemRepo)
	pageService := service.NewPageService(pageRepo)
	assignmentService := service.NewAssignmentService(assignmentRepo)
	assignmentGroupService := service.NewAssignmentGroupService(assignmentGroupRepo, assignmentRepo)
	submissionService := service.NewSubmissionService(submissionRepo, assignmentRepo, enrollmentRepo)
	gradingService := service.NewGradingService(submissionRepo, assignmentRepo, assignmentGroupRepo, enrollmentRepo)
	devKeyService := service.NewDeveloperKeyService(devKeyRepo)
	accessTokenService := service.NewAccessTokenService(accessTokenRepo)
	oauth2Service := service.NewOAuth2Service(devKeyService, accessTokenService)
	externalToolService := service.NewExternalToolService(externalToolRepo, devKeyRepo)

	// Determine platform issuer URL from frontend URL or fallback
	platformIssuer := cfg.FrontendURL
	ltiService, err := service.NewLTIService(devKeyRepo, ltiConfigRepo, nonceRepo, enrollmentRepo, courseRepo, platformIssuer)
	if err != nil {
		log.Fatalf("Failed to initialize LTI service: %v", err)
	}

	agsService := service.NewLTIAGSService(lineItemRepo, resultRepo, submissionRepo)
	nrpsService := service.NewLTINRPSService(enrollmentRepo, userRepo)
	// Phase 4 services
	discussionService := service.NewDiscussionService(discussionTopicRepo, discussionEntryRepo, discussionRatingRepo)
	fileService := service.NewFileService(folderRepo, attachmentRepo, cfg.FileStoragePath)
	sisImportService := service.NewSISImportService(sisBatchRepo, sisBatchErrorRepo, userRepo, courseRepo, sectionRepo, enrollmentRepo, database)
	// Phase 5 services
	quizService := service.NewQuizService(quizQuestionRepo, quizSubmissionRepo, quizSubmissionAnswerRepo)
	rubricService := service.NewRubricService(rubricRepo, rubricAssocRepo, rubricAssessRepo)
	gradingPeriodService := service.NewGradingPeriodService(gradingPeriodGroupRepo, gradingPeriodRepo)
	overrideService := service.NewOverrideService(assignmentOverrideRepo, assignmentOverrideStudentRepo, enrollmentRepo, sectionRepo)
	latePolicyService := service.NewLatePolicyService(latePolicyRepo)
	// Phase 6 services
	calendarService := service.NewCalendarService(calendarEventRepo)
	conversationService := service.NewConversationService(conversationRepo, conversationParticipantRepo, conversationMessageRepo)
	notificationService := service.NewNotificationService(notificationPrefRepo, notificationRepo)
	// Phase 7 services
	contentMigrationService := service.NewContentMigrationService(contentMigrationRepo)
	learningOutcomeService := service.NewLearningOutcomeService(outcomeGroupRepo, outcomeRepo, outcomeResultRepo)
	speedGraderService := service.NewSpeedGraderService(submissionRepo, submissionCommentRepo, assignmentRepo, enrollmentRepo, rubricAssessRepo)
	// Phase 8 services
	groupService := service.NewGroupService(groupCategoryRepo, groupRepo, groupMembershipRepo, enrollmentRepo)
	blueprintService := service.NewBlueprintService(blueprintTemplateRepo, blueprintSubscriptionRepo, blueprintMigrationRepo)
	coursePaceService := service.NewCoursePaceService(coursePaceRepo, coursePaceModuleItemRepo)
	// Phase 8B services
	collaborationService := service.NewCollaborationService(collaborationRepo)
	conferenceService := service.NewConferenceService(conferenceRepo, conferenceParticipantRepo)
	analyticsService := service.NewAnalyticsService(pageViewRepo, submissionRepo, enrollmentRepo, assignmentRepo)
	observerService := service.NewObserverService(enrollmentRepo, courseRepo, userRepo)
	// Phase 8C services
	authProviderService := service.NewAuthProviderService(authProviderRepo)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService, cfg.JWTSecret)
	accountHandler := handlers.NewAccountHandler(accountRepo)
	courseHandler := handlers.NewCourseHandler(courseService, enrollmentService)
	sectionHandler := handlers.NewSectionHandler(sectionRepo)
	enrollmentHandler := handlers.NewEnrollmentHandler(enrollmentService)
	moduleHandler := handlers.NewModuleHandler(moduleService)
	moduleItemHandler := handlers.NewModuleItemHandler(moduleService)
	pageHandler := handlers.NewPageHandler(pageService)
	assignmentHandler := handlers.NewAssignmentHandler(assignmentService)
	assignmentGroupHandler := handlers.NewAssignmentGroupHandler(assignmentGroupService)
	submissionHandler := handlers.NewSubmissionHandler(submissionService, submissionCommentRepo)
	gradebookHandler := handlers.NewGradebookHandler(gradingService)
	gradingStandardHandler := handlers.NewGradingStandardHandler(gradingStandardRepo)
	developerKeyHandler := handlers.NewDeveloperKeyHandler(devKeyService)
	accessTokenHandler := handlers.NewAccessTokenHandler(accessTokenService)
	oauth2Handler := handlers.NewOAuth2Handler(oauth2Service, devKeyService, accessTokenService, userService)
	externalToolHandler := handlers.NewExternalToolHandler(externalToolService, devKeyService)
	ltiHandler := handlers.NewLTIHandler(ltiService, agsService, nrpsService, externalToolRepo, ltiConfigRepo)
	// Phase 4 handlers
	discussionHandler := handlers.NewDiscussionHandler(discussionService)
	discussionEntryHandler := handlers.NewDiscussionEntryHandler(discussionService)
	fileHandler := handlers.NewFileHandler(fileService)
	folderHandler := handlers.NewFolderHandler(fileService)
	sisImportHandler := handlers.NewSISImportHandler(sisImportService)
	// Phase 5 handlers
	quizHandler := handlers.NewQuizHandler(quizRepo)
	quizQuestionHandler := handlers.NewQuizQuestionHandler(quizService)
	quizSubmissionHandler := handlers.NewQuizSubmissionHandler(quizService)
	rubricHandler := handlers.NewRubricHandler(rubricService)
	rubricAssessmentHandler := handlers.NewRubricAssessmentHandler(rubricService)
	gradingPeriodHandler := handlers.NewGradingPeriodHandler(gradingPeriodService)
	assignmentOverrideHandler := handlers.NewAssignmentOverrideHandler(overrideService)
	latePolicyHandler := handlers.NewLatePolicyHandler(latePolicyService)
	// Phase 6 handlers
	calendarEventHandler := handlers.NewCalendarEventHandler(calendarService)
	conversationHandler := handlers.NewConversationHandler(conversationService)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	// Phase 7 handlers
	contentMigrationHandler := handlers.NewContentMigrationHandler(contentMigrationService)
	learningOutcomeHandler := handlers.NewLearningOutcomeHandler(learningOutcomeService)
	speedGraderHandler := handlers.NewSpeedGraderHandler(speedGraderService)
	// Phase 8 handlers
	groupHandler := handlers.NewGroupHandler(groupService)
	blueprintHandler := handlers.NewBlueprintHandler(blueprintService)
	coursePaceHandler := handlers.NewCoursePaceHandler(coursePaceService)
	// Phase 8B handlers
	collaborationHandler := handlers.NewCollaborationHandler(collaborationService)
	conferenceHandler := handlers.NewConferenceHandler(conferenceService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	observerHandler := handlers.NewObserverHandler(observerService)
	// Phase 8C handlers
	graphqlResolver := graphql.NewResolver(courseService, assignmentService, userService, enrollmentService, moduleService, submissionService)
	graphqlHandler := handlers.NewGraphQLHandler(graphqlResolver)
	authProviderHandler := handlers.NewAuthProviderHandler(authProviderService)
	authMiddleware := middleware.NewAuthMiddleware(cfg.JWTSecret, accessTokenService, userRepo)

	// Create router
	router := v1.NewRouter(
		userHandler,
		accountHandler,
		courseHandler,
		sectionHandler,
		enrollmentHandler,
		moduleHandler,
		moduleItemHandler,
		pageHandler,
		assignmentHandler,
		assignmentGroupHandler,
		submissionHandler,
		gradebookHandler,
		gradingStandardHandler,
		developerKeyHandler,
		accessTokenHandler,
		oauth2Handler,
		externalToolHandler,
		ltiHandler,
		discussionHandler,
		discussionEntryHandler,
		fileHandler,
		folderHandler,
		sisImportHandler,
		// Phase 5
		quizHandler,
		quizQuestionHandler,
		quizSubmissionHandler,
		rubricHandler,
		rubricAssessmentHandler,
		gradingPeriodHandler,
		assignmentOverrideHandler,
		latePolicyHandler,
		// Phase 6
		calendarEventHandler,
		conversationHandler,
		notificationHandler,
		// Phase 7
		contentMigrationHandler,
		learningOutcomeHandler,
		speedGraderHandler,
		// Phase 8
		groupHandler,
		blueprintHandler,
		coursePaceHandler,
		// Phase 8B
		collaborationHandler,
		conferenceHandler,
		analyticsHandler,
		observerHandler,
		// Phase 8C
		graphqlHandler,
		authProviderHandler,
		authMiddleware,
	)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		BodyLimit: cfg.MaxUploadSize * 1024 * 1024, // Convert MB to bytes
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"errors": []fiber.Map{{"message": err.Error()}},
			})
		},
	})

	// Middleware
	app.Use(fiberlogger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.FrontendURL,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		ExposeHeaders:    "Link",
		AllowCredentials: true,
	}))

	// Register routes
	router.Register(app)

	// Start server
	log.Printf("Paper LMS starting on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
