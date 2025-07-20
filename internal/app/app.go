// Paket app pruža glavnu logiku aplikacije i upravljanje životnim ciklusom.
package app

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"MAPIK/internal/config"
	db "MAPIK/internal/db/migrations"
	"MAPIK/internal/keypool"
	"MAPIK/internal/models"
	"MAPIK/internal/proxy"
	"MAPIK/internal/services"
	"MAPIK/internal/store"
	"MAPIK/internal/types"
	"MAPIK/internal/version"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"go.uber.org/dig"
	"gorm.io/gorm"
)

// App sadrži sve servise i upravlja životnim ciklusom aplikacije.
type App struct {
	engine            *gin.Engine
	configManager     types.ConfigManager
	settingsManager   *config.SystemSettingsManager
	groupManager      *services.GroupManager
	logCleanupService *services.LogCleanupService
	requestLogService *services.RequestLogService
	cronChecker       *keypool.CronChecker
	keyPoolProvider   *keypool.KeyProvider
	proxyServer       *proxy.ProxyServer
	storage           store.Store
	db                *gorm.DB
	httpServer        *http.Server
}

// AppParams definiše zavisnosti za App.
type AppParams struct {
	dig.In
	Engine            *gin.Engine
	ConfigManager     types.ConfigManager
	SettingsManager   *config.SystemSettingsManager
	GroupManager      *services.GroupManager
	LogCleanupService *services.LogCleanupService
	RequestLogService *services.RequestLogService
	CronChecker       *keypool.CronChecker
	KeyPoolProvider   *keypool.KeyProvider
	ProxyServer       *proxy.ProxyServer
	Storage           store.Store
	DB                *gorm.DB
}

// NewApp je konstruktor za App, sa zavisnostima injektiranim od strane dig.
func NewApp(params AppParams) *App {
	return &App{
		engine:            params.Engine,
		configManager:     params.ConfigManager,
		settingsManager:   params.SettingsManager,
		groupManager:      params.GroupManager,
		logCleanupService: params.LogCleanupService,
		requestLogService: params.RequestLogService,
		cronChecker:       params.CronChecker,
		keyPoolProvider:   params.KeyPoolProvider,
		proxyServer:       params.ProxyServer,
		storage:           params.Storage,
		db:                params.DB,
	}
}

// Start pokreće aplikaciju, to je neblokirajući poziv.
func (a *App) Start() error {
	// Master čvor izvršava inicijalizaciju
	if a.configManager.IsMaster() {
		logrus.Info("Pokretanje kao Master čvor.")

		// Migracija baze podataka
		if err := a.db.AutoMigrate(
			&models.SystemSetting{},
			&models.Group{},
			&models.APIKey{},
			&models.RequestLog{},
			&models.GroupHourlyStat{},
		); err != nil {
			return fmt.Errorf("automatska migracija baze podataka neuspešna: %w", err)
		}
		// Popravka podataka
		db.MigrateDatabase(a.db)
		logrus.Info("Automatska migracija baze podataka završena.")

		// Inicijalizacija sistemskih podešavanja
		if err := a.settingsManager.EnsureSettingsInitialized(); err != nil {
			return fmt.Errorf("neuspešna inicijalizacija sistemskih podešavanja: %w", err)
		}
		logrus.Info("Sistemska podešavanja inicijalizovana u bazi podataka.")

		a.settingsManager.Initialize(a.storage, a.groupManager, a.configManager.IsMaster())

		// Učitavanje ključeva iz baze podataka u Redis
		if err := a.keyPoolProvider.LoadKeysFromDB(); err != nil {
			return fmt.Errorf("neuspešno učitavanje ključeva u bazen ključeva: %w", err)
		}
		logrus.Debug("API ključevi učitani u Redis keš od strane mastera.")

		// Servisi pokrenuti samo na Master čvoru
		a.requestLogService.Start()
		a.logCleanupService.Start()
		a.cronChecker.Start()
	} else {
		logrus.Info("Pokretanje kao Slave čvor.")
		a.settingsManager.Initialize(a.storage, a.groupManager, a.configManager.IsMaster())
	}

	// Prikaz konfiguracije i pokretanje svih pozadinskih servisa
	a.configManager.DisplayServerConfig()

	a.groupManager.Initialize()

	// Kreiranje HTTP servera
	serverConfig := a.configManager.GetEffectiveServerConfig()
	a.httpServer = &http.Server{
		Addr:           fmt.Sprintf("%s:%d", serverConfig.Host, serverConfig.Port),
		Handler:        a.engine,
		ReadTimeout:    time.Duration(serverConfig.ReadTimeout) * time.Second,
		WriteTimeout:   time.Duration(serverConfig.WriteTimeout) * time.Second,
		IdleTimeout:    time.Duration(serverConfig.IdleTimeout) * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	// Pokretanje HTTP servera u novoj gorutini
	go func() {
		logrus.Infof("MAPIK proxy server uspešno pokrenut na verziji: %s", version.Version)
		logrus.Infof("Adresa servera: http://%s:%d", serverConfig.Host, serverConfig.Port)
		logrus.Info("")
		if err := a.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("Pokretanje servera neuspešno: %v", err)
		}
	}()

	return nil
}

// Stop graciozno gasi aplikaciju.
func (a *App) Stop(ctx context.Context) {
	logrus.Info("Gašenje servera...")

	serverConfig := a.configManager.GetEffectiveServerConfig()
	totalTimeout := time.Duration(serverConfig.GracefulShutdownTimeout) * time.Second

	// Dinamičko izračunavanje HTTP timeout-a za gašenje, ostavljajući 5 sekundi za pozadinske servise
	httpShutdownTimeout := totalTimeout - 5*time.Second
	httpShutdownCtx, cancelHttpShutdown := context.WithTimeout(context.Background(), httpShutdownTimeout)
	defer cancelHttpShutdown()

	logrus.Debugf("Pokušaj gracioznog gašenja HTTP servera (maks. %v)...", httpShutdownTimeout)
	if err := a.httpServer.Shutdown(httpShutdownCtx); err != nil {
		logrus.Debugf("Graciozno gašenje HTTP servera je isteklo, prisilno zatvaranje preostalih veza.")
		if closeErr := a.httpServer.Close(); closeErr != nil {
			logrus.Errorf("Greška pri prisilnom zatvaranju HTTP servera: %v", closeErr)
		}
	}
	logrus.Info("HTTP server je ugašen.")

	// Nastavak gašenja ostalih pozadinskih servisa koristeći originalni ukupni timeout kontekst
	stoppableServices := []func(context.Context){
		a.groupManager.Stop,
		a.settingsManager.Stop,
	}

	if serverConfig.IsMaster {
		stoppableServices = append(stoppableServices,
			a.cronChecker.Stop,
			a.logCleanupService.Stop,
			a.requestLogService.Stop,
		)
	}

	var wg sync.WaitGroup
	wg.Add(len(stoppableServices))

	for _, stopFunc := range stoppableServices {
		go func(stop func(context.Context)) {
			defer wg.Done()
			stop(ctx)
		}(stopFunc)
	}

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logrus.Info("Svi pozadinski servisi su zaustavljeni.")
	case <-ctx.Done():
		logrus.Warn("Gašenje je isteklo, neki servisi možda nisu graciozno zaustavljeni.")
	}

	if a.storage != nil {
		a.storage.Close()
	}

	logrus.Info("Server je graciozno ugašen")
}
