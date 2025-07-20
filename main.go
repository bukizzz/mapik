// Paket main pruža ulaznu tačku za proxy server MAPIK
package main

import (
	"context"
	"embed"
	"os"
	"os/signal"
	"syscall"
	"time"

	"MAPIK/internal/app"
	"MAPIK/internal/container"
	"MAPIK/internal/types"
	"MAPIK/internal/utils"

	"github.com/sirupsen/logrus"
)

//go:embed web/dist
var buildFS embed.FS

//go:embed web/dist/index.html
var indexPage []byte

func main() {
	// Izgradite kontejner za ubrizgavanje zavisnosti
	container, err := container.BuildContainer()
	if err != nil {
		logrus.Fatalf("Greška pri izgradnji kontejnera: %v", err)
	}

	// Pružite UI resurse kontejneru
	if err := container.Provide(func() embed.FS { return buildFS }); err != nil {
		logrus.Fatalf("Greška pri pružanju buildFS: %v", err)
	}
	if err := container.Provide(func() []byte { return indexPage }); err != nil {
		logrus.Fatalf("Greška pri pružanju indexPage: %v", err)
	}

	// Inicijalizujte globalni loger
	if err := container.Invoke(func(configManager types.ConfigManager) {
		utils.SetupLogger(configManager)
	}); err != nil {
		logrus.Fatalf("Greška pri postavljanju logera: %v", err)
	}

	// Kreirajte i pokrenite aplikaciju
	if err := container.Invoke(func(application *app.App, configManager types.ConfigManager) {
		if err := application.Start(); err != nil {
			logrus.Fatalf("Greška pri pokretanju aplikacije: %v", err)
		}

		// Sačekajte signal prekida za graciozno gašenje
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		// Kreirajte kontekst sa vremenskim ograničenjem za gašenje
		serverConfig := configManager.GetEffectiveServerConfig()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), time.Duration(serverConfig.GracefulShutdownTimeout)*time.Second)
		defer cancel()

		// Izvršite graciozno gašenje
		application.Stop(shutdownCtx)

	}); err != nil {
		logrus.Fatalf("Greška pri pokretanju aplikacije: %v", err)
	}
}
