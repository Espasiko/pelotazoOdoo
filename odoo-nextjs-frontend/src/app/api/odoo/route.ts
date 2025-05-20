import { NextRequest, NextResponse } from 'next/server';

const ODOO_URL = process.env.NEXT_PUBLIC_ODOO_API_URL;
const ODOO_DB = process.env.NEXT_PUBLIC_ODOO_DB;
const ODOO_USERNAME = process.env.NEXT_PUBLIC_ODOO_USERNAME;
const ODOO_PASSWORD = process.env.NEXT_PUBLIC_ODOO_PASSWORD;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint') || '';
  const model = searchParams.get('model') || '';
  const id = searchParams.get('id') || '';
  const limit = searchParams.get('limit') || '';
  const offset = searchParams.get('offset') || '';
  const category = searchParams.get('category') || '';
  
  console.log('Proxy API GET request for endpoint:', endpoint);
  
  let url = `${ODOO_URL}/${endpoint}`;
  
  // Añadir parámetros de consulta si existen
  const queryParams = new URLSearchParams();
  if (model) queryParams.append('model', model);
  if (id) queryParams.append('id', id);
  if (limit) queryParams.append('limit', limit);
  if (offset) queryParams.append('offset', offset);
  if (category) queryParams.append('category', category);
  
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  console.log('Requesting URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data).substring(0, 100) + '...');
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, db, login, password',
      },
    });
  } catch (error) {
    console.error('Error proxying request to Odoo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Odoo' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint') || '';
  
  const url = `${ODOO_URL}/${endpoint}`;
  
  try {
    const body = await request.json();
    console.log('Proxy API POST request to:', url);
    console.log('Request body:', body);
    
    // Configurar las cabeceras según el tipo de endpoint
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Si es una solicitud de autenticación, incluir las credenciales en las cabeceras
    if (endpoint === 'authenticate' || endpoint === 'api/auth') {
      headers['db'] = body.db || ODOO_DB || '';
      headers['login'] = body.username || body.login || ODOO_USERNAME || '';
      headers['password'] = body.password || ODOO_PASSWORD || '';
    }
    
    console.log('Request headers:', headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    console.log('Response from Odoo:', data);
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, db, login, password',
      },
    });
  } catch (error) {
    console.error('Error proxying request to Odoo:', error);
    return NextResponse.json(
      { error: 'Failed to send data to Odoo' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, db, login, password',
      },
    }
  );
}
