package handlers

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
)

type GradingStandardHandler struct {
	repo repository.GradingStandardRepository
}

func NewGradingStandardHandler(repo repository.GradingStandardRepository) *GradingStandardHandler {
	return &GradingStandardHandler{repo: repo}
}

func gradingStandardToJSON(gs *models.GradingStandard) fiber.Map {
	var data interface{}
	_ = json.Unmarshal([]byte(gs.Data), &data)

	return fiber.Map{
		"id":             gs.ID,
		"title":          gs.Title,
		"context_type":   gs.ContextType,
		"context_id":     gs.ContextID,
		"data":           data,
		"workflow_state": gs.WorkflowState,
		"created_at":     gs.CreatedAt,
		"updated_at":     gs.UpdatedAt,
	}
}

func (h *GradingStandardHandler) ListGradingStandards(c *fiber.Ctx) error {
	courseID, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	standards, err := h.repo.ListByCourse(c.Context(), uint(courseID))
	if err != nil {
		return responses.InternalError(c, "Could not fetch grading standards")
	}

	result := make([]fiber.Map, len(standards))
	for i, gs := range standards {
		result[i] = gradingStandardToJSON(&gs)
	}

	return c.JSON(result)
}

func (h *GradingStandardHandler) CreateGradingStandard(c *fiber.Ctx) error {
	courseID, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	var input struct {
		GradingStandard struct {
			Title string          `json:"title"`
			Data  json.RawMessage `json:"data"`
		} `json:"grading_standard"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.GradingStandard.Title == "" {
		return responses.BadRequest(c, "Grading standard title is required")
	}

	dataStr := string(input.GradingStandard.Data)
	if dataStr == "" || dataStr == "null" {
		return responses.BadRequest(c, "Grading standard data is required")
	}

	standard := &models.GradingStandard{
		ContextType:   "Course",
		ContextID:     uint(courseID),
		Title:         input.GradingStandard.Title,
		Data:          dataStr,
		WorkflowState: "active",
	}

	if err := h.repo.Create(c.Context(), standard); err != nil {
		return responses.InternalError(c, "Could not create grading standard")
	}

	return c.Status(fiber.StatusCreated).JSON(gradingStandardToJSON(standard))
}
