package channel

import (
	"MAPIK/internal/models"
	"context"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

// ChannelProxy definiše interfejs za različite proxy-je API kanala.
type ChannelProxy interface {
	// BuildUpstreamURL konstruiše ciljni URL za upstream servis.
	BuildUpstreamURL(originalURL *url.URL, group *models.Group) (string, error)

	// IsConfigStale proverava da li je konfiguracija kanala zastarela u poređenju sa datom grupom.
	IsConfigStale(group *models.Group) bool

	// GetHTTPClient vraća klijenta za standardne zahteve.
	GetHTTPClient() *http.Client

	// GetStreamClient vraća klijenta za striming zahteve.
	GetStreamClient() *http.Client

	// ModifyRequest omogućava kanalu da doda specifična zaglavlja ili modifikuje zahtev
	ModifyRequest(req *http.Request, apiKey *models.APIKey, group *models.Group)

	// IsStreamRequest proverava da li je zahtev za striming odgovor.
	IsStreamRequest(c *gin.Context, bodyBytes []byte) bool

	// ExtractKey izdvaja API ključ iz zahteva.
	ExtractKey(c *gin.Context) string

	// ValidateKey proverava da li je dati API ključ validan.
	ValidateKey(ctx context.Context, key string) (bool, error)
}
