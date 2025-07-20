package models

// SystemSettingInfo predstavlja detaljne informacije o sistemskoj konfiguraciji (za API povratak)
type SystemSettingInfo struct {
	Key          string   `json:"key"`
	Name         string   `json:"name"`
	Value        any      `json:"value"`
	Type         string   `json:"type"` // "int", "bool", "string"
	DefaultValue any      `json:"default_value"`
	Description  string   `json:"description"`
	Category     string   `json:"category"`
	MinValue     *int     `json:"min_value,omitempty"`
}

// CategorizedSettings lista podešavanja grupisana po kategorijama
type CategorizedSettings struct {
	CategoryName string              `json:"category_name"`
	Settings     []SystemSettingInfo `json:"settings"`
}
