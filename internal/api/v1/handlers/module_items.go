package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/service"
)

type ModuleItemHandler struct {
	moduleService *service.ModuleService
}

func NewModuleItemHandler(moduleService *service.ModuleService) *ModuleItemHandler {
	return &ModuleItemHandler{moduleService: moduleService}
}

func (h *ModuleItemHandler) ListModuleItems(c *fiber.Ctx) error {
	moduleID, err := c.ParamsInt("module_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid module ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.moduleService.ListItems(c.Context(), uint(moduleID), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch module items")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	items := make([]fiber.Map, len(result.Items))
	for i, item := range result.Items {
		items[i] = moduleItemToJSON(&item)
	}

	return c.JSON(items)
}

func (h *ModuleItemHandler) GetModuleItem(c *fiber.Ctx) error {
	id, err := c.ParamsInt("item_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid item ID")
	}

	item, err := h.moduleService.GetItem(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "module item")
	}

	return c.JSON(moduleItemToJSON(item))
}

func (h *ModuleItemHandler) CreateModuleItem(c *fiber.Ctx) error {
	moduleID, err := c.ParamsInt("module_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid module ID")
	}

	var input struct {
		ModuleItem struct {
			Title       string `json:"title"`
			Type        string `json:"type"` // Page, Assignment, Quiz, ExternalUrl, SubHeader
			ContentID   *uint  `json:"content_id"`
			ExternalURL string `json:"external_url"`
			NewTab      bool   `json:"new_tab"`
			Position    int    `json:"position"`
			Indent      int    `json:"indent"`
		} `json:"module_item"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	contentType := itemTypeToContentType(input.ModuleItem.Type)

	item := &models.ContentTag{
		ContextModuleID: uint(moduleID),
		Title:           input.ModuleItem.Title,
		ContentType:     contentType,
		ContentID:       input.ModuleItem.ContentID,
		URL:             input.ModuleItem.ExternalURL,
		NewTab:          input.ModuleItem.NewTab,
		Position:        input.ModuleItem.Position,
		Indent:          input.ModuleItem.Indent,
		WorkflowState:   "active",
	}

	if err := h.moduleService.CreateItem(c.Context(), item); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(moduleItemToJSON(item))
}

func itemTypeToContentType(itemType string) string {
	switch itemType {
	case "Page":
		return "WikiPage"
	case "Assignment":
		return "Assignment"
	case "Quiz":
		return "Quizzes::Quiz"
	case "Discussion":
		return "DiscussionTopic"
	case "ExternalUrl":
		return "ExternalUrl"
	case "SubHeader":
		return "ContextModuleSubHeader"
	default:
		return itemType
	}
}
