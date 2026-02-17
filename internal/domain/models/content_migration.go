package models

import "time"

// ContentMigration tracks the import of content packages (Common Cartridge, IMSCC, Canvas export).
type ContentMigration struct {
	ID                uint       `json:"id" gorm:"primaryKey"`
	CourseID          uint       `json:"course_id" gorm:"not null;index"`
	UserID            uint       `json:"user_id" gorm:"not null"`
	MigrationType     string     `json:"migration_type" gorm:"not null"`       // common_cartridge, canvas_cartridge, course_copy, qti_converter, zip_file_importer
	SourceCourseID    *uint      `json:"source_course_id"`                     // For course_copy
	WorkflowState     string     `json:"workflow_state" gorm:"not null;default:'created'"` // created, pre_processing, running, completed, failed
	Progress          int        `json:"progress" gorm:"default:0"`            // 0-100
	MigrationSettings string     `json:"migration_settings" gorm:"type:jsonb"` // JSON: selective import options
	StartedAt         *time.Time `json:"started_at"`
	FinishedAt        *time.Time `json:"finished_at"`
	ErrorMessage      string     `json:"error_message" gorm:"type:text"`
	Attachment        string     `json:"attachment" gorm:"type:text"`          // path to uploaded package file
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}
