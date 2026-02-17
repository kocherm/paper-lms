package service

import (
	"context"
	"errors"
	"strings"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Register(ctx context.Context, name, email, password string) (*models.User, error) {
	if name == "" || email == "" || password == "" {
		return nil, errors.New("name, email, and password are required")
	}

	existing, _ := s.repo.FindByEmail(ctx, email)
	if existing != nil {
		return nil, errors.New("user already exists")
	}

	sortableName := name
	if parts := strings.SplitN(name, " ", 2); len(parts) == 2 {
		sortableName = parts[1] + ", " + parts[0]
	}

	user := &models.User{
		Name:         name,
		SortableName: sortableName,
		ShortName:    name,
		LoginID:      email,
		Email:        email,
	}

	if err := user.HashPassword(password); err != nil {
		return nil, err
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) Authenticate(ctx context.Context, loginID, password string) (*models.User, error) {
	user, err := s.repo.FindByLoginID(ctx, loginID)
	if err != nil {
		// Fallback to email lookup
		user, err = s.repo.FindByEmail(ctx, loginID)
		if err != nil {
			return nil, errors.New("invalid credentials")
		}
	}

	if err := user.CheckPassword(password); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}

func (s *UserService) GetByID(ctx context.Context, id uint) (*models.User, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *UserService) Update(ctx context.Context, user *models.User) error {
	return s.repo.Update(ctx, user)
}

func (s *UserService) List(ctx context.Context, params repository.PaginationParams) (*repository.PaginatedResult[models.User], error) {
	return s.repo.List(ctx, params)
}
