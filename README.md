# Fuel API

REST API สำหรับคำนวณปริมาณน้ำมันและค่าน้ำมันตามประเภทรถและระยะทาง สร้างด้วย Node.js + Express 5

## สารบัญ

- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [การติดตั้ง](#การติดตั้ง)
- [การตั้งค่า](#การตั้งค่า)
- [API](#api)
- [การทดสอบ API](#การทดสอบ-api)
- [การใช้งานด้วย PM2](#การใช้งานด้วย-pm2)
- [การเปิดใช้งานในวง LAN](#การเปิดใช้งานในวง-lan)
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
| `HOST` | environment variable | `0.0.0.0` | `0.0.0.0` = เครื่องอื่นในวง LAN เข้าได้, `127.0.0.1` = เข้าได้เฉพาะเครื่องนี้ |
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

## การเปิดใช้งานในวง LAN

ค่าเริ่มต้น server เปิดรับที่ `0.0.0.0` อยู่แล้ว เครื่องอื่นในวง LAN เดียวกันจึงเรียกใช้ได้ ขั้นตอนที่ต้องทำมีแค่หา IP ของเครื่อง และเปิด firewall

### 1. หา IP ของเครื่อง server

ตอนเริ่ม server จะแสดง IP ทุกการ์ดเครือข่าย:

```
Server running at http://localhost:8789
  LAN: http://192.168.1.50:8789  (Ethernet)
  LAN: http://172.25.176.1:8789  (vEthernet (WSL))
```

ให้ใช้ IP ที่อยู่วงเดียวกับเครื่องที่จะเรียกใช้ (ส่วนใหญ่ขึ้นต้นด้วย `192.168.`) ส่วน IP ของ WSL, Hyper-V (`Default Switch`) และ VirtualBox (`192.168.56.x`) เป็นเครือข่ายภายในเครื่อง เครื่องอื่นเข้าไม่ได้

ดูด้วยคำสั่งก็ได้: `ipconfig` (Windows) หรือ `ip addr` (Linux)

### 2. เปิด firewall

**Windows** — เปิด PowerShell แบบ **Run as Administrator**:

```powershell
# ตรวจว่าเครือข่ายเป็น Private (ถ้าเป็น Public เครื่องอื่นจะเข้าไม่ได้)
Get-NetConnectionProfile

# ถ้าเป็น Public และเป็นเครือข่ายที่ไว้ใจได้ (บ้าน/ออฟฟิศ) ให้เปลี่ยนเป็น Private
Set-NetConnectionProfile -InterfaceAlias "ชื่อ InterfaceAlias" -NetworkCategory Private

# อนุญาตพอร์ต 8789 บนเครือข่าย Private
New-NetFirewallRule -DisplayName "fuel-api (TCP 8789)" -Direction Inbound `
  -Protocol TCP -LocalPort 8789 -Action Allow -Profile Private
```

ถ้าตอนรัน node ครั้งแรก Windows ถามว่า "Allow access" แล้วเลือก Private networks ไว้แล้ว อาจไม่ต้องเพิ่ม rule นี้ แต่ rule นั้นผูกกับ path ของ `node.exe` ถ้าเปลี่ยนเวอร์ชัน Node (เช่นด้วย nvm) จะใช้ไม่ได้ การเปิดตามพอร์ตแบบด้านบนจึงแน่นอนกว่า

**Linux (ufw):**

```bash
sudo ufw allow 8789/tcp
```

### 3. ทดสอบจากเครื่องอื่น

เปิด browser บนมือถือหรือคอมเครื่องอื่นในวง LAN เดียวกัน:

```
http://192.168.1.50:8789/vehicles
```

หรือใช้คำสั่ง (แทน IP ด้วยของเครื่อง server):

```bash
curl -X POST http://192.168.1.50:8789/calculate-fuel \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":1,"distance":100}'
```

### ถ้าเครื่องอื่นเข้าไม่ได้

| อาการ | สาเหตุที่เป็นไปได้ |
|---|---|
| เข้า `localhost` ได้ แต่เข้าด้วย IP จากเครื่องอื่นไม่ได้ | firewall ยังไม่เปิด หรือเครือข่ายเป็น Public |
| เข้าได้บางวัน บางวันไม่ได้ | IP ของ server เปลี่ยน (DHCP) ให้ตั้ง DHCP reservation ที่ router หรือกำหนด IP คงที่ |
| เครื่องอื่นต่อ Wi-Fi สำหรับแขก (Guest) | Guest Wi-Fi มักแยกเครือข่ายออกจาก LAN หลัก |

ตรวจว่าพอร์ตเปิดหรือไม่ จากเครื่อง Windows อีกเครื่อง:

```powershell
Test-NetConnection -ComputerName 192.168.1.50 -Port 8789
# TcpTestSucceeded : True = เชื่อมต่อได้
```

> **ความปลอดภัย:** API นี้ยังไม่มีระบบยืนยันตัวตน ใช้ได้เฉพาะในเครือข่ายที่ไว้ใจได้ ห้าม forward พอร์ตออกอินเทอร์เน็ต ถ้าต้องการให้เข้าได้เฉพาะเครื่องตัวเอง ให้ตั้ง `HOST=127.0.0.1`

## โครงสร้างโปรเจกต์

```
calculate-fuel/
├── index.js               # Express app และ API ทั้งหมด
├── ecosystem.config.cjs   # ตั้งค่า PM2
├── package.json
└── package-lock.json
```
