import axios from "axios";

const BASE_URL = process.env.NIBSS_BASE_URL;

let cachedToken = null;
let tokenExpiresAt = 0;

async function login() {
    const { data } = await axios.post(`${BASE_URL}/api/auth/token`, {
        apiKey: process.env.NIBSS_API_KEY,
        apiSecret: process.env.NIBSS_API_SECRET,
    });

    cachedToken = data.token;
    tokenExpiresAt = Date.now() + 58 * 60 * 1000;
    return cachedToken;
}

async function getToken() {
    if (!cachedToken || Date.now() >= tokenExpiresAt) {
        await login();
    }
    return cachedToken;
}

const nibss = axios.create({ baseURL: BASE_URL });

nibss.interceptors.request.use(async (config) => {
    const token = await getToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});


nibss.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            cachedToken = null;
            const token = await getToken();
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return nibss(originalRequest);
        }
        return Promise.reject(error);
    }
);

export default nibss;