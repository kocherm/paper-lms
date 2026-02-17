package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port            string
	DatabaseURL     string
	JWTSecret       string
	Environment     string
	FrontendURL     string
	FileStoragePath string
	MaxUploadSize   int
	// SAML SSO
	SAMLEntityID string
	SAMLCertFile string
	SAMLKeyFile  string
	// SMTP Email
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	SMTPFrom     string
	SMTPEnabled  bool
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "3000"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://paper:paper@localhost:5432/paper_lms?sslmode=disable"),
		JWTSecret:       getEnv("JWT_SECRET", "your-super-secret-key-change-this-in-production"),
		Environment:     getEnv("ENVIRONMENT", "development"),
		FrontendURL:     getEnv("FRONTEND_URL", "http://localhost:5173"),
		FileStoragePath: getEnv("FILE_STORAGE_PATH", "./storage/files"),
		MaxUploadSize:   getEnvInt("MAX_UPLOAD_SIZE_MB", 50),
		SAMLEntityID:    getEnv("SAML_ENTITY_ID", ""),
		SAMLCertFile:    getEnv("SAML_CERT_FILE", ""),
		SAMLKeyFile:     getEnv("SAML_KEY_FILE", ""),
		SMTPHost:        getEnv("SMTP_HOST", ""),
		SMTPPort:        getEnvInt("SMTP_PORT", 587),
		SMTPUsername:    getEnv("SMTP_USERNAME", ""),
		SMTPPassword:    getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:        getEnv("SMTP_FROM", "noreply@paperlms.org"),
		SMTPEnabled:     getEnv("SMTP_ENABLED", "false") == "true",
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val := os.Getenv(key); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return fallback
}
