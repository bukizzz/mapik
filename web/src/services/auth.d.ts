export declare const useAuthKey: () => import("vue").Ref<string | null, string | null>;
export declare function useAuthService(): {
    login: (key: string) => Promise<boolean>;
    logout: () => void;
    checkLogin: () => boolean;
};
