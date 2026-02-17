package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/service"
)

type ContentMigrationHandler struct {
	migrationService *service.ContentMigrationService
}

func NewContentMigrationHandler(migrationService *service.ContentMigrationService) *ContentMigrationHandler {
	return &ContentMigrationHandler{migrationService: migrationService}
}

func contentMigrationToJSON(m *models.ContentMigration) fiber.Map {
	return fiber.Map{
		"id":                 m.ID,
		"course_id":          m.CourseID,
		"user_id":            m.UserID,
		"migration_type":     m.MigrationType,
		"source_course_id":   m.SourceCourseID,
		"workflow_state":     m.WorkflowState,
		"progress":           m.Progress,
		"migration_settings": m.MigrationSettings,
		"started_at":         m.StartedAt,
		"finished_at":        m.FinishedAt,
		"error_message":      m.ErrorMessage,
		"attachment":         m.Attachment,
		"created_at":         m.CreatedAt,
		"updated_at":         m.UpdatedAt,
	}
}

func (h *ContentMigrationHandler) ListMigrations(c *fiber.Ctx) error {
	courseID, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.migrationService.ListMigrations(c.Context(), uint(courseID), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch content migrations")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	migrations := make([]fiber.Map, len(result.Items))
	for i, m := range result.Items {
		migrations[i] = contentMigrationToJSON(&m)
	}

	return c.JSON(migrations)
}

func (h *ContentMigrationHandler) CreateMigration(c *fiber.Ctx) error {
	courseID, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	var input struct {
		ContentMigration struct {
			MigrationType     string `json:"migration_type"`
			SourceCourseID    *uint  `json:"source_course_id"`
			Settings          string `json:"settings"`
			MigrationSettings string `json:"migration_settings"`
		} `json:"content_migration"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	settings := input.ContentMigration.Settings
	if settings == "" {
		settings = input.ContentMigration.MigrationSettings
	}

	// Check for multipart file upload
	attachment := ""
	if file, fileErr := c.FormFile("attachment"); fileErr == nil && file != nil {
		uploadPath := "uploads/content_migrations/" + file.Filename
		if saveErr := c.SaveFile(file, uploadPath); saveErr != nil {
			return responses.InternalError(c, "Could not save uploaded file")
		}
		attachment = uploadPath
	}

	// Get user ID from auth context (default to 0 if not set)
	userID, _ := c.Locals("user_id").(uint)

	migration := &models.ContentMigration{
		CourseID:          uint(courseID),
		UserID:            userID,
		MigrationType:     input.ContentMigration.MigrationType,
		SourceCourseID:    input.ContentMigration.SourceCourseID,
		MigrationSettings: settings,
		Attachment:        attachment,
	}

	if err := h.migrationService.CreateMigration(c.Context(), migration); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(contentMigrationToJSON(migration))
}

func (h *ContentMigrationHandler) GetMigration(c *fiber.Ctx) error {
	migrationID, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid content migration ID")
	}

	migration, err := h.migrationService.GetMigration(c.Context(), uint(migrationID))
	if err != nil {
		return responses.NotFound(c, "content migration")
	}

	return c.JSON(contentMigrationToJSON(migration))
}

func (h *ContentMigrationHandler) UpdateMigration(c *fiber.Ctx) error {
	migrationID, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid content migration ID")
	}

	migration, err := h.migrationService.GetMigration(c.Context(), uint(migrationID))
	if err != nil {
		return responses.NotFound(c, "content migration")
	}

	var input struct {
		ContentMigration struct {
			WorkflowState     *string `json:"workflow_state"`
			MigrationSettings *string `json:"migration_settings"`
			Settings          *string `json:"settings"`
		} `json:"content_migration"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.ContentMigration.WorkflowState != nil {
		migration.WorkflowState = *input.ContentMigration.WorkflowState
	}
	if input.ContentMigration.MigrationSettings != nil {
		migration.MigrationSettings = *input.ContentMigration.MigrationSettings
	}
	if input.ContentMigration.Settings != nil {
		migration.MigrationSettings = *input.ContentMigration.Settings
	}

	if err := h.migrationService.UpdateMigration(c.Context(), migration); err != nil {
		return responses.InternalError(c, "Could not update content migration")
	}

	return c.JSON(contentMigrationToJSON(migration))
}
