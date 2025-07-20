package channel

import (
	"MAPIK/internal/config"
	"MAPIK/internal/httpclient"
	"MAPIK/internal/models"
	"encoding/json"
	"fmt"
	"net/url"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// channelConstructor definiše potpis funkcije za kreiranje novog proxy kanala.
type channelConstructor func(f *Factory, group *models.Group) (ChannelProxy, error)

var (
	// channelRegistry čuva mapiranje tipa kanala na njegov konstruktor.
	channelRegistry = make(map[string]channelConstructor)
)

// Register dodaje novi konstruktor kanala u registar.
func Register(channelType string, constructor channelConstructor) {
	if _, exists := channelRegistry[channelType]; exists {
		panic(fmt.Sprintf("tip kanala '%s' je već registrovan", channelType))
	}
	channelRegistry[channelType] = constructor
}

// GetChannels vraća slice svih registrovanih imena tipova kanala.
func GetChannels() []string {
	supportedTypes := make([]string, 0, len(channelRegistry))
	for t := range channelRegistry {
		supportedTypes = append(supportedTypes, t)
	}
	return supportedTypes
}

// Factory je odgovoran za kreiranje proxy kanala.
type Factory struct {
	settingsManager *config.SystemSettingsManager
	clientManager   *httpclient.HTTPClientManager
	channelCache    map[uint]ChannelProxy
	cacheLock       sync.Mutex
}

// NewFactory kreira novu fabriku kanala.
func NewFactory(settingsManager *config.SystemSettingsManager, clientManager *httpclient.HTTPClientManager) *Factory {
	return &Factory{
		settingsManager: settingsManager,
		clientManager:   clientManager,
		channelCache:    make(map[uint]ChannelProxy),
	}
}

// GetChannel vraća proxy kanala na osnovu tipa kanala grupe.
func (f *Factory) GetChannel(group *models.Group) (ChannelProxy, error) {
	f.cacheLock.Lock()
	defer f.cacheLock.Unlock()

	if channel, ok := f.channelCache[group.ID]; ok {
		if !channel.IsConfigStale(group) {
			return channel, nil
		}
	}

	logrus.Debugf("Kreiranje novog kanala za grupu %d tipa '%s'", group.ID, group.ChannelType)

	constructor, ok := channelRegistry[group.ChannelType]
	if !ok {
		return nil, fmt.Errorf("nepodržan tip kanala: %s", group.ChannelType)
	}
	channel, err := constructor(f, group)
	if err != nil {
		return nil, err
	}
	f.channelCache[group.ID] = channel
	return channel, nil
}

// newBaseChannel je pomoćna funkcija za kreiranje i konfigurisanje BaseChannel-a.
func (f *Factory) newBaseChannel(name string, group *models.Group) (*BaseChannel, error) {
	type upstreamDef struct {
		URL    string `json:"url"`
		Weight int    `json:"weight"`
	}

	var defs []upstreamDef
	if err := json.Unmarshal(group.Upstreams, &defs); err != nil {
		return nil, fmt.Errorf("neuspešno dešifrovanje upstreams za %s kanal: %w", name, err)
	}

	if len(defs) == 0 {
		return nil, fmt.Errorf("potreban je barem jedan upstream za %s kanal", name)
	}

	var upstreamInfos []UpstreamInfo
	for _, def := range defs {
		u, err := url.Parse(def.URL)
		if err != nil {
			return nil, fmt.Errorf("neuspešno parsiranje upstream URL-a '%s' za %s kanal: %w", def.URL, name, err)
		}
		weight := def.Weight
		if weight <= 0 {
			weight = 1
		}
		upstreamInfos = append(upstreamInfos, UpstreamInfo{URL: u, Weight: weight})
	}

	// Osnovna konfiguracija za regularne zahteve, izvedena iz efektivnih podešavanja grupe.
	clientConfig := &httpclient.Config{
		ConnectTimeout:        time.Duration(group.EffectiveConfig.ConnectTimeout) * time.Second,
		RequestTimeout:        time.Duration(group.EffectiveConfig.RequestTimeout) * time.Second,
		IdleConnTimeout:       time.Duration(group.EffectiveConfig.IdleConnTimeout) * time.Second,
		MaxIdleConns:          group.EffectiveConfig.MaxIdleConns,
		MaxIdleConnsPerHost:   group.EffectiveConfig.MaxIdleConnsPerHost,
		ResponseHeaderTimeout: time.Duration(group.EffectiveConfig.ResponseHeaderTimeout) * time.Second,
		DisableCompression:    false,
		WriteBufferSize:       32 * 1024,
		ReadBufferSize:        32 * 1024,
		ForceAttemptHTTP2:     true,
		TLSHandshakeTimeout:   15 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	// Kreiranje namenske konfiguracije za striming zahteve.
	streamConfig := *clientConfig
	streamConfig.RequestTimeout = 0
	streamConfig.DisableCompression = true
	streamConfig.WriteBufferSize = 0
	streamConfig.ReadBufferSize = 0
	// Koristi veći, nezavisni bazen veza za striming klijente kako bi se izbeglo iscrpljivanje.
	streamConfig.MaxIdleConns = max(group.EffectiveConfig.MaxIdleConns*2, 50)
	streamConfig.MaxIdleConnsPerHost = max(group.EffectiveConfig.MaxIdleConnsPerHost*2, 20)

	// Preuzimanje oba klijenta od menadžera koristeći njihove odgovarajuće konfiguracije.
	httpClient := f.clientManager.GetClient(clientConfig)
	streamClient := f.clientManager.GetClient(&streamConfig)

	return &BaseChannel{
		Name:            name,
		Upstreams:       upstreamInfos,
		HTTPClient:      httpClient,
		StreamClient:    streamClient,
		TestModel:       group.TestModel,
		channelType:     group.ChannelType,
		groupUpstreams:  group.Upstreams,
		effectiveConfig: &group.EffectiveConfig,
	}, nil
}
