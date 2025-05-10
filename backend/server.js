// Servidor Express unificado para El Pelotazo
import express from 'express';
import cors from 'cors';
import importacionRouter from './api/importacion/index.js';
import importacionesRouter from './api/importaciones/index.js';
// import pdfRouter from './api/pdf/index.js';
// import facturacionRouter from './api/facturacion/index.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas modulares
app.use('/api/importar', importacionRouter);
app.use('/api/importaciones', importacionesRouter);
// app.use('/api/pdf', pdfRouter);
// app.use('/api/facturacion', facturacionRouter);

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => console.log(`Servidor backend escuchando en puerto ${PORT}`));
