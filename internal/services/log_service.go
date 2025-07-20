package services

import (
	"MAPIK/internal/models"
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ExportableLogKey definiše strukturu podataka za izvoz u CSV.
type ExportableLogKey struct {
	KeyValue   string `gorm:"column:key_value"`
	GroupName  string `gorm:"column:group_name"`
	StatusCode int    `gorm:"column:status_code"`
}

// LogService pruža usluge vezane za logove zahteva.
type LogService struct {
	DB *gorm.DB
}

// NewLogService kreira novi LogService.
func NewLogService(db *gorm.DB) *LogService {
	return &LogService{DB: db}
}

// logFiltersScope vraća GORM scope funkciju koja primenjuje filtere iz Gin konteksta.
func logFiltersScope(c *gin.Context) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if groupName := c.Query("group_name"); groupName != "" {
			db = db.Where("group_name LIKE ?", "%"+groupName+"%")
		}
		if keyValue := c.Query("key_value"); keyValue != "" {
			// Bezbedno rukovanje keyValue, izbegavajući greške van opsega
			var likePattern string
			if len(keyValue) > 2 {
				likePattern = "%" + keyValue[1:len(keyValue)-1] + "%"
			} else {
				likePattern = "%" + keyValue + "%"
			}
			db = db.Where("key_value LIKE ?", likePattern)
		}
		if isSuccessStr := c.Query("is_success"); isSuccessStr != "" {
			if isSuccess, err := strconv.ParseBool(isSuccessStr); err == nil {
				db = db.Where("is_success = ?", isSuccess)
			}
		}
		if statusCodeStr := c.Query("status_code"); statusCodeStr != "" {
			if statusCode, err := strconv.Atoi(statusCodeStr); err == nil {
				db = db.Where("status_code = ?", statusCode)
			}
		}
		if sourceIP := c.Query("source_ip"); sourceIP != "" {
			db = db.Where("source_ip = ?", sourceIP)
		}
		if errorContains := c.Query("error_contains"); errorContains != "" {
			db = db.Where("error_message LIKE ?", "%"+errorContains+"%")
		}
		if startTimeStr := c.Query("start_time"); startTimeStr != "" {
			if startTime, err := time.Parse(time.RFC3339, startTimeStr); err == nil {
				db = db.Where("timestamp >= ?", startTime)
			}
		}
		if endTimeStr := c.Query("end_time"); endTimeStr != "" {
			if endTime, err := time.Parse(time.RFC3339, endTimeStr); err == nil {
				db = db.Where("timestamp <= ?", endTime)
			}
		}
		return db
	}
}

// GetLogsQuery vraća GORM upit za preuzimanje logova sa filterima.
func (s *LogService) GetLogsQuery(c *gin.Context) *gorm.DB {
	return s.DB.Model(&models.RequestLog{}).Scopes(logFiltersScope(c))
}

// StreamLogKeysToCSV preuzima jedinstvene ključeve iz logova na osnovu filtera i strimuje ih kao CSV.
func (s *LogService) StreamLogKeysToCSV(c *gin.Context, writer io.Writer) error {
	// Kreirajte CSV writer
	csvWriter := csv.NewWriter(writer)
	defer csvWriter.Flush()

	// Napišite CSV zaglavlje
	header := []string{"key_value", "group_name", "status_code"}
	if err := csvWriter.Write(header); err != nil {
		return fmt.Errorf("nije uspelo pisanje CSV zaglavlja: %w", err)
	}

	var results []ExportableLogKey

	baseQuery := s.DB.Model(&models.RequestLog{}).Scopes(logFiltersScope(c))

	// Koristite funkciju prozora za dobijanje najnovijeg zapisa za svaku key_value
	err := s.DB.Raw(`
		SELECT
			key_value,
			group_name,
			status_code
		FROM (
			SELECT
				key_value,
				group_name,
				status_code,
				ROW_NUMBER() OVER (PARTITION BY key_value ORDER BY timestamp DESC) as rn
			FROM (?) as filtered_logs
		) ranked
		WHERE rn = 1
		ORDER BY key_value
	`, baseQuery).Scan(&results).Error

	if err != nil {
		return fmt.Errorf("nije uspelo preuzimanje ključeva logova: %w", err)
	}

	// Napišite CSV podatke
	for _, record := range results {
		csvRecord := []string{
			record.KeyValue,
			record.GroupName,
			strconv.Itoa(record.StatusCode),
		}
		if err := csvWriter.Write(csvRecord); err != nil {
			return fmt.Errorf("nije uspelo pisanje CSV zapisa: %w", err)
		}
	}

	return nil
}
