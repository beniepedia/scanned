
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
// Lokal: 127.0.0.1 (hanya via proxy Apache). Docker: HOST=0.0.0.0 (network internal).
const HOST = process.env.HOST || '127.0.0.1';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY tidak ditemukan di environment variable server.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Configure Multer for in-memory file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
        const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMime.includes(file.mimetype) || !file.originalname.match(allowedExtensions)) {
            const err = new Error("Format file tidak didukung. Harap unggah file berformat JPG, JPEG, PNG, atau WEBP.");
            err.statusCode = 400;
            return cb(err, false);
        }
        cb(null, true);
    }
});

app.use(express.json());

// Access log ringkas: cara termudah memastikan request dari frontend sampai.
app.use((req, res, next) => {
    const started = Date.now();
    const bodySize = Number(req.headers['content-length'] ?? 0);

    res.on('finish', () => {
        console.log(
            `[req] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${Date.now() - started}ms ${bodySize}B`
        );
    });

    next();
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'vehicle-analysis', uptime: process.uptime() });
});

// Rate limit sederhana per IP (tanpa dependency): 30 permintaan / menit.
const hits = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function rateLimit(req, res, next) {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(key) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };

    if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + RATE_WINDOW_MS;
    }

    entry.count += 1;
    hits.set(key, entry);

    if (entry.count > RATE_LIMIT) {
        return res.status(429).json({ success: false, message: 'Terlalu banyak permintaan. Coba lagi sebentar.', data: null });
    }

    next();
}

function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Waktu tunggu AI habis.')), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

app.post('/analyze-vehicle', rateLimit, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.statusCode === 400) {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                    data: null
                });
            }
            return res.status(400).json({
                success: false,
                message: "Gagal memproses file yang diunggah.",
                data: null
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
            return res.status(400).json({
                success: false,
                message: "File yang diunggah kosong.",
                data: null
            });
        }

        let imageBuffer = req.file.buffer;

        // Verify and process image with Sharp
        let imageMetadata;
        try {
            imageMetadata = await sharp(imageBuffer).metadata();
        } catch (imgError) {
            return res.status(400).json({
                success: false,
                message: "Gambar tidak terbaca. File mungkin rusak (corrupt) atau bukan format gambar valid.",
                data: null
            });
        }

        const maxDimension = 1920;
        let sharpInstance = sharp(imageBuffer);

        if (imageMetadata.width > maxDimension || imageMetadata.height > maxDimension) {
            sharpInstance = sharpInstance.resize({
                width: imageMetadata.width > imageMetadata.height ? maxDimension : null,
                height: imageMetadata.height >= imageMetadata.width ? maxDimension : null,
                fit: 'inside'
            });
        }

        // Re-encode to JPEG buffer with quality 90
        const processedImageBuffer = await sharpInstance
            .jpeg({ quality: 90 })
            .toBuffer();

        const prompt = `
        Analisa foto kendaraan ini secara mendalam dan teliti. 
        Tolong berikan informasi berikut berdasarkan gambar:
        1. Warna kendaraan (contoh: "putih", "hitam", "merah").
        2. Nomor plat kendaraan tanpa spasi atau karakter khusus (contoh: "BK8929NBBN").
        3. Tahun masa berlaku plat sebagai integer/angka 4 digit (contoh: 2025). Jika tidak ada/tidak terbaca, isi null.
        4. Bulan masa berlaku plat sebagai string/angka 2 digit (contoh: "08"). Jika tidak ada/tidak terbaca, isi null.

        Berikan output HANYA dalam format JSON object/key-value yang valid seperti ini tanpa teks pembuka atau penutup lain:
        {
          "color": "putih",
          "plate": "BK8929NBBN",
          "year": 2025,
          "month": "08"
        }
        `;

        let response;
        try {
            response = await withTimeout(ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: processedImageBuffer.toString('base64')
                        }
                    },
                    prompt
                ]
            }), 25_000);
        } catch (aiCallError) {
            console.error('[ai] Gemini gagal:', aiCallError?.message ?? aiCallError);
            return res.status(502).json({
                success: false,
                message: `Kesalahan komunikasi dengan layanan AI: ${aiCallError.message}`,
                data: null
            });
        }

        const rawText = response && response.text ? response.text.trim() : "";
        if (!rawText) {
            return res.status(422).json({
                success: false,
                message: "Model AI gagal menganalisis gambar.",
                data: null
            });
        }

        const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const resultJson = JSON.parse(cleanedText);

            const color = resultJson.color;
            const plate = resultJson.plate;
            const year = resultJson.year;
            const month = resultJson.month;

            // Check if AI failed to identify required elements
            const isInvalidColor = !color || String(color).toLowerCase().includes("tidak") || String(color).toLowerCase().includes("gagal");
            const isInvalidPlate = !plate || String(plate).toLowerCase().includes("tidak") || String(plate).toLowerCase().includes("gagal");

            if (isInvalidColor || isInvalidPlate) {
                return res.status(422).json({
                    success: false,
                    message: "Gagal mengidentifikasi warna atau plat nomor kendaraan.",
                    data: {
                        color: null,
                        plate: null,
                        year: null,
                        month: null
                    }
                });
            }

            // Format success payload
            const formattedData = {
                color: String(color).toLowerCase().trim(),
                plate: String(plate).toUpperCase().replace(/\s+/g, "").trim(),
                year: (year && !isNaN(parseInt(year))) ? parseInt(year) : null,
                month: month ? String(month).padStart(2, '0') : null
            };

            return res.status(200).json({
                success: true,
                message: "Kendaraan berhasil dianalisis.",
                data: formattedData
            });

        } catch (jsonError) {
            return res.status(422).json({
                success: false,
                message: "Gagal mengekstrak JSON dari respon AI.",
                data: null
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan internal pada server.",
            detail: error.message
        });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`Server Vehicle Analysis API berjalan pada http://${HOST}:${PORT} (akses via proxy /ai/)`);
});