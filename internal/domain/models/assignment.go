package models

import "time"

type Assignment struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	CourseID        uint       `json:"course_id" gorm:"not null;index"`
	Name            string     `json:"name" gorm:"not null"`
	Description     string     `json:"description" gorm:"type:text"`
	DueAt           *time.Time `json:"due_at"`
	UnlockAt        *time.Time `json:"unlock_at"`
	LockAt          *time.Time `json:"lock_at"`
	PointsPossible  *float64   `json:"points_possible"`
	GradingType     string     `json:"grading_type" gorm:"default:'points'"` // points, percent, letter_grade, gpa_scale, pass_fail, not_graded
	SubmissionTypes string     `json:"submission_types" gorm:"default:'online_text_entry'"` // comma-separated
	AssignmentGroupID *uint     `json:"assignment_group_id"`
	Position        int        `json:"position"`
	WorkflowState   string     `json:"workflow_state" gorm:"not null;default:'unpublished'"`
	Published       bool       `json:"published" gorm:"default:false"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
