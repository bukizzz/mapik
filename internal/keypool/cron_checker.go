package keypool

import (
	"MAPIK/internal/config"
	"MAPIK/internal/models"
	"context"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// CronChecker je odgovoran za periodično validiranje nevažećih ključeva.
type CronChecker struct {
	DB              *gorm.DB
	SettingsManager *config.SystemSettingsManager
	Validator       *KeyValidator
	stopChan        chan struct{}
	wg              sync.WaitGroup
}

// NewCronChecker kreira novi CronChecker.
func NewCronChecker(
	db *gorm.DB,
	settingsManager *config.SystemSettingsManager,
	validator *KeyValidator,
) *CronChecker {
	return &CronChecker{
		DB:              db,
		SettingsManager: settingsManager,
		Validator:       validator,
		stopChan:        make(chan struct{}),
	}
}

// Start pokreće izvršavanje cron posla.
func (s *CronChecker) Start() {
	logrus.Debug("Pokretanje CronChecker-a...")
	s.wg.Add(1)
	go s.runLoop()
}

// Stop zaustavlja cron posao, poštujući kontekst za timeout isključivanja.
func (s *CronChecker) Stop(ctx context.Context) {
	close(s.stopChan)

	// Sačekajte da se gorutina završi, ili da istekne vreme za isključivanje.
	done := make(chan struct{})
	go func() {
		s.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logrus.Info("CronChecker je graciozno zaustavljen.")
	case <-ctx.Done():
		logrus.Warn("Isteklo je vreme za zaustavljanje CronChecker-a.")
	}
}

func (s *CronChecker) runLoop() {
	defer s.wg.Done()

	s.submitValidationJobs()

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			logrus.Debug("CronChecker: Radi kao Master, podnosi poslove validacije.")
			s.submitValidationJobs()
		case <-s.stopChan:
			return
		}
	}
}

// submitValidationJobs pronalazi grupe čiji ključevi zahtevaju validaciju i validira ih konkurentno.
func (s *CronChecker) submitValidationJobs() {
	var groups []models.Group
	if err := s.DB.Find(&groups).Error; err != nil {
		logrus.Errorf("CronChecker: Neuspešno dobijanje grupa: %v", err)
		return
	}

	validationStartTime := time.Now()
	var wg sync.WaitGroup

	for i := range groups {
		group := &groups[i]
		group.EffectiveConfig = s.SettingsManager.GetEffectiveConfig(group.Config)
		interval := time.Duration(group.EffectiveConfig.KeyValidationIntervalMinutes) * time.Minute

		if group.LastValidatedAt == nil || validationStartTime.Sub(*group.LastValidatedAt) > interval {
			wg.Add(1)
			g := group
			go func() {
				defer wg.Done()
				s.validateGroupKeys(g)
			}()
		}
	}

	wg.Wait()
}

// validateGroupKeys validira sve nevažeće ključeve za jednu grupu konkurentno.
func (s *CronChecker) validateGroupKeys(group *models.Group) {
	groupProcessStart := time.Now()

	var invalidKeys []models.APIKey
	err := s.DB.Where("group_id = ? AND status = ?", group.ID, models.KeyStatusInvalid).Find(&invalidKeys).Error
	if err != nil {
		logrus.Errorf("CronChecker: Neuspešno dobijanje nevažećih ključeva za grupu %s: %v", group.Name, err)
		return
	}

	if len(invalidKeys) == 0 {
		if err := s.DB.Model(group).Update("last_validated_at", time.Now()).Error; err != nil {
			logrus.Errorf("CronChecker: Neuspešno ažuriranje last_validated_at za grupu %s: %v", group.Name, err)
		}
		logrus.Infof("CronChecker: Grupa '%s' nema nevažećih ključeva za proveru.", group.Name)
		return
	}

	var becameValidCount int32
	var keyWg sync.WaitGroup
	jobs := make(chan *models.APIKey, len(invalidKeys))

	concurrency := group.EffectiveConfig.KeyValidationConcurrency
	for range concurrency {
		keyWg.Add(1)
		go func() {
			defer keyWg.Done()
			for {
				select {
				case key, ok := <-jobs:
					if !ok {
						return
					}
					isValid, _ := s.Validator.ValidateSingleKey(key, group)
					if isValid {
						atomic.AddInt32(&becameValidCount, 1)
					}
				case <-s.stopChan:
					return
				}
			}
		}()
	}

DistributeLoop:
	for i := range invalidKeys {
		select {
		case jobs <- &invalidKeys[i]:
		case <-s.stopChan:
			break DistributeLoop
		}
	}
	close(jobs)

	keyWg.Wait()

	if err := s.DB.Model(group).Update("last_validated_at", time.Now()).Error; err != nil {
		logrus.Errorf("CronChecker: Neuspešno ažuriranje last_validated_at za grupu %s: %v", group.Name, err)
	}

	duration := time.Since(groupProcessStart)
	logrus.Infof(
		"CronChecker: Validacija grupe '%s' završena. Ukupno provereno: %d, postalo važeće: %d. Trajanje: %s.",
		group.Name,
		len(invalidKeys),
		becameValidCount,
		duration.String(),
	)
}
