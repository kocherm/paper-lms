package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
	"github.com/kocherm/paper-lms/internal/service"
)

type SubmissionHandler struct {
	submissionService *service.SubmissionService
	commentRepo       repository.SubmissionCommentRepository
}

func NewSubmissionHandler(submissionService *service.SubmissionService, commentRepo repository.SubmissionCommentRepository) *SubmissionHandler {
	return &SubmissionHandler{
		submissionService: submissionService,
		commentRepo:       commentRepo,
	}
}

func submissionToJSON(s *models.Submission) fiber.Map {
	return fiber.Map{
		"id":              s.ID,
		"assignment_id":   s.AssignmentID,
		"user_id":         s.UserID,
		"submission_type": s.SubmissionType,
		"body":            s.Body,
		"url":             s.URL,
		"score":           s.Score,
		"grade":           s.Grade,
		"graded_at":       s.GradedAt,
		"grader_id":       s.GraderID,
		"submitted_at":    s.SubmittedAt,
		"attempt":         s.Attempt,
		"late":            s.Late,
		"missing":         s.Missing,
		"excused":         s.Excused,
		"workflow_state":  s.WorkflowState,
		"preview_url":     nil,
	}
}

func submissionCommentToJSON(sc *models.SubmissionComment) fiber.Map {
	return fiber.Map{
		"id":            sc.ID,
		"submission_id": sc.SubmissionID,
		"author_id":     sc.AuthorID,
		"comment":       sc.Comment,
		"draft":         sc.Draft,
		"created_at":    sc.CreatedAt,
		"updated_at":    sc.UpdatedAt,
	}
}

func (h *SubmissionHandler) ListSubmissions(c *fiber.Ctx) error {
	assignmentID, err := c.ParamsInt("assignment_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid assignment ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.submissionService.ListByAssignment(c.Context(), uint(assignmentID), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch submissions")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	submissions := make([]fiber.Map, len(result.Items))
	for i, s := range result.Items {
		submissions[i] = submissionToJSON(&s)
	}

	return c.JSON(submissions)
}

func (h *SubmissionHandler) GetSubmission(c *fiber.Ctx) error {
	assignmentID, err := c.ParamsInt("assignment_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid assignment ID")
	}

	userID, err := c.ParamsInt("user_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid user ID")
	}

	submission, err := h.submissionService.GetByAssignmentAndUser(c.Context(), uint(assignmentID), uint(userID))
	if err != nil {
		return responses.NotFound(c, "submission")
	}

	return c.JSON(submissionToJSON(submission))
}

func (h *SubmissionHandler) CreateSubmission(c *fiber.Ctx) error {
	assignmentID, err := c.ParamsInt("assignment_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid assignment ID")
	}

	userID := c.Locals("user_id").(uint)

	var input struct {
		Submission struct {
			SubmissionType string `json:"submission_type"`
			Body           string `json:"body"`
			URL            string `json:"url"`
		} `json:"submission"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	submission := &models.Submission{
		AssignmentID:   uint(assignmentID),
		UserID:         userID,
		SubmissionType: &input.Submission.SubmissionType,
		Body:           &input.Submission.Body,
	}

	if input.Submission.URL != "" {
		submission.URL = &input.Submission.URL
	}

	if err := h.submissionService.Create(c.Context(), submission); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(submissionToJSON(submission))
}

func (h *SubmissionHandler) UpdateSubmission(c *fiber.Ctx) error {
	assignmentID, err := c.ParamsInt("assignment_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid assignment ID")
	}

	userID, err := c.ParamsInt("user_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid user ID")
	}

	graderID := c.Locals("user_id").(uint)

	var input struct {
		Submission struct {
			PostedGrade string `json:"posted_grade"`
			Excused     *bool  `json:"excused"`
		} `json:"submission"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.Submission.PostedGrade != "" {
		submission, err := h.submissionService.Grade(c.Context(), uint(assignmentID), uint(userID), graderID, input.Submission.PostedGrade)
		if err != nil {
			return responses.BadRequest(c, err.Error())
		}
		return c.JSON(submissionToJSON(submission))
	}

	// Handle excused update
	if input.Submission.Excused != nil {
		submission, err := h.submissionService.GetByAssignmentAndUser(c.Context(), uint(assignmentID), uint(userID))
		if err != nil {
			return responses.NotFound(c, "submission")
		}
		submission.Excused = *input.Submission.Excused
		return c.JSON(submissionToJSON(submission))
	}

	return responses.BadRequest(c, "No valid update fields provided")
}

func (h *SubmissionHandler) CreateSubmissionComment(c *fiber.Ctx) error {
	assignmentID, err := c.ParamsInt("assignment_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid assignment ID")
	}

	userID, err := c.ParamsInt("user_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid user ID")
	}

	authorID := c.Locals("user_id").(uint)

	var input struct {
		Comment struct {
			TextComment string `json:"text_comment"`
		} `json:"comment"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.Comment.TextComment == "" {
		return responses.BadRequest(c, "Comment text is required")
	}

	// Find the submission to get its ID
	submission, err := h.submissionService.GetByAssignmentAndUser(c.Context(), uint(assignmentID), uint(userID))
	if err != nil {
		return responses.NotFound(c, "submission")
	}

	comment := &models.SubmissionComment{
		SubmissionID: submission.ID,
		AuthorID:     authorID,
		Comment:      input.Comment.TextComment,
	}

	if err := h.commentRepo.Create(c.Context(), comment); err != nil {
		return responses.InternalError(c, "Could not create comment")
	}

	return c.Status(fiber.StatusCreated).JSON(submissionCommentToJSON(comment))
}

func (h *SubmissionHandler) ListSubmissionComments(c *fiber.Ctx) error {
	assignmentID, err := c.ParamsInt("assignment_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid assignment ID")
	}

	userID, err := c.ParamsInt("user_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid user ID")
	}

	// Find the submission to get its ID
	submission, err := h.submissionService.GetByAssignmentAndUser(c.Context(), uint(assignmentID), uint(userID))
	if err != nil {
		return responses.NotFound(c, "submission")
	}

	comments, err := h.commentRepo.ListBySubmissionID(c.Context(), submission.ID)
	if err != nil {
		return responses.InternalError(c, "Could not fetch comments")
	}

	result := make([]fiber.Map, len(comments))
	for i, sc := range comments {
		result[i] = submissionCommentToJSON(&sc)
	}

	return c.JSON(result)
}
