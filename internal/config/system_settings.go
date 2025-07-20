package config

import (
	"MAPIK/internal/db"
	"MAPIK/internal/models"
	"MAPIK/internal/store"
	"MAPIK/internal/syncer"
	"MAPIK/internal/types"
	"MAPIK/internal/utils"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"strconv"
	"strings"

	"github.com/sirupsen/logrus"
	"gorm.io/datatypes"
	"gorm.io/gorm/clause"
)

const SettingsUpdateChannel = "system_settings:updated"

// SystemSettingsManager upravlja sistemskim podešavanjima
type SystemSettingsManager struct {
	syncer *syncer.CacheSyncer[types.SystemSettings]
}

// NewSystemSettingsManager kreira novi, neinicijalizovani SystemSettingsManager.
func NewSystemSettingsManager() *SystemSettingsManager {
	return &SystemSettingsManager{}
}

type groupManager interface {
	Invalidate() error
}

// Initialize inicijalizuje SystemSettingsManager sa zavisnostima baze podataka i skladišta.
func (sm *SystemSettingsManager) Initialize(store store.Store, gm groupManager, isMaster bool) error {
	settingsLoader := func() (types.SystemSettings, error) {
		var dbSettings []models.SystemSetting
		if err := db.DB.Find(&dbSettings).Error; err != nil {
			return types.SystemSettings{}, fmt.Errorf("nije uspelo učitavanje sistemskih podešavanja iz baze podataka: %w", err)
		}

		settingsMap := make(map[string]string)
		for _, setting := range dbSettings {
			settingsMap[setting.SettingKey] = setting.SettingValue
		}

		// Počnite sa podrazumevanim podešavanjima, a zatim ih prepišite vrednostima iz baze podataka.
		settings := utils.DefaultSystemSettings()
		v := reflect.ValueOf(&settings).Elem()
		t := v.Type()
		jsonToField := make(map[string]string)
		for i := range t.NumField() {
			field := t.Field(i)
			jsonTag := strings.Split(field.Tag.Get("json"), ",")[0]
			if jsonTag != "" {
				jsonToField[jsonTag] = field.Name
			}
		}

		for key, valStr := range settingsMap {
			if fieldName, ok := jsonToField[key]; ok {
				fieldValue := v.FieldByName(fieldName)
				if fieldValue.IsValid() && fieldValue.CanSet() {
					if err := utils.SetFieldFromString(fieldValue, valStr); err != nil {
						logrus.Warnf("Nije uspelo postavljanje vrednosti iz mape za polje %s: %v", fieldName, err)
					}
				}
			}
		}

		sm.DisplaySystemConfig(settings)

		return settings, nil
	}

	afterLoader := func(newData types.SystemSettings) {
		if !isMaster {
			return
		}
		gm.Invalidate()
	}

	syncer, err := syncer.NewCacheSyncer(
		settingsLoader,
		store,
		SettingsUpdateChannel,
		logrus.WithField("syncer", "system_settings"),
		afterLoader,
	)
	if err != nil {
		return fmt.Errorf("nije uspelo kreiranje sinhronizatora sistemskih podešavanja: %w", err)
	}

	sm.syncer = syncer
	return nil
}

// Stop graciozno zaustavlja pozadinski sinhronizator SystemSettingsManager-a.
func (sm *SystemSettingsManager) Stop(ctx context.Context) {
	if sm.syncer != nil {
		sm.syncer.Stop()
	}
}

// EnsureSettingsInitialized osigurava da svi zapisi sistemskih podešavanja postoje u bazi podataka.
func (sm *SystemSettingsManager) EnsureSettingsInitialized() error {
	defaultSettings := utils.DefaultSystemSettings()
	metadata := utils.GenerateSettingsMetadata(&defaultSettings)

	for _, meta := range metadata {
		var existing models.SystemSetting
		err := db.DB.Where("setting_key = ?", meta.Key).First(&existing).Error
		if err != nil {
			value := fmt.Sprintf("%v", meta.DefaultValue)
			if meta.Key == "app_url" {
				host := os.Getenv("HOST")
				if host == "" || host == "0.0.0.0" {
					host = "localhost"
				}
				port := os.Getenv("PORT")
				if port == "" {
					port = "3001"
				}
				value = fmt.Sprintf("http://%s:%s", host, port)
			}
			setting := models.SystemSetting{
				SettingKey:   meta.Key,
				SettingValue: value,
				Description:  meta.Description,
			}
			if err := db.DB.Create(&setting).Error; err != nil {
				logrus.Errorf("Nije uspelo inicijalizovanje podešavanja %s: %v", setting.SettingKey, err)
				return err
			}
			logrus.Infof("Inicijalizovano sistemsko podešavanje: %s = %s", setting.SettingKey, setting.SettingValue)
		}
	}

	return nil
}

// GetSettings dobija trenutnu sistemsku konfiguraciju
func (sm *SystemSettingsManager) GetSettings() types.SystemSettings {
	if sm.syncer == nil {
		logrus.Warn("SystemSettingsManager nije inicijalizovan, vraćaju se podrazumevana podešavanja.")
		return utils.DefaultSystemSettings()
	}
	return sm.syncer.Get()
}

// GetAppUrl vraća efektivni URL aplikacije.
func (sm *SystemSettingsManager) GetAppUrl() string {
	settings := sm.GetSettings()
	if settings.AppUrl != "" {
		return settings.AppUrl
	}

	host := os.Getenv("HOST")
	if host == "" || host == "0.0.0.0" {
		host = "localhost"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}
	return fmt.Sprintf("http://%s:%s", host, port)
}

// UpdateSettings ažurira sistemsku konfiguraciju
func (sm *SystemSettingsManager) UpdateSettings(settingsMap map[string]any) error {
	// Validacija stavki konfiguracije
	if err := sm.ValidateSettings(settingsMap); err != nil {
		return err
	}

	// Ažuriranje baze podataka
	var settingsToUpdate []models.SystemSetting
	for key, value := range settingsMap {
		settingsToUpdate = append(settingsToUpdate, models.SystemSetting{
			SettingKey:   key,
			SettingValue: fmt.Sprintf("%v", value), // Konvertuj bilo koji tip u string
		})
	}

	if len(settingsToUpdate) > 0 {
		if err := db.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "setting_key"}},
			DoUpdates: clause.AssignmentColumns([]string{"setting_value", "updated_at"}),
		}).Create(&settingsToUpdate).Error; err != nil {
			return fmt.Errorf("nije uspelo ažuriranje sistemskih podešavanja: %w", err)
		}
	}

	// Pokreni ponovno učitavanje svih instanci
	return sm.syncer.Invalidate()
}

// GetEffectiveConfig dobija efektivnu konfiguraciju (sistemska konfiguracija + grupna preklapanja)
func (sm *SystemSettingsManager) GetEffectiveConfig(groupConfigJSON datatypes.JSONMap) types.SystemSettings {
	effectiveConfig := sm.GetSettings()

	if groupConfigJSON == nil {
		return effectiveConfig
	}

	var groupConfig models.GroupConfig
	groupConfigBytes, err := groupConfigJSON.MarshalJSON()
	if err != nil {
		logrus.Warnf("Nije uspelo maršalovanje JSON-a grupne konfiguracije, koriste se samo sistemska podešavanja. Greška: %v", err)
		return effectiveConfig
	}
	if err := json.Unmarshal(groupConfigBytes, &groupConfig); err != nil {
		logrus.Warnf("Nije uspelo unmaršalovanje grupne konfiguracije, koriste se samo sistemska podešavanja. Greška: %v", err)
		return effectiveConfig
	}

	gcv := reflect.ValueOf(groupConfig)
	ecv := reflect.ValueOf(&effectiveConfig).Elem()

	for i := range gcv.NumField() {
		groupField := gcv.Field(i)
		if groupField.Kind() == reflect.Ptr && !groupField.IsNil() {
			groupFieldValue := groupField.Elem()
			effectiveField := ecv.FieldByName(gcv.Type().Field(i).Name)
			if effectiveField.IsValid() && effectiveField.CanSet() {
				if effectiveField.Type() == groupFieldValue.Type() {
					effectiveField.Set(groupFieldValue)
				}
			}
		}
	}

	return effectiveConfig
}

// ValidateSettings validira validnost sistemskih podešavanja
func (sm *SystemSettingsManager) ValidateSettings(settingsMap map[string]any) error {
	tempSettings := utils.DefaultSystemSettings()
	v := reflect.ValueOf(&tempSettings).Elem()
	t := v.Type()
	jsonToField := make(map[string]reflect.StructField)
	for i := range t.NumField() {
		field := t.Field(i)
		jsonTag := field.Tag.Get("json")
		if jsonTag != "" {
			jsonToField[jsonTag] = field
		}
	}

	for key, value := range settingsMap {
		field, ok := jsonToField[key]
		if !ok {
			return fmt.Errorf("nevažeći ključ podešavanja: %s", key)
		}

		validateTag := field.Tag.Get("validate")

		switch field.Type.Kind() {
		case reflect.Int:
			floatVal, ok := value.(float64)
			if !ok {
				return fmt.Errorf("nevažeći tip za %s: očekivan broj, dobijen %T", key, value)
			}
			intVal := int(floatVal)
			if floatVal != float64(intVal) {
				return fmt.Errorf("nevažeća vrednost za %s: mora biti ceo broj", key)
			}

			if strings.HasPrefix(validateTag, "min=") {
				minValStr := strings.TrimPrefix(validateTag, "min=")
				minVal, _ := strconv.Atoi(minValStr)
				if intVal < minVal {
					return fmt.Errorf("vrednost za %s (%d) je ispod minimalne vrednosti (%d)", key, intVal, minVal)
				}
			}
		case reflect.Bool:
			if _, ok := value.(bool); !ok {
				return fmt.Errorf("nevažeći tip za %s: očekivan boolean, dobijen %T", key, value)
			}
		case reflect.String:
			if _, ok := value.(string); !ok {
				return fmt.Errorf("nevažeći tip za %s: očekivan string, dobijen %T", key, value)
			}
		default:
			return fmt.Errorf("nepodržan tip za validaciju ključa podešavanja: %s", key)
		}
	}

	return nil
}

// ValidateGroupConfigOverrides validira mapu preklapanja konfiguracije na nivou grupe.
func (sm *SystemSettingsManager) ValidateGroupConfigOverrides(configMap map[string]any) error {
	tempSettings := types.SystemSettings{}
	v := reflect.ValueOf(&tempSettings).Elem()
	t := v.Type()
	jsonToField := make(map[string]reflect.StructField)
	for i := range t.NumField() {
		field := t.Field(i)
		jsonTag := field.Tag.Get("json")
		if jsonTag != "" {
			jsonToField[jsonTag] = field
		}
	}

	for key, value := range configMap {
		if value == nil {
			continue
		}

		field, ok := jsonToField[key]
		if !ok {
			return fmt.Errorf("nevažeći ključ podešavanja: %s", key)
		}

		validateTag := field.Tag.Get("validate")

		floatVal, isFloat := value.(float64)
		if !isFloat {
			continue
		}
		intVal := int(floatVal)
		if floatVal != float64(intVal) {
			return fmt.Errorf("nevažeća vrednost za %s: mora biti ceo broj", key)
		}

		if strings.HasPrefix(validateTag, "min=") {
			minValStr := strings.TrimPrefix(validateTag, "min=")
			minVal, _ := strconv.Atoi(minValStr)
			if intVal < minVal {
				return fmt.Errorf("vrednost za %s (%d) je ispod minimalne vrednosti (%d)", key, intVal, minVal)
			}
		}
	}

	return nil
}

// DisplaySystemConfig prikazuje trenutna sistemska podešavanja.
func (sm *SystemSettingsManager) DisplaySystemConfig(settings types.SystemSettings) {
	logrus.Info("")
	logrus.Info("========= Sistemska Podešavanja =========")
	logrus.Info("  --- Opšte ---")
	logrus.Infof("    URL aplikacije: %s", settings.AppUrl)
	logrus.Infof("    Zadržavanje logova (dani): %d", settings.RequestLogRetentionDays)
	logrus.Infof("    Interval pisanja logova (minute): %d", settings.RequestLogWriteIntervalMinutes)

	logrus.Info("  --- Zahtev ---")
	logrus.Infof("    Vremensko ograničenje zahteva (sekunde): %d", settings.RequestTimeout)
	logrus.Infof("    Vremensko ograničenje povezivanja (sekunde): %d", settings.ConnectTimeout)
	logrus.Infof("    Vremensko ograničenje zaglavlja odgovora (sekunde): %d", settings.ResponseHeaderTimeout)
	logrus.Infof("    Vremensko ograničenje neaktivne veze (sekunde): %d", settings.IdleConnTimeout)
	logrus.Infof("    Maksimalan broj neaktivnih veza: %d", settings.MaxIdleConns)
	logrus.Infof("    Maksimalan broj neaktivnih veza po hostu: %d", settings.MaxIdleConnsPerHost)

	logrus.Info("  --- Ključ ---")
	logrus.Infof("    Maksimalan broj ponovnih pokušaja: %d", settings.MaxRetries)
	logrus.Infof("    Prag crne liste: %d", settings.BlacklistThreshold)
	logrus.Infof("    Interval validacije ključa (minute): %d", settings.KeyValidationIntervalMinutes)
	logrus.Infof("    Konkurentnost validacije ključa: %d", settings.KeyValidationConcurrency)
	logrus.Infof("    Vremensko ograničenje validacije ključa: %d", settings.KeyValidationTimeoutSeconds)
	logrus.Info("====================================")
	logrus.Info("")
}
