# MAPIK - Upravljanje API ključevima

MAPIK je alat za upravljanje API ključevima koji omogućava centralizovano skladištenje, validaciju i rotaciju API ključeva.

## Karakteristike

- **Centralizovano skladištenje:** Svi vaši API ključevi na jednom mestu.
- **Validacija ključeva:** Automatska provera ispravnosti ključeva.
- **Rotacija ključeva:** Podrška za rotaciju ključeva radi poboljšanja sigurnosti.
- **Jednostavno korišćenje:** Intuitivan interfejs za lako upravljanje.

## Instalacija

### Korišćenje Docker-a

Najlakši način za pokretanje MAPIK-a je korišćenjem Docker-a i Docker Compose-a.

1. Klonirajte repozitorijum:

   ```bash
   git clone https://github.com/bukizzz/MAPIK.git
   cd MAPIK
   ```

2. Izgradite Docker sliku:

   ```bash
   docker build . -t MAPIK:0.1.0 --build-arg AUTHOR=bukizzz
   ```

3. Pokrenite aplikaciju pomoću Docker Compose-a:
   ```bash
   docker-compose up -d
   ```

Aplikacija će biti dostupna na `http://localhost:3001`.

## Korišćenje

Nakon pokretanja, možete pristupiti MAPIK interfejsu putem vašeg veb pregledača. Prijavite se sa podrazumevanim akreditivima (admin/admin) i počnite da upravljate svojim API ključevima.

## Doprinos

Pozdravljamo sve doprinose! Ako želite da doprinesete, molimo vas da pratite sledeće korake:

1. Forkujte repozitorijum.
2. Kreirajte novu granu (`git checkout -b feature/nova-funkcionalnost`).
3. Napravite svoje izmene.
4. Komitujte svoje izmene (`git commit -m 'Dodaj novu funkcionalnost'`).
5. Pošaljite izmene na svoju granu (`git push origin feature/nova-funkcionalnost`).
6. Otvorite Pull Request.

## Licenca

Ovaj projekat je licenciran pod MIT licencom. Pogledajte `LICENSE` datoteku za više detalja.

## Zahvalnice

Ovaj projekat je inspirisan i koristi delove koda iz `gpt-load` projekta od `tbphp`.
