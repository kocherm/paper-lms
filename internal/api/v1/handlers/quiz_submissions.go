package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/service"
)

type QuizSubmissionHandler struct {
	quizService *service.QuizService
}

func NewQuizSubmissionHandler(quizService *service.QuizService) *QuizSubmissionHandler {
	return &QuizSubmissionHandler{quizService: quizService}
}

func quizSubmissionToJSON(qs *models.QuizSubmission) fiber.Map {
	return fiber.Map{
		"id":               qs.ID,
		"quiz_id":          qs.QuizID,
		"user_id":          qs.UserID,
		"submission_id":    qs.SubmissionID,
		"attempt":          qs.Attempt,
		"score":            qs.Score,
		"kept_score":       qs.KeptScore,
		"started_at":       qs.StartedAt,
		"finished_at":      qs.FinishedAt,
		"end_at":           qs.EndAt,
		"time_spent":       qs.TimeSpent,
		"workflow_state":   qs.WorkflowState,
		"validation_token": qs.ValidationToken,
		"created_at":       qs.CreatedAt,
		"updated_at":       qs.UpdatedAt,
	}
}

func quizSubmissionAnswerToJSON(a *models.QuizSubmissionAnswer) fiber.Map {
	return fiber.Map{
		"id":                 a.ID,
		"quiz_submission_id": a.QuizSubmissionID,
		"question_id":        a.QuestionID,
		"answer":             a.Answer,
		"correct":            a.Correct,
		"points":             a.Points,
		"created_at":         a.CreatedAt,
		"updated_at":         a.UpdatedAt,
	}
}

// StartSubmission handles POST /courses/:course_id/quizzes/:quiz_id/submissions
func (h *QuizSubmissionHandler) StartSubmission(c *fiber.Ctx) error {
	quizID, err := c.ParamsInt("quiz_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid quiz ID")
	}

	userID := c.Locals("user_id").(uint)

	var input struct {
		TimeLimit *int `json:"time_limit"` // optional override in minutes
	}
	// Body is optional for starting a submission
	_ = c.BodyParser(&input)

	submission, err := h.quizService.StartSubmission(c.Context(), uint(quizID), userID, input.TimeLimit)
	if err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"quiz_submissions": []fiber.Map{quizSubmissionToJSON(submission)},
	})
}

// GetSubmission handles GET /courses/:course_id/quizzes/:quiz_id/submissions/:submission_id
func (h *QuizSubmissionHandler) GetSubmission(c *fiber.Ctx) error {
	submissionID, err := c.ParamsInt("submission_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid submission ID")
	}

	submission, err := h.quizService.GetSubmission(c.Context(), uint(submissionID))
	if err != nil {
		return responses.NotFound(c, "quiz submission")
	}

	return c.JSON(fiber.Map{
		"quiz_submissions": []fiber.Map{quizSubmissionToJSON(submission)},
	})
}

// AnswerQuestion handles PUT /courses/:course_id/quizzes/:quiz_id/submissions/:submission_id/questions/:question_id
func (h *QuizSubmissionHandler) AnswerQuestion(c *fiber.Ctx) error {
	submissionID, err := c.ParamsInt("submission_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid submission ID")
	}

	questionID, err := c.ParamsInt("question_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid question ID")
	}

	var input struct {
		Answer string `json:"answer"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	answer, err := h.quizService.AnswerQuestion(c.Context(), uint(submissionID), uint(questionID), input.Answer)
	if err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.JSON(quizSubmissionAnswerToJSON(answer))
}

// CompleteSubmission handles POST /courses/:course_id/quizzes/:quiz_id/submissions/:submission_id/complete
func (h *QuizSubmissionHandler) CompleteSubmission(c *fiber.Ctx) error {
	submissionID, err := c.ParamsInt("submission_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid submission ID")
	}

	userID := c.Locals("user_id").(uint)

	submission, err := h.quizService.CompleteSubmission(c.Context(), uint(submissionID), userID)
	if err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.JSON(fiber.Map{
		"quiz_submissions": []fiber.Map{quizSubmissionToJSON(submission)},
	})
}

// ListSubmissions handles GET /courses/:course_id/quizzes/:quiz_id/submissions
func (h *QuizSubmissionHandler) ListSubmissions(c *fiber.Ctx) error {
	quizID, err := c.ParamsInt("quiz_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid quiz ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.quizService.ListSubmissions(c.Context(), uint(quizID), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch quiz submissions")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	submissions := make([]fiber.Map, len(result.Items))
	for i, qs := range result.Items {
		submissions[i] = quizSubmissionToJSON(&qs)
	}

	return c.JSON(fiber.Map{
		"quiz_submissions": submissions,
	})
}
