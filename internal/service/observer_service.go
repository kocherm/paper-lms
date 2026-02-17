package service

import (
	"context"
	"errors"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
)

// ObserverEnrollmentRepository defines the enrollment repo methods needed by the
// observer service. The main EnrollmentRepository interface will be extended with
// an Update method by the main thread; this consumer-side interface ensures
// compile-time safety without modifying shared interface files.
type ObserverEnrollmentRepository interface {
	Create(ctx context.Context, enrollment *models.Enrollment) error
	FindByID(ctx context.Context, id uint) (*models.Enrollment, error)
	ListByCourseID(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Enrollment], error)
	ListByUserID(ctx context.Context, userID uint) ([]models.Enrollment, error)
	FindByUserAndCourse(ctx context.Context, userID, courseID uint) (*models.Enrollment, error)
	Update(ctx context.Context, enrollment *models.Enrollment) error
}

type ObserverService struct {
	enrollmentRepo ObserverEnrollmentRepository
	courseRepo      repository.CourseRepository
	userRepo        repository.UserRepository
}

func NewObserverService(
	enrollmentRepo ObserverEnrollmentRepository,
	courseRepo repository.CourseRepository,
	userRepo repository.UserRepository,
) *ObserverService {
	return &ObserverService{
		enrollmentRepo: enrollmentRepo,
		courseRepo:      courseRepo,
		userRepo:        userRepo,
	}
}

// LinkObserverToStudent creates an ObserverEnrollment for each active course the
// student is enrolled in. The AssociatedUserID on each enrollment is set to the
// student's user ID so the observer is linked to that student.
func (s *ObserverService) LinkObserverToStudent(ctx context.Context, observerUserID, studentUserID uint) error {
	// Validate that the observer user exists.
	_, err := s.userRepo.FindByID(ctx, observerUserID)
	if err != nil {
		return errors.New("observer user not found")
	}

	// Validate that the student user exists.
	_, err = s.userRepo.FindByID(ctx, studentUserID)
	if err != nil {
		return errors.New("student user not found")
	}

	// Check if the observer is already linked to this student.
	already, err := s.IsObserverOf(ctx, observerUserID, studentUserID)
	if err != nil {
		return err
	}
	if already {
		return errors.New("observer is already linked to this student")
	}

	// Get all active enrollments for the student.
	studentEnrollments, err := s.enrollmentRepo.ListByUserID(ctx, studentUserID)
	if err != nil {
		return errors.New("could not fetch student enrollments")
	}

	if len(studentEnrollments) == 0 {
		return errors.New("student has no active enrollments")
	}

	// Create an ObserverEnrollment in each course the student is enrolled in.
	for _, se := range studentEnrollments {
		if se.WorkflowState != "active" {
			continue
		}

		enrollment := &models.Enrollment{
			UserID:           observerUserID,
			CourseID:         se.CourseID,
			CourseSectionID:  se.CourseSectionID,
			Type:             "ObserverEnrollment",
			Role:             "ObserverEnrollment",
			WorkflowState:    "active",
			AssociatedUserID: &studentUserID,
		}

		if err := s.enrollmentRepo.Create(ctx, enrollment); err != nil {
			return err
		}
	}

	return nil
}

// UnlinkObserver removes observer enrollments for the given student by setting
// the workflow_state to "deleted" on each matching ObserverEnrollment.
func (s *ObserverService) UnlinkObserver(ctx context.Context, observerUserID, studentUserID uint) error {
	enrollments, err := s.enrollmentRepo.ListByUserID(ctx, observerUserID)
	if err != nil {
		return errors.New("could not fetch observer enrollments")
	}

	found := false
	for _, e := range enrollments {
		if e.Type != "ObserverEnrollment" {
			continue
		}
		if e.AssociatedUserID == nil || *e.AssociatedUserID != studentUserID {
			continue
		}

		found = true
		e.WorkflowState = "deleted"
		if err := s.enrollmentRepo.Update(ctx, &e); err != nil {
			return err
		}
	}

	if !found {
		return errors.New("observer is not linked to this student")
	}

	return nil
}

// ListObservedStudents returns a list of unique student user IDs the observer is
// linked to, derived from active ObserverEnrollment records where
// associated_user_id is not null.
func (s *ObserverService) ListObservedStudents(ctx context.Context, observerUserID uint) ([]uint, error) {
	enrollments, err := s.enrollmentRepo.ListByUserID(ctx, observerUserID)
	if err != nil {
		return nil, errors.New("could not fetch observer enrollments")
	}

	seen := make(map[uint]bool)
	var studentIDs []uint

	for _, e := range enrollments {
		if e.Type != "ObserverEnrollment" {
			continue
		}
		if e.AssociatedUserID == nil {
			continue
		}
		if e.WorkflowState != "active" {
			continue
		}
		if !seen[*e.AssociatedUserID] {
			seen[*e.AssociatedUserID] = true
			studentIDs = append(studentIDs, *e.AssociatedUserID)
		}
	}

	return studentIDs, nil
}

// IsObserverOf checks whether the observer has an active ObserverEnrollment
// linked to the given student.
func (s *ObserverService) IsObserverOf(ctx context.Context, observerUserID, studentUserID uint) (bool, error) {
	enrollments, err := s.enrollmentRepo.ListByUserID(ctx, observerUserID)
	if err != nil {
		return false, errors.New("could not fetch observer enrollments")
	}

	for _, e := range enrollments {
		if e.Type != "ObserverEnrollment" {
			continue
		}
		if e.AssociatedUserID == nil {
			continue
		}
		if e.WorkflowState != "active" {
			continue
		}
		if *e.AssociatedUserID == studentUserID {
			return true, nil
		}
	}

	return false, nil
}

// GetObserverDashboard returns the courses where the observer has an active
// ObserverEnrollment.
func (s *ObserverService) GetObserverDashboard(ctx context.Context, observerUserID uint) ([]models.Course, error) {
	enrollments, err := s.enrollmentRepo.ListByUserID(ctx, observerUserID)
	if err != nil {
		return nil, errors.New("could not fetch observer enrollments")
	}

	seen := make(map[uint]bool)
	var courses []models.Course

	for _, e := range enrollments {
		if e.Type != "ObserverEnrollment" {
			continue
		}
		if e.WorkflowState != "active" {
			continue
		}
		if seen[e.CourseID] {
			continue
		}
		seen[e.CourseID] = true

		course, err := s.courseRepo.FindByID(ctx, e.CourseID)
		if err != nil {
			continue
		}
		courses = append(courses, *course)
	}

	return courses, nil
}
