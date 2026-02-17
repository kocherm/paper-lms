package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/service"
)

type GroupHandler struct {
	groupService *service.GroupService
}

func NewGroupHandler(groupService *service.GroupService) *GroupHandler {
	return &GroupHandler{groupService: groupService}
}

// ---- JSON converters ----

func groupCategoryToJSON(c *models.GroupCategory) fiber.Map {
	return fiber.Map{
		"id":             c.ID,
		"course_id":      c.CourseID,
		"account_id":     c.AccountID,
		"name":           c.Name,
		"self_signup":    c.SelfSignup,
		"group_limit":    c.GroupLimit,
		"auto_leader":    c.AutoLeader,
		"role":           c.Role,
		"workflow_state": c.WorkflowState,
		"created_at":     c.CreatedAt,
		"updated_at":     c.UpdatedAt,
	}
}

func groupToJSON(g *models.Group) fiber.Map {
	return fiber.Map{
		"id":                g.ID,
		"group_category_id": g.GroupCategoryID,
		"name":              g.Name,
		"description":       g.Description,
		"max_membership":    g.MaxMembership,
		"is_public":         g.IsPublic,
		"join_level":        g.JoinLevel,
		"context_type":      g.ContextType,
		"context_id":        g.ContextID,
		"workflow_state":    g.WorkflowState,
		"created_at":        g.CreatedAt,
		"updated_at":        g.UpdatedAt,
	}
}

func groupMembershipToJSON(m *models.GroupMembership) fiber.Map {
	result := fiber.Map{
		"id":             m.ID,
		"group_id":       m.GroupID,
		"user_id":        m.UserID,
		"workflow_state": m.WorkflowState,
		"moderator":      m.Moderator,
		"created_at":     m.CreatedAt,
		"updated_at":     m.UpdatedAt,
	}
	if m.User != nil {
		result["user"] = fiber.Map{
			"id":            m.User.ID,
			"name":          m.User.Name,
			"sortable_name": m.User.SortableName,
			"short_name":    m.User.ShortName,
			"login_id":      m.User.LoginID,
			"email":         m.User.Email,
		}
	}
	return result
}

// ---- Group Category handlers ----

func (h *GroupHandler) ListGroupCategories(c *fiber.Ctx) error {
	courseID, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.groupService.ListCategoriesByCourse(c.Context(), uint(courseID), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch group categories")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	categories := make([]fiber.Map, len(result.Items))
	for i, cat := range result.Items {
		categories[i] = groupCategoryToJSON(&cat)
	}

	return c.JSON(categories)
}

func (h *GroupHandler) CreateGroupCategory(c *fiber.Ctx) error {
	courseID, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	var input struct {
		GroupCategory struct {
			Name       string `json:"name"`
			SelfSignup string `json:"self_signup"`
			GroupLimit *int   `json:"group_limit"`
			AutoLeader string `json:"auto_leader"`
			Role       string `json:"role"`
		} `json:"group_category"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	cid := uint(courseID)
	category := &models.GroupCategory{
		CourseID:   &cid,
		Name:       input.GroupCategory.Name,
		SelfSignup: input.GroupCategory.SelfSignup,
		GroupLimit: input.GroupCategory.GroupLimit,
		AutoLeader: input.GroupCategory.AutoLeader,
		Role:       input.GroupCategory.Role,
	}

	if err := h.groupService.CreateCategory(c.Context(), category); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(groupCategoryToJSON(category))
}

func (h *GroupHandler) GetGroupCategory(c *fiber.Ctx) error {
	id, err := c.ParamsInt("category_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid category ID")
	}

	category, err := h.groupService.GetCategory(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "group category")
	}

	return c.JSON(groupCategoryToJSON(category))
}

func (h *GroupHandler) UpdateGroupCategory(c *fiber.Ctx) error {
	id, err := c.ParamsInt("category_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid category ID")
	}

	category, err := h.groupService.GetCategory(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "group category")
	}

	var input struct {
		GroupCategory struct {
			Name       *string `json:"name"`
			SelfSignup *string `json:"self_signup"`
			GroupLimit *int    `json:"group_limit"`
			AutoLeader *string `json:"auto_leader"`
			Role       *string `json:"role"`
		} `json:"group_category"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.GroupCategory.Name != nil {
		category.Name = *input.GroupCategory.Name
	}
	if input.GroupCategory.SelfSignup != nil {
		category.SelfSignup = *input.GroupCategory.SelfSignup
	}
	if input.GroupCategory.GroupLimit != nil {
		category.GroupLimit = input.GroupCategory.GroupLimit
	}
	if input.GroupCategory.AutoLeader != nil {
		category.AutoLeader = *input.GroupCategory.AutoLeader
	}
	if input.GroupCategory.Role != nil {
		category.Role = *input.GroupCategory.Role
	}

	if err := h.groupService.UpdateCategory(c.Context(), category); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.JSON(groupCategoryToJSON(category))
}

func (h *GroupHandler) DeleteGroupCategory(c *fiber.Ctx) error {
	id, err := c.ParamsInt("category_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid category ID")
	}

	if err := h.groupService.DeleteCategory(c.Context(), uint(id)); err != nil {
		return responses.InternalError(c, "Could not delete group category")
	}

	return c.JSON(fiber.Map{"delete": true})
}

// ---- Group handlers ----

func (h *GroupHandler) ListGroupsByCategory(c *fiber.Ctx) error {
	categoryID, err := c.ParamsInt("category_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid category ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.groupService.ListGroupsByCategory(c.Context(), uint(categoryID), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch groups")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	groups := make([]fiber.Map, len(result.Items))
	for i, g := range result.Items {
		groups[i] = groupToJSON(&g)
	}

	return c.JSON(groups)
}

func (h *GroupHandler) CreateGroup(c *fiber.Ctx) error {
	categoryID, err := c.ParamsInt("category_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid category ID")
	}

	var input struct {
		Group struct {
			Name          string `json:"name"`
			Description   string `json:"description"`
			MaxMembership *int   `json:"max_membership"`
			IsPublic      bool   `json:"is_public"`
			JoinLevel     string `json:"join_level"`
			ContextType   string `json:"context_type"`
			ContextID     uint   `json:"context_id"`
		} `json:"group"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	group := &models.Group{
		GroupCategoryID: uint(categoryID),
		Name:            input.Group.Name,
		Description:     input.Group.Description,
		MaxMembership:   input.Group.MaxMembership,
		IsPublic:        input.Group.IsPublic,
		JoinLevel:       input.Group.JoinLevel,
		ContextType:     input.Group.ContextType,
		ContextID:       input.Group.ContextID,
	}

	if err := h.groupService.CreateGroup(c.Context(), group); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(groupToJSON(group))
}

func (h *GroupHandler) GetGroup(c *fiber.Ctx) error {
	id, err := c.ParamsInt("group_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid group ID")
	}

	group, err := h.groupService.GetGroup(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "group")
	}

	return c.JSON(groupToJSON(group))
}

func (h *GroupHandler) UpdateGroup(c *fiber.Ctx) error {
	id, err := c.ParamsInt("group_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid group ID")
	}

	group, err := h.groupService.GetGroup(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "group")
	}

	var input struct {
		Group struct {
			Name          *string `json:"name"`
			Description   *string `json:"description"`
			MaxMembership *int    `json:"max_membership"`
			IsPublic      *bool   `json:"is_public"`
			JoinLevel     *string `json:"join_level"`
		} `json:"group"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.Group.Name != nil {
		group.Name = *input.Group.Name
	}
	if input.Group.Description != nil {
		group.Description = *input.Group.Description
	}
	if input.Group.MaxMembership != nil {
		group.MaxMembership = input.Group.MaxMembership
	}
	if input.Group.IsPublic != nil {
		group.IsPublic = *input.Group.IsPublic
	}
	if input.Group.JoinLevel != nil {
		group.JoinLevel = *input.Group.JoinLevel
	}

	if err := h.groupService.UpdateGroup(c.Context(), group); err != nil {
		return responses.InternalError(c, "Could not update group")
	}

	return c.JSON(groupToJSON(group))
}

func (h *GroupHandler) DeleteGroup(c *fiber.Ctx) error {
	id, err := c.ParamsInt("group_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid group ID")
	}

	if err := h.groupService.DeleteGroup(c.Context(), uint(id)); err != nil {
		return responses.InternalError(c, "Could not delete group")
	}

	return c.JSON(fiber.Map{"delete": true})
}

// ---- Group Membership handlers ----

func (h *GroupHandler) ListGroupMemberships(c *fiber.Ctx) error {
	groupID, err := c.ParamsInt("group_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid group ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.groupService.ListMembers(c.Context(), uint(groupID), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch group memberships")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	memberships := make([]fiber.Map, len(result.Items))
	for i, m := range result.Items {
		memberships[i] = groupMembershipToJSON(&m)
	}

	return c.JSON(memberships)
}

func (h *GroupHandler) CreateGroupMembership(c *fiber.Ctx) error {
	groupID, err := c.ParamsInt("group_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid group ID")
	}

	var input struct {
		Membership struct {
			UserID        uint   `json:"user_id"`
			WorkflowState string `json:"workflow_state"`
			Moderator     bool   `json:"moderator"`
		} `json:"membership"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	// If user_id not provided, use the authenticated user (self-signup)
	userID := input.Membership.UserID
	if userID == 0 {
		uid, _ := c.Locals("user_id").(uint)
		userID = uid
	}
	if userID == 0 {
		return responses.BadRequest(c, "user_id is required")
	}

	membership := &models.GroupMembership{
		GroupID:       uint(groupID),
		UserID:        userID,
		WorkflowState: input.Membership.WorkflowState,
		Moderator:     input.Membership.Moderator,
	}

	if err := h.groupService.AddMember(c.Context(), membership); err != nil {
		return responses.BadRequest(c, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(groupMembershipToJSON(membership))
}

func (h *GroupHandler) UpdateGroupMembership(c *fiber.Ctx) error {
	membershipID, err := c.ParamsInt("membership_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid membership ID")
	}

	membership, err := h.groupService.GetMembership(c.Context(), uint(membershipID))
	if err != nil {
		return responses.NotFound(c, "group membership")
	}

	var input struct {
		Membership struct {
			WorkflowState *string `json:"workflow_state"`
			Moderator     *bool   `json:"moderator"`
		} `json:"membership"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.Membership.WorkflowState != nil {
		membership.WorkflowState = *input.Membership.WorkflowState
	}
	if input.Membership.Moderator != nil {
		membership.Moderator = *input.Membership.Moderator
	}

	if err := h.groupService.UpdateMembership(c.Context(), membership); err != nil {
		return responses.InternalError(c, "Could not update group membership")
	}

	return c.JSON(groupMembershipToJSON(membership))
}

func (h *GroupHandler) DeleteGroupMembership(c *fiber.Ctx) error {
	membershipID, err := c.ParamsInt("membership_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid membership ID")
	}

	if err := h.groupService.RemoveMember(c.Context(), uint(membershipID)); err != nil {
		return responses.InternalError(c, "Could not remove group membership")
	}

	return c.JSON(fiber.Map{"delete": true})
}

// ---- User Groups ----

func (h *GroupHandler) ListUserGroups(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uint)
	if userID == 0 {
		return responses.Unauthorized(c)
	}

	params := middleware.GetPagination(c)

	result, err := h.groupService.ListUserGroups(c.Context(), userID, params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch user groups")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	groups := make([]fiber.Map, len(result.Items))
	for i, g := range result.Items {
		groups[i] = groupToJSON(&g)
	}

	return c.JSON(groups)
}
