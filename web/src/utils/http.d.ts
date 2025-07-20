declare module "axios" {
    interface AxiosRequestConfig {
        hideMessage?: boolean;
    }
}
declare const http: import("axios").AxiosInstance;
export default http;
