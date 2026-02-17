package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/kocherm/paper-lms/internal/repository"
	"github.com/kocherm/paper-lms/internal/service"
)

type AuthMiddleware struct {
	jwtSecret          string
	accessTokenService *service.AccessTokenService
	userRepo           repository.UserRepository
}

func NewAuthMiddleware(jwtSecret string, accessTokenService *service.AccessTokenService, userRepo repository.UserRepository) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret:          jwtSecret,
		accessTokenService: accessTokenService,
		userRepo:           userRepo,
	}
}

func (m *AuthMiddleware) Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"errors": []fiber.Map{{"message": "Unauthorized - no token provided"}},
			})
		}

		tokenParts := strings.SplitN(authHeader, " ", 2)
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"errors": []fiber.Map{{"message": "Invalid token format"}},
			})
		}

		tokenStr := tokenParts[1]

		// Try JWT first (session tokens from login)
		jwtToken, jwtErr := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(m.jwtSecret), nil
		})

		if jwtErr == nil && jwtToken.Valid {
			claims := jwtToken.Claims.(jwt.MapClaims)
			c.Locals("user_id", uint(claims["id"].(float64)))
			c.Locals("user_email", claims["email"].(string))
			if name, ok := claims["name"].(string); ok {
				c.Locals("user_name", name)
			}
			return c.Next()
		}

		// Try access token (Personal Access Tokens and OAuth2 tokens)
		if m.accessTokenService != nil {
			accessToken, err := m.accessTokenService.ValidateToken(c.Context(), tokenStr)
			if err == nil {
				c.Locals("user_id", accessToken.UserID)

				// Look up user for email and name
				if m.userRepo != nil {
					user, userErr := m.userRepo.FindByID(c.Context(), accessToken.UserID)
					if userErr == nil {
						c.Locals("user_email", user.Email)
						c.Locals("user_name", user.Name)
					}
				}

				c.Locals("access_token_id", accessToken.ID)
				c.Locals("token_scopes", accessToken.Scopes)
				return c.Next()
			}
		}

		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"errors": []fiber.Map{{"message": "Invalid or expired token"}},
		})
	}
}
