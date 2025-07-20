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
	Register("openai", newOpenAIChannel)
}

// OpenAIChannel predstavlja kanal za OpenAI API.
type OpenAIChannel struct {
	*BaseChannel
}

// newOpenAIChannel kreira novu instancu OpenAIChannel.
func newOpenAIChannel(f *Factory, group *models.Group) (ChannelProxy, error) {
	base, err := f.newBaseChannel("openai", group)
	if err != nil {
		return nil, err
	}

	return &OpenAIChannel{
		BaseChannel: base,
	}, nil
}

// ModifyRequest postavlja zaglavlje Authorization za OpenAI servis.
func (ch *OpenAIChannel) ModifyRequest(req *http.Request, apiKey *models.APIKey, group *models.Group) {
	req.Header.Set("Authorization", "Bearer "+apiKey.KeyValue)
}

// IsStreamRequest proverava da li je zahtev za striming odgovor koristeći prethodno pročitano telo.
func (ch *OpenAIChannel) IsStreamRequest(c *gin.Context, bodyBytes []byte) bool {
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

// ExtractKey izdvaja API ključ iz zaglavlja Authorization.
func (ch *OpenAIChannel) ExtractKey(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		const bearerPrefix = "Bearer "
		if strings.HasPrefix(authHeader, bearerPrefix) {
			return authHeader[len(bearerPrefix):]
		}
	}
	return ""
}

// ValidateKey proverava da li je dati API ključ validan slanjem zahteva za dovršavanje četa.
func (ch *OpenAIChannel) ValidateKey(ctx context.Context, key string) (bool, error) {
	upstreamURL := ch.getUpstreamURL()
	if upstreamURL == nil {
		return false, fmt.Errorf("nije konfigurisan upstream URL za kanal %s", ch.Name)
	}

	reqURL := upstreamURL.String() + "/v1/chat/completions"

	// Koristi minimalan, niskotroškovni payload za validaciju
	payload := gin.H{
		"model": ch.TestModel,
		"messages": []gin.H{
			{"role": "user", "content": "hi"},
		},
		"max_tokens": 100,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return false, fmt.Errorf("neuspešno maršalovanje validacionog payload-a: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(body))
	if err != nil {
		return false, fmt.Errorf("neuspešno kreiranje validacionog zahteva: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")

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
