// Paket container pruža kontejner za ubrizgavanje zavisnosti za aplikaciju.
package container

import (
	"MAPIK/internal/app"
	"MAPIK/internal/channel"
	"MAPIK/internal/config"
	"MAPIK/internal/db"
	"MAPIK/internal/handler"
	"MAPIK/internal/httpclient"
	"MAPIK/internal/keypool"
	"MAPIK/internal/proxy"
	"MAPIK/internal/router"
	"MAPIK/internal/services"
	"MAPIK/internal/store"

	"go.uber.org/dig"
)

// BuildContainer kreira novi kontejner za ubrizgavanje zavisnosti i pruža sve servise aplikacije.
func BuildContainer() (*dig.Container, error) {
	container := dig.New()

	// Infrastrukturni servisi
	if err := container.Provide(config.NewManager); err != nil {
		return nil, err
	}
	if err := container.Provide(db.NewDB); err != nil {
		return nil, err
	}
	if err := container.Provide(config.NewSystemSettingsManager); err != nil {
		return nil, err
	}
	if err := container.Provide(store.NewStore); err != nil {
		return nil, err
	}
	if err := container.Provide(httpclient.NewHTTPClientManager); err != nil {
		return nil, err
	}
	if err := container.Provide(channel.NewFactory); err != nil {
		return nil, err
	}

	// Poslovni servisi
	if err := container.Provide(services.NewTaskService); err != nil {
		return nil, err
	}
	if err := container.Provide(services.NewKeyManualValidationService); err != nil {
		return nil, err
	}
	if err := container.Provide(services.NewKeyService); err != nil {
		return nil, err
	}
	if err := container.Provide(services.NewKeyImportService); err != nil {
		return nil, err
	}
	if err := container.Provide(services.NewLogService); err != nil {
		return nil, err
	}
	if err := container.Provide(services.NewLogCleanupService); err != nil {
		return nil, err
	}
	if err := container.Provide(services.NewRequestLogService); err != nil {
		return nil, err
	}
	if err := container.Provide(services.NewGroupManager); err != nil {
		return nil, err
	}
	if err := container.Provide(keypool.NewProvider); err != nil {
		return nil, err
	}
	if err := container.Provide(keypool.NewKeyValidator); err != nil {
		return nil, err
	}
	if err := container.Provide(keypool.NewCronChecker); err != nil {
		return nil, err
	}

	// Hendleri
	if err := container.Provide(handler.NewServer); err != nil {
		return nil, err
	}
	if err := container.Provide(handler.NewCommonHandler); err != nil {
		return nil, err
	}

	// Proxy i Ruter
	if err := container.Provide(proxy.NewProxyServer); err != nil {
		return nil, err
	}
	if err := container.Provide(router.NewRouter); err != nil {
		return nil, err
	}

	// Sloj aplikacije
	if err := container.Provide(app.NewApp); err != nil {
		return nil, err
	}

	return container, nil
}
