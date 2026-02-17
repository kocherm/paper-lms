package service

import (
	"context"
	"errors"
	"time"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
)

type BlueprintService struct {
	tmplRepo repository.BlueprintTemplateRepository
	subRepo  repository.BlueprintSubscriptionRepository
	migRepo  repository.BlueprintMigrationRepository
}

func NewBlueprintService(
	tmplRepo repository.BlueprintTemplateRepository,
	subRepo repository.BlueprintSubscriptionRepository,
	migRepo repository.BlueprintMigrationRepository,
) *BlueprintService {
	return &BlueprintService{
		tmplRepo: tmplRepo,
		subRepo:  subRepo,
		migRepo:  migRepo,
	}
}

// GetOrCreateTemplate returns the existing template for a course, or creates a new one.
func (s *BlueprintService) GetOrCreateTemplate(ctx context.Context, courseID uint) (*models.BlueprintTemplate, error) {
	if courseID == 0 {
		return nil, errors.New("course_id is required")
	}

	template, err := s.tmplRepo.FindByCourseID(ctx, courseID)
	if err == nil {
		return template, nil
	}

	// Create a new template for this course
	template = &models.BlueprintTemplate{
		CourseID:               courseID,
		DefaultRestrictions:    "{}",
		UseDefaultRestrictions: true,
		WorkflowState:          "active",
	}
	if err := s.tmplRepo.Create(ctx, template); err != nil {
		return nil, err
	}
	return template, nil
}

// GetTemplate returns a template by ID.
func (s *BlueprintService) GetTemplate(ctx context.Context, id uint) (*models.BlueprintTemplate, error) {
	return s.tmplRepo.FindByID(ctx, id)
}

// UpdateTemplate updates an existing template.
func (s *BlueprintService) UpdateTemplate(ctx context.Context, template *models.BlueprintTemplate) error {
	if template.ID == 0 {
		return errors.New("template id is required")
	}
	return s.tmplRepo.Update(ctx, template)
}

// ListTemplates returns templates for a course.
func (s *BlueprintService) ListTemplates(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.BlueprintTemplate], error) {
	return s.tmplRepo.ListByCourseID(ctx, courseID, params)
}

// ListAssociatedCourses lists subscriptions (associated courses) for a template.
func (s *BlueprintService) ListAssociatedCourses(ctx context.Context, templateID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.BlueprintSubscription], error) {
	return s.subRepo.ListByTemplateID(ctx, templateID, params)
}

// UpdateAssociations reconciles the set of associated courses for a template.
// courseIDs that are not yet associated will be added; existing associations not in courseIDs will be removed.
func (s *BlueprintService) UpdateAssociations(ctx context.Context, templateID uint, courseIDs []uint) error {
	if templateID == 0 {
		return errors.New("template_id is required")
	}

	// Fetch all current subscriptions for this template
	existing, err := s.subRepo.ListByTemplateID(ctx, templateID, repository.PaginationParams{Page: 1, PerPage: 10000})
	if err != nil {
		return err
	}

	// Build a set of desired course IDs
	desired := make(map[uint]bool, len(courseIDs))
	for _, id := range courseIDs {
		desired[id] = true
	}

	// Build a set of currently active course IDs
	current := make(map[uint]uint, len(existing.Items)) // childCourseID -> subscriptionID
	for _, sub := range existing.Items {
		current[sub.ChildCourseID] = sub.ID
	}

	// Remove subscriptions that are no longer desired
	for childID, subID := range current {
		if !desired[childID] {
			if err := s.subRepo.Delete(ctx, subID); err != nil {
				return err
			}
		}
	}

	// Add new subscriptions
	for _, courseID := range courseIDs {
		if _, exists := current[courseID]; !exists {
			sub := &models.BlueprintSubscription{
				BlueprintTemplateID: templateID,
				ChildCourseID:       courseID,
				WorkflowState:       "active",
			}
			if err := s.subRepo.Create(ctx, sub); err != nil {
				return err
			}
		}
	}

	return nil
}

// TriggerSync creates a migration record for a blueprint sync.
// Since we don't have actual content sync, it completes immediately.
func (s *BlueprintService) TriggerSync(ctx context.Context, templateID, userID uint, comment string) (*models.BlueprintMigration, error) {
	if templateID == 0 {
		return nil, errors.New("template_id is required")
	}
	if userID == 0 {
		return nil, errors.New("user_id is required")
	}

	now := time.Now()
	migration := &models.BlueprintMigration{
		BlueprintTemplateID: templateID,
		UserID:              userID,
		WorkflowState:       "completed",
		Comment:             comment,
		ExportSettings:      "{}",
		CompletedAt:         &now,
	}

	if err := s.migRepo.Create(ctx, migration); err != nil {
		return nil, err
	}
	return migration, nil
}

// GetMigration returns a migration by ID.
func (s *BlueprintService) GetMigration(ctx context.Context, id uint) (*models.BlueprintMigration, error) {
	return s.migRepo.FindByID(ctx, id)
}

// ListMigrations lists migrations for a template.
func (s *BlueprintService) ListMigrations(ctx context.Context, templateID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.BlueprintMigration], error) {
	return s.migRepo.ListByTemplateID(ctx, templateID, params)
}

// GetUnsyncedChanges returns a placeholder empty list of unsynced changes.
func (s *BlueprintService) GetUnsyncedChanges(ctx context.Context, templateID uint) ([]interface{}, error) {
	return []interface{}{}, nil
}

// ListSubscriptions lists subscriptions for a child course.
func (s *BlueprintService) ListSubscriptions(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.BlueprintSubscription], error) {
	return s.subRepo.ListByChildCourseID(ctx, courseID, params)
}

// GetSubscription returns a subscription by ID.
func (s *BlueprintService) GetSubscription(ctx context.Context, id uint) (*models.BlueprintSubscription, error) {
	return s.subRepo.FindByID(ctx, id)
}

// ListSubscriptionMigrations lists migrations associated with a subscription.
func (s *BlueprintService) ListSubscriptionMigrations(ctx context.Context, subscriptionID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.BlueprintMigration], error) {
	return s.migRepo.ListBySubscriptionID(ctx, subscriptionID, params)
}
