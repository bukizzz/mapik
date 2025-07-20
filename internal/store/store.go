package store

import (
	"errors"
	"time"
)

// ErrNotFound je greška koja se vraća kada ključ nije pronađen u skladištu.
var ErrNotFound = errors.New("store: key not found")

// Message je struktura za primljene pub/sub poruke.
type Message struct {
	Channel string
	Payload []byte
}

// Subscription predstavlja aktivnu pretplatu na pub/sub kanal.
type Subscription interface {
	Channel() <-chan *Message
	Close() error
}

// Store je generički interfejs za skladište ključ-vrednost.
type Store interface {
	// Set čuva par ključ-vrednost sa opcionalnim TTL-om.
	Set(key string, value []byte, ttl time.Duration) error

	// Get preuzima vrednost po ključu.
	Get(key string) ([]byte, error)

	// Delete uklanja vrednost po ključu.
	Delete(key string) error

	// Del briše više ključeva.
	Del(keys ...string) error

	// Exists proverava da li ključ postoji u skladištu.
	Exists(key string) (bool, error)

	// SetNX postavlja par ključ-vrednost ako ključ već ne postoji.
	SetNX(key string, value []byte, ttl time.Duration) (bool, error)

	// HASH operacije
	HSet(key string, values map[string]any) error
	HGetAll(key string) (map[string]string, error)
	HIncrBy(key, field string, incr int64) (int64, error)

	// LIST operacije
	LPush(key string, values ...any) error
	LRem(key string, count int64, value any) error
	Rotate(key string) (string, error)

	// SET operacije
	SAdd(key string, members ...any) error
	SPopN(key string, count int64) ([]string, error)

	// Close zatvara skladište i oslobađa sve resurse.
	Close() error

	// Publish šalje poruku na dati kanal.
	Publish(channel string, message []byte) error

	// Subscribe sluša poruke na datom kanalu.
	Subscribe(channel string) (Subscription, error)
}

// Pipeliner definiše interfejs za izvršavanje serije komandi.
type Pipeliner interface {
	HSet(key string, values map[string]any)
	Exec() error
}

// RedisPipeliner je opcioni interfejs koji Store može implementirati za pružanje pipelining-a.
type RedisPipeliner interface {
	Pipeline() Pipeliner
}
