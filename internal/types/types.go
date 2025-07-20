package types

// ConfigManager definiše interfejs za upravljanje konfiguracijom
type ConfigManager interface {
	IsMaster() bool
	GetAuthConfig() AuthConfig
	GetCORSConfig() CORSConfig
	GetPerformanceConfig() PerformanceConfig
	GetLogConfig() LogConfig
	GetDatabaseConfig() DatabaseConfig
	GetEffectiveServerConfig() ServerConfig
	GetRedisDSN() string
	Validate() error
	DisplayServerConfig()
	ReloadConfig() error
}

// SystemSettings definiše sve stavke sistemske konfiguracije
type SystemSettings struct {
	// Opšta podešavanja
	AppUrl                         string `json:"app_url" default:"http://localhost:3001" name:"appUrl" category:"General" desc:"The base URL of the project, used to concatenate group endpoint addresses. System configuration takes precedence over the APP_URL environment variable."`
	RequestLogRetentionDays        int    `json:"request_log_retention_days" default:"7" name:"logRetentionDays" category:"General" desc:"The number of days to retain request logs in the database. 0 means no cleanup." validate:"min=0"`
	RequestLogWriteIntervalMinutes int    `json:"request_log_write_interval_minutes" default:"1" name:"logWriteIntervalMinutes" category:"General" desc:"The interval in minutes for writing request logs from cache to the database. 0 means real-time writing." validate:"min=0"`

	// Podešavanja zahteva
	RequestTimeout        int `json:"request_timeout" default:"600" name:"requestTimeout" category:"Request" desc:"The timeout for the entire lifecycle of a forwarded request in seconds." validate:"min=1"`
	ConnectTimeout        int `json:"connect_timeout" default:"15" name:"connectTimeout" category:"Request" desc:"The timeout for establishing a new connection with the upstream service in seconds." validate:"min=1"`
	IdleConnTimeout       int `json:"idle_conn_timeout" default:"120" name:"idleConnTimeout" category:"Request" desc:"The timeout for idle connections in the HTTP client in seconds." validate:"min=1"`
	ResponseHeaderTimeout int `json:"response_header_timeout" default:"600" name:"responseHeaderTimeout" category:"Request" desc:"The maximum time to wait for the upstream service's response headers in seconds." validate:"min=1"`
	MaxIdleConns          int `json:"max_idle_conns" default:"100" name:"maxIdleConns" category:"Request" desc:"The maximum number of idle connections allowed in the HTTP client's connection pool." validate:"min=1"`
	MaxIdleConnsPerHost   int `json:"max_idle_conns_per_host" default:"50" name:"maxIdleConnsPerHost" category:"Request" desc:"The maximum number of idle connections allowed for each upstream host in the HTTP client's connection pool." validate:"min=1"`

	// Podešavanja ključa
	MaxRetries                   int `json:"max_retries" default:"3" name:"maxRetries" category:"Key" desc:"The maximum number of retries for a single request using different keys. 0 means no retries." validate:"min=0"`
	BlacklistThreshold           int `json:"blacklist_threshold" default:"3" name:"blacklistThreshold" category:"Key" desc:"The number of consecutive failures for a key to be blacklisted. 0 means no blacklisting." validate:"min=0"`
	KeyValidationIntervalMinutes int `json:"key_validation_interval_minutes" default:"60" name:"keyValidationIntervalMinutes" category:"Key" desc:"The default interval in minutes for background key validation." validate:"min=30"`
	KeyValidationConcurrency     int `json:"key_validation_concurrency" default:"10" name:"keyValidationConcurrency" category:"Key" desc:"The number of concurrent validations for invalid keys in the background." validate:"min=1"`
	KeyValidationTimeoutSeconds  int `json:"key_validation_timeout_seconds" default:"20" name:"keyValidationTimeoutSeconds" category:"Key" desc:"The API request timeout in seconds for a single key validation in the background." validate:"min=5"`
}

// ServerConfig predstavlja konfiguraciju servera
type ServerConfig struct {
	Port                    int    `json:"port"`
	Host                    string `json:"host"`
	IsMaster                bool   `json:"is_master"`
	ReadTimeout             int    `json:"read_timeout"`
	WriteTimeout            int    `json:"write_timeout"`
	IdleTimeout             int    `json:"idle_timeout"`
	GracefulShutdownTimeout int    `json:"graceful_shutdown_timeout"`
}

// AuthConfig predstavlja konfiguraciju autentifikacije
type AuthConfig struct {
	Key string `json:"key"`
}

// CORSConfig predstavlja CORS konfiguraciju
type CORSConfig struct {
	Enabled          bool     `json:"enabled"`
	AllowedOrigins   []string `json:"allowed_origins"`
	AllowedMethods   []string `json:"allowed_methods"`
	AllowedHeaders   []string `json:"allowed_headers"`
	AllowCredentials bool     `json:"allow_credentials"`
}

// PerformanceConfig predstavlja konfiguraciju performansi
type PerformanceConfig struct {
	MaxConcurrentRequests int `json:"max_concurrent_requests"`
}

// LogConfig predstavlja konfiguraciju logovanja
type LogConfig struct {
	Level      string `json:"level"`
	Format     string `json:"format"`
	EnableFile bool   `json:"enable_file"`
	FilePath   string `json:"file_path"`
}

// DatabaseConfig predstavlja konfiguraciju baze podataka
type DatabaseConfig struct {
	DSN string `json:"dsn"`
}

type RetryError struct {
	StatusCode         int    `json:"status_code"`
	ErrorMessage       string `json:"error_message"`
	ParsedErrorMessage string `json:"-"`
	KeyValue           string `json:"key_value"`
	Attempt            int    `json:"attempt"`
	UpstreamAddr       string `json:"-"`
}
