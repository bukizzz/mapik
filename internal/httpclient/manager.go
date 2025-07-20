package httpclient

import (
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"
)

// Config definiše parametre za kreiranje HTTP klijenta.
// Ova struktura se koristi za generisanje jedinstvenog otiska za ponovnu upotrebu klijenta.
type Config struct {
	ConnectTimeout        time.Duration
	RequestTimeout        time.Duration
	IdleConnTimeout       time.Duration
	MaxIdleConns          int
	MaxIdleConnsPerHost   int
	ResponseHeaderTimeout time.Duration
	DisableCompression    bool
	WriteBufferSize       int
	ReadBufferSize        int
	ForceAttemptHTTP2     bool
	TLSHandshakeTimeout   time.Duration
	ExpectContinueTimeout time.Duration
}

// HTTPClientManager upravlja životnim ciklusom HTTP klijenata.
// Kreira i kešira klijente na osnovu otiska njihove konfiguracije,
// obezbeđujući da se klijenti sa istom konfiguracijom ponovo koriste.
type HTTPClientManager struct {
	clients map[string]*http.Client
	lock    sync.RWMutex
}

// NewHTTPClientManager kreira novog menadžera klijenata.
func NewHTTPClientManager() *HTTPClientManager {
	return &HTTPClientManager{
		clients: make(map[string]*http.Client),
	}
}

// GetClient vraća HTTP klijenta koji odgovara datoj konfiguraciji.
// Ako odgovarajući klijent već postoji u kešu, on se vraća.
// U suprotnom, kreira se novi klijent, kešira se i vraća.
func (m *HTTPClientManager) GetClient(config *Config) *http.Client {
	fingerprint := config.getFingerprint()

	// Brza putanja sa zaključavanjem za čitanje
	m.lock.RLock()
	client, exists := m.clients[fingerprint]
	m.lock.RUnlock()
	if exists {
		return client
	}

	// Spora putanja sa zaključavanjem za pisanje
	m.lock.Lock()
	defer m.lock.Unlock()

	// Dvostruka provera u slučaju da je druga gorutina kreirala klijenta dok smo čekali na zaključavanje.
	if client, exists = m.clients[fingerprint]; exists {
		return client
	}

	// Kreirajte novi transport i klijent sa navedenom konfiguracijom.
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   config.ConnectTimeout,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		ForceAttemptHTTP2:     config.ForceAttemptHTTP2,
		MaxIdleConns:          config.MaxIdleConns,
		MaxIdleConnsPerHost:   config.MaxIdleConnsPerHost,
		IdleConnTimeout:       config.IdleConnTimeout,
		TLSHandshakeTimeout:   config.TLSHandshakeTimeout,
		ExpectContinueTimeout: config.ExpectContinueTimeout,
		ResponseHeaderTimeout: config.ResponseHeaderTimeout,
		DisableCompression:    config.DisableCompression,
		WriteBufferSize:       config.WriteBufferSize,
		ReadBufferSize:        config.ReadBufferSize,
	}

	newClient := &http.Client{
		Transport: transport,
		Timeout:   config.RequestTimeout,
	}

	m.clients[fingerprint] = newClient
	return newClient
}

// getFingerprint generiše jedinstvenu string reprezentaciju konfiguracije klijenta.
func (c *Config) getFingerprint() string {
	return fmt.Sprintf(
		"ct:%.0fs|rt:%.0fs|it:%.0fs|mic:%d|mich:%d|rht:%.0fs|dc:%t|wbs:%d|rbs:%d|fh2:%t|tlst:%.0fs|ect:%.0fs",
		c.ConnectTimeout.Seconds(),
		c.RequestTimeout.Seconds(),
		c.IdleConnTimeout.Seconds(),
		c.MaxIdleConns,
		c.MaxIdleConnsPerHost,
		c.ResponseHeaderTimeout.Seconds(),
		c.DisableCompression,
		c.WriteBufferSize,
		c.ReadBufferSize,
		c.ForceAttemptHTTP2,
		c.TLSHandshakeTimeout.Seconds(),
		c.ExpectContinueTimeout.Seconds(),
	)
}
