package channel

import (
	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/models"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func init() {
	Register("gemini", newGeminiChannel)
}

// GeminiChannel predstavlja kanal za Gemini API.
type GeminiChannel struct {
	*BaseChannel
}

// newGeminiChannel kreira novu instancu GeminiChannel.
func newGeminiChannel(f *Factory, group *models.Group) (ChannelProxy, error) {
	base, err := f.newBaseChannel("gemini", group)
	if err != nil {
		return nil, err
	}

	return &GeminiChannel{
		BaseChannel: base,
	}, nil
}

// ModifyRequest dodaje API ključ kao parametar upita za Gemini zahteve.
func (ch *GeminiChannel) ModifyRequest(req *http.Request, apiKey *models.APIKey, group *models.Group) {
	q := req.URL.Query()
	q.Set("key", apiKey.KeyValue)
	req.URL.RawQuery = q.Encode()
}

// IsStreamRequest proverava da li je zahtev za striming odgovor.
func (ch *GeminiChannel) IsStreamRequest(c *gin.Context, bodyBytes []byte) bool {
	path := c.Request.URL.Path
	if strings.HasSuffix(path, ":streamGenerateContent") {
		return true
	}

	// Takođe proverava standardne indikatore striminga kao rezervu.
	if strings.Contains(c.GetHeader("Accept"), "text/event-stream") {
		return true
	}
	if c.Query("stream") == "true" {
		return true
	}

	return false
}

// ExtractKey izdvaja API ključ iz X-Goog-Api-Key zaglavlja ili "key" parametra upita.
func (ch *GeminiChannel) ExtractKey(c *gin.Context) string {
	// 1. Proveri X-Goog-Api-Key zaglavlje
	if key := c.GetHeader("X-Goog-Api-Key"); key != "" {
		return key
	}

	// 2. Proveri "key" parametar upita
	if key := c.Query("key"); key != "" {
		return key
	}

	return ""
}

// ValidateKey proverava da li je dati API ključ validan slanjem zahteva za generisanje sadržaja.
func (ch *GeminiChannel) ValidateKey(ctx context.Context, key string) (bool, error) {
	upstreamURL := ch.getUpstreamURL()
	if upstreamURL == nil {
		return false, fmt.Errorf("nije konfigurisan upstream URL za kanal %s", ch.Name)
	}

	reqURL := fmt.Sprintf("%s/v1beta/models/%s:generateContent?key=%s", upstreamURL.String(), ch.TestModel, key)

	payload := gin.H{
		"contents": []gin.H{
			{"parts": []gin.H{
				{"text": "hi"},
			}},
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return false, fmt.Errorf("neuspešno maršalovanje validacionog payload-a: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(body))
	if err != nil {
		return false, fmt.Errorf("neuspešno kreiranje validacionog zahteva: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := ch.HTTPClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("neuspešno slanje validacionog zahteva: %w", err)
	}
	defer resp.Body.Close()

	// Status kod 200 OK ukazuje da je ključ validan.
	if resp.StatusCode == http.StatusOK {
		return true, nil
	}

	// Za odgovore koji nisu 200, parsiraj telo da bi se pružio specifičniji razlog greške.
	errorBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, fmt.Errorf("ključ je nevažeći (status %d), ali neuspešno čitanje tela greške: %w", resp.StatusCode, err)
	}

	// Koristi novi parser za izdvajanje čiste poruke o grešci.
	parsedError := app_errors.ParseUpstreamError(errorBody)

	return false, fmt.Errorf("[status %d] %s", resp.StatusCode, parsedError)
}
