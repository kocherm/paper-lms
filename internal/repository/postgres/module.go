package postgres

import (
	"context"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
	"gorm.io/gorm"
)

type moduleRepo struct {
	db *gorm.DB
}

func NewModuleRepository(db *gorm.DB) repository.ModuleRepository {
	return &moduleRepo{db: db}
}

func (r *moduleRepo) Create(ctx context.Context, module *models.ContextModule) error {
	return r.db.WithContext(ctx).Create(module).Error
}

func (r *moduleRepo) FindByID(ctx context.Context, id uint) (*models.ContextModule, error) {
	var module models.ContextModule
	if err := r.db.WithContext(ctx).Preload("Items", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).First(&module, id).Error; err != nil {
		return nil, err
	}
	return &module, nil
}

func (r *moduleRepo) Update(ctx context.Context, module *models.ContextModule) error {
	return r.db.WithContext(ctx).Save(module).Error
}

func (r *moduleRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Model(&models.ContextModule{}).Where("id = ?", id).Update("workflow_state", "deleted").Error
}

func (r *moduleRepo) ListByCourseID(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.ContextModule], error) {
	var modules []models.ContextModule
	var count int64

	query := r.db.WithContext(ctx).Model(&models.ContextModule{}).Where("course_id = ? AND workflow_state != ?", courseID, "deleted")
	query.Count(&count)

	offset := (params.Page - 1) * params.PerPage
	if err := query.Preload("Items", func(db *gorm.DB) *gorm.DB {
		return db.Where("workflow_state != ?", "deleted").Order("position ASC")
	}).Offset(offset).Limit(params.PerPage).Order("position ASC").Find(&modules).Error; err != nil {
		return nil, err
	}

	return &repository.PaginatedResult[models.ContextModule]{
		Items:      modules,
		TotalCount: count,
		Page:       params.Page,
		PerPage:    params.PerPage,
	}, nil
}
