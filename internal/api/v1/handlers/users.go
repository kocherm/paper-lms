package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/auth"
	"github.com/kocherm/paper-lms/internal/service"
)

type UserHandler struct {
	userService *service.UserService
	jwtSecret   string
}

func NewUserHandler(userService *service.UserService, jwtSecret string) *UserHandler {
	return &UserHandler{userService: userService, jwtSecret: jwtSecret}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *UserHandler) Login(c *fiber.Ctx) error {
	var input loginRequest
	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	user, err := h.userService.Authenticate(c.Context(), input.Email, input.Password)
	if err != nil {
		return responses.Error(c, fiber.StatusUnauthorized, "Invalid credentials")
	}

	token, err := auth.GenerateToken(user, h.jwtSecret)
	if err != nil {
		return responses.InternalError(c, "Could not generate token")
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user": fiber.Map{
			"id":            user.ID,
			"name":          user.Name,
			"sortable_name": user.SortableName,
			"short_name":    user.ShortName,
			"login_id":      user.LoginID,
			"email":         user.Email,
			"avatar_url":    user.AvatarURL,
			"locale":        user.Locale,
		},
	})
}

func (h *UserHandler) Register(c *fiber.Ctx) error {
	var input registerRequest
	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	user, err := h.userService.Register(c.Context(), input.Name, input.Email, input.Password)
	if err != nil {
		return responses.BadRequest(c, err.Error())
	}

	token, err := auth.GenerateToken(user, h.jwtSecret)
	if err != nil {
		return responses.InternalError(c, "Could not generate token")
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"token": token,
		"user": fiber.Map{
			"id":            user.ID,
			"name":          user.Name,
			"sortable_name": user.SortableName,
			"short_name":    user.ShortName,
			"login_id":      user.LoginID,
			"email":         user.Email,
			"locale":        user.Locale,
		},
	})
}

func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid user ID")
	}

	user, err := h.userService.GetByID(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "user")
	}

	return c.JSON(fiber.Map{
		"id":            user.ID,
		"name":          user.Name,
		"sortable_name": user.SortableName,
		"short_name":    user.ShortName,
		"login_id":      user.LoginID,
		"email":         user.Email,
		"avatar_url":    user.AvatarURL,
		"locale":        user.Locale,
		"time_zone":     user.TimeZone,
		"created_at":    user.CreatedAt,
	})
}

func (h *UserHandler) GetUserProfile(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid user ID")
	}

	user, err := h.userService.GetByID(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "user")
	}

	return c.JSON(fiber.Map{
		"id":            user.ID,
		"name":          user.Name,
		"sortable_name": user.SortableName,
		"short_name":    user.ShortName,
		"login_id":      user.LoginID,
		"primary_email": user.Email,
		"avatar_url":    user.AvatarURL,
		"locale":        user.Locale,
		"time_zone":     user.TimeZone,
	})
}

func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid user ID")
	}

	currentUserID := c.Locals("user_id").(uint)
	if currentUserID != uint(id) {
		return responses.Error(c, fiber.StatusForbidden, "You can only update your own profile")
	}

	user, err := h.userService.GetByID(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "user")
	}

	var input struct {
		User struct {
			Name     string `json:"name"`
			Locale   string `json:"locale"`
			TimeZone string `json:"time_zone"`
		} `json:"user"`
	}

	if err := c.BodyParser(&input); err != nil {
		return responses.BadRequest(c, "Invalid input")
	}

	if input.User.Name != "" {
		user.Name = input.User.Name
	}
	if input.User.Locale != "" {
		user.Locale = input.User.Locale
	}
	if input.User.TimeZone != "" {
		user.TimeZone = input.User.TimeZone
	}

	if err := h.userService.Update(c.Context(), user); err != nil {
		return responses.InternalError(c, "Could not update user")
	}

	return c.JSON(fiber.Map{
		"id":            user.ID,
		"name":          user.Name,
		"sortable_name": user.SortableName,
		"short_name":    user.ShortName,
		"login_id":      user.LoginID,
		"email":         user.Email,
		"avatar_url":    user.AvatarURL,
		"locale":        user.Locale,
		"time_zone":     user.TimeZone,
	})
}

func (h *UserHandler) GetSelf(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	user, err := h.userService.GetByID(c.Context(), userID)
	if err != nil {
		return responses.NotFound(c, "user")
	}

	return c.JSON(fiber.Map{
		"id":            user.ID,
		"name":          user.Name,
		"sortable_name": user.SortableName,
		"short_name":    user.ShortName,
		"login_id":      user.LoginID,
		"email":         user.Email,
		"avatar_url":    user.AvatarURL,
		"locale":        user.Locale,
		"time_zone":     user.TimeZone,
	})
}

func (h *UserHandler) ListUsers(c *fiber.Ctx) error {
	params := middleware.GetPagination(c)

	result, err := h.userService.List(c.Context(), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch users")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	users := make([]fiber.Map, len(result.Items))
	for i, u := range result.Items {
		users[i] = fiber.Map{
			"id":            u.ID,
			"name":          u.Name,
			"sortable_name": u.SortableName,
			"short_name":    u.ShortName,
			"login_id":      u.LoginID,
			"email":         u.Email,
			"avatar_url":    u.AvatarURL,
			"locale":        u.Locale,
			"created_at":    u.CreatedAt,
		}
	}

	return c.JSON(users)
}
