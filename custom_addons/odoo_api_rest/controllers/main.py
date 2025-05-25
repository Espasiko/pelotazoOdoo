# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request, Response
import json

class OdooApiRestController(http.Controller):
    # Método para manejar las solicitudes OPTIONS (preflight CORS)
    @http.route(['/api/v1/*'], type='http', auth='none', methods=['OPTIONS'], csrf=False)
    def handle_options_request(self, **kw):
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, api-key, db, login, password',
            'Access-Control-Max-Age': '86400',  # 24 horas
        }
        return Response(status=204, headers=headers)
    
    # Endpoint para autenticación
    @http.route('/api/v1/auth', type='json', auth='none', methods=['POST'], csrf=False)
    def authenticate(self, **kw):
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
        
        try:
            # Obtener credenciales del cuerpo de la solicitud
            db = request.jsonrequest.get('db')
            login = request.jsonrequest.get('login')
            password = request.jsonrequest.get('password')
            
            # Validar credenciales
            uid = request.session.authenticate(db, login, password)
            
            if uid:
                # Obtener información del usuario
                user = request.env['res.users'].sudo().browse(uid)
                
                return {
                    'success': True,
                    'uid': uid,
                    'name': user.name,
                    'email': user.email,
                    'session_id': request.session.sid,
                }
            else:
                return {
                    'success': False,
                    'error': 'Credenciales inválidas',
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    # Endpoint para obtener productos
    @http.route('/api/v1/products', type='http', auth='public', methods=['GET'], csrf=False)
    def get_products(self, limit=50, offset=0, **kw):
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json',
        }
        
        try:
            # Obtener productos
            products = request.env['product.template'].sudo().search([], limit=int(limit), offset=int(offset))
            total = request.env['product.template'].sudo().search_count([])
            
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
            
            return Response(
                json.dumps({
                    'success': True,
                    'data': result,
                    'total': total,
                }),
                headers=headers,
                content_type='application/json'
            )
        except Exception as e:
            return Response(
                json.dumps({
                    'success': False,
                    'error': str(e),
                }),
                headers=headers,
                status=500,
                content_type='application/json'
            )
    
    # Endpoint para obtener un producto específico
    @http.route('/api/v1/products/<int:id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_product(self, id, **kw):
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json',
        }
        
        try:
            # Obtener producto
            product = request.env['product.template'].sudo().browse(int(id))
            
            if not product.exists():
                return Response(
                    json.dumps({
                        'success': False,
                        'error': 'Producto no encontrado',
                    }),
                    headers=headers,
                    status=404,
                    content_type='application/json'
                )
            
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
            
            return Response(
                json.dumps({
                    'success': True,
                    'data': result,
                }),
                headers=headers,
                content_type='application/json'
            )
        except Exception as e:
            return Response(
                json.dumps({
                    'success': False,
                    'error': str(e),
                }),
                headers=headers,
                status=500,
                content_type='application/json'
            )