package postgres

import (
	"context"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
	"gorm.io/gorm"
)

type gradingStandardRepo struct {
	db *gorm.DB
}

func NewGradingStandardRepository(db *gorm.DB) repository.GradingStandardRepository {
	return &gradingStandardRepo{db: db}
}

func (r *gradingStandardRepo) Create(ctx context.Context, standard *models.GradingStandard) error {
	return r.db.WithContext(ctx).Create(standard).Error
}

func (r *gradingStandardRepo) FindByID(ctx context.Context, id uint) (*models.GradingStandard, error) {
	var standard models.GradingStandard
	if err := r.db.WithContext(ctx).First(&standard, id).Error; err != nil {
		return nil, err
	}
	return &standard, nil
}

func (r *gradingStandardRepo) ListByCourse(ctx context.Context, courseID uint) ([]models.GradingStandard, error) {
	var standards []models.GradingStandard
	if err := r.db.WithContext(ctx).Where("context_type = ? AND context_id = ? AND workflow_state = ?", "Course", courseID, "active").Order("id ASC").Find(&standards).Error; err != nil {
		return nil, err
	}
	return standards, nil
}
