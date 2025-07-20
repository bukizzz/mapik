package utils

import "fmt"

// MaskAPIKey maskira API ključ za bezbedno logovanje.
func MaskAPIKey(key string) string {
	length := len(key)
	if length <= 8 {
		return key
	}
	return fmt.Sprintf("%s****%s", key[:4], key[length-4:])
}

// TruncateString skraćuje string na maksimalnu dužinu.
func TruncateString(s string, maxLength int) string {
	if len(s) > maxLength {
		return s[:maxLength]
	}
	return s
}
