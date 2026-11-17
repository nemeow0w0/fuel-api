import express from "express";



const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8789;

const vehicles = [
    { id: 1, name: "รถกระบะ 4 ล้อ", fuelRate: 10 }, // 10 km/l
    { id: 2, name: "รถบรรทุก 6 ล้อ", fuelRate: 5 }, // 5 km/l
];

const FUEL_PRICE_PER_LITER = 35; // ราคาน้ำมันต่อ 1 ลิตร


// 1. API ดูรายการรถทั้งหมด
app.get("/vehicles", (req, res) => {
    res.json({
        success: true,
        data: vehicles,
    });
});


// 2. API คำนวณค่าน้ำมัน
app.post("/calculate-fuel", (req, res) => {
    const { vehicleId, distance } = req.body;

    if (!vehicleId || !distance) {
        return res.status(400).json({
            success: false,
            message: "กรุณาระบุ รหัสรถและระยะทาง",
        });
    }

    // ค้นหารถตาม vehicleId
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: "ไม่พบรถที่ระบุ",
        });
    }

    // คำนวณค่าน้ำมัน
    const litersUsed = distance / vehicle.fuelRate;
    const totalCost = litersUsed * FUEL_PRICE_PER_LITER;

    res.json({
        success: true,
        data: {
            vehicle: vehicle.name,
            distance: Number(distance),
            litersUsed: Number(litersUsed.toFixed(2)),
            totalCost: Number(totalCost.toFixed(2)),
        },
    });
})


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
 