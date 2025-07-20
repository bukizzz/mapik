package channel

import (
	"MAPIK/internal/models"
	"MAPIK/internal/types"
	"bytes"
	"fmt"
	"net/http"
	"net/url"
	"reflect"
	"strings"
	"sync"

	"gorm.io/datatypes"
)

// UpstreamInfo sadrži informacije za jedan upstream server, uključujući njegovu težinu.
type UpstreamInfo struct {
	URL           *url.URL
	Weight        int
	CurrentWeight int
}

// BaseChannel pruža zajedničku funkcionalnost za proxy kanale.
type BaseChannel struct {
	Name         string
	Upstreams    []UpstreamInfo
	HTTPClient   *http.Client
	StreamClient *http.Client
	TestModel    string
	upstreamLock sync.Mutex

	// Keširana polja iz grupe za proveru zastarelosti
	channelType     string
	groupUpstreams  datatypes.JSON
	effectiveConfig *types.SystemSettings
}

// getUpstreamURL bira upstream URL koristeći algoritam glatkog ponderisanog kružnog raspoređivanja.
func (b *BaseChannel) getUpstreamURL() *url.URL {
	b.upstreamLock.Lock()
	defer b.upstreamLock.Unlock()

	if len(b.Upstreams) == 0 {
		return nil
	}
	if len(b.Upstreams) == 1 {
		return b.Upstreams[0].URL
	}

	totalWeight := 0
	var best *UpstreamInfo

	for i := range b.Upstreams {
		up := &b.Upstreams[i]
		totalWeight += up.Weight
		up.CurrentWeight += up.Weight

		if best == nil || up.CurrentWeight > best.CurrentWeight {
			best = up
		}
	}

	if best == nil {
		return b.Upstreams[0].URL // Vraća se na prvi dostupan
	}

	best.CurrentWeight -= totalWeight
	return best.URL
}

// BuildUpstreamURL konstruiše ciljni URL za upstream servis.
func (b *BaseChannel) BuildUpstreamURL(originalURL *url.URL, group *models.Group) (string, error) {
	base := b.getUpstreamURL()
	if base == nil {
		return "", fmt.Errorf("nije konfigurisan upstream URL za kanal %s", b.Name)
	}

	finalURL := *base
	proxyPrefix := "/proxy/" + group.Name
	requestPath := originalURL.Path
	requestPath = strings.TrimPrefix(requestPath, proxyPrefix)

	finalURL.Path = strings.TrimRight(finalURL.Path, "/") + requestPath

	finalURL.RawQuery = originalURL.RawQuery

	return finalURL.String(), nil
}

// IsConfigStale proverava da li je konfiguracija kanala zastarela u poređenju sa datom grupom.
func (b *BaseChannel) IsConfigStale(group *models.Group) bool {
	if b.channelType != group.ChannelType {
		return true
	}
	if b.TestModel != group.TestModel {
		return true
	}
	if !bytes.Equal(b.groupUpstreams, group.Upstreams) {
		return true
	}
	if !reflect.DeepEqual(b.effectiveConfig, &group.EffectiveConfig) {
		return true
	}
	return false
}

// GetHTTPClient vraća klijenta za standardne zahteve.
func (b *BaseChannel) GetHTTPClient() *http.Client {
	return b.HTTPClient
}

// GetStreamClient vraća klijenta za striming zahteve.
func (b *BaseChannel) GetStreamClient() *http.Client {
	return b.StreamClient
}
