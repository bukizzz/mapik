import type { Group } from "@/types/models";
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
export declare function formatDisplayName(name: string): string;
/**
 * Dobija prikazno ime za grupu, vraćajući formatiranu verziju njenog imena ako prikazno ime ne postoji.
 * @param group Objekat grupe.
 * @returns Prikazno ime za grupu.
 */
export declare function getGroupDisplayName(group: Group): string;
/**
 * Maskira dugačak string ključa za prikaz.
 * @param key String ključa.
 * @returns Maskirani ključ.
 */
export declare function maskKey(key: string): string;
