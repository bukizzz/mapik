package services

import (
	"MAPIK/internal/config"
	"MAPIK/internal/models"
	"MAPIK/internal/store"
	"MAPIK/internal/syncer"
	"context"
	"fmt"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

const GroupUpdateChannel = "groups:updated"

// GroupManager upravlja keširanjem podataka o grupama.
type GroupManager struct {
	syncer          *syncer.CacheSyncer[map[string]*models.Group]
	db              *gorm.DB
	store           store.Store
	settingsManager *config.SystemSettingsManager
}

// NewGroupManager kreira novi, neinicijalizovani GroupManager.
func NewGroupManager(
	db *gorm.DB,
	store store.Store,
	settingsManager *config.SystemSettingsManager,
) *GroupManager {
	return &GroupManager{
		db:              db,
		store:           store,
		settingsManager: settingsManager,
	}
}

// Initialize postavlja CacheSyncer. Ovo se poziva odvojeno za rukovanje potencijalnim
func (gm *GroupManager) Initialize() error {
	loader := func() (map[string]*models.Group, error) {
		var groups []*models.Group
		if err := gm.db.Find(&groups).Error; err != nil {
			return nil, fmt.Errorf("failed to load groups from db: %w", err)
		}

		groupMap := make(map[string]*models.Group, len(groups))
		for _, group := range groups {
			g := *group
			g.EffectiveConfig = gm.settingsManager.GetEffectiveConfig(g.Config)
			groupMap[g.Name] = &g
			logrus.WithFields(logrus.Fields{
				"group_name":       g.Name,
				"effective_config": g.EffectiveConfig,
			}).Debug("Loaded group with effective config")
		}

		return groupMap, nil
	}

	syncer, err := syncer.NewCacheSyncer(
		loader,
		gm.store,
		GroupUpdateChannel,
		logrus.WithField("syncer", "groups"),
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to create group syncer: %w", err)
	}
	gm.syncer = syncer
	return nil
}

// GetGroupByName preuzima jednu grupu po njenom imenu iz keša.
func (gm *GroupManager) GetGroupByName(name string) (*models.Group, error) {
	if gm.syncer == nil {
		return nil, fmt.Errorf("GroupManager is not initialized")
	}

	groups := gm.syncer.Get()
	group, ok := groups[name]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}
	return group, nil
}

// Invalidate pokreće ponovno učitavanje keša na svim instancama.
func (gm *GroupManager) Invalidate() error {
	if gm.syncer == nil {
		return fmt.Errorf("GroupManager is not initialized")
	}
	return gm.syncer.Invalidate()
}

// Stop graciozno zaustavlja pozadinski syncer GroupManager-a.
func (gm *GroupManager) Stop(ctx context.Context) {
	if gm.syncer != nil {
		gm.syncer.Stop()
	}
}
