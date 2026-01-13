package handlers

import (
	"excalidraw-backend/database"
	"excalidraw-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CreateTabInput struct {
	Title    string `json:"title" binding:"required"`
	Elements string `json:"elements"`
	AppState string `json:"appState"`
}

type UpdateTabInput struct {
	Title    string `json:"title"`
	Elements string `json:"elements"`
	AppState string `json:"appState"`
}

func GetTabs(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Safe conversion from interface{} to uint
	var userIdUint uint
	switch v := userId.(type) {
	case float64:
		userIdUint = uint(v)
	case int:
		userIdUint = uint(v)
	case uint:
		userIdUint = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID type"})
		return
	}

	var tabs []models.Tab

	if result := database.DB.Where("user_id = ?", userIdUint).Find(&tabs); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tabs"})
		return
	}

	c.JSON(http.StatusOK, tabs)
}

func CreateTab(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var input CreateTabInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Safe conversion from interface{} to uint
	var userIdUint uint
	switch v := userId.(type) {
	case float64:
		userIdUint = uint(v)
	case int:
		userIdUint = uint(v)
	case uint:
		userIdUint = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID type"})
		return
	}

	tab := models.Tab{
		UserID:   userIdUint,
		Title:    input.Title,
		Elements: input.Elements,
		AppState: input.AppState,
	}

	if result := database.DB.Create(&tab); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create tab"})
		return
	}

	c.JSON(http.StatusCreated, tab)
}

func UpdateTab(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Safe conversion from interface{} to uint
	var userIdUint uint
	switch v := userId.(type) {
	case float64:
		userIdUint = uint(v)
	case int:
		userIdUint = uint(v)
	case uint:
		userIdUint = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID type"})
		return
	}

	tabId := c.Param("id")

	var tab models.Tab
	if result := database.DB.Where("id = ? AND user_id = ?", tabId, userIdUint).First(&tab); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tab not found"})
		return
	}

	var input UpdateTabInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Title != "" {
		tab.Title = input.Title
	}
	if input.Elements != "" {
		tab.Elements = input.Elements
	}
	if input.AppState != "" {
		tab.AppState = input.AppState
	}

	database.DB.Save(&tab)
	c.JSON(http.StatusOK, tab)
}

func DeleteTab(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Safe conversion from interface{} to uint
	var userIdUint uint
	switch v := userId.(type) {
	case float64:
		userIdUint = uint(v)
	case int:
		userIdUint = uint(v)
	case uint:
		userIdUint = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID type"})
		return
	}

	tabId := c.Param("id")

	var tab models.Tab
	if result := database.DB.Where("id = ? AND user_id = ?", tabId, userIdUint).First(&tab); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tab not found"})
		return
	}

	database.DB.Delete(&tab)
	c.JSON(http.StatusOK, gin.H{"message": "Tab deleted successfully"})
}
