package db

import (
	"fmt"
	"log"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)

	log.Println("Connected to PostgreSQL database")
	return db, nil
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Account{},
		&models.Course{},
		&models.CourseSection{},
		&models.Enrollment{},
		&models.ContextModule{},
		&models.ContentTag{},
		&models.WikiPage{},
		&models.Assignment{},
		&models.Quiz{},
		&models.AssignmentGroup{},
		&models.Submission{},
		&models.SubmissionComment{},
		&models.GradingStandard{},
		// Phase 3: OAuth2, Personal Access Tokens, LTI 1.3
		&models.DeveloperKey{},
		&models.AccessToken{},
		&models.LTIToolConfiguration{},
		&models.ContextExternalTool{},
		&models.LTIResourceLink{},
		&models.LTILineItem{},
		&models.LTIResult{},
		&models.Nonce{},
		// Phase 4: Discussions, Files, SIS
		&models.DiscussionTopic{},
		&models.DiscussionEntry{},
		&models.DiscussionEntryRating{},
		&models.Folder{},
		&models.Attachment{},
		&models.SISBatch{},
		&models.SISBatchError{},
		// Phase 5: Quiz Engine, Rubrics, Grading Periods, Overrides
		&models.QuizQuestion{},
		&models.QuizSubmission{},
		&models.QuizSubmissionAnswer{},
		&models.Rubric{},
		&models.RubricAssociation{},
		&models.RubricAssessment{},
		&models.GradingPeriodGroup{},
		&models.GradingPeriod{},
		&models.AssignmentOverride{},
		&models.AssignmentOverrideStudent{},
		&models.LatePolicy{},
		// Phase 6: Calendar, Messaging, Notifications
		&models.CalendarEvent{},
		&models.Conversation{},
		&models.ConversationParticipant{},
		&models.ConversationMessage{},
		&models.NotificationPreference{},
		&models.Notification{},
		// Phase 7: Content Migration, Learning Outcomes
		&models.ContentMigration{},
		&models.LearningOutcomeGroup{},
		&models.LearningOutcome{},
		&models.LearningOutcomeResult{},
		// Phase 8: Groups, Blueprint Courses, Course Pacing
		&models.GroupCategory{},
		&models.Group{},
		&models.GroupMembership{},
		&models.BlueprintTemplate{},
		&models.BlueprintSubscription{},
		&models.BlueprintMigration{},
		&models.CoursePace{},
		&models.CoursePaceModuleItem{},
		// Phase 8: Collaborations, Conferences, Analytics
		&models.Collaboration{},
		&models.Conference{},
		&models.ConferenceParticipant{},
		&models.PageView{},
		// Phase 8C: Authentication Providers
		&models.AuthenticationProvider{},
		// Phase 9: Discussion V2
		&models.DiscussionEntryParticipant{},
		&models.DiscussionTopicParticipant{},
		&models.DiscussionEntryVersion{},
		// Phase 10: Announcements, Enrollment Terms
		&models.Announcement{},
		&models.AnnouncementReadReceipt{},
		&models.EnrollmentTerm{},
		// Phase 10B: Notification Delivery, Audit Logs
		&models.CommunicationChannel{},
		&models.NotificationDelivery{},
		&models.AuditLog{},
		&models.GradeChangeLog{},
		// Phase 10C: Custom Roles, OneRoster, Document Annotations
		&models.CustomRole{},
		&models.RoleOverride{},
		&models.OneRosterConnection{},
		&models.OneRosterSyncLog{},
		&models.DocumentAnnotation{},
		// Phase 12: COPPA, FERPA, Accommodations, Attendance, Portfolios
		&models.ParentalConsent{},
		&models.DataProcessingAgreement{},
		&models.AgeVerification{},
		&models.DataRetentionPolicy{},
		&models.DataDeletionRequest{},
		&models.DataExportRequest{},
		&models.PIIAccessLog{},
		&models.StudentAccommodation{},
		&models.AccommodationApplication{},
		&models.AttendanceRecord{},
		&models.Portfolio{},
		&models.PortfolioSection{},
		&models.PortfolioArtifact{},
		&models.PortfolioReflection{},
		&models.PortfolioTemplate{},
		&models.PortfolioComment{},
		// Course Home Engine
		&models.CourseHomeButton{},
		&models.TodaysLessonOverride{},
		&models.CourseVisit{},
	)
}

func SeedDefaultAccount(db *gorm.DB) error {
	var count int64
	db.Model(&models.Account{}).Count(&count)
	if count == 0 {
		account := models.Account{
			Name:          "Paper LMS",
			WorkflowState: "active",
		}
		if err := db.Create(&account).Error; err != nil {
			return fmt.Errorf("failed to seed default account: %w", err)
		}
		log.Println("Created default account: Paper LMS")
	}
	return nil
}
