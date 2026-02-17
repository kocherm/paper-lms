package service

import (
	"context"
	"errors"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
)

type ModuleService struct {
	moduleRepo     repository.ModuleRepository
	moduleItemRepo repository.ModuleItemRepository
}

func NewModuleService(moduleRepo repository.ModuleRepository, moduleItemRepo repository.ModuleItemRepository) *ModuleService {
	return &ModuleService{
		moduleRepo:     moduleRepo,
		moduleItemRepo: moduleItemRepo,
	}
}

func (s *ModuleService) Create(ctx context.Context, module *models.ContextModule) error {
	if module.Name == "" {
		return errors.New("module name is required")
	}
	if module.WorkflowState == "" {
		module.WorkflowState = "active"
	}
	return s.moduleRepo.Create(ctx, module)
}

func (s *ModuleService) GetByID(ctx context.Context, id uint) (*models.ContextModule, error) {
	return s.moduleRepo.FindByID(ctx, id)
}

func (s *ModuleService) Update(ctx context.Context, module *models.ContextModule) error {
	return s.moduleRepo.Update(ctx, module)
}

func (s *ModuleService) Delete(ctx context.Context, id uint) error {
	return s.moduleRepo.Delete(ctx, id)
}

func (s *ModuleService) ListByCourse(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.ContextModule], error) {
	return s.moduleRepo.ListByCourseID(ctx, courseID, params)
}

func (s *ModuleService) CreateItem(ctx context.Context, item *models.ContentTag) error {
	if item.Title == "" {
		return errors.New("item title is required")
	}
	if item.WorkflowState == "" {
		item.WorkflowState = "active"
	}
	return s.moduleItemRepo.Create(ctx, item)
}

func (s *ModuleService) GetItem(ctx context.Context, id uint) (*models.ContentTag, error) {
	return s.moduleItemRepo.FindByID(ctx, id)
}

func (s *ModuleService) ListItems(ctx context.Context, moduleID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.ContentTag], error) {
	return s.moduleItemRepo.ListByModuleID(ctx, moduleID, params)
}
