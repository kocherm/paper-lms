package service

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
)

type SubmissionService struct {
	submissionRepo repository.SubmissionRepository
	assignmentRepo repository.AssignmentRepository
	enrollmentRepo repository.EnrollmentRepository
}

func NewSubmissionService(submissionRepo repository.SubmissionRepository, assignmentRepo repository.AssignmentRepository, enrollmentRepo repository.EnrollmentRepository) *SubmissionService {
	return &SubmissionService{
		submissionRepo: submissionRepo,
		assignmentRepo: assignmentRepo,
		enrollmentRepo: enrollmentRepo,
	}
}

func (s *SubmissionService) Create(ctx context.Context, submission *models.Submission) error {
	// Validate assignment exists
	assignment, err := s.assignmentRepo.FindByID(ctx, submission.AssignmentID)
	if err != nil {
		return errors.New("assignment not found")
	}

	if submission.SubmissionType == nil || *submission.SubmissionType == "" {
		return errors.New("submission_type is required")
	}

	now := time.Now()
	submission.SubmittedAt = &now
	submission.Attempt = 1
	submission.WorkflowState = "submitted"

	// Check if late
	if assignment.DueAt != nil && now.After(*assignment.DueAt) {
		submission.Late = true
	}

	// Check for existing submission and increment attempt
	existing, _ := s.submissionRepo.FindByAssignmentAndUser(ctx, submission.AssignmentID, submission.UserID)
	if existing != nil {
		existing.SubmissionType = submission.SubmissionType
		existing.Body = submission.Body
		existing.URL = submission.URL
		existing.SubmittedAt = &now
		existing.Attempt = existing.Attempt + 1
		existing.Late = submission.Late
		existing.WorkflowState = "submitted"
		*submission = *existing
		return s.submissionRepo.Update(ctx, submission)
	}

	return s.submissionRepo.Create(ctx, submission)
}

func (s *SubmissionService) GetByAssignmentAndUser(ctx context.Context, assignmentID, userID uint) (*models.Submission, error) {
	return s.submissionRepo.FindByAssignmentAndUser(ctx, assignmentID, userID)
}

func (s *SubmissionService) ListByAssignment(ctx context.Context, assignmentID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Submission], error) {
	return s.submissionRepo.ListByAssignmentID(ctx, assignmentID, params)
}

func (s *SubmissionService) BulkListByCourse(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Submission], error) {
	return s.submissionRepo.BulkListByCourse(ctx, courseID, params)
}

func (s *SubmissionService) Grade(ctx context.Context, assignmentID, userID, graderID uint, postedGrade string) (*models.Submission, error) {
	submission, err := s.submissionRepo.FindByAssignmentAndUser(ctx, assignmentID, userID)
	if err != nil {
		return nil, errors.New("submission not found")
	}

	score, err := strconv.ParseFloat(postedGrade, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid grade value: %s", postedGrade)
	}

	now := time.Now()
	submission.Score = &score
	submission.Grade = &postedGrade
	submission.GradedAt = &now
	submission.GraderID = &graderID
	submission.WorkflowState = "graded"

	if err := s.submissionRepo.Update(ctx, submission); err != nil {
		return nil, err
	}

	return submission, nil
}
