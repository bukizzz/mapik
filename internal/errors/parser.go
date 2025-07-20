package errors

import (
	"encoding/json"
	"strings"
)

const (
	// maxErrorBodyLength definiše maksimalnu dužinu poruke o grešci koja će biti sačuvana ili vraćena.
	maxErrorBodyLength = 2048
)

// standardErrorResponse odgovara formatima kao što su: {"error": {"message": "..."}}
type standardErrorResponse struct {
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

// vendorErrorResponse odgovara formatima kao što su: {"error_msg": "..."}
type vendorErrorResponse struct {
	ErrorMsg string `json:"error_msg"`
}

// simpleErrorResponse odgovara formatima kao što su: {"error": "..."}
type simpleErrorResponse struct {
	Error string `json:"error"`
}

// rootMessageErrorResponse odgovara formatima kao što su: {"message": "..."}
type rootMessageErrorResponse struct {
	Message string `json:"message"`
}

// ParseUpstreamError pokušava da parsira strukturiranu poruku o grešci iz tela uzvodnog odgovora
func ParseUpstreamError(body []byte) string {
	// 1. Pokušaj parsiranja standardnog OpenAI/Gemini formata.
	var stdErr standardErrorResponse
	if err := json.Unmarshal(body, &stdErr); err == nil {
		if msg := strings.TrimSpace(stdErr.Error.Message); msg != "" {
			return truncateString(msg, maxErrorBodyLength)
		}
	}

	// 2. Pokušaj parsiranja formata specifičnog za dobavljača (npr. Baidu).
	var vendorErr vendorErrorResponse
	if err := json.Unmarshal(body, &vendorErr); err == nil {
		if msg := strings.TrimSpace(vendorErr.ErrorMsg); msg != "" {
			return truncateString(msg, maxErrorBodyLength)
		}
	}

	// 3. Pokušaj parsiranja jednostavnog formata greške.
	var simpleErr simpleErrorResponse
	if err := json.Unmarshal(body, &simpleErr); err == nil {
		if msg := strings.TrimSpace(simpleErr.Error); msg != "" {
			return truncateString(msg, maxErrorBodyLength)
		}
	}

	// 4. Pokušaj parsiranja formata poruke na nivou korena.
	var rootMsgErr rootMessageErrorResponse
	if err := json.Unmarshal(body, &rootMsgErr); err == nil {
		if msg := strings.TrimSpace(rootMsgErr.Message); msg != "" {
			return truncateString(msg, maxErrorBodyLength)
		}
	}

	// 5. Graciozna degradacija: Ako svi pokušaji parsiranja ne uspeju, vrati sirovo (ali bezbedno) telo.
	return truncateString(string(body), maxErrorBodyLength)
}

// truncateString osigurava da string ne prelazi maksimalnu dužinu.
func truncateString(s string, maxLength int) string {
	if len(s) > maxLength {
		return s[:maxLength]
	}
	return s
}
