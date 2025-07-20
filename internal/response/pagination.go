package response

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const (
	DefaultPageSize = 15
	MaxPageSize     = 1000
)

// Pagination predstavlja detalje paginacije u odgovoru.
type Pagination struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalItems int64 `json:"total_items"`
	TotalPages int   `json:"total_pages"`
}

// PaginatedResponse je standardna struktura za sve paginirane API odgovore.
type PaginatedResponse struct {
	Items      any        `json:"items"`
	Pagination Pagination `json:"pagination"`
}

// Paginate vrši paginaciju na GORM upitu i vraća standardizovani odgovor.
// Prihvata Gin kontekst, GORM query builder i odredišni slice za rezultate.
func Paginate(c *gin.Context, query *gorm.DB, dest any) (*PaginatedResponse, error) {
	// 1. Preuzmite stranicu i veličinu stranice iz parametara upita
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(DefaultPageSize)))
	if err != nil || pageSize <= 0 {
		pageSize = DefaultPageSize
	}
	if pageSize > MaxPageSize {
		pageSize = MaxPageSize
	}

	// 2. Preuzmite ukupan broj stavki
	var totalItems int64
	if err := query.Count(&totalItems).Error; err != nil {
		return nil, err
	}

	// 3. Izračunajte offset i ukupan broj stranica
	offset := (page - 1) * pageSize
	totalPages := int(math.Ceil(float64(totalItems) / float64(pageSize)))

	// 4. Preuzmite podatke za trenutnu stranicu
	if err := query.Limit(pageSize).Offset(offset).Find(dest).Error; err != nil {
		return nil, err
	}

	// 5. Konstruišite paginirani odgovor
	paginatedData := &PaginatedResponse{
		Items: dest,
		Pagination: Pagination{
			Page:       page,
			PageSize:   pageSize,
			TotalItems: totalItems,
			TotalPages: totalPages,
		},
	}

	return paginatedData, nil
}
