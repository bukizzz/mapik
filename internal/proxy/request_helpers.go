package proxy

import (
	app_errors "MAPIK/internal/errors"
	"MAPIK/internal/models"
	"bytes"
	"compress/gzip"
	"encoding/json"
	"io"
	"net/http"

	"github.com/sirupsen/logrus"
)

func (ps *ProxyServer) applyParamOverrides(bodyBytes []byte, group *models.Group) ([]byte, error) {
	if len(group.ParamOverrides) == 0 || len(bodyBytes) == 0 {
		return bodyBytes, nil
	}

	var requestData map[string]any
	if err := json.Unmarshal(bodyBytes, &requestData); err != nil {
		logrus.Warnf("neuspešno de-serijalizovanje tela zahteva za premošćavanje parametara, prosleđivanje: %v", err)
		return bodyBytes, nil
	}

	for key, value := range group.ParamOverrides {
		requestData[key] = value
	}

	return json.Marshal(requestData)
}

// logUpstreamError pruža centralizovan način za logovanje grešaka iz uzvodnih interakcija.
func logUpstreamError(context string, err error) {
	if err == nil {
		return
	}
	if app_errors.IsIgnorableError(err) {
		logrus.Debugf("Zanemarljiva uzvodna greška u %s: %v", context, err)
	} else {
		logrus.Errorf("Uzvodna greška u %s: %v", context, err)
	}
}

// handleGzipCompression proverava gzip kodiranje i dekompresuje telo ako je potrebno.
func handleGzipCompression(resp *http.Response, bodyBytes []byte) []byte {
	if resp.Header.Get("Content-Encoding") == "gzip" {
		reader, gzipErr := gzip.NewReader(bytes.NewReader(bodyBytes))
		if gzipErr != nil {
			logrus.Warnf("Neuspešno kreiranje gzip čitača za telo greške: %v", gzipErr)
			return bodyBytes
		}
		defer reader.Close()

		decompressedBody, readAllErr := io.ReadAll(reader)
		if readAllErr != nil {
			logrus.Warnf("Neuspešna dekompresija gzip tela greške: %v", readAllErr)
			return bodyBytes
		}
		return decompressedBody
	}
	return bodyBytes
}
