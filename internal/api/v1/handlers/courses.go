package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/service"
)

type CourseHandler struct {
	courseService     *service.CourseService
	enrollmentService *service.EnrollmentService
}

func NewCourseHandler(courseService *service.CourseService, enrollmentService *service.EnrollmentService) *CourseHandler {
	return &CourseHandler{
		courseService:     courseService,
		enrollmentService: enrollmentService,
	}
}

func courseToJSON(c *models.Course) fiber.Map {
	return fiber.Map{
		"id":             c.ID,
		"account_id":     c.AccountID,
		"name":           c.Name,
		"course_code":    c.CourseCode,
		"workflow_state": c.WorkflowState,
		"start_at":       c.StartAt,
		"end_at":         c.EndAt,
		"default_view":   c.DefaultView,
		"syllabus_body":  c.SyllabusBody,
		"license":        c.License,
		"is_public":      c.IsPublic,
		"ui_mode":        c.UIMode,
		"created_at":     c.CreatedAt,
	}
}

func (h *CourseHandler) ListCourses(c *fiber.Ctx) error {
	params := middleware.GetPagination(c)
	userID := c.Locals("user_id").(uint)

	enrollmentType := c.Query("enrollment_type")

	var items []models.Course
	var totalCount int64
	var page, perPage int

	if enrollmentType != "" || c.Query("as_student") == "true" {
		r, err := h.courseService.ListForUser(c.Context(), userID, params)
		if err != nil {
			return responses.InternalError(c, "Could not fetch courses")
		}
		items = r.Items
		totalCount = r.TotalCount
		page = r.Page
		perPage = r.PerPage
	} else {
		r, err := h.courseService.List(c.Context(), params)
		if err != nil {
			return responses.InternalError(c, "Could not fetch courses")
		}
		items = r.Items
		totalCount = r.TotalCount
		page = r.Page
		perPage = r.PerPage
	}

	responses.SetPaginationHeaders(c, totalCount, page, perPage)

	courses := make([]fiber.Map, len(items))
	for i, course := range items {
		courses[i] = courseToJSON(&course)
	}

	return c.JSON(courses)
}

func (h *CourseHandler) GetCourse(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	course, err := h.courseService.GetByID(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "course")
	}

	return c.JSON(courseToJSON(course))
}

type createCourseRequest struct {
	Course struct {
		Name          string     `json:"name"`
		CourseCode    string     `json:"course_code"`
		StartAt       *time.Time `json:"start_at"`
		EndAt         *time.Time `json:"end_at"`
		DefaultView   string     `json:"default_view"`
		SyllabusBody  string     `json:"syllabus_body"`
		License       string     `json:"license"`
		IsPublic      bool       `json:"is_public"`
		UIMode        string     `json:"ui_mode"`
	} `json:"course"`
}

func (h *CourseHandler) CreateCourse(c *fiber.Ctx) error {
	var input createCourseRequest
	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	userID := c.Locals("user_id").(uint)

	course := &models.Course{
		Name:         input.Course.Name,
		CourseCode:   input.Course.CourseCode,
		StartAt:      input.Course.StartAt,
		EndAt:        input.Course.EndAt,
		DefaultView:  input.Course.DefaultView,
		SyllabusBody: input.Course.SyllabusBody,
		License:      input.Course.License,
		IsPublic:     input.Course.IsPublic,
		UIMode:       input.Course.UIMode,
	}

	if course.DefaultView == "" {
		course.DefaultView = "modules"
	}
	if course.UIMode == "" {
		course.UIMode = "standard"
	}

	if err := h.courseService.Create(c.Context(), course, userID); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(courseToJSON(course))
}

func (h *CourseHandler) UpdateCourse(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	course, err := h.courseService.GetByID(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "course")
	}

	var input struct {
		Course struct {
			Name          *string    `json:"name"`
			CourseCode    *string    `json:"course_code"`
			StartAt       *time.Time `json:"start_at"`
			EndAt         *time.Time `json:"end_at"`
			DefaultView   *string    `json:"default_view"`
			SyllabusBody  *string    `json:"syllabus_body"`
			License       *string    `json:"license"`
			IsPublic      *bool      `json:"is_public"`
			UIMode        *string    `json:"ui_mode"`
			WorkflowState *string    `json:"workflow_state"`
		} `json:"course"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.Course.Name != nil {
		course.Name = *input.Course.Name
	}
	if input.Course.CourseCode != nil {
		course.CourseCode = *input.Course.CourseCode
	}
	if input.Course.StartAt != nil {
		course.StartAt = input.Course.StartAt
	}
	if input.Course.EndAt != nil {
		course.EndAt = input.Course.EndAt
	}
	if input.Course.DefaultView != nil {
		course.DefaultView = *input.Course.DefaultView
	}
	if input.Course.SyllabusBody != nil {
		course.SyllabusBody = *input.Course.SyllabusBody
	}
	if input.Course.License != nil {
		course.License = *input.Course.License
	}
	if input.Course.IsPublic != nil {
		course.IsPublic = *input.Course.IsPublic
	}
	if input.Course.UIMode != nil {
		course.UIMode = *input.Course.UIMode
	}
	if input.Course.WorkflowState != nil {
		course.WorkflowState = *input.Course.WorkflowState
	}

	if err := h.courseService.Update(c.Context(), course); err != nil {
		return responses.InternalError(c, "Could not update course")
	}

	return c.JSON(courseToJSON(course))
}

func (h *CourseHandler) DeleteCourse(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	if err := h.courseService.Delete(c.Context(), uint(id)); err != nil {
		return responses.InternalError(c, "Could not delete course")
	}

	return c.JSON(fiber.Map{"delete": true})
}
