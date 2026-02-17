package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/repository"
)

type AccountHandler struct {
	accountRepo repository.AccountRepository
}

func NewAccountHandler(accountRepo repository.AccountRepository) *AccountHandler {
	return &AccountHandler{accountRepo: accountRepo}
}

func (h *AccountHandler) ListAccounts(c *fiber.Ctx) error {
	params := middleware.GetPagination(c)

	result, err := h.accountRepo.List(c.Context(), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch accounts")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	accounts := make([]fiber.Map, len(result.Items))
	for i, a := range result.Items {
		accounts[i] = fiber.Map{
			"id":                a.ID,
			"name":              a.Name,
			"parent_account_id": a.ParentAccountID,
			"root_account_id":   a.RootAccountID,
			"workflow_state":    a.WorkflowState,
		}
	}

	return c.JSON(accounts)
}

func (h *AccountHandler) GetAccount(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid account ID")
	}

	account, err := h.accountRepo.FindByID(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "account")
	}

	return c.JSON(fiber.Map{
		"id":                account.ID,
		"name":              account.Name,
		"parent_account_id": account.ParentAccountID,
		"root_account_id":   account.RootAccountID,
		"workflow_state":    account.WorkflowState,
	})
}
