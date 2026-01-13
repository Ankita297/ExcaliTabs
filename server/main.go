package main

import (
	"excalidraw-backend/database"
	"excalidraw-backend/handlers"
	"excalidraw-backend/middleware"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()

	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Update with your frontend URL
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		// Auth routes
		api.POST("/auth/register", handlers.Register)
		api.POST("/auth/login", handlers.Login)

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Tab routes
			protected.GET("/tabs", handlers.GetTabs)
			protected.POST("/tabs", handlers.CreateTab)
			protected.PUT("/tabs/:id", handlers.UpdateTab)
			protected.DELETE("/tabs/:id", handlers.DeleteTab)

			// Share routes
			protected.PUT("/tabs/:id/share", handlers.ShareTab)
			protected.GET("/tabs/:id/collaborators", handlers.GetTabCollaborators)
			protected.POST("/tabs/:id/collaborators", handlers.AddTabCollaborator)
			protected.DELETE("/tabs/:id/collaborators/:shareId", handlers.RemoveTabCollaborator)
		}

		// Public share route (can be accessed without auth if tab is public)
		api.GET("/shared/:token", handlers.GetSharedTab)
	}

	r.Run(":8080")
}
