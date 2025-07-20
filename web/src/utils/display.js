/**
 * Formatira string iz camelCase, snake_case ili kebab-case
 * u čitljiviji format sa razmacima i velikim slovima.
 *
 * @param name Ulazni string.
 * @returns Formatirani string.
 *
 * @example
 * formatDisplayName("myGroupName")      // "My Group Name"
 * formatDisplayName("my_group_name")    // "My Group Name"
 * formatDisplayName("my-group-name")    // "My Group Name"
 * formatDisplayName("MyGroup")          // "My Group"
 */
export function formatDisplayName(name) {
    if (!name) {
        return "";
    }
    // Zamenite snake_case i kebab-case razmacima, i dodajte razmak pre velikih slova u camelCase.
    const result = name.replace(/[_-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
    // Kapitalizujte prvo slovo svake reči.
    return result
        .split(" ")
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
/**
 * Dobija prikazno ime za grupu, vraćajući formatiranu verziju njenog imena ako prikazno ime ne postoji.
 * @param group Objekat grupe.
 * @returns Prikazno ime za grupu.
 */
export function getGroupDisplayName(group) {
    return group.display_name || formatDisplayName(group.name);
}
/**
 * Maskira dugačak string ključa za prikaz.
 * @param key String ključa.
 * @returns Maskirani ključ.
 */
export function maskKey(key) {
    if (!key || key.length <= 8) {
        return key || "";
    }
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}
