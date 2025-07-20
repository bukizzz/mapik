package proxy

import (
	"bufio"
	"net/http"

	"io"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func (ps *ProxyServer) handleStreamingResponse(c *gin.Context, resp *http.Response) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		logrus.Error("Strimovanje nije podržano od strane pisca, vraćanje na normalan odgovor")
		ps.handleNormalResponse(c, resp)
		return
	}

	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		select {
		case <-c.Request.Context().Done():
			logrus.Debugf("Klijent se isključio, zatvaranje strima.")
			return
		default:
		}

		if _, err := c.Writer.Write(scanner.Bytes()); err != nil {
			logUpstreamError("pisanje strima klijentu", err)
			return
		}
		if _, err := c.Writer.Write([]byte("\n")); err != nil {
			logUpstreamError("pisanje novog reda strima klijentu", err)
			return
		}
		flusher.Flush()
	}

	if err := scanner.Err(); err != nil {
		logUpstreamError("čitanje iz uzvodnog skenera", err)
	}
}

func (ps *ProxyServer) handleNormalResponse(c *gin.Context, resp *http.Response) {
	if _, err := io.Copy(c.Writer, resp.Body); err != nil {
		logUpstreamError("kopiranje tela odgovora", err)
	}
}
