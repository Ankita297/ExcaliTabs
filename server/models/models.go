package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`
	Tabs     []Tab  `json:"tabs,omitempty"`
}

type Tab struct {
	gorm.Model
	UserID     uint       `gorm:"not null" json:"userId"`
	Title      string     `gorm:"not null" json:"title"`
	Elements   string     `gorm:"type:text" json:"elements"` // JSON string
	AppState   string     `gorm:"type:text" json:"appState"` // JSON string
	IsPublic   bool       `gorm:"default:false" json:"isPublic"`
	ShareToken *string    `gorm:"uniqueIndex" json:"shareToken,omitempty"`
	SharedWith []TabShare `json:"sharedWith,omitempty"`
}

type TabShare struct {
	gorm.Model
	TabID          uint `gorm:"not null" json:"tabId"`
	SharedWithUser uint `gorm:"not null" json:"sharedWithUser"`
	User           User `gorm:"foreignKey:SharedWithUser" json:"user,omitempty"`
}
