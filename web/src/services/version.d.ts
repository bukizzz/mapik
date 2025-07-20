export interface GitHubRelease {
    tag_name: string;
    html_url: string;
    published_at: string;
    name: string;
}
export interface VersionInfo {
    currentVersion: string;
    latestVersion: string | null;
    isLatest: boolean;
    hasUpdate: boolean;
    releaseUrl: string | null;
    lastCheckTime: number;
    status: "checking" | "latest" | "update-available" | "error";
}
declare class VersionService {
    private currentVersion;
    constructor();
    /**
     * Dohvata keširane informacije o verziji
     */
    private getCachedVersionInfo;
    /**
     * Kešira informacije o verziji
     */
    private setCachedVersionInfo;
    /**
     * Poredi verzije (jednostavno semantičko poređenje verzija)
     */
    private compareVersions;
    /**
     * Dohvata najnoviju verziju sa GitHub API-ja
     */
    private fetchLatestVersion;
    /**
     * Proverava ažuriranja verzije
     */
    checkForUpdates(): Promise<VersionInfo>;
    /**
     * Dohvata trenutni broj verzije
     */
    getCurrentVersion(): string;
    /**
     * Briše keš
     */
    clearCache(): void;
}
export declare const versionService: VersionService;
export {};
