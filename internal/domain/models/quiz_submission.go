package models

import "time"

type QuizSubmission struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	QuizID          uint       `json:"quiz_id" gorm:"not null;index"`
	UserID          uint       `json:"user_id" gorm:"not null"`
	SubmissionID    *uint      `json:"submission_id"` // linked Assignment Submission
	Attempt         int        `json:"attempt" gorm:"not null;default:1"`
	Score           *float64   `json:"score"`
	KeptScore       *float64   `json:"kept_score"`
	StartedAt       *time.Time `json:"started_at"`
	FinishedAt      *time.Time `json:"finished_at"`
	EndAt           *time.Time `json:"end_at"` // deadline based on time limit
	TimeSpent       int        `json:"time_spent"` // seconds
	ValidationToken string     `json:"-" gorm:"not null"`
	WorkflowState   string     `json:"workflow_state" gorm:"not null;default:'untaken'"` // untaken, pending_review, complete, settings_only
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
