// proxy.js
import cors_anywhere from 'cors-anywhere';

const host = 'localhost';
const port = 8080;

cors_anywhere.createServer({
    originWhitelist: [], // Cho phép tất cả các nguồn trong môi trường dev
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, () => {
    console.log(`\x1b[32m%s\x1b[0m`, `[CORS Proxy] Đang chạy tại: http://${host}:${port}/`);
    console.log(`[CORS Proxy] Sử dụng prefix này để né CORS trong môi trường dev.`);
});
