package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"excalidraw-backend/database"
	"excalidraw-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ShareTabInput struct {
	IsPublic bool `json:"isPublic"`
}

type AddCollaboratorInput struct {
	Username string `json:"username" binding:"required"`
}

// Generate a random share token
func generateShareToken() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Helper function to safely convert userId from interface{} to uint
func getUserIdUint(c *gin.Context) (uint, bool) {
	userId, exists := c.Get("userId")
	if !exists {
		return 0, false
	}

	switch v := userId.(type) {
	case float64:
		return uint(v), true
	case int:
		return uint(v), true
	case uint:
		return v, true
	default:
		return 0, false
	}
}

// ShareTab - Configure tab sharing settings (public/private)
func ShareTab(c *gin.Context) {
	userIdUint, ok := getUserIdUint(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	tabId := c.Param("id")

	var tab models.Tab
	if result := database.DB.Where("id = ? AND user_id = ?", tabId, userIdUint).First(&tab); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tab not found"})
		return
	}

	var input ShareTabInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tab.IsPublic = input.IsPublic

	// Generate share token if not exists
	if tab.ShareToken == nil || *tab.ShareToken == "" {
		token, err := generateShareToken()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate share token"})
			return
		}
		tab.ShareToken = &token
	}

	database.DB.Save(&tab)
	c.JSON(http.StatusOK, tab)
}

// GetSharedTab - Access tab via share token
func GetSharedTab(c *gin.Context) {
	shareToken := c.Param("token")

	var tab models.Tab
	if result := database.DB.Where("share_token = ?", shareToken).First(&tab); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Shared tab not found"})
		return
	}

	// Check if tab is public or user has access
	userIdUint, exists := getUserIdUint(c)
	if !tab.IsPublic && (!exists || tab.UserID != userIdUint) {
		// Check if user has been granted access
		if exists {
			var share models.TabShare
			if result := database.DB.Where("tab_id = ? AND shared_with_user = ?", tab.ID, userIdUint).First(&share); result.Error != nil {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
	}

	c.JSON(http.StatusOK, tab)
}

// AddTabCollaborator - Share tab with specific user
func AddTabCollaborator(c *gin.Context) {
	userIdUint, ok := getUserIdUint(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	tabId := c.Param("id")

	var tab models.Tab
	if result := database.DB.Where("id = ? AND user_id = ?", tabId, userIdUint).First(&tab); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tab not found"})
		return
	}

	var input AddCollaboratorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by username
	var targetUser models.User
	if result := database.DB.Where("username = ?", input.Username).First(&targetUser); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if already shared
	var existingShare models.TabShare
	if result := database.DB.Where("tab_id = ? AND shared_with_user = ?", tab.ID, targetUser.ID).First(&existingShare); result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Tab already shared with this user"})
		return
	}

	// Create share
	share := models.TabShare{
		TabID:          tab.ID,
		SharedWithUser: targetUser.ID,
	}

	if result := database.DB.Create(&share); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to share tab"})
		return
	}

	// Load user data
	database.DB.Preload("User").First(&share, share.ID)

	c.JSON(http.StatusCreated, share)
}

// RemoveTabCollaborator - Revoke user access
func RemoveTabCollaborator(c *gin.Context) {
	userIdUint, ok := getUserIdUint(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	tabId := c.Param("id")
	shareId := c.Param("shareId")

	var tab models.Tab
	if result := database.DB.Where("id = ? AND user_id = ?", tabId, userIdUint).First(&tab); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tab not found"})
		return
	}

	var share models.TabShare
	if result := database.DB.Where("id = ? AND tab_id = ?", shareId, tab.ID).First(&share); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Share not found"})
		return
	}

	database.DB.Delete(&share)
	c.JSON(http.StatusOK, gin.H{"message": "Access revoked successfully"})
}

// GetTabCollaborators - List users with access
func GetTabCollaborators(c *gin.Context) {
	userIdUint, ok := getUserIdUint(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	tabId := c.Param("id")

	var tab models.Tab
	if result := database.DB.Where("id = ? AND user_id = ?", tabId, userIdUint).First(&tab); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tab not found"})
		return
	}

	var shares []models.TabShare
	database.DB.Where("tab_id = ?", tab.ID).Preload("User").Find(&shares)

	c.JSON(http.StatusOK, shares)
}
