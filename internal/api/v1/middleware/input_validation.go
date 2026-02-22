package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// MaxBodySize is the maximum allowed request body size (10 MB).
const MaxBodySize = 10 * 1024 * 1024

// InputValidation returns middleware that enforces request body size limits.
// This prevents denial-of-service attacks via oversized JSON payloads,
// extremely long string fields, or other excessively large request bodies.
func InputValidation() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Enforce body size limit on requests with a body
		method := c.Method()
		if method == "POST" || method == "PUT" || method == "PATCH" {
			if len(c.Body()) > MaxBodySize {
				return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
					"errors": []fiber.Map{{"message": "Request body too large"}},
				})
			}
		}
		return c.Next()
	}
}
