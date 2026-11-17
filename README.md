# Fuel API

REST API สำหรับคำนวณปริมาณน้ำมันและค่าน้ำมันตามประเภทรถและระยะทาง สร้างด้วย Node.js + Express 5

## สารบัญ

- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [การติดตั้ง](#การติดตั้ง)
- [การตั้งค่า](#การตั้งค่า)
- [API](#api)
- [การทดสอบ API](#การทดสอบ-api)
- [การใช้งานด้วย PM2](#การใช้งานด้วย-pm2)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)

## ความต้องการของระบบ

- Node.js 20 ขึ้นไป (ทดสอบกับ v20.19.2)
- npm
- PM2 (เฉพาะตอนรันบน server ดูหัวข้อ [การใช้งานด้วย PM2](#การใช้งานด้วย-pm2))

## การติดตั้ง

```bash
git clone https://github.com/nemeow0w0/fuel-api.git
cd fuel-api
npm install
```

รันโหมดพัฒนา (ใช้ nodemon รีสตาร์ทอัตโนมัติเมื่อแก้ไฟล์):

```bash
npm start
```

เมื่อขึ้นข้อความนี้แสดงว่าพร้อมใช้งาน:

```
Server running at http://localhost:8789
```

## การตั้งค่า

| ค่า | ที่อยู่ | ค่าเริ่มต้น | หมายเหตุ |
|---|---|---|---|
| `PORT` | environment variable | `8789` | พอร์ตที่ server เปิดรับ |
| `FUEL_PRICE_PER_LITER` | `index.js` | `35` | ราคาน้ำมัน (บาท/ลิตร) |
| `vehicles` | `index.js` | 2 คัน | รายการรถและอัตราสิ้นเปลือง (กม./ลิตร) |

เปลี่ยนพอร์ตชั่วคราว:

```bash
# Git Bash / macOS / Linux
PORT=3000 npm start
```

```powershell
# PowerShell
$env:PORT = 3000; npm start
```

## API

Base URL: `http://localhost:8789`

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/vehicles` | ดูรายการรถทั้งหมด |
| `POST` | `/calculate-fuel` | คำนวณปริมาณน้ำมันและค่าน้ำมัน |

### `GET /vehicles`

Response `200`:

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "รถกระบะ 4 ล้อ", "fuelRate": 10 },
    { "id": 2, "name": "รถบรรทุก 6 ล้อ", "fuelRate": 5 }
  ]
}
```

`fuelRate` คือระยะทางที่วิ่งได้ต่อน้ำมัน 1 ลิตร (กม./ลิตร)

### `POST /calculate-fuel`

ต้องส่ง header `Content-Type: application/json`

Request body:

| Field | Type | จำเป็น | คำอธิบาย |
|---|---|---|---|
| `vehicleId` | number | ✅ | `id` ของรถจาก `/vehicles` ต้องเป็นตัวเลข (`1`) ไม่ใช่ข้อความ (`"1"`) |
| `distance` | number | ✅ | ระยะทาง (กม.) ต้องมากกว่า 0 |

```json
{ "vehicleId": 1, "distance": 100 }
```

สูตรคำนวณ:

```
litersUsed = distance / fuelRate
totalCost  = litersUsed × FUEL_PRICE_PER_LITER
```

ผลลัพธ์ปัดทศนิยม 2 ตำแหน่ง

Response `200`:

```json
{
  "success": true,
  "data": {
    "vehicle": "รถกระบะ 4 ล้อ",
    "distance": 100,
    "litersUsed": 10,
    "totalCost": 350
  }
}
```

Response เมื่อผิดพลาด:

| Status | กรณี | Response |
|---|---|---|
| `400` | ไม่ส่ง `vehicleId` หรือ `distance` (หรือส่ง `0`) | `{ "success": false, "message": "กรุณาระบุ รหัสรถและระยะทาง" }` |
| `404` | ไม่พบ `vehicleId` (รวมถึงส่งเป็นข้อความ เช่น `"1"`) | `{ "success": false, "message": "ไม่พบรถที่ระบุ" }` |
| `500` | ไม่ได้ส่ง header `Content-Type: application/json` | หน้า error HTML |

## การทดสอบ API

เปิด server ก่อน (`npm start` หรือ PM2) แล้วทดสอบด้วยวิธีใดวิธีหนึ่งด้านล่าง

### curl (Git Bash / macOS / Linux)

```bash
# ดูรายการรถ
curl http://localhost:8789/vehicles

# คำนวณค่าน้ำมัน
curl -X POST http://localhost:8789/calculate-fuel \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":1,"distance":100}'

# แสดง status code ด้วย
curl -s -w "\n[%{http_code}]\n" -X POST http://localhost:8789/calculate-fuel \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":99,"distance":100}'
```

### PowerShell

ใน Windows PowerShell คำสั่ง `curl` เป็นชื่อย่อของ `Invoke-WebRequest` ไม่ใช่ curl จริง ให้ใช้ `Invoke-RestMethod` แทน (หรือ `curl.exe` สำหรับ GET)

```powershell
# ดูรายการรถ
(Invoke-RestMethod -Uri "http://localhost:8789/vehicles").data | Format-Table

# คำนวณค่าน้ำมัน
$body = @{ vehicleId = 1; distance = 100 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8789/calculate-fuel" -Method Post `
  -ContentType "application/json" -Body $body
```

`Invoke-RestMethod` จะ throw error เมื่อได้ status 4xx/5xx ถ้าต้องการดู response ของ error:

```powershell
try {
    $body = @{ vehicleId = 99; distance = 100 } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8789/calculate-fuel" -Method Post `
      -ContentType "application/json" -Body $body
} catch {
    "Status: " + $_.Exception.Response.StatusCode.value__
    $_.ErrorDetails.Message
}
```

### Postman / Thunder Client

1. สร้าง request `POST http://localhost:8789/calculate-fuel`
2. แท็บ **Body** เลือก **raw** → **JSON**
3. ใส่ `{ "vehicleId": 1, "distance": 100 }` แล้วกด **Send**

### กรณีทดสอบ

| # | Request | ผลที่คาดหวัง |
|---|---|---|
| 1 | `GET /vehicles` | `200` รายการรถ 2 คัน |
| 2 | `POST` `{"vehicleId":1,"distance":100}` | `200` `litersUsed: 10`, `totalCost: 350` |
| 3 | `POST` `{"vehicleId":2,"distance":250}` | `200` `litersUsed: 50`, `totalCost: 1750` |
| 4 | `POST` `{"vehicleId":1}` | `400` กรุณาระบุ รหัสรถและระยะทาง |
| 5 | `POST` `{"vehicleId":99,"distance":100}` | `404` ไม่พบรถที่ระบุ |
| 6 | `POST` `{"vehicleId":"1","distance":100}` | `404` ไม่พบรถที่ระบุ (`vehicleId` เป็นข้อความ) |

## การใช้งานด้วย PM2

PM2 ใช้รันแอปบน server แบบเบื้องหลัง รีสตาร์ทอัตโนมัติเมื่อแอปล่ม และเก็บ log ให้ PM2 รัน `index.js` ด้วย node โดยตรง ไม่ผ่าน nodemon

### ติดตั้ง PM2

```bash
npm install -g pm2
pm2 -v
```

### เริ่มแอป

ค่าตั้งต้นอยู่ใน [`ecosystem.config.cjs`](ecosystem.config.cjs) (ชื่อแอป `fuel-api`, พอร์ต `8789`)

```bash
pm2 start ecosystem.config.cjs --env production
```

ไฟล์ config ต้องเป็น `.cjs` เพราะ `package.json` ตั้ง `"type": "module"` ไว้

ถ้าไม่ใช้ไฟล์ config ก็รันตรงได้:

```bash
pm2 start index.js --name fuel-api
```

### คำสั่งที่ใช้บ่อย

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `pm2 list` | ดูสถานะแอปทั้งหมด |
| `pm2 logs fuel-api` | ดู log แบบ real-time (`Ctrl+C` เพื่อออก) |
| `pm2 logs fuel-api --lines 100` | ดู log ย้อนหลัง 100 บรรทัด |
| `pm2 monit` | ดู CPU / RAM แบบ real-time |
| `pm2 restart fuel-api` | รีสตาร์ทแอป |
| `pm2 stop fuel-api` | หยุดแอป (ยังอยู่ในรายการ) |
| `pm2 delete fuel-api` | หยุดและลบออกจากรายการ |
| `pm2 flush fuel-api` | ล้างไฟล์ log |

### อัปเดตโค้ดบน server

```bash
git pull
npm install
pm2 restart ecosystem.config.cjs --env production --update-env
```

### ให้แอปเริ่มเองเมื่อเปิดเครื่อง

**Linux:**

```bash
pm2 startup     # จะแสดงคำสั่ง sudo ให้ copy ไปรัน
pm2 save        # บันทึกรายการแอปที่กำลังรันอยู่
```

**Windows:** `pm2 startup` ใช้บน Windows ไม่ได้ ให้ใช้แพ็กเกจเสริม:

```powershell
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

ทุกครั้งที่เพิ่มหรือลบแอปใน PM2 ให้รัน `pm2 save` อีกครั้ง

### หมุนเวียนไฟล์ log (แนะนำ)

ไฟล์ log ของ PM2 จะโตขึ้นเรื่อย ๆ ติดตั้งโมดูลนี้เพื่อแบ่งไฟล์และลบไฟล์เก่าอัตโนมัติ:

```bash
pm2 install pm2-logrotate
```

## โครงสร้างโปรเจกต์

```
calculate-fuel/
├── index.js               # Express app และ API ทั้งหมด
├── ecosystem.config.cjs   # ตั้งค่า PM2
├── package.json
└── package-lock.json
```
