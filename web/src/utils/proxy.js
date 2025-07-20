import axios from "axios";
const proxy = axios.create({
    baseURL: "/proxy",
    timeout: 60000,
    headers: { "Content-Type": "application/json" },
});
proxy.interceptors.request.use(config => {
    const authKey = localStorage.getItem("authKey");
    if (authKey) {
        config.headers.Authorization = `Bearer ${authKey}`;
    }
    return config;
});
proxy.interceptors.response.use(response => response.data, error => {
    if (error.response) {
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
export default proxy;
