package errors

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-sql-driver/mysql"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

// APIError definiše standardnu strukturu greške za API odgovore.
type APIError struct {
	HTTPStatus int
	Code       string
	Message    string
}

// Error implementira interfejs greške.
func (e *APIError) Error() string {
	return e.Message
}

// Predefinisane API greške
var (
	ErrBadRequest         = &APIError{HTTPStatus: http.StatusBadRequest, Code: "BAD_REQUEST", Message: "Nevažeći parametri zahteva"}
	ErrInvalidJSON        = &APIError{HTTPStatus: http.StatusBadRequest, Code: "INVALID_JSON", Message: "Nevažeći JSON format"}
	ErrValidation         = &APIError{HTTPStatus: http.StatusBadRequest, Code: "VALIDATION_FAILED", Message: "Validacija unosa nije uspela"}
	ErrDuplicateResource  = &APIError{HTTPStatus: http.StatusConflict, Code: "DUPLICATE_RESOURCE", Message: "Resurs već postoji"}
	ErrResourceNotFound   = &APIError{HTTPStatus: http.StatusNotFound, Code: "NOT_FOUND", Message: "Resurs nije pronađen"}
	ErrInternalServer     = &APIError{HTTPStatus: http.StatusInternalServerError, Code: "INTERNAL_SERVER_ERROR", Message: "Došlo je do neočekivane greške"}
	ErrDatabase           = &APIError{HTTPStatus: http.StatusInternalServerError, Code: "DATABASE_ERROR", Message: "Operacija baze podataka nije uspela"}
	ErrUnauthorized       = &APIError{HTTPStatus: http.StatusUnauthorized, Code: "UNAUTHORIZED", Message: "Autentifikacija nije uspela"}
	ErrForbidden          = &APIError{HTTPStatus: http.StatusForbidden, Code: "FORBIDDEN", Message: "Nemate dozvolu za pristup ovom resursu"}
	ErrTaskInProgress     = &APIError{HTTPStatus: http.StatusConflict, Code: "TASK_IN_PROGRESS", Message: "Zadatak je već u toku"}
	ErrBadGateway         = &APIError{HTTPStatus: http.StatusBadGateway, Code: "BAD_GATEWAY", Message: "Greška uzvodnog servisa"}
	ErrNoActiveKeys       = &APIError{HTTPStatus: http.StatusServiceUnavailable, Code: "NO_ACTIVE_KEYS", Message: "Nema aktivnih API ključeva dostupnih za ovu grupu"}
	ErrMaxRetriesExceeded = &APIError{HTTPStatus: http.StatusBadGateway, Code: "MAX_RETRIES_EXCEEDED", Message: "Zahtev nije uspeo nakon maksimalnog broja ponovnih pokušaja"}
	ErrNoKeysAvailable    = &APIError{HTTPStatus: http.StatusServiceUnavailable, Code: "NO_KEYS_AVAILABLE", Message: "Nema dostupnih API ključeva za obradu zahteva"}
)

// NewAPIError kreira novu APIError sa prilagođenom porukom.
func NewAPIError(base *APIError, message string) *APIError {
	return &APIError{
		HTTPStatus: base.HTTPStatus,
		Code:       base.Code,
		Message:    message,
	}
}

// NewAPIErrorWithUpstream kreira novu APIError posebno za obmotavanje sirovih uzvodnih grešaka.
func NewAPIErrorWithUpstream(statusCode int, code string, upstreamMessage string) *APIError {
	return &APIError{
		HTTPStatus: statusCode,
		Code:       code,
		Message:    upstreamMessage,
	}
}

// ParseDBError inteligentno konvertuje GORM grešku u standardnu APIError.
func ParseDBError(err error) *APIError {
	if err == nil {
		return nil
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrResourceNotFound
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		if pgErr.Code == "23505" { // unique_violation
			return ErrDuplicateResource
		}
	}

	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) {
		if mysqlErr.Number == 1062 { // Duplicate entry
			return ErrDuplicateResource
		}
	}

	// Generička provera za SQLite
	if strings.Contains(strings.ToLower(err.Error()), "unique constraint failed") {
		return ErrDuplicateResource
	}

	return ErrDatabase
}
