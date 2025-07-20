package utils

import (
	"MAPIK/internal/types"
	"io"
	"os"
	"path/filepath"

	"github.com/sirupsen/logrus"
)

// SetupLogger konfiguriše sistem logovanja na osnovu dostavljene konfiguracije.
func SetupLogger(configManager types.ConfigManager) {
	logConfig := configManager.GetLogConfig()

	// Postavi nivo logovanja
	level, err := logrus.ParseLevel(logConfig.Level)
	if err != nil {
		logrus.Warn("Invalid log level, using info")
		level = logrus.InfoLevel
	}
	logrus.SetLevel(level)

	// Postavi format logovanja
	if logConfig.Format == "json" {
		logrus.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: "2006-01-02T15:04:05.000Z07:00", // ISO 8601 format
		})
	} else {
		logrus.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: "2006-01-02 15:04:05",
		})
	}

	// Postavi logovanje u fajl ako je omogućeno
	if logConfig.EnableFile {
		logDir := filepath.Dir(logConfig.FilePath)
		if err := os.MkdirAll(logDir, 0755); err != nil {
			logrus.Warnf("Failed to create log directory: %v", err)
		} else {
			logFile, err := os.OpenFile(logConfig.FilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
			if err != nil {
				logrus.Warnf("Failed to open log file: %v", err)
			} else {
				logrus.SetOutput(io.MultiWriter(os.Stdout, logFile))
			}
		}
	}
}
