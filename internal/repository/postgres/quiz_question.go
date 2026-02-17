package postgres

import (
	"context"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
	"gorm.io/gorm"
)

type quizQuestionRepo struct {
	db *gorm.DB
}

func NewQuizQuestionRepository(db *gorm.DB) *quizQuestionRepo {
	return &quizQuestionRepo{db: db}
}

func (r *quizQuestionRepo) Create(ctx context.Context, question *models.QuizQuestion) error {
	return r.db.WithContext(ctx).Create(question).Error
}

func (r *quizQuestionRepo) FindByID(ctx context.Context, id uint) (*models.QuizQuestion, error) {
	var question models.QuizQuestion
	if err := r.db.WithContext(ctx).First(&question, id).Error; err != nil {
		return nil, err
	}
	return &question, nil
}

func (r *quizQuestionRepo) Update(ctx context.Context, question *models.QuizQuestion) error {
	return r.db.WithContext(ctx).Save(question).Error
}

func (r *quizQuestionRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Model(&models.QuizQuestion{}).Where("id = ?", id).Update("workflow_state", "deleted").Error
}

func (r *quizQuestionRepo) ListByQuizID(ctx context.Context, quizID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.QuizQuestion], error) {
	var questions []models.QuizQuestion
	var count int64

	query := r.db.WithContext(ctx).Model(&models.QuizQuestion{}).Where("quiz_id = ? AND workflow_state != ?", quizID, "deleted")
	query.Count(&count)

	offset := (params.Page - 1) * params.PerPage
	if err := query.Offset(offset).Limit(params.PerPage).Order("position ASC, id ASC").Find(&questions).Error; err != nil {
		return nil, err
	}

	return &repository.PaginatedResult[models.QuizQuestion]{
		Items:      questions,
		TotalCount: count,
		Page:       params.Page,
		PerPage:    params.PerPage,
	}, nil
}
