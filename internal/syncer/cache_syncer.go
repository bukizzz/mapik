package syncer

import (
	"fmt"
	"sync"
	"time"

	"MAPIK/internal/store"

	"github.com/sirupsen/logrus"
)

// LoaderFunc definiše generički potpis funkcije za učitavanje podataka iz izvora istine (npr. baze podataka).
type LoaderFunc[T any] func() (T, error)

// CacheSyncer je generička usluga koja upravlja keširanjem u memoriji i sinhronizacijom između instanci.
type CacheSyncer[T any] struct {
	mu          sync.RWMutex
	cache       T
	loader      LoaderFunc[T]
	store       store.Store
	channelName string
	logger      *logrus.Entry
	stopChan    chan struct{}
	wg          sync.WaitGroup
	afterReload func(newValue T)
}

// NewCacheSyncer kreira i inicijalizuje novi CacheSyncer.
func NewCacheSyncer[T any](
	loader LoaderFunc[T],
	store store.Store,
	channelName string,
	logger *logrus.Entry,
	afterReload func(newValue T),
) (*CacheSyncer[T], error) {
	s := &CacheSyncer[T]{
		loader:      loader,
		store:       store,
		channelName: channelName,
		logger:      logger,
		stopChan:    make(chan struct{}),
		afterReload: afterReload,
	}

	if err := s.reload(); err != nil {
		return nil, fmt.Errorf("initial load for %s failed: %w", channelName, err)
	}

	s.wg.Add(1)
	go s.listenForUpdates()

	return s, nil
}

// Get bezbedno vraća keširane podatke.
func (s *CacheSyncer[T]) Get() T {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.cache
}

// Invalidate objavljuje obaveštenje svim instancama da ponovo učitaju svoj keš.
func (s *CacheSyncer[T]) Invalidate() error {
	s.logger.Debug("publishing invalidation notification")
	return s.store.Publish(s.channelName, []byte("reload"))
}

// Stop graciozno gasi pozadinsku gorutinu sinhronizatora.
func (s *CacheSyncer[T]) Stop() {
	close(s.stopChan)
	s.wg.Wait()
	s.logger.Info("cache syncer stopped.")
}

// reload preuzima najnovije podatke koristeći funkciju učitavača i ažurira keš.
func (s *CacheSyncer[T]) reload() error {
	s.logger.Debug("reloading cache...")
	newData, err := s.loader()
	if err != nil {
		s.logger.Errorf("failed to reload cache: %v", err)
		return err
	}

	s.mu.Lock()
	s.cache = newData
	s.mu.Unlock()

	s.logger.Info("cache reloaded successfully")
	// Nakon uspešnog ponovnog učitavanja i ažuriranja keša, pokrenite kuku.
	if s.afterReload != nil {
		s.logger.Debug("triggering afterReload hook")
		s.afterReload(newData)
	}
	return nil
}

// listenForUpdates radi u pozadini, slušajući poruke o poništavanju.
func (s *CacheSyncer[T]) listenForUpdates() {
	defer s.wg.Done()

	for {
		select {
		case <-s.stopChan:
			s.logger.Info("received stop signal, exiting listener loop.")
			return
		default:
		}

		if s.store == nil {
			s.logger.Warn("store is not configured, stopping subscription listener.")
			return
		}

		subscription, err := s.store.Subscribe(s.channelName)
		if err != nil {
			s.logger.Errorf("failed to subscribe, retrying in 5s: %v", err)
			select {
			case <-time.After(5 * time.Second):
				continue
			case <-s.stopChan:
				return
			}
		}

		s.logger.Debugf("subscribed to channel: %s", s.channelName)

	subscriberLoop:
		for {
			select {
			case msg, ok := <-subscription.Channel():
				if !ok {
					s.logger.Warn("subscription channel closed, attempting to re-subscribe...")
					break subscriberLoop
				}
				s.logger.Debugf("received invalidation notification, payload: %s", string(msg.Payload))
				if err := s.reload(); err != nil {
					s.logger.Errorf("failed to reload cache after notification: %v", err)
				}
			case <-s.stopChan:
				if err := subscription.Close(); err != nil {
					s.logger.Errorf("failed to close subscription: %v", err)
				}
				return
			}
		}

		// Pre ponovnog pokušaja, osigurajte da je stara pretplata zatvorena.
		if err := subscription.Close(); err != nil {
			s.logger.Errorf("failed to close subscription before retrying: %v", err)
		}

		// Sačekajte trenutak pre ponovnog pokušaja kako biste izbegli uske petlje kod trajnih grešaka.
		select {
		case <-time.After(2 * time.Second):
		case <-s.stopChan:
			return
		}
	}
}
