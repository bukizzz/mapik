package db

import (
	"MAPIK/internal/models"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// TODO: Ažurirati migraciju, ukloniti nakon što se starije verzije nadograde.
func V1_0_13_FixRequestLogs(db *gorm.DB) error {
	// Ako postoji key_id, izvrši popravku
	if !db.Migrator().HasColumn(&models.RequestLog{}, "key_id") {
		return nil
	}

	logrus.Info("Detektovana stara šema. Pokreće se migracija podataka za request_logs...")

	if !db.Migrator().HasColumn(&models.RequestLog{}, "group_name") {
		logrus.Info("Dodavanje kolone 'group_name' u tabelu request_logs...")
		if err := db.Migrator().AddColumn(&models.RequestLog{}, "group_name"); err != nil {
			return err // Dodavanje kolone je kritično
		}
	}
	if !db.Migrator().HasColumn(&models.RequestLog{}, "key_value") {
		logrus.Info("Dodavanje kolone 'key_value' u tabelu request_logs...")
		if err := db.Migrator().AddColumn(&models.RequestLog{}, "key_value"); err != nil {
			return err // Dodavanje kolone je kritično
		}
	}

	type OldRequestLog struct {
		ID      string
		KeyID   uint `gorm:"column:key_id"`
		GroupID uint
	}

	batchSize := 1000
	for i := 0; ; i++ {
		logrus.Infof("Obrađuje se serija %d...", i+1)
		var oldLogs []OldRequestLog

		result := db.Model(&models.RequestLog{}).
			Select("id", "key_id", "group_id").
			Where("key_value IS NULL OR group_name IS NULL").
			Limit(batchSize).
			Find(&oldLogs)

		if result.Error != nil {
			logrus.WithError(result.Error).Error("Nije uspelo preuzimanje serije logova. Preskače se na sledeću seriju.")
			continue
		}

		if len(oldLogs) == 0 {
			logrus.Info("Sve serije obrađene.")
			break
		}

		keyIDMap := make(map[uint]bool)
		groupIDMap := make(map[uint]bool)
		for _, logEntry := range oldLogs {
			if logEntry.KeyID > 0 {
				keyIDMap[logEntry.KeyID] = true
			}
			if logEntry.GroupID > 0 {
				groupIDMap[logEntry.GroupID] = true
			}
		}

		var apiKeys []models.APIKey
		if len(keyIDMap) > 0 {
			var keyIDs []uint
			for id := range keyIDMap {
				keyIDs = append(keyIDs, id)
			}
			if err := db.Model(&models.APIKey{}).Where("id IN ?", keyIDs).Find(&apiKeys).Error; err != nil {
				logrus.WithError(err).Warn("Nije uspelo preuzimanje API ključeva za trenutnu seriju. Neki logovi možda neće biti ažurirani.")
			}
		}
		keyValueMapping := make(map[uint]string)
		for _, key := range apiKeys {
			keyValueMapping[key.ID] = key.KeyValue
		}

		var groups []models.Group
		if len(groupIDMap) > 0 {
			var groupIDs []uint
			for id := range groupIDMap {
				groupIDs = append(groupIDs, id)
			}
			if err := db.Model(&models.Group{}).Where("id IN ?", groupIDs).Find(&groups).Error; err != nil {
				logrus.WithError(err).Warn("Nije uspelo preuzimanje grupa za trenutnu seriju. Neki logovi možda neće biti ažurirani.")
			}
		}
		groupNameMapping := make(map[uint]string)
		for _, group := range groups {
			groupNameMapping[group.ID] = group.Name
		}

		updateGroups := make(map[string]map[string][]string)

		for _, logEntry := range oldLogs {
			groupName, gExists := groupNameMapping[logEntry.GroupID]
			if !gExists {
				logrus.Warnf("ID loga %s: Nije pronađena grupa za group_id %d. Postavlja se group_name na prazan string.", logEntry.ID, logEntry.GroupID)
			}

			keyValue, kExists := keyValueMapping[logEntry.KeyID]
			if !kExists {
				logrus.Warnf("ID loga %s: Nije pronađen APIKey za key_id %d. Postavlja se key_value na prazan string.", logEntry.ID, logEntry.KeyID)
			}

			if _, ok := updateGroups[groupName]; !ok {
				updateGroups[groupName] = make(map[string][]string)
			}
			updateGroups[groupName][keyValue] = append(updateGroups[groupName][keyValue], logEntry.ID)
		}

		for groupName, keyMap := range updateGroups {
			for keyValue, ids := range keyMap {
				updates := map[string]any{
					"group_name": groupName,
					"key_value":  keyValue,
				}
				if err := db.Model(&models.RequestLog{}).Where("id IN ?", ids).UpdateColumns(updates).Error; err != nil {
					logrus.WithError(err).Errorf("Nije uspelo ažuriranje serije unosa logova. Preskače se ova serija.")
				}
			}
		}
		logrus.Infof("Završena obrada serije %d. Ažurirano %d unosa logova.", i+1, len(oldLogs))
	}

	logrus.Info("Migracija podataka završena. Briše se kolona 'key_id' iz tabele request_logs...")
	if err := db.Migrator().DropColumn(&models.RequestLog{}, "key_id"); err != nil {
		logrus.WithError(err).Warn("Nije uspelo brisanje kolone 'key_id'. Ovo se može uraditi ručno.")
	}

	logrus.Info("Migracija baze podataka završena!")
	return nil
}
