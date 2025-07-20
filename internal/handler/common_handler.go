package handler

import (
	"MAPIK/internal/channel"
	"MAPIK/internal/response"

	"github.com/gin-gonic/gin"
)

// CommonHandler obrađuje uobičajene zahteve koji nisu grupisani.
type CommonHandler struct{}

// NewCommonHandler kreira novi CommonHandler.
func NewCommonHandler() *CommonHandler {
	return &CommonHandler{}
}

// GetChannelTypes vraća listu dostupnih tipova kanala.
func (h *CommonHandler) GetChannelTypes(c *gin.Context) {
	channelTypes := channel.GetChannels()
	response.Success(c, channelTypes)
}
