// Paket handler pruža HTTP handlere za aplikaciju
package handler

import (
	"net/http"
	"time"

	"MAPIK/internal/config"
	"MAPIK/internal/services"
	"MAPIK/internal/types"

	"github.com/gin-gonic/gin"
	"go.uber.org/dig"
	"gorm.io/gorm"
)

// Server sadrži zavisnosti za HTTP handlere
type Server struct {
	DB                         *gorm.DB
	config                     types.ConfigManager
	SettingsManager            *config.SystemSettingsManager
	GroupManager               *services.GroupManager
	KeyManualValidationService *services.KeyManualValidationService
	TaskService                *services.TaskService
	KeyService                 *services.KeyService
	KeyImportService           *services.KeyImportService
	LogService                 *services.LogService
	CommonHandler              *CommonHandler
}

// NewServerParams definiše zavisnosti za konstruktor NewServer.
type NewServerParams struct {
	dig.In
	DB                         *gorm.DB
	Config                     types.ConfigManager
	SettingsManager            *config.SystemSettingsManager
	GroupManager               *services.GroupManager
	KeyManualValidationService *services.KeyManualValidationService
	TaskService                *services.TaskService
	KeyService                 *services.KeyService
	KeyImportService           *services.KeyImportService
	LogService                 *services.LogService
	CommonHandler              *CommonHandler
}

// NewServer kreira novu instancu handlera sa zavisnostima injektovanim od strane dig-a.
func NewServer(params NewServerParams) *Server {
	return &Server{
		DB:                         params.DB,
		config:                     params.Config,
		SettingsManager:            params.SettingsManager,
		GroupManager:               params.GroupManager,
		KeyManualValidationService: params.KeyManualValidationService,
		TaskService:                params.TaskService,
		KeyService:                 params.KeyService,
		KeyImportService:           params.KeyImportService,
		LogService:                 params.LogService,
		CommonHandler:              params.CommonHandler,
	}
}

// LoginRequest predstavlja telo zahteva za prijavu
type LoginRequest struct {
	AuthKey string `json:"auth_key" binding:"required"`
}

// LoginResponse predstavlja odgovor na prijavu
type LoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// Login obrađuje verifikaciju autentifikacije
func (s *Server) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Nevažeći format zahteva",
		})
		return
	}

	authConfig := s.config.GetAuthConfig()

	if req.AuthKey == authConfig.Key {
		c.JSON(http.StatusOK, LoginResponse{
			Success: true,
			Message: "Autentifikacija uspešna",
		})
	} else {
		c.JSON(http.StatusUnauthorized, LoginResponse{
			Success: false,
			Message: "Nevažeći ključ za autentifikaciju",
		})
	}
}

// Health obrađuje zahteve za proveru zdravlja
func (s *Server) Health(c *gin.Context) {
	uptime := "nepoznato"
	if startTime, exists := c.Get("serverStartTime"); exists {
		if st, ok := startTime.(time.Time); ok {
			uptime = time.Since(st).String()
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "zdravo",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"uptime":    uptime,
	})
}
