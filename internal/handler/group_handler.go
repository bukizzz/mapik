// Paket handler pruža HTTP hendlere za aplikaciju
package handler

import (
	"encoding/json"
	"fmt"
	"net/url"
	"sync"

	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/models"
	"MAPIK/internal/response"
	"MAPIK/internal/utils"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	"MAPIK/internal/channel"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/datatypes"
)

// isValidChannelType proverava da li je tip kanala validan poređenjem sa registrovanim kanalima.
func isValidChannelType(channelType string) bool {
	channels := channel.GetChannels()
	for _, t := range channels {
		if t == channelType {
			return true
		}
	}
	return false
}

// UpstreamDefinition definiše strukturu za uzvodni server u zahtevu.
type UpstreamDefinition struct {
	URL    string `json:"url"`
	Weight int    `json:"weight"`
}

// validateAndCleanUpstreams validira i čisti JSON uzvodnih servera.
func validateAndCleanUpstreams(upstreams json.RawMessage) (datatypes.JSON, error) {
	if len(upstreams) == 0 {
		return nil, fmt.Errorf("polje 'upstreams' je obavezno")
	}

	var defs []UpstreamDefinition
	if err := json.Unmarshal(upstreams, &defs); err != nil {
		return nil, fmt.Errorf("nevažeći format za upstreams: %w", err)
	}

	if len(defs) == 0 {
		return nil, fmt.Errorf("potreban je barem jedan upstream")
	}

	for i := range defs {
		defs[i].URL = strings.TrimSpace(defs[i].URL)
		if defs[i].URL == "" {
			return nil, fmt.Errorf("URL uzvodnog servera ne može biti prazan")
		}
		// Osnovna validacija URL formata
		if !strings.HasPrefix(defs[i].URL, "http://") && !strings.HasPrefix(defs[i].URL, "https://") {
			return nil, fmt.Errorf("nevažeći URL format za upstream: %s", defs[i].URL)
		}
		if defs[i].Weight <= 0 {
			return nil, fmt.Errorf("težina uzvodnog servera mora biti pozitivan ceo broj")
		}
	}

	cleanedUpstreams, err := json.Marshal(defs)
	if err != nil {
		return nil, fmt.Errorf("nije uspelo maršalovanje očišćenih upstreams: %w", err)
	}

	return cleanedUpstreams, nil
}

// isValidGroupName proverava da li je naziv grupe validan.
func isValidGroupName(name string) bool {
	if name == "" {
		return false
	}
	// Dozvoljava mala slova, brojeve, donje crte i crtice, dužine između 3 i 30 karaktera
	match, _ := regexp.MatchString("^[a-z0-9_-]{3,30}$", name)
	return match
}

// validateAndCleanConfig validira konfiguraciju grupe u odnosu na strukturu GroupConfig i sistemski definisana pravila.
func (s *Server) validateAndCleanConfig(configMap map[string]any) (map[string]any, error) {
	if configMap == nil {
		return nil, nil
	}

	// 1. Proveri nepoznata polja poređenjem sa definicijom strukture GroupConfig.
	var tempGroupConfig models.GroupConfig
	groupConfigType := reflect.TypeOf(tempGroupConfig)
	validFields := make(map[string]bool)
	for i := 0; i < groupConfigType.NumField(); i++ {
		jsonTag := groupConfigType.Field(i).Tag.Get("json")
		fieldName := strings.Split(jsonTag, ",")[0]
		if fieldName != "" && fieldName != "-" {
			validFields[fieldName] = true
		}
	}

	for key := range configMap {
		if !validFields[key] {
			return nil, fmt.Errorf("nepoznato polje konfiguracije: '%s'", key)
		}
	}

	// 2. Validira vrednosti pruženih polja koristeći centralni validator sistemskih podešavanja.
	if err := s.SettingsManager.ValidateGroupConfigOverrides(configMap); err != nil {
		return nil, err
	}

	// 3. Unmaršaluj i ponovo maršaluj da bi se očistila mapa i osigurali ispravni tipovi.
	configBytes, err := json.Marshal(configMap)
	if err != nil {
		return nil, fmt.Errorf("nije uspelo maršalovanje mape konfiguracije: %w", err)
	}

	var validatedConfig models.GroupConfig
	if err := json.Unmarshal(configBytes, &validatedConfig); err != nil {
		return nil, fmt.Errorf("nije uspelo unmaršalovanje u validiranu konfiguraciju: %w", err)
	}

	validatedBytes, err := json.Marshal(validatedConfig)
	if err != nil {
		return nil, fmt.Errorf("nije uspelo maršalovanje validirane konfiguracije: %w", err)
	}
	var finalMap map[string]any
	if err := json.Unmarshal(validatedBytes, &finalMap); err != nil {
		return nil, fmt.Errorf("nije uspelo unmaršalovanje u konačnu mapu: %w", err)
	}

	return finalMap, nil
}

// CreateGroup obrađuje kreiranje nove grupe.
func (s *Server) CreateGroup(c *gin.Context) {
	var req models.Group
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	// Čišćenje i validacija podataka
	name := strings.TrimSpace(req.Name)
	if !isValidGroupName(name) {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, "Nevažeći naziv grupe. Može sadržati samo mala slova, brojeve, crtice ili donje crte, dužine 3-30 karaktera"))
		return
	}

	channelType := strings.TrimSpace(req.ChannelType)
	if !isValidChannelType(channelType) {
		supported := strings.Join(channel.GetChannels(), ", ")
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, fmt.Sprintf("Nevažeći tip kanala. Podržani tipovi su: %s", supported)))
		return
	}

	testModel := strings.TrimSpace(req.TestModel)
	if testModel == "" {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, "Test model je obavezan"))
		return
	}

	cleanedUpstreams, err := validateAndCleanUpstreams(json.RawMessage(req.Upstreams))
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
		return
	}

	cleanedConfig, err := s.validateAndCleanConfig(req.Config)
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, fmt.Sprintf("Nevažeći format konfiguracije: %v", err)))
		return
	}

	group := models.Group{
		Name:           name,
		DisplayName:    strings.TrimSpace(req.DisplayName),
		Description:    strings.TrimSpace(req.Description),
		Upstreams:      cleanedUpstreams,
		ChannelType:    channelType,
		Sort:           req.Sort,
		TestModel:      testModel,
		ParamOverrides: req.ParamOverrides,
		Config:         cleanedConfig,
	}

	if err := s.DB.Create(&group).Error; err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	if err := s.GroupManager.Invalidate(); err != nil {
		logrus.WithContext(c.Request.Context()).WithError(err).Error("nije uspelo poništavanje keša grupe")
	}
	response.Success(c, s.newGroupResponse(&group))
}

// ListGroups obrađuje listanje svih grupa.
func (s *Server) ListGroups(c *gin.Context) {
	var groups []models.Group
	if err := s.DB.Order("sort asc, id desc").Find(&groups).Error; err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	var groupResponses []GroupResponse
	for i := range groups {
		groupResponses = append(groupResponses, *s.newGroupResponse(&groups[i]))
	}

	response.Success(c, groupResponses)
}

// GroupUpdateRequest definiše payload za ažuriranje grupe.
// Korišćenje namenske strukture izbegava probleme sa nultim vrednostima koje GORM-ovo Update ignoriše.
type GroupUpdateRequest struct {
	Name           *string         `json:"name,omitempty"`
	DisplayName    *string         `json:"display_name,omitempty"`
	Description    *string         `json:"description,omitempty"`
	Upstreams      json.RawMessage `json:"upstreams"`
	ChannelType    *string         `json:"channel_type,omitempty"`
	Sort           *int            `json:"sort"`
	TestModel      string          `json:"test_model"`
	ParamOverrides map[string]any  `json:"param_overrides"`
	Config         map[string]any  `json:"config"`
}

// UpdateGroup obrađuje ažuriranje postojeće grupe.
func (s *Server) UpdateGroup(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrBadRequest, "Nevažeći format ID-a grupe"))
		return
	}

	var group models.Group
	if err := s.DB.First(&group, id).Error; err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	var req GroupUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrInvalidJSON, err.Error()))
		return
	}

	// Pokreni transakciju
	tx := s.DB.Begin()
	if tx.Error != nil {
		response.Error(c, app_errors.ErrDatabase)
		return
	}
	defer tx.Rollback() // Vrati na prethodno stanje u slučaju panike

	// Primeni ažuriranja iz zahteva, uz čišćenje i validaciju
	if req.Name != nil {
		cleanedName := strings.TrimSpace(*req.Name)
		if !isValidGroupName(cleanedName) {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, "Nevažeći format naziva grupe. Može sadržati samo mala slova, brojeve, crtice ili donje crte, dužine 3-30 karaktera"))
			return
		}
		group.Name = cleanedName
	}

	if req.DisplayName != nil {
		group.DisplayName = strings.TrimSpace(*req.DisplayName)
	}

	if req.Description != nil {
		group.Description = strings.TrimSpace(*req.Description)
	}

	if req.Upstreams != nil {
		cleanedUpstreams, err := validateAndCleanUpstreams(req.Upstreams)
		if err != nil {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, err.Error()))
			return
		}
		group.Upstreams = cleanedUpstreams
	}

	if req.ChannelType != nil {
		cleanedChannelType := strings.TrimSpace(*req.ChannelType)
		if !isValidChannelType(cleanedChannelType) {
			supported := strings.Join(channel.GetChannels(), ", ")
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, fmt.Sprintf("Nevažeći tip kanala. Podržani tipovi su: %s", supported)))
			return
		}
		group.ChannelType = cleanedChannelType
	}
	if req.Sort != nil {
		group.Sort = *req.Sort
	}
	if req.TestModel != "" {
		cleanedTestModel := strings.TrimSpace(req.TestModel)
		if cleanedTestModel == "" {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, "Test model ne može biti prazan ili samo razmaci."))
			return
		}
		group.TestModel = cleanedTestModel
	}
	if req.ParamOverrides != nil {
		group.ParamOverrides = req.ParamOverrides
	}
	if req.Config != nil {
		cleanedConfig, err := s.validateAndCleanConfig(req.Config)
		if err != nil {
			response.Error(c, app_errors.NewAPIError(app_errors.ErrValidation, fmt.Sprintf("Nevažeći format konfiguracije: %v", err)))
			return
		}
		group.Config = cleanedConfig
	}

	// Sačuvaj ažurirani objekat grupe
	if err := tx.Save(&group).Error; err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	if err := tx.Commit().Error; err != nil {
		response.Error(c, app_errors.ErrDatabase)
		return
	}

	if err := s.GroupManager.Invalidate(); err != nil {
		logrus.WithContext(c.Request.Context()).WithError(err).Error("nije uspelo poništavanje keša grupe")
	}
	response.Success(c, gin.H{"message": "Grupa i povezani ključevi uspešno obrisani"})
}

// GroupResponse definiše strukturu za odgovor grupe, isključujući osetljiva ili velika polja.
type GroupResponse struct {
	ID              uint              `json:"id"`
	Name            string            `json:"name"`
	Endpoint        string            `json:"endpoint"`
	DisplayName     string            `json:"display_name"`
	Description     string            `json:"description"`
	Upstreams       datatypes.JSON    `json:"upstreams"`
	ChannelType     string            `json:"channel_type"`
	Sort            int               `json:"sort"`
	TestModel       string            `json:"test_model"`
	ParamOverrides  datatypes.JSONMap `json:"param_overrides"`
	Config          datatypes.JSONMap `json:"config"`
	LastValidatedAt *time.Time        `json:"last_validated_at"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
}

// newGroupResponse kreira novi GroupResponse iz models.Group.
func (s *Server) newGroupResponse(group *models.Group) *GroupResponse {
	appURL := s.SettingsManager.GetAppUrl()
	endpoint := ""
	if appURL != "" {
		u, err := url.Parse(appURL)
		if err == nil {
			u.Path = strings.TrimRight(u.Path, "/") + "/proxy/" + group.Name
			endpoint = u.String()
		}
	}

	return &GroupResponse{
		ID:              group.ID,
		Name:            group.Name,
		Endpoint:        endpoint,
		DisplayName:     group.DisplayName,
		Description:     group.Description,
		Upstreams:       group.Upstreams,
		ChannelType:     group.ChannelType,
		Sort:            group.Sort,
		TestModel:       group.TestModel,
		ParamOverrides:  group.ParamOverrides,
		Config:          group.Config,
		LastValidatedAt: group.LastValidatedAt,
		CreatedAt:       group.CreatedAt,
		UpdatedAt:       group.UpdatedAt,
	}
}

// DeleteGroup obrađuje brisanje grupe.
func (s *Server) DeleteGroup(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrBadRequest, "Nevažeći format ID-a grupe"))
		return
	}

	// Prvo, dobij sve API ključeve za ovu grupu da bi se očistili iz memorijskog skladišta
	var apiKeys []models.APIKey
	if err := s.DB.Where("group_id = ?", id).Find(&apiKeys).Error; err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	// Izdvoji ID-eve ključeva za čišćenje memorijskog skladišta
	var keyIDs []uint
	for _, key := range apiKeys {
		keyIDs = append(keyIDs, key.ID)
	}

	// Koristi transakciju da bi se osigurala atomičnost
	tx := s.DB.Begin()
	if tx.Error != nil {
		response.Error(c, app_errors.ErrDatabase)
		return
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Prvo proveri da li grupa postoji
	var group models.Group
	if err := tx.First(&group, id).Error; err != nil {
		tx.Rollback()
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	// Prvo obriši povezane API ključeve zbog ograničenja stranog ključa
	if err := tx.Where("group_id = ?", id).Delete(&models.APIKey{}).Error; err != nil {
		tx.Rollback()
		response.Error(c, app_errors.ErrDatabase)
		return
	}

	// Zatim obriši grupu
	if err := tx.Delete(&models.Group{}, id).Error; err != nil {
		tx.Rollback()
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	// Očisti memorijsko skladište (Redis) unutar transakcije da bi se osigurala atomičnost
	// Ako čišćenje Redis-a ne uspe, cela transakcija će biti vraćena na prethodno stanje
	if len(keyIDs) > 0 {
		if err := s.KeyService.KeyProvider.RemoveKeysFromStore(uint(id), keyIDs); err != nil {
			tx.Rollback()
			logrus.WithFields(logrus.Fields{
				"groupID":  id,
				"keyCount": len(keyIDs),
				"error":    err,
			}).Error("Nije uspelo uklanjanje ključeva iz memorijskog skladišta, vraćanje transakcije na prethodno stanje")

			response.Error(c, app_errors.NewAPIError(app_errors.ErrDatabase,
				"Nije uspelo brisanje grupe: nije moguće očistiti keš"))
			return
		}
	}

	// Potvrdi transakciju samo ako su i DB i Redis operacije uspešne
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		response.Error(c, app_errors.ErrDatabase)
		return
	}

	if err := s.GroupManager.Invalidate(); err != nil {
		logrus.WithContext(c.Request.Context()).WithError(err).Error("nije uspelo poništavanje keša grupe")
	}
	response.Success(c, gin.H{"message": "Grupa i povezani ključevi uspešno obrisani"})
}

// ConfigOption predstavlja jednu konfigurabilnu opciju za grupu.
type ConfigOption struct {
	Key          string `json:"key"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	DefaultValue any    `json:"default_value"`
}

// GetGroupConfigOptions vraća listu dostupnih opcija konfiguracije za grupe.
func (s *Server) GetGroupConfigOptions(c *gin.Context) {
	var options []ConfigOption

	// 1. Dobij sve definicije sistemskih podešavanja iz struct tagova
	defaultSettings := utils.DefaultSystemSettings()
	settingDefinitions := utils.GenerateSettingsMetadata(&defaultSettings)
	defMap := make(map[string]models.SystemSettingInfo)
	for _, def := range settingDefinitions {
		defMap[def.Key] = def
	}

	// 2. Dobij trenutne vrednosti sistemskih podešavanja
	currentSettings := s.SettingsManager.GetSettings()
	currentSettingsValue := reflect.ValueOf(currentSettings)
	currentSettingsType := currentSettingsValue.Type()
	jsonToFieldMap := make(map[string]string)
	for i := 0; i < currentSettingsType.NumField(); i++ {
		field := currentSettingsType.Field(i)
		jsonTag := strings.Split(field.Tag.Get("json"), ",")[0]
		if jsonTag != "" {
			jsonToFieldMap[jsonTag] = field.Name
		}
	}

	// 3. Iteriraj kroz polja GroupConfig da bi se održao redosled i izgradio odgovor
	groupConfigType := reflect.TypeOf(models.GroupConfig{})

	for i := 0; i < groupConfigType.NumField(); i++ {
		field := groupConfigType.Field(i)
		jsonTag := field.Tag.Get("json")
		key := strings.Split(jsonTag, ",")[0]

		if key == "" || key == "-" {
			continue
		}

		if definition, ok := defMap[key]; ok {
			var defaultValue any
			if fieldName, ok := jsonToFieldMap[key]; ok {
				defaultValue = currentSettingsValue.FieldByName(fieldName).Interface()
			}

			option := ConfigOption{
				Key:          key,
				Name:         definition.Name,
				Description:  definition.Description,
				DefaultValue: defaultValue,
			}
			options = append(options, option)
		}
	}

	response.Success(c, options)
}

// KeyStats definiše statistiku za API ključeve u grupi.
type KeyStats struct {
	TotalKeys   int64 `json:"total_keys"`
	ActiveKeys  int64 `json:"active_keys"`
	InvalidKeys int64 `json:"invalid_keys"`
}

// RequestStats definiše statistiku za zahteve tokom perioda.
type RequestStats struct {
	TotalRequests  int64   `json:"total_requests"`
	FailedRequests int64   `json:"failed_requests"`
	FailureRate    float64 `json:"failure_rate"`
}

// GroupStatsResponse definiše kompletnu statistiku za grupu.
type GroupStatsResponse struct {
	KeyStats    KeyStats     `json:"key_stats"`
	HourlyStats RequestStats `json:"hourly_stats"` // 1 sat
	DailyStats  RequestStats `json:"daily_stats"`  // 24 sata
	WeeklyStats RequestStats `json:"weekly_stats"` // 7 dana
}

// calculateRequestStats je pomoćna funkcija za izračunavanje statistike zahteva.
func calculateRequestStats(total, failed int64) RequestStats {
	stats := RequestStats{
		TotalRequests:  total,
		FailedRequests: failed,
	}
	if total > 0 {
		stats.FailureRate, _ = strconv.ParseFloat(fmt.Sprintf("%.4f", float64(failed)/float64(total)), 64)
	}
	return stats
}

// GetGroupStats obrađuje preuzimanje detaljne statistike za određenu grupu.
func (s *Server) GetGroupStats(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrBadRequest, "Nevažeći format ID-a grupe"))
		return
	}
	groupID := uint(id)

	// 1. Proveri da li grupa postoji
	var group models.Group
	if err := s.DB.First(&group, groupID).Error; err != nil {
		response.Error(c, app_errors.ParseDBError(err))
		return
	}

	var resp GroupStatsResponse
	var wg sync.WaitGroup
	var mu sync.Mutex
	var errors []error

	// Konkurentno izvršavanje svih upita za statistiku

	// 2. Statistika ključeva
	wg.Add(1)
	go func() {
		defer wg.Done()
		var totalKeys, activeKeys int64

		if err := s.DB.Model(&models.APIKey{}).Where("group_id = ?", groupID).Count(&totalKeys).Error; err != nil {
			mu.Lock()
			errors = append(errors, fmt.Errorf("nije uspelo dobijanje ukupnog broja ključeva: %w", err))
			mu.Unlock()
			return
		}
		if err := s.DB.Model(&models.APIKey{}).Where("group_id = ? AND status = ?", groupID, models.KeyStatusActive).Count(&activeKeys).Error; err != nil {
			mu.Lock()
			errors = append(errors, fmt.Errorf("nije uspelo dobijanje aktivnih ključeva: %w", err))
			mu.Unlock()
			return
		}

		mu.Lock()
		resp.KeyStats = KeyStats{
			TotalKeys:   totalKeys,
			ActiveKeys:  activeKeys,
			InvalidKeys: totalKeys - activeKeys,
		}
		mu.Unlock()
	}()

	// 3. Statistika zahteva za 1 sat (upit tabele request_logs)
	wg.Add(1)
	go func() {
		defer wg.Done()
		var total, failed int64
		now := time.Now()
		oneHourAgo := now.Add(-1 * time.Hour)

		if err := s.DB.Model(&models.RequestLog{}).Where("group_id = ? AND timestamp BETWEEN ? AND ?", groupID, oneHourAgo, now).Count(&total).Error; err != nil {
			mu.Lock()
			errors = append(errors, fmt.Errorf("nije uspelo dobijanje ukupnog broja zahteva po satu: %w", err))
			mu.Unlock()
			return
		}
		if err := s.DB.Model(&models.RequestLog{}).Where("group_id = ? AND timestamp BETWEEN ? AND ? AND is_success = ?", groupID, oneHourAgo, now, false).Count(&failed).Error; err != nil {
			mu.Lock()
			errors = append(errors, fmt.Errorf("nije uspelo dobijanje neuspelih zahteva po satu: %w", err))
			mu.Unlock()
			return
		}

		mu.Lock()
		resp.HourlyStats = calculateRequestStats(total, failed)
		mu.Unlock()
	}()

	// 4. Statistika za 24 sata i 7 dana (upit tabele group_hourly_stats)
	// Pomoćna funkcija za upit iz group_hourly_stats
	queryHourlyStats := func(duration time.Duration) (RequestStats, error) {
		var result struct {
			SuccessCount int64
			FailureCount int64
		}
		now := time.Now()
		// Krajnje vreme je početak tekućeg sata, upit ne uključuje taj sat
		// Početno vreme je krajnje vreme minus period statistike
		endTime := now.Truncate(time.Hour)
		startTime := endTime.Add(-duration)

		err := s.DB.Model(&models.GroupHourlyStat{}).
			Select("SUM(success_count) as success_count, SUM(failure_count) as failure_count").
			Where("group_id = ? AND time >= ? AND time < ?", groupID, startTime, endTime).
			Scan(&result).Error
		if err != nil {
			return RequestStats{}, err
		}
		return calculateRequestStats(result.SuccessCount+result.FailureCount, result.FailureCount), nil
	}

	// Statistika za 24 sata
	wg.Add(1)
	go func() {
		defer wg.Done()
		stats, err := queryHourlyStats(24 * time.Hour)
		if err != nil {
			mu.Lock()
			errors = append(errors, fmt.Errorf("nije uspelo dobijanje dnevne statistike: %w", err))
			mu.Unlock()
			return
		}
		mu.Lock()
		resp.DailyStats = stats
		mu.Unlock()
	}()

	// Statistika za 7 dana
	wg.Add(1)
	go func() {
		defer wg.Done()
		stats, err := queryHourlyStats(7 * 24 * time.Hour)
		if err != nil {
			mu.Lock()
			errors = append(errors, fmt.Errorf("nije uspelo dobijanje nedeljne statistike: %w", err))
			mu.Unlock()
			return
		}
		mu.Lock()
		resp.WeeklyStats = stats
		mu.Unlock()
	}()

	wg.Wait()

	if len(errors) > 0 {
		// Zabeleži samo prvu grešku, ali naznači da može biti više grešaka
		logrus.WithContext(c.Request.Context()).WithError(errors[0]).Error("Došlo je do grešaka prilikom preuzimanja statistike grupe")
		response.Error(c, app_errors.NewAPIError(app_errors.ErrDatabase, "Nije uspelo preuzimanje nekih statistika"))
		return
	}

	response.Success(c, resp)
}

// List godoc
func (s *Server) List(c *gin.Context) {
	var groups []models.Group
	if err := s.DB.Select("id, name,display_name").Find(&groups).Error; err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrDatabase, "Nije moguće dobiti listu grupa"))
		return
	}
	response.Success(c, groups)
}
