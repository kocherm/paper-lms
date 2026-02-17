package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/service"
)

type ConversationHandler struct {
	conversationService *service.ConversationService
}

func NewConversationHandler(conversationService *service.ConversationService) *ConversationHandler {
	return &ConversationHandler{conversationService: conversationService}
}

func conversationToJSON(c *models.Conversation) fiber.Map {
	return fiber.Map{
		"id":                 c.ID,
		"subject":            c.Subject,
		"created_by_user_id": c.CreatedByUserID,
		"last_message_at":    c.LastMessageAt,
		"workflow_state":     c.WorkflowState,
		"created_at":         c.CreatedAt,
		"updated_at":         c.UpdatedAt,
	}
}

func conversationMessageToJSON(m *models.ConversationMessage) fiber.Map {
	return fiber.Map{
		"id":              m.ID,
		"conversation_id": m.ConversationID,
		"user_id":         m.UserID,
		"body":            m.Body,
		"workflow_state":  m.WorkflowState,
		"created_at":      m.CreatedAt,
		"updated_at":      m.UpdatedAt,
	}
}

func (h *ConversationHandler) ListConversations(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uint)

	params := middleware.GetPagination(c)

	result, err := h.conversationService.ListByUser(c.Context(), userID, params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch conversations")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	conversations := make([]fiber.Map, len(result.Items))
	for i, conv := range result.Items {
		conversations[i] = conversationToJSON(&conv)
	}

	return c.JSON(conversations)
}

func (h *ConversationHandler) GetConversation(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid conversation ID")
	}

	conv, err := h.conversationService.GetConversation(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "conversation")
	}

	return c.JSON(conversationToJSON(conv))
}

func (h *ConversationHandler) CreateConversation(c *fiber.Ctx) error {
	var input struct {
		Conversation struct {
			Subject    string `json:"subject"`
			Recipients []uint `json:"recipients"`
		} `json:"conversation"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	userID, _ := c.Locals("user_id").(uint)

	conv := &models.Conversation{
		Subject:         input.Conversation.Subject,
		CreatedByUserID: userID,
	}

	if err := h.conversationService.CreateConversation(c.Context(), conv, input.Conversation.Recipients); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(conversationToJSON(conv))
}

func (h *ConversationHandler) UpdateConversation(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid conversation ID")
	}

	conv, err := h.conversationService.GetConversation(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "conversation")
	}

	var input struct {
		Conversation struct {
			WorkflowState *string `json:"workflow_state"`
			Subject       *string `json:"subject"`
		} `json:"conversation"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.Conversation.WorkflowState != nil {
		conv.WorkflowState = *input.Conversation.WorkflowState
	}
	if input.Conversation.Subject != nil {
		conv.Subject = *input.Conversation.Subject
	}

	if err := h.conversationService.UpdateConversation(c.Context(), conv); err != nil {
		return responses.InternalError(c, "Could not update conversation")
	}

	return c.JSON(conversationToJSON(conv))
}

func (h *ConversationHandler) ListMessages(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid conversation ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.conversationService.ListMessages(c.Context(), uint(id), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch messages")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	messages := make([]fiber.Map, len(result.Items))
	for i, m := range result.Items {
		messages[i] = conversationMessageToJSON(&m)
	}

	return c.JSON(messages)
}

func (h *ConversationHandler) CreateMessage(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid conversation ID")
	}

	var input struct {
		Message string `json:"message"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	userID, _ := c.Locals("user_id").(uint)

	msg := &models.ConversationMessage{
		ConversationID: uint(id),
		UserID:         userID,
		Body:           input.Message,
	}

	if err := h.conversationService.CreateMessage(c.Context(), msg); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(conversationMessageToJSON(msg))
}

func (h *ConversationHandler) MarkAsRead(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid conversation ID")
	}

	userID, _ := c.Locals("user_id").(uint)

	if err := h.conversationService.MarkConversationAsRead(c.Context(), uint(id), userID); err != nil {
		return responses.InternalError(c, "Could not mark conversation as read")
	}

	return c.JSON(fiber.Map{"status": "ok"})
}
