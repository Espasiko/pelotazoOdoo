import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Función para formatear precios en el tooltip
const formatEuro = (value) => {
  return `${value.toLocaleString('es-ES')} €`;
};

// Componente personalizado para el tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="subtitle2" component="p">
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography 
            key={`item-${index}`}
            variant="body2"
            component="p"
            sx={{ 
              color: entry.color,
              display: 'flex',
              alignItems: 'center',
              mt: 0.5
            }}
          >
            <Box
              component="span"
              sx={{
                width: 12,
                height: 12,
                backgroundColor: entry.color,
                mr: 1,
                display: 'inline-block',
                borderRadius: '50%'
              }}
            />
            {entry.name}: {formatEuro(entry.value)}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

export const SalesChart = () => {
  // Datos de ejemplo, en una implementación real estos vendrían de la API
  const data = [
    { name: 'Lun', ventas: 1200, pedidos: 4 },
    { name: 'Mar', ventas: 1900, pedidos: 6 },
    { name: 'Mié', ventas: 800, pedidos: 3 },
    { name: 'Jue', ventas: 1600, pedidos: 5 },
    { name: 'Vie', ventas: 2400, pedidos: 8 },
    { name: 'Sáb', ventas: 2800, pedidos: 9 },
    { name: 'Dom', ventas: 1400, pedidos: 5 },
  ];

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 2 }}>
      <Typography variant="h6" component="h3" gutterBottom>
        Ventas de la Semana
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e53935" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#e53935" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e2a38" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1e2a38" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis 
              yAxisId="left"
              tickFormatter={formatEuro}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              domain={[0, 'dataMax + 2']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="ventas"
              name="Ventas"
              stroke="#e53935"
              fillOpacity={1}
              fill="url(#colorVentas)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="pedidos"
              name="Pedidos"
              stroke="#1e2a38"
              fillOpacity={1}
              fill="url(#colorPedidos)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default SalesChart;
