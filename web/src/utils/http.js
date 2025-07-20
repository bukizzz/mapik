import { useAuthService } from "@/services/auth";
import axios from "axios";
import { appState } from "./app-state";
// Definišite listu API adresa za koje ne treba prikazivati učitavanje
const noLoadingUrls = ["/tasks/status"];
const http = axios.create({
    baseURL: "/api",
    timeout: 60000,
    headers: { "Content-Type": "application/json" },
});
// Interceptor zahteva
http.interceptors.request.use(config => {
    // Proverite da li je URL trenutnog zahteva na listi za blokiranje
    if (config.url && !noLoadingUrls.includes(config.url)) {
        appState.loading = true;
    }
    const authKey = localStorage.getItem("authKey");
    if (authKey) {
        config.headers.Authorization = `Bearer ${authKey}`;
    }
    return config;
});
// Interceptor odgovora
http.interceptors.response.use(response => {
    appState.loading = false;
    if (response.config.method !== "get" && !response.config.hideMessage) {
        window.$message.success(response.data.message ?? "Operacija uspešna");
    }
    return response.data;
}, error => {
    appState.loading = false;
    if (error.response) {
        if (error.response.status === 401) {
            if (window.location.pathname !== "/login") {
                const { logout } = useAuthService();
                logout();
                window.location.href = "/login";
            }
        }
        window.$message.error(error.response.data?.message || `Zahtev neuspešan: ${error.response.status}`, {
            keepAliveOnHover: true,
            duration: 5000,
            closable: true,
        });
    }
    else if (error.request) {
        window.$message.error("Greška mreže, proverite svoju vezu");
    }
    else {
        window.$message.error("Greška u podešavanju zahteva");
    }
    return Promise.reject(error);
});
export default http;
