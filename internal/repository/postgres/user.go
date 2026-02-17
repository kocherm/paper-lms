package postgres

import (
	"context"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
	"gorm.io/gorm"
)

type userRepo struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) repository.UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) Create(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepo) FindByID(ctx context.Context, id uint) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) FindByLoginID(ctx context.Context, loginID string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("login_id = ?", loginID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) FindBySISUserID(ctx context.Context, sisUserID string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("sis_user_id = ?", sisUserID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) Update(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepo) List(ctx context.Context, params repository.PaginationParams) (*repository.PaginatedResult[models.User], error) {
	var users []models.User
	var count int64

	r.db.WithContext(ctx).Model(&models.User{}).Count(&count)

	offset := (params.Page - 1) * params.PerPage
	if err := r.db.WithContext(ctx).Offset(offset).Limit(params.PerPage).Order("id ASC").Find(&users).Error; err != nil {
		return nil, err
	}

	return &repository.PaginatedResult[models.User]{
		Items:      users,
		TotalCount: count,
		Page:       params.Page,
		PerPage:    params.PerPage,
	}, nil
}
