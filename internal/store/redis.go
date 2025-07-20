package store

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisStore je skladište ključ-vrednost podržano Redisom.
type RedisStore struct {
	client *redis.Client
}

// NewRedisStore kreira novu instancu RedisStore-a.
func NewRedisStore(client *redis.Client) *RedisStore {
	return &RedisStore{client: client}
}

// Set čuva par ključ-vrednost u Redisu.
func (s *RedisStore) Set(key string, value []byte, ttl time.Duration) error {
	return s.client.Set(context.Background(), key, value, ttl).Err()
}

// Get preuzima vrednost iz Redisa.
func (s *RedisStore) Get(key string) ([]byte, error) {
	val, err := s.client.Get(context.Background(), key).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return val, nil
}

// Delete uklanja vrednost iz Redisa.
func (s *RedisStore) Delete(key string) error {
	return s.client.Del(context.Background(), key).Err()
}

// Del uklanja više vrednosti iz Redisa.
func (s *RedisStore) Del(keys ...string) error {
	if len(keys) == 0 {
		return nil
	}
	return s.client.Del(context.Background(), keys...).Err()
}

// Exists proverava da li ključ postoji u Redisu.
func (s *RedisStore) Exists(key string) (bool, error) {
	val, err := s.client.Exists(context.Background(), key).Result()
	if err != nil {
		return false, err
	}
	return val > 0, nil
}

// SetNX postavlja par ključ-vrednost u Redisu ako ključ već ne postoji.
func (s *RedisStore) SetNX(key string, value []byte, ttl time.Duration) (bool, error) {
	return s.client.SetNX(context.Background(), key, value, ttl).Result()
}

// Close zatvara vezu Redis klijenta.
func (s *RedisStore) Close() error {
	return s.client.Close()
}

// --- HASH operacije ---

func (s *RedisStore) HSet(key string, values map[string]any) error {
	return s.client.HSet(context.Background(), key, values).Err()
}

func (s *RedisStore) HGetAll(key string) (map[string]string, error) {
	return s.client.HGetAll(context.Background(), key).Result()
}

func (s *RedisStore) HIncrBy(key, field string, incr int64) (int64, error) {
	return s.client.HIncrBy(context.Background(), key, field, incr).Result()
}

// --- LIST operacije ---

func (s *RedisStore) LPush(key string, values ...any) error {
	return s.client.LPush(context.Background(), key, values...).Err()
}

func (s *RedisStore) LRem(key string, count int64, value any) error {
	return s.client.LRem(context.Background(), key, count, value).Err()
}

func (s *RedisStore) Rotate(key string) (string, error) {
	val, err := s.client.RPopLPush(context.Background(), key, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return "", ErrNotFound
		}
		return "", err
	}
	return val, nil
}

// --- SET operacije ---

func (s *RedisStore) SAdd(key string, members ...any) error {
	return s.client.SAdd(context.Background(), key, members...).Err()
}

func (s *RedisStore) SPopN(key string, count int64) ([]string, error) {
	return s.client.SPopN(context.Background(), key, count).Result()
}

// --- Implementacija Pipeliner-a ---

type redisPipeliner struct {
	pipe redis.Pipeliner
}

// HSet dodaje HSET komandu u pipeline.
func (p *redisPipeliner) HSet(key string, values map[string]any) {
	p.pipe.HSet(context.Background(), key, values)
}

// Exec izvršava sve komande u pipeline-u.
func (p *redisPipeliner) Exec() error {
	_, err := p.pipe.Exec(context.Background())
	return err
}

// Pipeline kreira novi pipeline.
func (s *RedisStore) Pipeline() Pipeliner {
	return &redisPipeliner{
		pipe: s.client.Pipeline(),
	}
}

// --- Pub/Sub operacije ---

// redisSubscription omotava redis.PubSub za implementaciju interfejsa Subscription.
type redisSubscription struct {
	pubsub  *redis.PubSub
	msgChan chan *Message
	once    sync.Once
}

// Channel vraća kanal koji prima poruke iz pretplate.
func (rs *redisSubscription) Channel() <-chan *Message {
	rs.once.Do(func() {
		rs.msgChan = make(chan *Message, 10)
		go func() {
			defer close(rs.msgChan)
			for redisMsg := range rs.pubsub.Channel() {
				rs.msgChan <- &Message{
					Channel: redisMsg.Channel,
					Payload: []byte(redisMsg.Payload),
				}
			}
		}()
	})
	return rs.msgChan
}

// Close zatvara pretplatu.
func (rs *redisSubscription) Close() error {
	return rs.pubsub.Close()
}

// Publish šalje poruku na dati kanal.
func (s *RedisStore) Publish(channel string, message []byte) error {
	return s.client.Publish(context.Background(), channel, message).Err()
}

// Subscribe sluša poruke na datom kanalu.
func (s *RedisStore) Subscribe(channel string) (Subscription, error) {
	pubsub := s.client.Subscribe(context.Background(), channel)

	_, err := pubsub.Receive(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to subscribe to channel %s: %w", channel, err)
	}

	return &redisSubscription{pubsub: pubsub}, nil
}
