package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/service"
)

// SpeedGraderHandler handles SpeedGrader-related API endpoints.
type SpeedGraderHandler struct {
	speedGraderService *service.SpeedGraderService
}

// NewSpeedGraderHandler creates a new SpeedGraderHandler.
func NewSpeedGraderHandler(speedGraderService *service.SpeedGraderService) *SpeedGraderHandler {
	return &SpeedGraderHandler{speedGraderService: speedGraderService}
}

// GetSpeedGraderData returns the full SpeedGrader data set for an assignment,
// including the assignment, all enrolled students, their submissions, and comments.
// GET /courses/:course_id/assignments/:assignment_id/speedgrader
func (h *SpeedGraderHandler) GetSpeedGraderData(c *fiber.Ctx) error {
	courseID, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	assignmentID, err := c.ParamsInt("assignment_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid assignment ID")
	}

	data, err := h.speedGraderService.GetSpeedGraderData(c.Context(), uint(courseID), uint(assignmentID))
	if err != nil {
		return responses.InternalError(c, "Could not fetch SpeedGrader data")
	}

	// Build the response with assignment details and students
	studentsJSON := make([]fiber.Map, len(data.Students))
	for i, student := range data.Students {
		var submissionJSON fiber.Map
		if student.Submission != nil {
			submissionJSON = fiber.Map{
				"id":              student.Submission.ID,
				"assignment_id":   student.Submission.AssignmentID,
				"user_id":         student.Submission.UserID,
				"submission_type": student.Submission.SubmissionType,
				"body":            student.Submission.Body,
				"url":             student.Submission.URL,
				"score":           student.Submission.Score,
				"grade":           student.Submission.Grade,
				"graded_at":       student.Submission.GradedAt,
				"grader_id":       student.Submission.GraderID,
				"submitted_at":    student.Submission.SubmittedAt,
				"attempt":         student.Submission.Attempt,
				"late":            student.Submission.Late,
				"missing":         student.Submission.Missing,
				"excused":         student.Submission.Excused,
				"workflow_state":  student.Submission.WorkflowState,
			}
		}

		commentsJSON := make([]fiber.Map, len(student.Comments))
		for j, comment := range student.Comments {
			commentsJSON[j] = fiber.Map{
				"id":            comment.ID,
				"submission_id": comment.SubmissionID,
				"author_id":     comment.AuthorID,
				"comment":       comment.Comment,
				"draft":         comment.Draft,
				"created_at":    comment.CreatedAt,
				"updated_at":    comment.UpdatedAt,
			}
		}

		studentsJSON[i] = fiber.Map{
			"user_id":    student.UserID,
			"user_name":  student.UserName,
			"submission": submissionJSON,
			"comments":   commentsJSON,
		}
	}

	return c.JSON(fiber.Map{
		"assignment": fiber.Map{
			"id":               data.Assignment.ID,
			"course_id":        data.Assignment.CourseID,
			"name":             data.Assignment.Name,
			"description":      data.Assignment.Description,
			"due_at":           data.Assignment.DueAt,
			"points_possible":  data.Assignment.PointsPossible,
			"grading_type":     data.Assignment.GradingType,
			"submission_types": data.Assignment.SubmissionTypes,
			"published":        data.Assignment.Published,
		},
		"students": studentsJSON,
	})
}

// GetStudentSubmission returns a single student's submission with comments
// for the given assignment.
// GET /courses/:course_id/assignments/:assignment_id/speedgrader/submissions/:user_id
func (h *SpeedGraderHandler) GetStudentSubmission(c *fiber.Ctx) error {
	_, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	assignmentID, err := c.ParamsInt("assignment_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid assignment ID")
	}

	userID, err := c.ParamsInt("user_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid user ID")
	}

	data, err := h.speedGraderService.GetStudentSubmission(c.Context(), uint(assignmentID), uint(userID))
	if err != nil {
		return responses.InternalError(c, "Could not fetch student submission")
	}

	var submissionJSON fiber.Map
	if data.Submission != nil {
		submissionJSON = fiber.Map{
			"id":              data.Submission.ID,
			"assignment_id":   data.Submission.AssignmentID,
			"user_id":         data.Submission.UserID,
			"submission_type": data.Submission.SubmissionType,
			"body":            data.Submission.Body,
			"url":             data.Submission.URL,
			"score":           data.Submission.Score,
			"grade":           data.Submission.Grade,
			"graded_at":       data.Submission.GradedAt,
			"grader_id":       data.Submission.GraderID,
			"submitted_at":    data.Submission.SubmittedAt,
			"attempt":         data.Submission.Attempt,
			"late":            data.Submission.Late,
			"missing":         data.Submission.Missing,
			"excused":         data.Submission.Excused,
			"workflow_state":  data.Submission.WorkflowState,
		}
	}

	commentsJSON := make([]fiber.Map, len(data.Comments))
	for i, comment := range data.Comments {
		commentsJSON[i] = fiber.Map{
			"id":            comment.ID,
			"submission_id": comment.SubmissionID,
			"author_id":     comment.AuthorID,
			"comment":       comment.Comment,
			"draft":         comment.Draft,
			"created_at":    comment.CreatedAt,
			"updated_at":    comment.UpdatedAt,
		}
	}

	return c.JSON(fiber.Map{
		"submission": submissionJSON,
		"comments":   commentsJSON,
	})
}
