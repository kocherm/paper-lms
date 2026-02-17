package models

import "time"

type WikiPage struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	CourseID     uint      `json:"course_id" gorm:"not null;index"`
	Title        string    `json:"title" gorm:"not null"`
	URL          string    `json:"url" gorm:"not null;index"` // slug
	Body         string    `json:"body" gorm:"type:text"`
	WorkflowState string  `json:"workflow_state" gorm:"not null;default:'unpublished'"`
	EditingRoles string    `json:"editing_roles" gorm:"default:'teachers'"`
	FrontPage    bool      `json:"front_page" gorm:"default:false"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (WikiPage) TableName() string {
	return "wiki_pages"
}
