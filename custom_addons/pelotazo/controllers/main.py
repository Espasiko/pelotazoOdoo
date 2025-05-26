from odoo import http
from odoo.http import request
import json

class PelotazoController(http.Controller):
    @http.route('/api/v1/auth', type='json', auth='none', methods=['POST'], csrf=False)
    def authenticate(self, **kw):
        """
        Authenticate a user and return a token
        """
        data = json.loads(request.httprequest.data.decode('utf-8'))
        db = data.get('db')
        login = data.get('login')
        password = data.get('password')
        
        if not all([db, login, password]):
            return {'success': False, 'error': 'Missing credentials'}
        
        try:
            uid = request.session.authenticate(db, login, password)
            if uid:
                user = request.env['res.users'].sudo().browse(uid)
                return {
                    'success': True,
                    'uid': uid,
                    'name': user.name,
                    'token': request.session.sid,
                }
            return {'success': False, 'error': 'Authentication failed'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @http.route('/api/v1/products', type='http', auth='public', methods=['GET'], csrf=False)
    def get_products(self, **kw):
        """
        Return a list of products
        """
        try:
            products = request.env['product.template'].sudo().search([])
            result = []
            for product in products:
                result.append({
                    'id': product.id,
                    'name': product.name,
                    'list_price': product.list_price,
                    'description': product.description_sale or '',
                    'supplier': product.x_nombre_proveedor or '',
                    'brand': product.x_marca or '',
                })
            return http.Response(
                json.dumps({'success': True, 'data': result}),
                content_type='application/json'
            )
        except Exception as e:
            return http.Response(
                json.dumps({'success': False, 'error': str(e)}),
                content_type='application/json'
            )
    
    @http.route('/api/v1/products/<int:product_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_product(self, product_id, **kw):
        """
        Return a specific product
        """
        try:
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return http.Response(
                    json.dumps({'success': False, 'error': 'Product not found'}),
                    content_type='application/json'
                )
            
            result = {
                'id': product.id,
                'name': product.name,
                'list_price': product.list_price,
                'description': product.description_sale or '',
                'supplier': product.x_nombre_proveedor or '',
                'brand': product.x_marca or '',
            }
            
            return http.Response(
                json.dumps({'success': True, 'data': result}),
                content_type='application/json'
            )
        except Exception as e:
            return http.Response(
                json.dumps({'success': False, 'error': str(e)}),
                content_type='application/json'
            )