import axios from "axios";
const CACHE_KEY = "MAPIK-version-info";
const CACHE_DURATION = 30 * 60 * 1000;
class VersionService {
    currentVersion;
    constructor() {
        this.currentVersion = import.meta.env.VITE_VERSION || "1.0.0";
    }
    /**
     * Dohvata keširane informacije o verziji
     */
    getCachedVersionInfo() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) {
                return null;
            }
            const versionInfo = JSON.parse(cached);
            const now = Date.now();
            // Proverava da li je keš istekao
            if (now - versionInfo.lastCheckTime > CACHE_DURATION) {
                return null;
            }
            // Proverava da li se verzija u kešu poklapa sa trenutnom verzijom aplikacije
            if (versionInfo.currentVersion !== this.currentVersion) {
                this.clearCache();
                return null;
            }
            return versionInfo;
        }
        catch (error) {
            console.warn("Neuspešno parsiranje keširanih informacija o verziji:", error);
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    }
    /**
     * Kešira informacije o verziji
     */
    setCachedVersionInfo(versionInfo) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(versionInfo));
        }
        catch (error) {
            console.warn("Neuspešno keširanje informacija o verziji:", error);
        }
    }
    /**
     * Poredi verzije (jednostavno semantičko poređenje verzija)
     */
    compareVersions(current, latest) {
        const currentParts = current.replace(/^v/, "").split(".").map(Number);
        const latestParts = latest.replace(/^v/, "").split(".").map(Number);
        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const latestPart = latestParts[i] || 0;
            if (currentPart < latestPart) {
                return -1;
            }
            if (currentPart > latestPart) {
                return 1;
            }
        }
        return 0;
    }
    /**
     * Dohvata najnoviju verziju sa GitHub API-ja
     */
    async fetchLatestVersion() {
        try {
            const response = await axios.get("https://api.github.com/repos/bukizzz/MAPIK/releases/latest", {
                timeout: 10000,
                headers: {
                    Accept: "application/vnd.github.v3+json",
                },
            });
            if (response.status === 200 && response.data) {
                return response.data;
            }
            return null;
        }
        catch (error) {
            console.warn("Neuspešno dohvatanje najnovije verzije sa GitHub-a:", error);
            return null;
        }
    }
    /**
     * Proverava ažuriranja verzije
     */
    async checkForUpdates() {
        // Prvo proverava keš
        const cached = this.getCachedVersionInfo();
        if (cached) {
            return cached;
        }
        // Kreira početno stanje
        const versionInfo = {
            currentVersion: this.currentVersion,
            latestVersion: null,
            isLatest: false,
            hasUpdate: false,
            releaseUrl: null,
            lastCheckTime: Date.now(),
            status: "checking",
        };
        try {
            const release = await this.fetchLatestVersion();
            if (release) {
                const comparison = this.compareVersions(this.currentVersion, release.tag_name);
                versionInfo.latestVersion = release.tag_name;
                versionInfo.releaseUrl = release.html_url;
                versionInfo.isLatest = comparison >= 0;
                versionInfo.hasUpdate = comparison < 0;
                versionInfo.status = comparison < 0 ? "update-available" : "latest";
                // Kešira rezultat samo u slučaju uspeha
                this.setCachedVersionInfo(versionInfo);
            }
            else {
                versionInfo.status = "error";
            }
        }
        catch (error) {
            console.warn("Provera verzije neuspešna:", error);
            versionInfo.status = "error";
        }
        return versionInfo;
    }
    /**
     * Dohvata trenutni broj verzije
     */
    getCurrentVersion() {
        return this.currentVersion;
    }
    /**
     * Briše keš
     */
    clearCache() {
        localStorage.removeItem(CACHE_KEY);
    }
}
export const versionService = new VersionService();
