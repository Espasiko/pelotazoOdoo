import React from 'react';

const Logo = ({ width = 200, height = 60 }) => (
  <svg width={width} height={height} viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="40" height="40" rx="5" fill="#e53935" />
    <text x="20" y="38" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="#ffffff">P</text>
    <text x="60" y="35" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="#333333">El Pelotazo</text>
    <text x="60" y="50" fontFamily="Arial" fontSize="12" fill="#666666">Electro y Hogar</text>
  </svg>
);

export default Logo;
