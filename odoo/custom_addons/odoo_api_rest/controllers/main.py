from odoo import http
from odoo.http import request
import json

class ApiController(http.Controller):
    @http.route('/api/auth', type='json', auth='none', methods=['POST'], cors='*')
    def authenticate(self, **kw):
        """
        Endpoint para autenticar usuarios y obtener un token de sesión
        """
        try:
            db = request.jsonrequest.get('db')
            login = request.jsonrequest.get('login')
            password = request.jsonrequest.get('password')
            
            uid = request.session.authenticate(db, login, password)
            if uid:
                return {
                    'success': True,
                    'uid': uid,
                    'session_id': request.session.sid,
                    'name': request.env['res.users'].browse(uid).name,
                }
            return {'success': False, 'error': 'Credenciales inválidas'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/products', type='http', auth='public', methods=['GET'], cors='*')
    def get_products(self, **kw):
        """
        Endpoint para obtener productos
        """
        try:
            limit = int(kw.get('limit', 50))
            offset = int(kw.get('offset', 0))
            
            domain = []
            if 'category' in kw:
                domain.append(('categ_id.name', '=', kw.get('category')))
            
            fields = ['id', 'name', 'list_price', 'default_code', 'description', 'image_1920']
            products = request.env['product.template'].sudo().search_read(domain, fields=fields, limit=limit, offset=offset)
            
            # Convertir la imagen a URL o base64 si es necesario
            for product in products:
                if product.get('image_1920'):
                    product['image_url'] = f"/web/image/product.template/{product['id']}/image_1920"
                    del product['image_1920']
            
            return http.Response(
                json.dumps({'success': True, 'data': products}),
                status=200,
                content_type='application/json'
            )
        except Exception as e:
            return http.Response(
                json.dumps({'success': False, 'error': str(e)}),
                status=500,
                content_type='application/json'
            )

    @http.route('/api/products', type='json', auth='user', methods=['POST'], cors='*')
    def create_product(self, **kw):
        """
        Endpoint para crear un nuevo producto
        """
        try:
            product_data = request.jsonrequest
            required_fields = ['name', 'list_price']
            
            for field in required_fields:
                if field not in product_data:
                    return {'success': False, 'error': f'El campo {field} es obligatorio'}
            
            product_id = request.env['product.template'].sudo().create(product_data)
            
            return {
                'success': True,
                'id': product_id.id,
                'message': 'Producto creado correctamente'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/products/<int:product_id>', type='http', auth='public', methods=['GET'], cors='*')
    def get_product(self, product_id, **kw):
        """
        Endpoint para obtener un producto específico
        """
        try:
            fields = ['id', 'name', 'list_price', 'default_code', 'description', 'image_1920']
            product = request.env['product.template'].sudo().browse(product_id).read(fields)
            
            if not product:
                return http.Response(
                    json.dumps({'success': False, 'error': 'Producto no encontrado'}),
                    status=404,
                    content_type='application/json'
                )
            
            # Convertir la imagen a URL
            if product[0].get('image_1920'):
                product[0]['image_url'] = f"/web/image/product.template/{product_id}/image_1920"
                del product[0]['image_1920']
            
            return http.Response(
                json.dumps({'success': True, 'data': product[0]}),
                status=200,
                content_type='application/json'
            )
        except Exception as e:
            return http.Response(
                json.dumps({'success': False, 'error': str(e)}),
                status=500,
                content_type='application/json'
            )

    @http.route('/api/products/<int:product_id>', type='json', auth='user', methods=['PUT'], cors='*')
    def update_product(self, product_id, **kw):
        """
        Endpoint para actualizar un producto existente
        """
        try:
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {'success': False, 'error': 'Producto no encontrado'}
            
            product_data = request.jsonrequest
            product.write(product_data)
            
            return {
                'success': True,
                'message': 'Producto actualizado correctamente'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/products/<int:product_id>', type='json', auth='user', methods=['DELETE'], cors='*')
    def delete_product(self, product_id, **kw):
        """
        Endpoint para eliminar un producto existente
        """
        try:
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {'success': False, 'error': 'Producto no encontrado'}
            
            product.unlink()
            
            return {
                'success': True,
                'message': 'Producto eliminado correctamente'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    # Endpoints para clientes (partners)
    @http.route('/api/partners', type='http', auth='public', methods=['GET'], cors='*')
    def get_partners(self, **kw):
        """
        Endpoint para obtener clientes/partners
        """
        try:
            limit = int(kw.get('limit', 50))
            offset = int(kw.get('offset', 0))
            
            domain = [('customer_rank', '>', 0)]  # Solo clientes
            
            fields = ['id', 'name', 'email', 'phone', 'street', 'city', 'country_id']
            partners = request.env['res.partner'].sudo().search_read(domain, fields=fields, limit=limit, offset=offset)
            
            return http.Response(
                json.dumps({'success': True, 'data': partners}),
                status=200,
                content_type='application/json'
            )
        except Exception as e:
            return http.Response(
                json.dumps({'success': False, 'error': str(e)}),
                status=500,
                content_type='application/json'
            )

    # Endpoints para órdenes de venta
    @http.route('/api/orders', type='http', auth='public', methods=['GET'], cors='*')
    def get_orders(self, **kw):
        """
        Endpoint para obtener órdenes de venta
        """
        try:
            limit = int(kw.get('limit', 50))
            offset = int(kw.get('offset', 0))
            
            domain = []
            
            fields = ['id', 'name', 'partner_id', 'date_order', 'amount_total', 'state']
            orders = request.env['sale.order'].sudo().search_read(domain, fields=fields, limit=limit, offset=offset)
            
            return http.Response(
                json.dumps({'success': True, 'data': orders}),
                status=200,
                content_type='application/json'
            )
        except Exception as e:
            return http.Response(
                json.dumps({'success': False, 'error': str(e)}),
                status=500,
                content_type='application/json'
            )
