// Paket middleware pruža HTTP middleware za aplikaciju
package middleware

import (
	"fmt"
	"strings"
	"time"

	"MAPIK/internal/channel"
	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/response"
	"MAPIK/internal/services"
	"MAPIK/internal/types"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Logger kreira middleware za logovanje visokih performansi
func Logger(config types.LogConfig) gin.HandlerFunc {
	return func(c *gin.Context) {

		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Obradite zahtev
		c.Next()

		// Izračunajte vreme odgovora
		latency := time.Since(start)

		// Dobijte osnovne informacije
		method := c.Request.Method
		statusCode := c.Writer.Status()

		// Izgradite punu putanju (izbegavajte spajanje stringova)
		fullPath := path
		if raw != "" {
			fullPath = path + "?" + raw
		}

		// Dobijte informacije o ključu (ako postoje)
		keyInfo := ""
		if keyIndex, exists := c.Get("keyIndex"); exists {
			if keyPreview, exists := c.Get("keyPreview"); exists {
				keyInfo = fmt.Sprintf(" - Ključ[%v] %v", keyIndex, keyPreview)
			}
		}

		// Dobijte informacije o ponovnom pokušaju (ako postoje)
		retryInfo := ""
		if retryCount, exists := c.Get("retryCount"); exists {
			retryInfo = fmt.Sprintf(" - Ponovni pokušaj[%d]", retryCount)
		}

		// Filtrirajte logove provere zdravlja i drugih nadzornih krajnjih tačaka da biste smanjili buku
		if isMonitoringEndpoint(path) {
			// Logujte samo greške za nadzorne krajnje tačke
			if statusCode >= 400 {
				logrus.Warnf("%s %s - %d - %v", method, fullPath, statusCode, latency)
			}
			return
		}

		// Odaberite nivo logovanja na osnovu status koda
		if statusCode >= 500 {
			logrus.Errorf("%s %s - %d - %v%s%s", method, fullPath, statusCode, latency, keyInfo, retryInfo)
		} else if statusCode >= 400 {
			logrus.Warnf("%s %s - %d - %v%s%s", method, fullPath, statusCode, latency, keyInfo, retryInfo)
		} else {
			logrus.Infof("%s %s - %d - %v%s%s", method, fullPath, statusCode, latency, keyInfo, retryInfo)
		}
	}
}

// CORS kreira CORS middleware
func CORS(config types.CORSConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !config.Enabled {
			c.Next()
			return
		}

		origin := c.Request.Header.Get("Origin")

		// Proverite da li je poreklo dozvoljeno
		allowed := false
		for _, allowedOrigin := range config.AllowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		// Postavite druge CORS zaglavlja
		c.Header("Access-Control-Allow-Methods", strings.Join(config.AllowedMethods, ", "))
		c.Header("Access-Control-Allow-Headers", strings.Join(config.AllowedHeaders, ", "))

		if config.AllowCredentials {
			c.Header("Access-Control-Allow-Credentials", "true")
		}

		// Obradite preflight zahteve
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Auth kreira middleware za autentifikaciju
func Auth(
	authConfig types.AuthConfig,
	groupManager *services.GroupManager,
	channelFactory *channel.Factory,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// Preskočite autentifikaciju za zdravstvene krajnje tačke
		if isMonitoringEndpoint(path) {
			c.Next()
			return
		}

		var key string
		var err error

		if strings.HasPrefix(path, "/api") {
			// Obradite autentifikaciju backend API-ja
			key = extractApiKey(c)
		} else if strings.HasPrefix(path, "/proxy/") {
			// Obradite autentifikaciju proxy-ja
			key, err = extractProxyKey(c, groupManager, channelFactory)
			if err != nil {
				// Greška iz extractProxyKey je već APIError
				if apiErr, ok := err.(*app_errors.APIError); ok {
					response.Error(c, apiErr)
				} else {
					response.Error(c, app_errors.NewAPIError(app_errors.ErrInternalServer, err.Error()))
				}
				c.Abort()
				return
			}
		} else {
			// Za sve ostale putanje, podrazumevano odbijte pristup
			response.Error(c, app_errors.ErrResourceNotFound)
			c.Abort()
			return
		}

		if key == "" || key != authConfig.Key {
			response.Error(c, app_errors.ErrUnauthorized)
			c.Abort()
			return
		}

		// Ključ je izvučen, ali validacija se obrađuje samom proxy logikom.
		// Za backend API, već smo ga validirali.
		c.Next()
	}
}

// Recovery kreira middleware za oporavak sa prilagođenim rukovanjem greškama
func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		logrus.Errorf("Panika oporavljena: %v", recovered)
		response.Error(c, app_errors.ErrInternalServer)
		c.Abort()
	})
}

// RateLimiter kreira jednostavan middleware za ograničavanje brzine
func RateLimiter(config types.PerformanceConfig) gin.HandlerFunc {
	// Jednostavno ograničavanje brzine zasnovano na semaforu
	semaphore := make(chan struct{}, config.MaxConcurrentRequests)

	return func(c *gin.Context) {
		select {
		case semaphore <- struct{}{}:
			defer func() { <-semaphore }()
			c.Next()
		default:
			response.Error(c, app_errors.NewAPIError(app_errors.ErrInternalServer, "Previše istovremenih zahteva"))
			c.Abort()
		}
	}
}

// ErrorHandler kreira middleware za rukovanje greškama
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Obradite sve greške koje su se dogodile tokom obrade zahteva
		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err

			// Proverite da li je to naš prilagođeni tip greške
			if apiErr, ok := err.(*app_errors.APIError); ok {
				response.Error(c, apiErr)
				return
			}

			// Obradite druge greške
			logrus.Errorf("Neobrađena greška: %v", err)
			response.Error(c, app_errors.ErrInternalServer)
		}
	}
}

// isMonitoringEndpoint proverava da li je putanja nadzorna krajnja tačka
func isMonitoringEndpoint(path string) bool {
	monitoringPaths := []string{"/health"}
	for _, monitoringPath := range monitoringPaths {
		if path == monitoringPath {
			return true
		}
	}
	return false
}

// extractBearerKey izvlači ključ iz zaglavlja "Authorization: Bearer <key>".
func extractApiKey(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		const bearerPrefix = "Bearer "
		if strings.HasPrefix(authHeader, bearerPrefix) {
			return authHeader[len(bearerPrefix):]
		}
	}

	authKey := c.Query("auth_key")
	if authKey != "" {
		return authKey
	}

	return ""
}

// extractProxyKey obrađuje izvlačenje ključa za proxy rute.
func extractProxyKey(
	c *gin.Context,
	groupManager *services.GroupManager,
	channelFactory *channel.Factory,
) (string, error) {
	groupName := c.Param("group_name")
	if groupName == "" {
		return "", app_errors.NewAPIError(app_errors.ErrBadRequest, "Naziv grupe nedostaje u URL putanji")
	}

	group, err := groupManager.GetGroupByName(groupName)
	if err != nil {
		return "", app_errors.NewAPIError(app_errors.ErrResourceNotFound, fmt.Sprintf("Grupa '%s' nije pronađena", groupName))
	}

	channel, err := channelFactory.GetChannel(group)
	if err != nil {
		return "", app_errors.NewAPIError(app_errors.ErrInternalServer, fmt.Sprintf("Neuspešno dobijanje kanala za grupu '%s'", groupName))
	}

	key := channel.ExtractKey(c)
	if key == "" {
		return "", app_errors.ErrUnauthorized
	}

	return key, nil
}
