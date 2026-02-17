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
