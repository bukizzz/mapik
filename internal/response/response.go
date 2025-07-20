// Paket response pruža standardizovane pomoćne funkcije za JSON odgovor.
package response

import (
	app_errors "MAPIK/internal/errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// SuccessResponse definiše standardnu strukturu JSON odgovora za uspeh.
type SuccessResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

// ErrorResponse definiše standardnu strukturu JSON odgovora za grešku.
type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Success šalje standardizovani odgovor za uspeh.
func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, SuccessResponse{
		Code:    0,
		Message: "Success",
		Data:    data,
	})
}

// Error šalje standardizovani odgovor za grešku koristeći APIError.
func Error(c *gin.Context, apiErr *app_errors.APIError) {
	c.JSON(apiErr.HTTPStatus, ErrorResponse{
		Code:    apiErr.Code,
		Message: apiErr.Message,
	})
}
