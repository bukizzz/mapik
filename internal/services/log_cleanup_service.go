package services

import (
	"MAPIK/internal/config"
	"MAPIK/internal/models"
	"context"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// LogCleanupService je odgovoran za čišćenje isteklih logova zahteva
type LogCleanupService struct {
	db              *gorm.DB
	settingsManager *config.SystemSettingsManager
	stopCh          chan struct{}
	wg              sync.WaitGroup
}

// NewLogCleanupService kreira novu uslugu za čišćenje logova
func NewLogCleanupService(db *gorm.DB, settingsManager *config.SystemSettingsManager) *LogCleanupService {
	return &LogCleanupService{
		db:              db,
		settingsManager: settingsManager,
		stopCh:          make(chan struct{}),
	}
}

// Start pokreće uslugu za čišćenje logova
func (s *LogCleanupService) Start() {
	s.wg.Add(1)
	go s.run()
	logrus.Debug("Log cleanup service started")
}

// Stop zaustavlja uslugu za čišćenje logova
func (s *LogCleanupService) Stop(ctx context.Context) {
	close(s.stopCh)

	done := make(chan struct{})
	go func() {
		s.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logrus.Info("LogCleanupService stopped gracefully.")
	case <-ctx.Done():
		logrus.Warn("LogCleanupService stop timed out.")
	}
}

// run pokreće glavnu petlju za čišćenje logova
func (s *LogCleanupService) run() {
	defer s.wg.Done()
	ticker := time.NewTicker(2 * time.Hour)
	defer ticker.Stop()

	// Izvršite čišćenje jednom prilikom pokretanja
	s.cleanupExpiredLogs()

	for {
		select {
		case <-ticker.C:
			s.cleanupExpiredLogs()
		case <-s.stopCh:
			return
		}
	}
}

// cleanupExpiredLogs čisti istekle logove zahteva
func (s *LogCleanupService) cleanupExpiredLogs() {
	// Preuzmite konfiguraciju dana zadržavanja logova
	settings := s.settingsManager.GetSettings()
	retentionDays := settings.RequestLogRetentionDays

	if retentionDays <= 0 {
		logrus.Debug("Zadržavanje logova je onemogućeno (retention_days <= 0)")
		return
	}

	// Izračunajte vreme isteka
	cutoffTime := time.Now().AddDate(0, 0, -retentionDays).UTC()

	// Izvršite operaciju brisanja
	result := s.db.Where("timestamp < ?", cutoffTime).Delete(&models.RequestLog{})
	if result.Error != nil {
		logrus.WithError(result.Error).Error("Nije uspelo čišćenje isteklih logova zahteva")
		return
	}

	if result.RowsAffected > 0 {
		logrus.WithFields(logrus.Fields{
			"deleted_count":  result.RowsAffected,
			"cutoff_time":    cutoffTime.Format(time.RFC3339),
			"retention_days": retentionDays,
		}).Info("Uspešno očišćeni istekli logovi zahteva")
	} else {
		logrus.Debug("Nema isteklih logova zahteva za čišćenje")
	}
}
