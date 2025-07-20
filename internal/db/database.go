package db

import (
	"MAPIK/internal/types"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func NewDB(configManager types.ConfigManager) (*gorm.DB, error) {
	dbConfig := configManager.GetDatabaseConfig()
	dsn := dbConfig.DSN
	if dsn == "" {
		return nil, fmt.Errorf("DATABASE_DSN nije konfigurisan")
	}

	var newLogger logger.Interface
	if configManager.GetLogConfig().Level == "debug" {
		newLogger = logger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags), // I/O pisac
			logger.Config{
				SlowThreshold:             time.Second, // Prag za spori SQL
				LogLevel:                  logger.Info, // Nivo logovanja
				IgnoreRecordNotFoundError: true,        // Ignoriši grešku ErrRecordNotFound za loger
				Colorful:                  true,        // Onemogući boju
			},
		)
	}

	var dialector gorm.Dialector
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		dialector = postgres.New(postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol: true,
		})
	} else if strings.Contains(dsn, "@tcp") {
		if !strings.Contains(dsn, "parseTime") {
			if strings.Contains(dsn, "?") {
				dsn += "&parseTime=true"
			} else {
				dsn += "?parseTime=true"
			}
		}
		dialector = mysql.Open(dsn)
	} else {
		if err := os.MkdirAll(filepath.Dir(dsn), 0755); err != nil {
			return nil, fmt.Errorf("nije uspelo kreiranje direktorijuma baze podataka: %w", err)
		}
		dialector = sqlite.Open(dsn + "?_busy_timeout=5000")
	}

	var err error
	DB, err = gorm.Open(dialector, &gorm.Config{
		Logger:      newLogger,
		PrepareStmt: true,
	})
	if err != nil {
		return nil, fmt.Errorf("nije uspelo povezivanje sa bazom podataka: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return nil, fmt.Errorf("nije uspelo dobijanje sql.DB: %w", err)
	}
	// Postavi parametre bazena veza za sve drajvere
	sqlDB.SetMaxIdleConns(50)
	sqlDB.SetMaxOpenConns(500)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return DB, nil
}
