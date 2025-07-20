import axios from "axios";

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

const CACHE_KEY = "MAPIK-version-info";
const CACHE_DURATION = 30 * 60 * 1000;

class VersionService {
  private currentVersion: string;

  constructor() {
    this.currentVersion = import.meta.env.VITE_VERSION || "1.0.0";
  }

  /**
   * Dohvata keširane informacije o verziji
   */
  private getCachedVersionInfo(): VersionInfo | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return null;
      }

      const versionInfo: VersionInfo = JSON.parse(cached);
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
    } catch (error) {
      console.warn("Neuspešno parsiranje keširanih informacija o verziji:", error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  /**
   * Kešira informacije o verziji
   */
  private setCachedVersionInfo(versionInfo: VersionInfo): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(versionInfo));
    } catch (error) {
      console.warn("Neuspešno keširanje informacija o verziji:", error);
    }
  }

  /**
   * Poredi verzije (jednostavno semantičko poređenje verzija)
   */
  private compareVersions(current: string, latest: string): number {
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
  private async fetchLatestVersion(): Promise<GitHubRelease | null> {
    try {
      const response = await axios.get(
        "https://api.github.com/repos/bukizzz/MAPIK/releases/latest",
        {
          timeout: 10000,
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (response.status === 200 && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.warn("Neuspešno dohvatanje najnovije verzije sa GitHub-a:", error);
      return null;
    }
  }

  /**
   * Proverava ažuriranja verzije
   */
  async checkForUpdates(): Promise<VersionInfo> {
    // Prvo proverava keš
    const cached = this.getCachedVersionInfo();
    if (cached) {
      return cached;
    }

    // Kreira početno stanje
    const versionInfo: VersionInfo = {
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
      } else {
        versionInfo.status = "error";
      }
    } catch (error) {
      console.warn("Provera verzije neuspešna:", error);
      versionInfo.status = "error";
    }

    return versionInfo;
  }

  /**
   * Dohvata trenutni broj verzije
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Briše keš
   */
  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
}

export const versionService = new VersionService();
