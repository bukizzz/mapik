package errors

import (
	"strings"
)

// ignorableErrorSubstrings sadrži listu podstringova koji ukazuju da se greška
// može bezbedno ignorisati. One se obično javljaju kada se klijent prerano isključi.
var ignorableErrorSubstrings = []string{
	"context canceled",
	"connection reset by peer",
	"broken pipe",
	"use of closed network connection",
	"request canceled",
}

// IsIgnorableError proverava da li je data greška uobičajena, nekritična greška
// koja se može javiti kada se klijent isključi. Ovo se koristi za sprečavanje logovanja
// nepotrebnih grešaka i za izbegavanje označavanja ključeva kao neuspelih zbog problema na strani klijenta.
func IsIgnorableError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	for _, sub := range ignorableErrorSubstrings {
		if strings.Contains(errStr, sub) {
			return true
		}
	}
	return false
}
