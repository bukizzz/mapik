package handler

import (
	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/models"
	"MAPIK/internal/response"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// validateGroupIDFromQuery validira i parsira ID grupe iz parametra upita.
func validateGroupIDFromQuery(c *gin.Context) (uint, error) {
	groupIDStr := c.Query("group_id")
	if groupIDStr == "" {
		return 0, fmt.Errorf("parametar upita group_id je obavezan")
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil || groupID <= 0 {
		return 0, fmt.Errorf("nevažeći format group_id")
	}

	return uint(groupID), nil
}

// validateKeysText validira ulazni tekst ključeva
func validateKeysText(keysText string) error {
	if strings.TrimSpace(keysText) == "" {
		return fmt.Errorf("tekst ključeva ne može biti prazan")
	}

	return nil
}

// findGroupByID je pomoćna funkcija za pronalaženje grupe po njenom ID-u.
func (s *Server) findGroupByID(c *gin.Context, groupID uint) (*models.Group, bool) {
	var group models.Group
	if err := s.DB.First(&group, groupID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.Error(c, app_errors.ErrResourceNotFound)
		} else {
			response.Error(c, app_errors.ParseDBError(err))
		}
		return nil, false
	}
	return &group, true
}

// KeyTextRequest definiše generički payload za operacije koje zahtevaju ID grupe i tekstualni blok ključeva.
type KeyTextRequest struct {
	GroupID  uint   `json:"group_id" binding:"required"`
	KeysText string `json:"keys_text" binding:"required"`
}

// GroupIDRequest definiše generički payload za operacije koje zahtevaju samo ID grupe.
type GroupIDRequest struct {
	GroupID uint `json:"group_id" binding:"required"`
}

// AddMultipleKeys obrađuje kreiranje novih ključeva iz tekstualnog bloka unutar određene grupe.
func (s *Server) AddMultipleKeys(c *gin.Context) {
	var req KeyTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	if _, ok := s.findGroupByID(c, req.GroupID); !ok {
		return
	}

	if err := validateKeysText(req.KeysText); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		return
	}

	result, err := s.KeyService.AddMultipleKeys(req.GroupID, req.KeysText)
	if err != nil {
		if strings.Contains(err.Error(), "batch size exceeds the limit") {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		} else if err.Error() == "no valid keys found in the input text" {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		} else {
			response.Error(c, app_errors.ParseDBError(err))
		}
		return
	}

	response.Success(c, result)
}

// AddMultipleKeysAsync obrađuje asinhrono kreiranje novih ključeva iz tekstualnog bloka unutar određene grupe.
func (s *Server) AddMultipleKeysAsync(c *gin.Context) {
	var req KeyTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	group, ok := s.findGroupByID(c, req.GroupID)
	if !ok {
		return
	}

	if err := validateKeysText(req.KeysText); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		return
	}

	taskStatus, err := s.KeyImportService.StartImportTask(group, req.KeysText)
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrTaskInProgress, err.Error()))
		return
	}

	response.Success(c, taskStatus)
}

// ListKeysInGroup obrađuje listanje svih ključeva unutar određene grupe sa paginacijom.
func (s *Server) ListKeysInGroup(c *gin.Context) {
	groupID, err := validateGroupIDFromQuery(c)
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrBadRequest, err.Error()))
		return
	}

	if _, ok := s.findGroupByID(c, groupID); !ok {
		return
	}

	statusFilter := c.Query("status")
	if statusFilter != "" && statusFilter != models.KeyStatusActive && statusFilter != models.KeyStatusInvalid {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, "Nevažeći filter statusa"))
		return
	}

	searchKeyword := c.Query("key")

	query := s.KeyService.ListKeysInGroupQuery(groupID, statusFilter, searchKeyword)

	var keys []models.APIKey
	paginatedResult, err := response.Paginate(c, query, &keys)
	if err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	response.Success(c, paginatedResult)
}

// DeleteMultipleKeys obrađuje brisanje ključeva iz tekstualnog bloka unutar određene grupe.
func (s *Server) DeleteMultipleKeys(c *gin.Context) {
	var req KeyTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	if _, ok := s.findGroupByID(c, req.GroupID); !ok {
		return
	}

	if err := validateKeysText(req.KeysText); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		return
	}

	result, err := s.KeyService.DeleteMultipleKeys(req.GroupID, req.KeysText)
	if err != nil {
		if strings.Contains(err.Error(), "batch size exceeds the limit") {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		} else if err.Error() == "no valid keys found in the input text" {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		} else {
			response.Error(c, app_errors.ParseDBError(err))
		}
		return
	}

	response.Success(c, result)
}

// RestoreMultipleKeys obrađuje vraćanje ključeva iz tekstualnog bloka unutar određene grupe.
func (s *Server) RestoreMultipleKeys(c *gin.Context) {
	var req KeyTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	if _, ok := s.findGroupByID(c, req.GroupID); !ok {
		return
	}

	if err := validateKeysText(req.KeysText); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		return
	}

	result, err := s.KeyService.RestoreMultipleKeys(req.GroupID, req.KeysText)
	if err != nil {
		if strings.Contains(err.Error(), "batch size exceeds the limit") {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		} else if err.Error() == "no valid keys found in the input text" {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		} else {
			response.Error(c, app_errors.ParseDBError(err))
		}
		return
	}

	response.Success(c, result)
}

// TestMultipleKeys obrađuje jednokratni test validacije za više ključeva.
func (s *Server) TestMultipleKeys(c *gin.Context) {
	var req KeyTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	groupDB, ok := s.findGroupByID(c, req.GroupID)
	if !ok {
		return
	}

	group, err := s.GroupManager.GetGroupByName(groupDB.Name)
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrResourceNotFound, fmt.Sprintf("Grupa '%s' nije pronađena", groupDB.Name)))
		return
	}

	if err := validateKeysText(req.KeysText); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		return
	}

	results, err := s.KeyService.TestMultipleKeys(group, req.KeysText)
	if err != nil {
		if strings.Contains(err.Error(), "batch size exceeds the limit") {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		} else if err.Error() == "no valid keys found in the input text" {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		} else {
			response.Error(c, app_errors.ParseDBError(err))
		}
		return
	}

	response.Success(c, results)
}

// ValidateGroupKeys inicira zadatak ručne validacije za sve ključeve u grupi.
func (s *Server) ValidateGroupKeys(c *gin.Context) {
	var req GroupIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	groupDB, ok := s.findGroupByID(c, req.GroupID)
	if !ok {
		return
	}

	group, err := s.GroupManager.GetGroupByName(groupDB.Name)
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrResourceNotFound, fmt.Sprintf("Grupa '%s' nije pronađena", groupDB.Name)))
		return
	}

	taskStatus, err := s.KeyManualValidationService.StartValidationTask(group)
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrTaskInProgress, err.Error()))
		return
	}

	response.Success(c, taskStatus)
}

// RestoreAllInvalidKeys postavlja status svih 'neaktivnih' ključeva u grupi na 'aktivne'.
func (s *Server) RestoreAllInvalidKeys(c *gin.Context) {
	var req GroupIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	if _, ok := s.findGroupByID(c, req.GroupID); !ok {
		return
	}

	rowsAffected, err := s.KeyService.RestoreAllInvalidKeys(req.GroupID)
	if err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	response.Success(c, gin.H{"message": fmt.Sprintf("%d ključeva vraćeno.", rowsAffected)})
}

// ClearAllInvalidKeys briše sve 'neaktivne' ključeve iz grupe.
func (s *Server) ClearAllInvalidKeys(c *gin.Context) {
	var req GroupIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	if _, ok := s.findGroupByID(c, req.GroupID); !ok {
		return
	}

	rowsAffected, err := s.KeyService.ClearAllInvalidKeys(req.GroupID)
	if err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	response.Success(c, gin.H{"message": fmt.Sprintf("%d nevažećih ključeva obrisano.", rowsAffected)})
}

// ExportKeys obrađuje izvoz ključeva u tekstualnu datoteku.
func (s *Server) ExportKeys(c *gin.Context) {
	groupID, err := validateGroupIDFromQuery(c)
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrBadRequest, err.Error()))
		return
	}

	statusFilter := c.Query("status")
	if statusFilter == "" {
		statusFilter = "all"
	}

	switch statusFilter {
	case "all", models.KeyStatusActive, models.KeyStatusInvalid:
	default:
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, "Nevažeći filter statusa"))
		return
	}

	group, ok := s.findGroupByID(c, groupID)
	if !ok {
		return
	}

	filename := fmt.Sprintf("keys-%s-%s.txt", group.Name, statusFilter)
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "text/plain; charset=utf-8")

	err = s.KeyService.StreamKeysToWriter(groupID, statusFilter, c.Writer)
	if err != nil {
		log.Printf("Neuspešno strimovanje ključeva: %v", err)
	}
}
