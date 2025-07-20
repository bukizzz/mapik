package handler

import (
	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/models"
	"MAPIK/internal/response"
	"MAPIK/internal/utils"
	"time"

	"github.com/gin-gonic/gin"
)

// GetSettings obrađuje GET /api/settings zahtev.
// Preuzima sva sistemska podešavanja, grupiše ih po kategorijama i vraća ih.
func (s *Server) GetSettings(c *gin.Context) {
	currentSettings := s.SettingsManager.GetSettings()
	settingsInfo := utils.GenerateSettingsMetadata(&currentSettings)

	// Grupišite podešavanja po kategorijama uz očuvanje redosleda
	categorized := make(map[string][]models.SystemSettingInfo)
	var categoryOrder []string
	for _, s := range settingsInfo {
		if _, exists := categorized[s.Category]; !exists {
			categoryOrder = append(categoryOrder, s.Category)
		}
		categorized[s.Category] = append(categorized[s.Category], s)
	}

	// Kreirajte strukturu odgovora u ispravnom redosledu
	var responseData []models.CategorizedSettings
	for _, categoryName := range categoryOrder {
		responseData = append(responseData, models.CategorizedSettings{
			CategoryName: categoryName,
			Settings:     categorized[categoryName],
		})
	}

	response.Success(c, responseData)
}

// UpdateSettings obrađuje PUT /api/settings zahtev.
func (s *Server) UpdateSettings(c *gin.Context) {
	var settingsMap map[string]any
	if err := c.ShouldBindJSON(&settingsMap); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	if len(settingsMap) == 0 {
		response.Success(c, nil)
		return
	}

	// Ažurirajte konfiguraciju
	if err := s.SettingsManager.UpdateSettings(settingsMap); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrDatabase, err.Error()))
		return
	}

	time.Sleep(100 * time.Millisecond) // Sačekajte asinhrono ažuriranje konfiguracije

	response.Success(c, gin.H{
		"message": "Podešavanja su uspešno ažurirana. Konfiguracija će biti ponovo učitana u pozadini na svim instancama.",
	})
}
