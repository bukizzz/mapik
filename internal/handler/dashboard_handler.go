package handler

import (
	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/models"
	"MAPIK/internal/response"
	"time"

	"github.com/gin-gonic/gin"
)

// Stats Dobijanje statistike kontrolne table
func (s *Server) Stats(c *gin.Context) {
	var activeKeys, invalidKeys, groupCount int64
	s.DB.Model(&models.APIKey{}).Where("status = ?", models.KeyStatusActive).Count(&activeKeys)
	s.DB.Model(&models.APIKey{}).Where("status = ?", models.KeyStatusInvalid).Count(&invalidKeys)
	s.DB.Model(&models.Group{}).Count(&groupCount)

	now := time.Now()
	twentyFourHoursAgo := now.Add(-24 * time.Hour)
	fortyEightHoursAgo := now.Add(-48 * time.Hour)

	currentPeriod, err := s.getHourlyStats(twentyFourHoursAgo, now)
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrDatabase, "nije uspelo dobijanje statistike za trenutni period"))
		return
	}
	previousPeriod, err := s.getHourlyStats(fortyEightHoursAgo, twentyFourHoursAgo)
	if err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrDatabase, "nije uspelo dobijanje statistike za prethodni period"))
		return
	}

	// Izračunaj trend broja zahteva
	reqTrend := 0.0
	reqTrendIsGrowth := true
	if previousPeriod.TotalRequests > 0 {
		// Postoje prethodni podaci, izračunaj procentualnu promenu
		reqTrend = (float64(currentPeriod.TotalRequests-previousPeriod.TotalRequests) / float64(previousPeriod.TotalRequests)) * 100
		reqTrendIsGrowth = reqTrend >= 0
	} else if currentPeriod.TotalRequests > 0 {
		// Nema prethodnih podataka, ali ima trenutnih, smatra se 100% rastom
		reqTrend = 100.0
		reqTrendIsGrowth = true
	} else {
		// Nema podataka ni za prethodni ni za trenutni period
		reqTrend = 0.0
		reqTrendIsGrowth = true
	}

	// Izračunaj trenutnu i prethodnu stopu grešaka
	currentErrorRate := 0.0
	if currentPeriod.TotalRequests > 0 {
		currentErrorRate = (float64(currentPeriod.TotalFailures) / float64(currentPeriod.TotalRequests)) * 100
	}

	previousErrorRate := 0.0
	if previousPeriod.TotalRequests > 0 {
		previousErrorRate = (float64(previousPeriod.TotalFailures) / float64(previousPeriod.TotalRequests)) * 100
	}

	// Izračunaj trend stope grešaka
	errorRateTrend := 0.0
	errorRateTrendIsGrowth := false
	if previousPeriod.TotalRequests > 0 {
		// Postoje prethodni podaci, izračunaj razliku u procentnim poenima
		errorRateTrend = currentErrorRate - previousErrorRate
		errorRateTrendIsGrowth = errorRateTrend < 0 // Pad stope grešaka je dobar
	} else if currentPeriod.TotalRequests > 0 {
		// Nema prethodnih podataka, ali ima trenutnih
		errorRateTrend = currentErrorRate // Prikaži trenutnu stopu grešaka
		errorRateTrendIsGrowth = false    // Greška je loša (ako je stopa grešaka > 0)
		if currentErrorRate == 0 {
			errorRateTrendIsGrowth = true // Ako trenutno nema grešaka, označi kao pozitivno
		}
	} else {
		// Nema podataka ni za prethodni ni za trenutni period
		errorRateTrend = 0.0
		errorRateTrendIsGrowth = true
	}

	stats := models.DashboardStatsResponse{
		KeyCount: models.StatCard{
			Value:       float64(activeKeys),
			SubValue:    invalidKeys,
			SubValueTip: "Broj nevažećih ključeva",
		},
		GroupCount: models.StatCard{
			Value: float64(groupCount),
		},
		RequestCount: models.StatCard{
			Value:         float64(currentPeriod.TotalRequests),
			Trend:         reqTrend,
			TrendIsGrowth: reqTrendIsGrowth,
		},
		ErrorRate: models.StatCard{
			Value:         currentErrorRate,
			Trend:         errorRateTrend,
			TrendIsGrowth: errorRateTrendIsGrowth,
		},
	}

	response.Success(c, stats)
}

// Chart Dobijanje podataka za grafikon kontrolne table
func (s *Server) Chart(c *gin.Context) {
	groupID := c.Query("groupId")

	now := time.Now()
	endHour := now.Truncate(time.Hour)
	startHour := endHour.Add(-23 * time.Hour)

	var hourlyStats []models.GroupHourlyStat
	query := s.DB.Where("time >= ? AND time < ?", startHour, endHour.Add(time.Hour))
	if groupID != "" {
		query = query.Where("group_id = ?", groupID)
	}
	if err := query.Order("time asc").Find(&hourlyStats).Error; err != nil {
		response.Error(c, app_errors.NewAPIError(app_errors.ErrDatabase, "nije uspelo dobijanje podataka za grafikon"))
		return
	}

	statsByHour := make(map[time.Time]map[string]int64)
	for _, stat := range hourlyStats {
		hour := stat.Time.Local().Truncate(time.Hour)
		if _, ok := statsByHour[hour]; !ok {
			statsByHour[hour] = make(map[string]int64)
		}
		statsByHour[hour]["success"] += stat.SuccessCount
		statsByHour[hour]["failure"] += stat.FailureCount
	}

	var labels []string
	var successData, failureData []int64

	for i := range 24 {
		hour := startHour.Add(time.Duration(i) * time.Hour)
		labels = append(labels, hour.Format(time.RFC3339))

		if data, ok := statsByHour[hour]; ok {
			successData = append(successData, data["success"])
			failureData = append(failureData, data["failure"])
		} else {
			successData = append(successData, 0)
			failureData = append(failureData, 0)
		}
	}

	chartData := models.ChartData{
		Labels: labels,
		Datasets: []models.ChartDataset{
			{
				Label: "Uspešni zahtevi",
				Data:  successData,
				Color: "rgba(10, 200, 110, 1)",
			},
			{
				Label: "Neuspešni zahtevi",
				Data:  failureData,
				Color: "rgba(255, 70, 70, 1)",
			},
		},
	}

	response.Success(c, chartData)
}

type hourlyStatResult struct {
	TotalRequests int64
	TotalFailures int64
}

func (s *Server) getHourlyStats(startTime, endTime time.Time) (hourlyStatResult, error) {
	var result hourlyStatResult
	err := s.DB.Model(&models.GroupHourlyStat{}).
		Select("sum(success_count) + sum(failure_count) as total_requests, sum(failure_count) as total_failures").
		Where("time >= ? AND time < ?", startTime, endTime).
		Scan(&result).Error
	return result, err
}
