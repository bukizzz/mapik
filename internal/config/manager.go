// Paket config pruža upravljanje konfiguracijom za aplikaciju
package config

import (
	"fmt"
	"os"
	"strings"

	"MAPIK/internal/errors"
	"MAPIK/internal/types"
	"MAPIK/internal/utils"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

// Constants predstavlja konstante konfiguracije
type Constants struct {
	MinPort               int
	MaxPort               int
	MinTimeout            int
	DefaultTimeout        int
	DefaultMaxSockets     int
	DefaultMaxFreeSockets int
}

// DefaultConstants sadrži podrazumevane vrednosti konfiguracije
var DefaultConstants = Constants{
	MinPort:               1,
	MaxPort:               65535,
	MinTimeout:            1,
	DefaultTimeout:        30,
	DefaultMaxSockets:     50,
	DefaultMaxFreeSockets: 10,
}

// Manager implementira interfejs ConfigManager
type Manager struct {
	config          *Config
	settingsManager *SystemSettingsManager
}

// Config predstavlja konfiguraciju aplikacije
type Config struct {
	Server      types.ServerConfig      `json:"server"`
	Auth        types.AuthConfig        `json:"auth"`
	CORS        types.CORSConfig        `json:"cors"`
	Performance types.PerformanceConfig `json:"performance"`
	Log         types.LogConfig         `json:"log"`
	Database    types.DatabaseConfig    `json:"database"`
	RedisDSN    string                  `json:"redis_dsn"`
}

// NewManager kreira novi menadžer konfiguracije
func NewManager(settingsManager *SystemSettingsManager) (types.ConfigManager, error) {
	manager := &Manager{
		settingsManager: settingsManager,
	}
	if err := manager.ReloadConfig(); err != nil {
		return nil, err
	}
	return manager, nil
}

// ReloadConfig ponovo učitava konfiguraciju iz promenljivih okruženja
func (m *Manager) ReloadConfig() error {
	if err := godotenv.Load(); err != nil {
		logrus.Info("Info: Kreirajte .env datoteku za podršku konfiguraciji promenljivih okruženja")
	}

	config := &Config{
		Server: types.ServerConfig{
			IsMaster:                !utils.ParseBoolean(os.Getenv("IS_SLAVE"), false),
			Port:                    utils.ParseInteger(os.Getenv("PORT"), 3001),
			Host:                    utils.GetEnvOrDefault("HOST", "0.0.0.0"),
			ReadTimeout:             utils.ParseInteger(os.Getenv("SERVER_READ_TIMEOUT"), 60),
			WriteTimeout:            utils.ParseInteger(os.Getenv("SERVER_WRITE_TIMEOUT"), 600),
			IdleTimeout:             utils.ParseInteger(os.Getenv("SERVER_IDLE_TIMEOUT"), 120),
			GracefulShutdownTimeout: utils.ParseInteger(os.Getenv("SERVER_GRACEFUL_SHUTDOWN_TIMEOUT"), 10),
		},
		Auth: types.AuthConfig{
			Key: os.Getenv("AUTH_KEY"),
		},
		CORS: types.CORSConfig{
			Enabled:          utils.ParseBoolean(os.Getenv("ENABLE_CORS"), true),
			AllowedOrigins:   utils.ParseArray(os.Getenv("ALLOWED_ORIGINS"), []string{"*"}),
			AllowedMethods:   utils.ParseArray(os.Getenv("ALLOWED_METHODS"), []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
			AllowedHeaders:   utils.ParseArray(os.Getenv("ALLOWED_HEADERS"), []string{"*"}),
			AllowCredentials: utils.ParseBoolean(os.Getenv("ALLOW_CREDENTIALS"), false),
		},
		Performance: types.PerformanceConfig{
			MaxConcurrentRequests: utils.ParseInteger(os.Getenv("MAX_CONCURRENT_REQUESTS"), 100),
		},
		Log: types.LogConfig{
			Level:      utils.GetEnvOrDefault("LOG_LEVEL", "info"),
			Format:     utils.GetEnvOrDefault("LOG_FORMAT", "text"),
			EnableFile: utils.ParseBoolean(os.Getenv("LOG_ENABLE_FILE"), false),
			FilePath:   utils.GetEnvOrDefault("LOG_FILE_PATH", "./data/logs/app.log"),
		},
		Database: types.DatabaseConfig{
			DSN: utils.GetEnvOrDefault("DATABASE_DSN", "./data/MAPIK.db"),
		},
		RedisDSN: os.Getenv("REDIS_DSN"),
	}
	m.config = config

	// Validacija konfiguracije
	if err := m.Validate(); err != nil {
		return err
	}

	return nil
}

// IsMaster vraća režim servera
func (m *Manager) IsMaster() bool {
	return m.config.Server.IsMaster
}

// GetAuthConfig vraća konfiguraciju autentifikacije
func (m *Manager) GetAuthConfig() types.AuthConfig {
	return m.config.Auth
}

// GetCORSConfig vraća CORS konfiguraciju
func (m *Manager) GetCORSConfig() types.CORSConfig {
	return m.config.CORS
}

// GetPerformanceConfig vraća konfiguraciju performansi
func (m *Manager) GetPerformanceConfig() types.PerformanceConfig {
	return m.config.Performance
}

// GetLogConfig vraća konfiguraciju logovanja
func (m *Manager) GetLogConfig() types.LogConfig {
	return m.config.Log
}

// GetRedisDSN vraća Redis DSN string.
func (m *Manager) GetRedisDSN() string {
	return m.config.RedisDSN
}

// GetDatabaseConfig vraća konfiguraciju baze podataka.
func (m *Manager) GetDatabaseConfig() types.DatabaseConfig {
	return m.config.Database
}

// GetEffectiveServerConfig vraća konfiguraciju servera spojenu sa sistemskim podešavanjima
func (m *Manager) GetEffectiveServerConfig() types.ServerConfig {
	return m.config.Server
}

// Validate validira konfiguraciju
func (m *Manager) Validate() error {
	var validationErrors []string

	// Validacija porta
	if m.config.Server.Port < DefaultConstants.MinPort || m.config.Server.Port > DefaultConstants.MaxPort {
		validationErrors = append(validationErrors, fmt.Sprintf("port mora biti između %d-%d", DefaultConstants.MinPort, DefaultConstants.MaxPort))
	}

	if m.config.Performance.MaxConcurrentRequests < 1 {
		validationErrors = append(validationErrors, "maksimalan broj istovremenih zahteva ne može biti manji od 1")
	}

	// Validacija ključa za autentifikaciju
	if m.config.Auth.Key == "" {
		validationErrors = append(validationErrors, "AUTH_KEY je obavezan i ne može biti prazan")
	}

	// Validacija GracefulShutdownTimeout i resetovanje ako je potrebno
	if m.config.Server.GracefulShutdownTimeout < 10 {
		logrus.Warnf("Vrednost SERVER_GRACEFUL_SHUTDOWN_TIMEOUT %ds je prekratka, resetuje se na minimum 10s.", m.config.Server.GracefulShutdownTimeout)
		m.config.Server.GracefulShutdownTimeout = 10
	}

	if len(validationErrors) > 0 {
		logrus.Error("Validacija konfiguracije nije uspela:")
		for _, err := range validationErrors {
			logrus.Errorf("   - %s", err)
		}
		return errors.NewAPIError(errors.ErrValidation, strings.Join(validationErrors, "; "))
	}

	return nil
}

// DisplayServerConfig prikazuje trenutne informacije o konfiguraciji servera
func (m *Manager) DisplayServerConfig() {
	serverConfig := m.GetEffectiveServerConfig()
	corsConfig := m.GetCORSConfig()
	perfConfig := m.GetPerformanceConfig()
	logConfig := m.GetLogConfig()
	dbConfig := m.GetDatabaseConfig()

	logrus.Info("")
	logrus.Info("======= Konfiguracija Servera =======")
	logrus.Info("  --- Server ---")
	logrus.Infof("    Adresa slušanja: %s:%d", serverConfig.Host, serverConfig.Port)
	logrus.Infof("    Vremensko ograničenje za graciozno gašenje: %d sekundi", serverConfig.GracefulShutdownTimeout)
	logrus.Infof("    Vremensko ograničenje za čitanje: %d sekundi", serverConfig.ReadTimeout)
	logrus.Infof("    Vremensko ograničenje za pisanje: %d sekundi", serverConfig.WriteTimeout)
	logrus.Infof("    Vremensko ograničenje za mirovanje: %d sekundi", serverConfig.IdleTimeout)

	logrus.Info("  --- Performanse ---")
	logrus.Infof("    Maksimalan broj istovremenih zahteva: %d", perfConfig.MaxConcurrentRequests)

	logrus.Info("  --- Sigurnost ---")
	logrus.Infof("    Autentifikacija: omogućena (ključ učitan)")
	corsStatus := "onemogućeno"
	if corsConfig.Enabled {
		corsStatus = fmt.Sprintf("omogućeno (Porekla: %s)", strings.Join(corsConfig.AllowedOrigins, ", "))
	}
	logrus.Infof("    CORS: %s", corsStatus)

	logrus.Info("  --- Logovanje ---")
	logrus.Infof("    Nivo logovanja: %s", logConfig.Level)
	logrus.Infof("    Format logovanja: %s", logConfig.Format)
	logrus.Infof("    Logovanje u datoteku: %t", logConfig.EnableFile)
	if logConfig.EnableFile {
		logrus.Infof("    Putanja datoteke loga: %s", logConfig.FilePath)
	}

	logrus.Info("  --- Zavisnosti ---")
	if dbConfig.DSN != "" {
		logrus.Info("    Baza podataka: konfigurisana")
	} else {
		logrus.Info("    Baza podataka: nije konfigurisana")
	}
	if m.config.RedisDSN != "" {
		logrus.Info("    Redis: konfigurisan")
	} else {
		logrus.Info("    Redis: nije konfigurisan")
	}
	logrus.Info("====================================")
	logrus.Info("")
}
