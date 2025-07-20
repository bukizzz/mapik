import http from "@/utils/http";
import { useState } from "@/utils/state";
const AUTH_KEY = "authKey";
export const useAuthKey = () => {
    return useState(AUTH_KEY, () => null);
};
export function useAuthService() {
    const authKey = useAuthKey();
    const login = async (key) => {
        try {
            await http.post("/auth/login", { auth_key: key });
            localStorage.setItem(AUTH_KEY, key);
            authKey.value = key;
            return true;
        }
        catch (_error) {
            // 错误已记录
            return false;
        }
    };
    const logout = () => {
        localStorage.removeItem(AUTH_KEY);
        authKey.value = null;
    };
    const checkLogin = () => {
        if (authKey.value) {
            return true;
        }
        const key = localStorage.getItem(AUTH_KEY);
        if (key) {
            authKey.value = key;
        }
        return !!authKey.value;
    };
    return {
        login,
        logout,
        checkLogin,
    };
}
