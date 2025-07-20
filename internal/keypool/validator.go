package keypool

import (
	"MAPIK/internal/channel"
	"MAPIK/internal/config"
	"MAPIK/internal/models"
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"go.uber.org/dig"
	"gorm.io/gorm"
)

// KeyTestResult sadrži rezultat validacije za pojedinačni ključ.
type KeyTestResult struct {
	KeyValue string `json:"key_value"`
	IsValid  bool   `json:"is_valid"`
	Error    string `json:"error,omitempty"`
}

// KeyValidator pruža metode za validaciju API ključeva.
type KeyValidator struct {
	DB              *gorm.DB
	channelFactory  *channel.Factory
	SettingsManager *config.SystemSettingsManager
	keypoolProvider *KeyProvider
}

type KeyValidatorParams struct {
	dig.In
	DB              *gorm.DB
	ChannelFactory  *channel.Factory
	SettingsManager *config.SystemSettingsManager
	KeypoolProvider *KeyProvider
}

// NewKeyValidator kreira novi KeyValidator.
func NewKeyValidator(params KeyValidatorParams) *KeyValidator {
	return &KeyValidator{
		DB:              params.DB,
		channelFactory:  params.ChannelFactory,
		SettingsManager: params.SettingsManager,
		keypoolProvider: params.KeypoolProvider,
	}
}

// ValidateSingleKey vrši proveru validacije na pojedinačnom API ključu.
func (s *KeyValidator) ValidateSingleKey(key *models.APIKey, group *models.Group) (bool, error) {
	if group.EffectiveConfig.AppUrl == "" {
		group.EffectiveConfig = s.SettingsManager.GetEffectiveConfig(group.Config)
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(group.EffectiveConfig.KeyValidationTimeoutSeconds)*time.Second)
	defer cancel()

	ch, err := s.channelFactory.GetChannel(group)
	if err != nil {
		return false, fmt.Errorf("neuspešno dobijanje kanala za grupu %s: %w", group.Name, err)
	}

	isValid, validationErr := ch.ValidateKey(ctx, key.KeyValue)

	s.keypoolProvider.UpdateStatus(key, group, isValid)

	if !isValid {
		logrus.WithFields(logrus.Fields{
			"error":    validationErr,
			"key_id":   key.ID,
			"group_id": group.ID,
		}).Debug("Validacija ključa neuspešna")
		return false, validationErr
	}

	logrus.WithFields(logrus.Fields{
		"key_id":   key.ID,
		"is_valid": isValid,
	}).Debug("Validacija ključa uspešna")

	return true, nil
}

// TestMultipleKeys vrši sinhronu validaciju za listu vrednosti ključeva unutar određene grupe.
func (s *KeyValidator) TestMultipleKeys(group *models.Group, keyValues []string) ([]KeyTestResult, error) {
	results := make([]KeyTestResult, len(keyValues))

	// Pronađite koji od navedenih ključeva zapravo postoje u bazi podataka za ovu grupu
	var existingKeys []models.APIKey
	if err := s.DB.Where("group_id = ? AND key_value IN ?", group.ID, keyValues).Find(&existingKeys).Error; err != nil {
		return nil, fmt.Errorf("neuspešno upitavanje ključeva iz baze podataka: %w", err)
	}
	existingKeyMap := make(map[string]models.APIKey)
	for _, k := range existingKeys {
		existingKeyMap[k.KeyValue] = k
	}

	for i, kv := range keyValues {
		apiKey, exists := existingKeyMap[kv]
		if !exists {
			results[i] = KeyTestResult{
				KeyValue: kv,
				IsValid:  false,
				Error:    "Ključ ne postoji u ovoj grupi ili je uklonjen.",
			}
			continue
		}

		isValid, validationErr := s.ValidateSingleKey(&apiKey, group)

		results[i] = KeyTestResult{
			KeyValue: kv,
			IsValid:  isValid,
			Error:    "",
		}
		if validationErr != nil {
			results[i].Error = validationErr.Error()
		}
	}

	return results, nil
}
