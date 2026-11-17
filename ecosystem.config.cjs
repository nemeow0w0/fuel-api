// PM2 config — ใช้ไฟล์ .cjs เพราะ package.json ตั้ง "type": "module"
module.exports = {
    apps: [
        {
            name: "fuel-api",
            script: "index.js",
            exec_mode: "fork",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "300M",
            time: true, // ใส่เวลาหน้าแต่ละบรรทัดใน log
            env: {
                NODE_ENV: "development",
                PORT: 8789,
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 8789,
            },
        },
    ],
};
