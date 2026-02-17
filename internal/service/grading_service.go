package service

import (
	"context"
	"fmt"
	"math"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
)

type GradingService struct {
	submissionRepo repository.SubmissionRepository
	assignmentRepo repository.AssignmentRepository
	groupRepo      repository.AssignmentGroupRepository
	enrollmentRepo repository.EnrollmentRepository
}

func NewGradingService(submissionRepo repository.SubmissionRepository, assignmentRepo repository.AssignmentRepository, groupRepo repository.AssignmentGroupRepository, enrollmentRepo repository.EnrollmentRepository) *GradingService {
	return &GradingService{
		submissionRepo: submissionRepo,
		assignmentRepo: assignmentRepo,
		groupRepo:      groupRepo,
		enrollmentRepo: enrollmentRepo,
	}
}

type GradebookEntry struct {
	Students    []GradebookStudent                       `json:"students"`
	Assignments []GradebookAssignment                    `json:"assignments"`
	Submissions map[string]map[string]*models.Submission `json:"submissions"`
}

type GradebookStudent struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type GradebookAssignment struct {
	ID             uint     `json:"id"`
	Name           string   `json:"name"`
	PointsPossible *float64 `json:"points_possible"`
}

type StudentGrade struct {
	CurrentGrade string  `json:"current_grade"`
	CurrentScore float64 `json:"current_score"`
	FinalGrade   string  `json:"final_grade"`
	FinalScore   float64 `json:"final_score"`
}

func (s *GradingService) GetGradebook(ctx context.Context, courseID uint) (*GradebookEntry, error) {
	// Get all enrollments for the course (students)
	params := repository.PaginationParams{Page: 1, PerPage: 1000}
	enrollments, err := s.enrollmentRepo.ListByCourseID(ctx, courseID, params)
	if err != nil {
		return nil, err
	}

	// Get all assignments for the course
	assignments, err := s.assignmentRepo.ListByCourseID(ctx, courseID, params)
	if err != nil {
		return nil, err
	}

	// Get all submissions for the course
	allSubmissions, err := s.submissionRepo.BulkListByCourse(ctx, courseID, repository.PaginationParams{Page: 1, PerPage: 10000})
	if err != nil {
		return nil, err
	}

	// Build student list (only students)
	students := make([]GradebookStudent, 0)
	for _, e := range enrollments.Items {
		if e.Type == "StudentEnrollment" {
			name := ""
			if e.User != nil {
				name = e.User.Name
			}
			students = append(students, GradebookStudent{
				ID:   e.UserID,
				Name: name,
			})
		}
	}

	// Build assignment list
	gradebookAssignments := make([]GradebookAssignment, len(assignments.Items))
	for i, a := range assignments.Items {
		gradebookAssignments[i] = GradebookAssignment{
			ID:             a.ID,
			Name:           a.Name,
			PointsPossible: a.PointsPossible,
		}
	}

	// Build submissions map: student_id -> assignment_id -> submission
	submissionsMap := make(map[string]map[string]*models.Submission)
	for i, sub := range allSubmissions.Items {
		studentKey := fmt.Sprintf("%d", sub.UserID)
		assignmentKey := fmt.Sprintf("%d", sub.AssignmentID)
		if submissionsMap[studentKey] == nil {
			submissionsMap[studentKey] = make(map[string]*models.Submission)
		}
		submissionsMap[studentKey][assignmentKey] = &allSubmissions.Items[i]
	}

	return &GradebookEntry{
		Students:    students,
		Assignments: gradebookAssignments,
		Submissions: submissionsMap,
	}, nil
}

func (s *GradingService) GetStudentGrade(ctx context.Context, courseID, studentID uint) (*StudentGrade, error) {
	// Get all assignments for the course
	params := repository.PaginationParams{Page: 1, PerPage: 1000}
	assignments, err := s.assignmentRepo.ListByCourseID(ctx, courseID, params)
	if err != nil {
		return nil, err
	}

	// Get student submissions
	submissions, err := s.submissionRepo.ListByUserAndCourse(ctx, studentID, courseID)
	if err != nil {
		return nil, err
	}

	// Build submission lookup
	subByAssignment := make(map[uint]*models.Submission)
	for i, sub := range submissions {
		subByAssignment[sub.AssignmentID] = &submissions[i]
	}

	// Calculate current score (only graded assignments) and final score (all assignments)
	var currentEarned, currentPossible float64
	var finalEarned, finalPossible float64

	for _, a := range assignments.Items {
		if a.PointsPossible == nil || *a.PointsPossible <= 0 {
			continue
		}
		points := *a.PointsPossible
		finalPossible += points

		sub, exists := subByAssignment[a.ID]
		if exists && sub.Score != nil {
			currentEarned += *sub.Score
			currentPossible += points
			finalEarned += *sub.Score
		}
	}

	var currentScore, finalScore float64
	if currentPossible > 0 {
		currentScore = math.Round(currentEarned/currentPossible*10000) / 100
	}
	if finalPossible > 0 {
		finalScore = math.Round(finalEarned/finalPossible*10000) / 100
	}

	return &StudentGrade{
		CurrentGrade: scoreToLetterGrade(currentScore),
		CurrentScore: currentScore,
		FinalGrade:   scoreToLetterGrade(finalScore),
		FinalScore:   finalScore,
	}, nil
}

func scoreToLetterGrade(score float64) string {
	switch {
	case score >= 93:
		return "A"
	case score >= 90:
		return "A-"
	case score >= 87:
		return "B+"
	case score >= 83:
		return "B"
	case score >= 80:
		return "B-"
	case score >= 77:
		return "C+"
	case score >= 73:
		return "C"
	case score >= 70:
		return "C-"
	case score >= 67:
		return "D+"
	case score >= 63:
		return "D"
	case score >= 60:
		return "D-"
	default:
		return "F"
	}
}
