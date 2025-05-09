// Endpoint Express para subir PDF y devolver datos extraídos
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import extractFacturaData from './extractFacturaData.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/extract-factura', upload.single('pdf'), async (req, res) => {
    try {
        const pdfPath = req.file.path;
        const pdfBuffer = fs.readFileSync(pdfPath);
        const data = await extractFacturaData(pdfBuffer);
        // Borra el archivo temporal
        fs.unlinkSync(pdfPath);
        res.json({ exito: true, datos: data });
    } catch (err) {
        res.status(500).json({ exito: false, error: err.message });
    }
});

app.listen(4000, () => {
    console.log('PDF Extractor API escuchando en http://localhost:4000');
});
