package router

import (
	"MAPIK/internal/channel"
	"MAPIK/internal/handler"
	"MAPIK/internal/middleware"
	"MAPIK/internal/proxy"
	"MAPIK/internal/services"
	"MAPIK/internal/types"
	"embed"
	"io/fs"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"

	"github.com/gin-gonic/gin"
)

type embedFileSystem struct {
	http.FileSystem
}

func (e embedFileSystem) Exists(prefix string, path string) bool {
	_, err := e.Open(path)
	return err == nil
}

func EmbedFolder(fsEmbed embed.FS, targetPath string) static.ServeFileSystem {
	efs, err := fs.Sub(fsEmbed, targetPath)
	if err != nil {
		panic(err)
	}
	return embedFileSystem{
		FileSystem: http.FS(efs),
	}
}

func NewRouter(
	serverHandler *handler.Server,
	proxyServer *proxy.ProxyServer,
	configManager types.ConfigManager,
	groupManager *services.GroupManager,
	channelFactory *channel.Factory,
	buildFS embed.FS,
	indexPage []byte,
) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()

	// 注册全局中间件
	router.Use(middleware.Recovery())
	router.Use(middleware.ErrorHandler())
	router.Use(middleware.Logger(configManager.GetLogConfig()))
	router.Use(middleware.CORS(configManager.GetCORSConfig()))
	router.Use(middleware.RateLimiter(configManager.GetPerformanceConfig()))
	startTime := time.Now()
	router.Use(func(c *gin.Context) {
		c.Set("serverStartTime", startTime)
		c.Next()
	})

	// Registrujte rute
	registerSystemRoutes(router, serverHandler)
	registerAPIRoutes(router, serverHandler, configManager, groupManager, channelFactory)
	registerProxyRoutes(router, proxyServer, configManager, groupManager, channelFactory)
	registerFrontendRoutes(router, buildFS, indexPage)

	return router
}

// registerSystemRoutes registruje rute na nivou sistema
func registerSystemRoutes(router *gin.Engine, serverHandler *handler.Server) {
	router.GET("/health", serverHandler.Health)
}

// registerAPIRoutes registruje API rute
func registerAPIRoutes(
	router *gin.Engine,
	serverHandler *handler.Server,
	configManager types.ConfigManager,
	groupManager *services.GroupManager,
	channelFactory *channel.Factory,
) {
	api := router.Group("/api")
	authConfig := configManager.GetAuthConfig()

	// Javne
	registerPublicAPIRoutes(api, serverHandler)

	// Autentifikovane
	protectedAPI := api.Group("")
	protectedAPI.Use(middleware.Auth(authConfig, groupManager, channelFactory))
	registerProtectedAPIRoutes(protectedAPI, serverHandler)
}

// registerPublicAPIRoutes javne API rute
func registerPublicAPIRoutes(api *gin.RouterGroup, serverHandler *handler.Server) {
	api.POST("/auth/login", serverHandler.Login)
}

// registerProtectedAPIRoutes autentifikovane API rute
func registerProtectedAPIRoutes(api *gin.RouterGroup, serverHandler *handler.Server) {
	api.GET("/channel-types", serverHandler.CommonHandler.GetChannelTypes)

	groups := api.Group("/groups")
	{
		groups.POST("", serverHandler.CreateGroup)
		groups.GET("", serverHandler.ListGroups)
		groups.GET("/list", serverHandler.List)
		groups.GET("/config-options", serverHandler.GetGroupConfigOptions)
		groups.PUT("/:id", serverHandler.UpdateGroup)
		groups.DELETE("/:id", serverHandler.DeleteGroup)
		groups.GET("/:id/stats", serverHandler.GetGroupStats)
	}

	// Rute za upravljanje ključevima
	keys := api.Group("/keys")
	{
		keys.GET("", serverHandler.ListKeysInGroup)
		keys.GET("/export", serverHandler.ExportKeys)
		keys.POST("/add-multiple", serverHandler.AddMultipleKeys)
		keys.POST("/add-async", serverHandler.AddMultipleKeysAsync)
		keys.POST("/delete-multiple", serverHandler.DeleteMultipleKeys)
		keys.POST("/restore-multiple", serverHandler.RestoreMultipleKeys)
		keys.POST("/restore-all-invalid", serverHandler.RestoreAllInvalidKeys)
		keys.POST("/clear-all-invalid", serverHandler.ClearAllInvalidKeys)
		keys.POST("/validate-group", serverHandler.ValidateGroupKeys)
		keys.POST("/test-multiple", serverHandler.TestMultipleKeys)
	}

	// Zadaci
	api.GET("/tasks/status", serverHandler.GetTaskStatus)

	// Kontrolna tabla i logovi
	dashboard := api.Group("/dashboard")
	{
		dashboard.GET("/stats", serverHandler.Stats)
		dashboard.GET("/chart", serverHandler.Chart)
	}

	// Logovi
	logs := api.Group("/logs")
	{
		logs.GET("", serverHandler.GetLogs)
		logs.GET("/export", serverHandler.ExportLogs)
	}

	// Podešavanja
	settings := api.Group("/settings")
	{
		settings.GET("", serverHandler.GetSettings)
		settings.PUT("", serverHandler.UpdateSettings)
	}
}

// registerProxyRoutes registruje proxy rute
func registerProxyRoutes(
	router *gin.Engine,
	proxyServer *proxy.ProxyServer,
	configManager types.ConfigManager,
	groupManager *services.GroupManager,
	channelFactory *channel.Factory,
) {
	proxyGroup := router.Group("/proxy")
	authConfig := configManager.GetAuthConfig()

	proxyGroup.Use(middleware.Auth(authConfig, groupManager, channelFactory))

	proxyGroup.Any("/:group_name/*path", proxyServer.HandleProxy)
}

// registerFrontendRoutes registruje frontend rute
func registerFrontendRoutes(router *gin.Engine, buildFS embed.FS, indexPage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.NoMethod(func(c *gin.Context) {
		c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Method not allowed"})
	})

	router.Use(static.Serve("/", EmbedFolder(buildFS, "web/dist")))
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/proxy") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not Found"})
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}
