/**
 * Kopirajte tekst
 */
export async function copy(text: string): Promise<boolean> {
  // navigator.clipboard je dostupan samo u sigurnom kontekstu (HTTPS) ili na localhostu
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error("Kopiranje pomoću navigator.clipboard nije uspelo:", e);
    }
  }

  // Rezervna opcija: koristite zastareli, ali kompatibilniji execCommand
  try {
    const input = document.createElement("input");
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.value = text;
    document.body.appendChild(input);
    input.select();
    const result = document.execCommand("copy");
    document.body.removeChild(input);

    if (!result) {
      console.error("Kopiranje pomoću execCommand nije uspelo");
      return false;
    }
    return true;
  } catch (e) {
    console.error("Došlo je do greške prilikom izvršavanja rezervne metode kopiranja:", e);
    return false;
  }
}
