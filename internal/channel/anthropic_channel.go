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
	Register("anthropic", newAnthropicChannel)
}

// AnthropicChannel predstavlja kanal za Anthropic API.
type AnthropicChannel struct {
	*BaseChannel
}

// newAnthropicChannel kreira novu instancu AnthropicChannel.
func newAnthropicChannel(f *Factory, group *models.Group) (ChannelProxy, error) {
	base, err := f.newBaseChannel("anthropic", group)
	if err != nil {
		return nil, err
	}

	return &AnthropicChannel{
		BaseChannel: base,
	}, nil
}

// ModifyRequest postavlja potrebne zaglavlja za Anthropic API.
func (ch *AnthropicChannel) ModifyRequest(req *http.Request, apiKey *models.APIKey, group *models.Group) {
	req.Header.Set("x-api-key", apiKey.KeyValue)
	req.Header.Set("anthropic-version", "2023-06-01")
}

// IsStreamRequest proverava da li je zahtev za striming odgovor koristeći prethodno pročitano telo.
func (ch *AnthropicChannel) IsStreamRequest(c *gin.Context, bodyBytes []byte) bool {
	if strings.Contains(c.GetHeader("Accept"), "text/event-stream") {
		return true
	}

	if c.Query("stream") == "true" {
		return true
	}

	type streamPayload struct {
		Stream bool `json:"stream"`
	}
	var p streamPayload
	if err := json.Unmarshal(bodyBytes, &p); err == nil {
		return p.Stream
	}

	return false
}

// ExtractKey izdvaja API ključ iz x-api-key zaglavlja.
func (ch *AnthropicChannel) ExtractKey(c *gin.Context) string {
	// Proveri x-api-key zaglavlje (Anthropic standard)
	if key := c.GetHeader("x-api-key"); key != "" {
		return key
	}

	// Povratak na Authorization zaglavlje radi kompatibilnosti
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		const bearerPrefix = "Bearer "
		if strings.HasPrefix(authHeader, bearerPrefix) {
			return authHeader[len(bearerPrefix):]
		}
	}

	return ""
}

// ValidateKey proverava da li je dati API ključ validan slanjem zahteva za poruke.
func (ch *AnthropicChannel) ValidateKey(ctx context.Context, key string) (bool, error) {
	upstreamURL := ch.getUpstreamURL()
	if upstreamURL == nil {
		return false, fmt.Errorf("nije konfigurisan upstream URL za kanal %s", ch.Name)
	}

	reqURL := upstreamURL.String() + "/v1/messages"

	// Koristi minimalan, niskotroškovni payload za validaciju
	payload := gin.H{
		"model":      ch.TestModel,
		"max_tokens": 100,
		"messages": []gin.H{
			{"role": "user", "content": "hi"},
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
	req.Header.Set("x-api-key", key)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := ch.HTTPClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("neuspešno slanje validacionog zahteva: %w", err)
	}
	defer resp.Body.Close()

	// Status kod 200 OK ukazuje da je ključ validan i da može slati zahteve.
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
