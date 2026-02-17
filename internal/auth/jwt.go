package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/kocherm/paper-lms/internal/domain/models"
)

func GenerateToken(user *models.User, secret string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"name":  user.Name,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString([]byte(secret))
}
