package handler

import (
	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/models"
	"MAPIK/internal/response"
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// LogResponse definiše strukturu za unose logova u API odgovoru
type LogResponse struct {
	models.RequestLog
}

// GetLogs obrađuje preuzimanje logova zahteva sa filtriranjem i paginacijom.
func (s *Server) GetLogs(c *gin.Context) {
	query := s.LogService.GetLogsQuery(c)

	var logs []models.RequestLog
	query = query.Order("timestamp desc")
	pagination, err := response.Paginate(c, query, &logs)
	if err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	pagination.Items = logs
	response.Success(c, pagination)
}

// ExportLogs obrađuje izvoz filtriranih ključeva logova u CSV datoteku.
func (s *Server) ExportLogs(c *gin.Context) {
	filename := fmt.Sprintf("log_keys_export_%s.csv", time.Now().Format("20060102150405"))
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "text/csv; charset=utf-8")

	// Strimujte odgovor
	err := s.LogService.StreamLogKeysToCSV(c, c.Writer)
	if err != nil {
		log.Printf("Neuspešno strimovanje ključeva logova u CSV: %v", err)
		c.JSON(500, gin.H{"error": "Neuspešan izvoz logova"})
		return
	}
}
