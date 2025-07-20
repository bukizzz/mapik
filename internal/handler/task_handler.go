package handler

import (
	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/response"

	"github.com/gin-gonic/gin"
)

// GetTaskStatus obrađuje zahteve za status globalnog dugotrajnog zadatka.
func (s *Server) GetTaskStatus(c *gin.Context) {
	taskStatus, err := s.TaskService.GetTaskStatus()
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInternalServer, "Neuspešno dobijanje statusa zadatka"))
		return
	}
	response.Success(c, taskStatus)
}
