from odoo import http
from odoo.http import request, Response
import json

class PelotazoController(http.Controller):
    @http.route(['/shop', '/shop/page/<int:page>', '/shop/category/<model("product.public.category"):category>'], type='http', auth="public", website=True)
    def shop(self, page=0, category=None, search='', ppg=False, **post):
        # Primero, llamamos al método original para obtener la respuesta normal
        response = request.env['website.sale'].shop(page=page, category=category, search=search, ppg=ppg, **post)
        
        # Inyectamos nuestro CSS personalizado en la respuesta
        if hasattr(response, 'qcontext'):
            # Añadir una variable al contexto para indicar que estamos en la tienda de El Pelotazo
            response.qcontext['is_pelotazo_shop'] = True
            
            # Añadir la ruta al CSS personalizado
            if 'custom_css' not in response.qcontext:
                response.qcontext['custom_css'] = []
            response.qcontext['custom_css'].append('/pelotazo/static/src/css/pelotazo_store_theme_direct.css')
        
        return response

    # Método para manejar las solicitudes OPTIONS (preflight CORS)
    @http.route(['/api/auth', '/api/products', '/api/products/<int:id>'], 
                type='http', auth='none', methods=['OPTIONS'], csrf=False)
    def handle_options_request(self, **kw):
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, api-key, db, login, password',
            'Access-Control-Max-Age': '86400',  # 24 horas
        }
        return Response(status=204, headers=headers)

    # Endpoint de autenticación
    @http.route('/api/auth', type='json', auth='none', methods=['POST'], csrf=False)
    def authenticate(self, **kw):
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        }
        
        try:
            # Obtener datos de la solicitud
            data = request.jsonrequest
            db = data.get('db')
            login = data.get('login')
            password = data.get('password')
            
            # Validar los datos
            if not all([db, login, password]):
                return self._json_response({'success': False, 'error': 'Faltan datos de autenticación'}, headers=headers)
            
            # Autenticar al usuario
            uid = request.session.authenticate(db, login, password)
            if uid:
                return self._json_response({
                    'success': True,
                    'uid': uid,
                    'session_id': request.session.sid,
                    'name': request.env['res.users'].browse(uid).name
                }, headers=headers)
            else:
                return self._json_response({'success': False, 'error': 'Credenciales inválidas'}, headers=headers)
        except Exception as e:
            return self._json_response({'success': False, 'error': str(e)}, headers=headers)

    # Endpoint para obtener productos
    @http.route('/api/products', type='http', auth='public', methods=['GET'], csrf=False)
    def get_products(self, limit=50, offset=0, category=None, **kw):
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
            'Content-Type': 'application/json'
        }
        
        try:
            limit = int(limit)
            offset = int(offset)
            
            domain = [('website_published', '=', True)]
            if category:
                domain.append(('public_categ_ids', 'child_of', int(category)))
            
            products = request.env['product.template'].sudo().search(domain, limit=limit, offset=offset)
            
            result = []
            for product in products:
                result.append({
                    'id': product.id,
                    'name': product.name,
                    'price': product.list_price,
                    'description': product.description_sale or '',
                    'image_url': f'/web/image/product.template/{product.id}/image_1920',
                    'category_id': product.categ_id.id,
                    'category_name': product.categ_id.name,
                    'x_pvp_web': product.x_pvp_web if hasattr(product, 'x_pvp_web') else 0,
                    'x_dto': product.x_dto if hasattr(product, 'x_dto') else 0,
                    'x_precio_margen': product.x_precio_margen if hasattr(product, 'x_precio_margen') else 0,
                    'x_beneficio_unitario': product.x_beneficio_unitario if hasattr(product, 'x_beneficio_unitario') else 0,
                    'x_nombre_proveedor': product.x_nombre_proveedor if hasattr(product, 'x_nombre_proveedor') else '',
                    'x_marca': product.x_marca if hasattr(product, 'x_marca') else '',
                })
            
            return self._http_json_response({'success': True, 'data': result}, headers=headers)
        except Exception as e:
            return self._http_json_response({'success': False, 'error': str(e)}, headers=headers)

    # Endpoint para obtener un producto específico
    @http.route('/api/products/<int:id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_product(self, id, **kw):
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
            'Content-Type': 'application/json'
        }
        
        try:
            product = request.env['product.template'].sudo().browse(int(id))
            
            if not product.exists():
                return self._http_json_response({'success': False, 'error': 'Producto no encontrado'}, headers=headers)
            
            result = {
                'id': product.id,
                'name': product.name,
                'price': product.list_price,
                'description': product.description_sale or '',
                'image_url': f'/web/image/product.template/{product.id}/image_1920',
                'category_id': product.categ_id.id,
                'category_name': product.categ_id.name,
                'x_pvp_web': product.x_pvp_web if hasattr(product, 'x_pvp_web') else 0,
                'x_dto': product.x_dto if hasattr(product, 'x_dto') else 0,
                'x_precio_margen': product.x_precio_margen if hasattr(product, 'x_precio_margen') else 0,
                'x_beneficio_unitario': product.x_beneficio_unitario if hasattr(product, 'x_beneficio_unitario') else 0,
                'x_nombre_proveedor': product.x_nombre_proveedor if hasattr(product, 'x_nombre_proveedor') else '',
                'x_marca': product.x_marca if hasattr(product, 'x_marca') else '',
            }
            
            return self._http_json_response({'success': True, 'data': result}, headers=headers)
        except Exception as e:
            return self._http_json_response({'success': False, 'error': str(e)}, headers=headers)

    # Método auxiliar para respuestas JSON con tipo http
    def _http_json_response(self, data, headers=None, status=200):
        if headers is None:
            headers = {}
        
        return Response(
            json.dumps(data),
            status=status,
            headers=headers,
            content_type='application/json'
        )

    # Método auxiliar para respuestas JSON con tipo json
    def _json_response(self, data, headers=None):
        if headers is None:
            headers = {}
        
        response = {'jsonrpc': '2.0', 'id': None, 'result': data}
        return response
