package keypool

import (
	"MAPIK/internal/config"
	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/models"
	"MAPIK/internal/store"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type KeyProvider struct {
	db              *gorm.DB
	store           store.Store
	settingsManager *config.SystemSettingsManager
}

// NewProvider kreira novu instancu KeyProvider-a.
func NewProvider(db *gorm.DB, store store.Store, settingsManager *config.SystemSettingsManager) *KeyProvider {
	return &KeyProvider{
		db:              db,
		store:           store,
		settingsManager: settingsManager,
	}
}

// SelectKey atomski bira i rotira dostupan APIKey za navedenu grupu.
func (p *KeyProvider) SelectKey(groupID uint) (*models.APIKey, error) {
	activeKeysListKey := fmt.Sprintf("group:%d:active_keys", groupID)

	// 1. Atomski rotirajte ID ključa sa liste
	keyIDStr, err := p.store.Rotate(activeKeysListKey)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil, app_errors.ErrNoActiveKeys
		}
		return nil, fmt.Errorf("neuspešna rotacija ključa iz skladišta: %w", err)
	}

	keyID, err := strconv.ParseUint(keyIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("neuspešno parsiranje ID-a ključa '%s': %w", keyIDStr, err)
	}

	// 2. Preuzmite detalje ključa iz HASH-a
	keyHashKey := fmt.Sprintf("key:%d", keyID)
	keyDetails, err := p.store.HGetAll(keyHashKey)
	if err != nil {
		return nil, fmt.Errorf("neuspešno dobijanje detalja ključa za ID ključa %d: %w", keyID, err)
	}

	// 3. Ručno de-serijalizujte mapu u APIKey strukturu
	failureCount, _ := strconv.ParseInt(keyDetails["failure_count"], 10, 64)
	createdAt, _ := strconv.ParseInt(keyDetails["created_at"], 10, 64)

	apiKey := &models.APIKey{
		ID:           uint(keyID),
		KeyValue:     keyDetails["key_string"],
		Status:       keyDetails["status"],
		FailureCount: failureCount,
		GroupID:      groupID,
		CreatedAt:    time.Unix(createdAt, 0),
	}

	return apiKey, nil
}

// UpdateStatus asinhrono podnosi zadatak ažuriranja statusa ključa.
func (p *KeyProvider) UpdateStatus(apiKey *models.APIKey, group *models.Group, isSuccess bool) {
	go func() {
		keyHashKey := fmt.Sprintf("key:%d", apiKey.ID)
		activeKeysListKey := fmt.Sprintf("group:%d:active_keys", group.ID)

		if isSuccess {
			if err := p.handleSuccess(apiKey.ID, keyHashKey, activeKeysListKey); err != nil {
				logrus.WithFields(logrus.Fields{"keyID": apiKey.ID, "error": err}).Error("Neuspešno rukovanje uspehom ključa")
			}
		} else {
			if err := p.handleFailure(apiKey, group, keyHashKey, activeKeysListKey); err != nil {
				logrus.WithFields(logrus.Fields{"keyID": apiKey.ID, "error": err}).Error("Neuspešno rukovanje neuspehom ključa")
			}
		}
	}()
}

func (p *KeyProvider) handleSuccess(keyID uint, keyHashKey, activeKeysListKey string) error {
	keyDetails, err := p.store.HGetAll(keyHashKey)
	if err != nil {
		return fmt.Errorf("neuspešno dobijanje detalja ključa iz skladišta: %w", err)
	}

	failureCount, _ := strconv.ParseInt(keyDetails["failure_count"], 10, 64)
	isActive := keyDetails["status"] == models.KeyStatusActive

	if failureCount == 0 && isActive {
		return nil
	}

	return p.db.Transaction(func(tx *gorm.DB) error {
		var key models.APIKey
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&key, keyID).Error; err != nil {
			return fmt.Errorf("neuspešno zaključavanje ključa %d za ažuriranje: %w", keyID, err)
		}

		updates := map[string]any{"failure_count": 0}
		if !isActive {
			updates["status"] = models.KeyStatusActive
		}

		if err := tx.Model(&key).Updates(updates).Error; err != nil {
			return fmt.Errorf("neuspešno ažuriranje ključa u bazi podataka: %w", err)
		}

		if err := p.store.HSet(keyHashKey, updates); err != nil {
			return fmt.Errorf("neuspešno ažuriranje detalja ključa u skladištu: %w", err)
		}

		if !isActive {
			logrus.WithField("keyID", keyID).Debug("Ključ se oporavio i vraća se u aktivni bazen.")
			if err := p.store.LRem(activeKeysListKey, 0, keyID); err != nil {
				return fmt.Errorf("neuspešno LRem ključa pre LPush-a pri oporavku: %w", err)
			}
			if err := p.store.LPush(activeKeysListKey, keyID); err != nil {
				return fmt.Errorf("neuspešno LPush ključa nazad na aktivnu listu: %w", err)
			}
		}

		return nil
	})
}

func (p *KeyProvider) handleFailure(apiKey *models.APIKey, group *models.Group, keyHashKey, activeKeysListKey string) error {
	keyDetails, err := p.store.HGetAll(keyHashKey)
	if err != nil {
		return fmt.Errorf("neuspešno dobijanje detalja ključa iz skladišta: %w", err)
	}

	if keyDetails["status"] == models.KeyStatusInvalid {
		return nil
	}

	failureCount, _ := strconv.ParseInt(keyDetails["failure_count"], 10, 64)

	// Preuzmite efektivnu konfiguraciju za ovu grupu
	blacklistThreshold := group.EffectiveConfig.BlacklistThreshold

	return p.db.Transaction(func(tx *gorm.DB) error {
		var key models.APIKey
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&key, apiKey.ID).Error; err != nil {
			return fmt.Errorf("neuspešno zaključavanje ključa %d za ažuriranje: %w", apiKey.ID, err)
		}

		newFailureCount := failureCount + 1

		updates := map[string]any{"failure_count": newFailureCount}
		shouldBlacklist := blacklistThreshold > 0 && newFailureCount >= int64(blacklistThreshold)
		if shouldBlacklist {
			updates["status"] = models.KeyStatusInvalid
		}

		if err := tx.Model(&key).Updates(updates).Error; err != nil {
			return fmt.Errorf("neuspešno ažuriranje statistike ključa u bazi podataka: %w", err)
		}

		if _, err := p.store.HIncrBy(keyHashKey, "failure_count", 1); err != nil {
			return fmt.Errorf("neuspešno povećanje broja neuspeha u skladištu: %w", err)
		}

		if shouldBlacklist {
			logrus.WithFields(logrus.Fields{"keyID": apiKey.ID, "threshold": blacklistThreshold}).Warn("Ključ je dostigao prag crne liste, onemogućavanje.")
			if err := p.store.LRem(activeKeysListKey, 0, apiKey.ID); err != nil {
				return fmt.Errorf("neuspešno LRem ključa sa aktivne liste: %w", err)
			}
			if err := p.store.HSet(keyHashKey, map[string]any{"status": models.KeyStatusInvalid}); err != nil {
				return fmt.Errorf("neuspešno ažuriranje statusa ključa na nevažeći u skladištu: %w", err)
			}
		}

		return nil
	})
}

// LoadKeysFromDB učitava sve grupe i ključeve iz baze podataka i popunjava ih u Store.
func (p *KeyProvider) LoadKeysFromDB() error {
	initFlagKey := "initialization:db_keys_loaded"

	exists, err := p.store.Exists(initFlagKey)
	if err != nil {
		return fmt.Errorf("neuspešna provera zastavice inicijalizacije: %w", err)
	}

	if exists {
		logrus.Debug("Ključevi su već učitani u skladište. Preskačem.")
		return nil
	}

	logrus.Debug("Prvo pokretanje, učitavanje ključeva iz baze podataka...")

	// 1. Učitajte ključeve iz baze podataka u serijama i upišite ih u Redis koristeći Pipeline
	allActiveKeyIDs := make(map[uint][]any)
	batchSize := 1000
	var batchKeys []*models.APIKey

	err = p.db.Model(&models.APIKey{}).FindInBatches(&batchKeys, batchSize, func(tx *gorm.DB, batch int) error {
		logrus.Debugf("Obrađujem seriju %d sa %d ključeva...", batch, len(batchKeys))

		var pipeline store.Pipeliner
		if redisStore, ok := p.store.(store.RedisPipeliner); ok {
			pipeline = redisStore.Pipeline()
		}

		for _, key := range batchKeys {
			keyHashKey := fmt.Sprintf("key:%d", key.ID)
			keyDetails := p.apiKeyToMap(key)

			if pipeline != nil {
				pipeline.HSet(keyHashKey, keyDetails)
			} else {
				if err := p.store.HSet(keyHashKey, keyDetails); err != nil {
					logrus.WithFields(logrus.Fields{"keyID": key.ID, "error": err}).Error("Neuspešno HSet detalja ključa")
				}
			}

			if key.Status == models.KeyStatusActive {
				allActiveKeyIDs[key.GroupID] = append(allActiveKeyIDs[key.GroupID], key.ID)
			}
		}

		if pipeline != nil {
			if err := pipeline.Exec(); err != nil {
				return fmt.Errorf("neuspešno izvršavanje pipeline-a za seriju %d: %w", batch, err)
			}
		}
		return nil
	}).Error

	if err != nil {
		return fmt.Errorf("neuspešno tokom serijske obrade ključeva: %w", err)
	}

	// 2. Ažurirajte liste aktivnih ključeva za sve grupe
	logrus.Info("Ažuriram liste aktivnih ključeva za sve grupe...")
	for groupID, activeIDs := range allActiveKeyIDs {
		if len(activeIDs) > 0 {
			activeKeysListKey := fmt.Sprintf("group:%d:active_keys", groupID)
			p.store.Delete(activeKeysListKey)
			if err := p.store.LPush(activeKeysListKey, activeIDs...); err != nil {
				logrus.WithFields(logrus.Fields{"groupID": groupID, "error": err}).Error("Neuspešno LPush aktivnih ključeva za grupu")
			}
		}
	}

	if err := p.store.Set(initFlagKey, []byte("1"), 0); err != nil {
		logrus.WithField("flagKey", initFlagKey).Error("Neuspešno postavljanje zastavice inicijalizacije nakon učitavanja ključeva")
	}

	return nil
}

// AddKeys masovno dodaje nove ključeve u bazen i bazu podataka.
func (p *KeyProvider) AddKeys(groupID uint, keys []models.APIKey) error {
	if len(keys) == 0 {
		return nil
	}

	err := p.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&keys).Error; err != nil {
			return err
		}

		for _, key := range keys {
			if err := p.addKeyToStore(&key); err != nil {
				logrus.WithFields(logrus.Fields{"keyID": key.ID, "error": err}).Error("Neuspešno dodavanje ključa u skladište nakon kreiranja baze podataka, vraćanje transakcije")
				return err
			}
		}
		return nil
	})

	return err
}

// RemoveKeys masovno uklanja ključeve iz bazena i baze podataka.
func (p *KeyProvider) RemoveKeys(groupID uint, keyValues []string) (int64, error) {
	if len(keyValues) == 0 {
		return 0, nil
	}

	var keysToDelete []models.APIKey
	var deletedCount int64

	err := p.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("group_id = ? AND key_value IN ?", groupID, keyValues).Find(&keysToDelete).Error; err != nil {
			return err
		}

		if len(keysToDelete) == 0 {
			return nil
		}

		keyIDsToDelete := pluckIDs(keysToDelete)

		result := tx.Where("id IN ?", keyIDsToDelete).Delete(&models.APIKey{})
		if result.Error != nil {
			return result.Error
		}
		deletedCount = result.RowsAffected

		for _, key := range keysToDelete {
			if err := p.removeKeyFromStore(key.ID, key.GroupID); err != nil {
				logrus.WithFields(logrus.Fields{"keyID": key.ID, "error": err}).Error("Neuspešno uklanjanje ključa iz skladišta nakon brisanja iz baze podataka, vraćanje transakcije")
				return err
			}
		}

		return nil
	})

	return deletedCount, err
}

// RestoreKeys vraća sve nevažeće ključeve unutar grupe.
func (p *KeyProvider) RestoreKeys(groupID uint) (int64, error) {
	var invalidKeys []models.APIKey
	var restoredCount int64

	err := p.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("group_id = ? AND status = ?", groupID, models.KeyStatusInvalid).Find(&invalidKeys).Error; err != nil {
			return err
		}

		if len(invalidKeys) == 0 {
			return nil
		}

		updates := map[string]any{
			"status":        models.KeyStatusActive,
			"failure_count": 0,
		}
		result := tx.Model(&models.APIKey{}).Where("group_id = ? AND status = ?", groupID, models.KeyStatusInvalid).Updates(updates)
		if result.Error != nil {
			return result.Error
		}
		restoredCount = result.RowsAffected

		for _, key := range invalidKeys {
			key.Status = models.KeyStatusActive
			key.FailureCount = 0
			if err := p.addKeyToStore(&key); err != nil {
				logrus.WithFields(logrus.Fields{"keyID": key.ID, "error": err}).Error("Neuspešno vraćanje ključa u skladište nakon ažuriranja baze podataka, vraćanje transakcije")
				return err
			}
		}
		return nil
	})

	return restoredCount, err
}

// RestoreMultipleKeys vraća navedene ključeve.
func (p *KeyProvider) RestoreMultipleKeys(groupID uint, keyValues []string) (int64, error) {
	if len(keyValues) == 0 {
		return 0, nil
	}

	var keysToRestore []models.APIKey
	var restoredCount int64

	err := p.db.Transaction(func(tx *gorm.DB) error {
		// 1. Pronađite ključeve za vraćanje
		if err := tx.Where("group_id = ? AND key_value IN ? AND status = ?", groupID, keyValues, models.KeyStatusInvalid).Find(&keysToRestore).Error; err != nil {
			return err
		}

		if len(keysToRestore) == 0 {
			return nil
		}

		keyIDsToRestore := pluckIDs(keysToRestore)

		// 2. Ažurirajte status u bazi podataka
		updates := map[string]any{
			"status":        models.KeyStatusActive,
			"failure_count": 0,
		}
		result := tx.Model(&models.APIKey{}).Where("id IN ?", keyIDsToRestore).Updates(updates)
		if result.Error != nil {
			return result.Error
		}
		restoredCount = result.RowsAffected

		// 3. Dodajte ključeve nazad u Redis
		for _, key := range keysToRestore {
			key.Status = models.KeyStatusActive
			key.FailureCount = 0
			if err := p.addKeyToStore(&key); err != nil {
				// U transakciji, pojedinačni neuspeh će vratiti celu transakciju, ali ovde je logovanje i dalje korisno
				logrus.WithFields(logrus.Fields{"keyID": key.ID, "error": err}).Error("Neuspešno vraćanje ključa u skladište nakon ažuriranja baze podataka")
				return err // Vratite grešku da biste vratili transakciju
			}
		}

		return nil
	})

	return restoredCount, err
}

// RemoveInvalidKeys uklanja sve nevažeće ključeve iz grupe.
func (p *KeyProvider) RemoveInvalidKeys(groupID uint) (int64, error) {
	var invalidKeys []models.APIKey
	var removedCount int64

	err := p.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("group_id = ? AND status = ?", groupID, models.KeyStatusInvalid).Find(&invalidKeys).Error; err != nil {
			return err
		}

		if len(invalidKeys) == 0 {
			return nil
		}

		result := tx.Where("id IN ?", pluckIDs(invalidKeys)).Delete(&models.APIKey{})
		if result.Error != nil {
			return result.Error
		}
		removedCount = result.RowsAffected

		for _, key := range invalidKeys {
			if err := p.removeKeyFromStore(key.ID, key.GroupID); err != nil {
				logrus.WithFields(logrus.Fields{"keyID": key.ID, "error": err}).Error("Neuspešno uklanjanje nevažećeg ključa iz skladišta nakon brisanja iz baze podataka, vraćanje transakcije")
				return err
			}
		}
		return nil
	})

	return removedCount, err
}

// RemoveKeysFromStore direktno uklanja navedene ključeve iz memorijskog skladišta, bez operacija baze podataka
// Ova metoda je pogodna za scenarije gde je baza podataka već obrisana, ali je potrebno očistiti memorijsko skladište
func (p *KeyProvider) RemoveKeysFromStore(groupID uint, keyIDs []uint) error {
	if len(keyIDs) == 0 {
		return nil
	}

	activeKeysListKey := fmt.Sprintf("group:%d:active_keys", groupID)

	// Prvi korak: direktno obrišite celu listu active_keys
	if err := p.store.Delete(activeKeysListKey); err != nil {
		logrus.WithFields(logrus.Fields{
			"groupID": groupID,
			"error":   err,
		}).Error("Neuspešno brisanje liste aktivnih ključeva")
		return err
	}

	// Drugi korak: masovno obrišite sve povezane key hash-ove
	for _, keyID := range keyIDs {
		keyHashKey := fmt.Sprintf("key:%d", keyID)
		if err := p.store.Delete(keyHashKey); err != nil {
			logrus.WithFields(logrus.Fields{
				"keyID": keyID,
				"error": err,
			}).Error("Neuspešno brisanje key hash-a")
		}
	}

	logrus.WithFields(logrus.Fields{
		"groupID":  groupID,
		"keyCount": len(keyIDs),
	}).Info("Uspešno očišćeni ključevi grupe iz skladišta")

	return nil
}

// addKeyToStore je pomoćna funkcija za dodavanje jednog ključa u keš.
func (p *KeyProvider) addKeyToStore(key *models.APIKey) error {
	// 1. Sačuvajte detalje ključa u HASH
	keyHashKey := fmt.Sprintf("key:%d", key.ID)
	keyDetails := p.apiKeyToMap(key)
	if err := p.store.HSet(keyHashKey, keyDetails); err != nil {
		return fmt.Errorf("neuspešno HSet detalja ključa za ključ %d: %w", key.ID, err)
	}

	// 2. Ako je aktivan, dodajte ga na aktivnu LISTU
	if key.Status == models.KeyStatusActive {
		activeKeysListKey := fmt.Sprintf("group:%d:active_keys", key.GroupID)
		if err := p.store.LRem(activeKeysListKey, 0, key.ID); err != nil {
			return fmt.Errorf("neuspešno LRem ključa %d pre LPush-a za grupu %d: %w", key.ID, key.GroupID, err)
		}
		if err := p.store.LPush(activeKeysListKey, key.ID); err != nil {
			return fmt.Errorf("neuspešno LPush ključa %d u grupu %d: %w", key.ID, key.GroupID, err)
		}
	}
	return nil
}

// removeKeyFromStore je pomoćna funkcija za uklanjanje jednog ključa iz keša.
func (p *KeyProvider) removeKeyFromStore(keyID, groupID uint) error {
	activeKeysListKey := fmt.Sprintf("group:%d:active_keys", groupID)
	if err := p.store.LRem(activeKeysListKey, 0, keyID); err != nil {
		logrus.WithFields(logrus.Fields{"keyID": keyID, "groupID": groupID, "error": err}).Error("Neuspešno LRem ključa sa aktivne liste")
	}

	keyHashKey := fmt.Sprintf("key:%d", keyID)
	if err := p.store.Delete(keyHashKey); err != nil {
		return fmt.Errorf("neuspešno brisanje key HASH-a za ključ %d: %w", keyID, err)
	}
	return nil
}

// apiKeyToMap konvertuje APIKey model u mapu za HSET.
func (p *KeyProvider) apiKeyToMap(key *models.APIKey) map[string]any {
	return map[string]any{
		"id":            fmt.Sprint(key.ID),
		"key_string":    key.KeyValue,
		"status":        key.Status,
		"failure_count": key.FailureCount,
		"group_id":      key.GroupID,
		"created_at":    key.CreatedAt.Unix(),
	}
}

// pluckIDs izvlači ID-ove iz slice-a APIKey.
func pluckIDs(keys []models.APIKey) []uint {
	ids := make([]uint, len(keys))
	for i, key := range keys {
		ids[i] = key.ID
	}
	return ids
}
