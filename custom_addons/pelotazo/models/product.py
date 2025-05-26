from odoo import models, fields, api, _

class ProductTemplate(models.Model):
    _inherit = 'product.template'
    
    # Campos personalizados existentes
    x_nombre_proveedor = fields.Char(string='Proveedor', index=True)
    x_marca = fields.Char(string='Marca', index=True)
    x_precio_venta_web = fields.Float(string='Precio de venta web', digits='Product Price', default=0.0)
    x_pvp_web = fields.Float(string='PVP Web', digits='Product Price', default=0.0,
                           help='Precio de venta al público en la web')
    x_dto = fields.Float(string='Descuento (%)', digits='Discount', default=0.0)
    x_precio_margen = fields.Float(string='Precio con margen', digits='Product Price', compute='_compute_precio_margen', store=True)
    x_beneficio_unitario = fields.Float(string='Beneficio unitario', digits='Product Price', compute='_compute_beneficio_unitario', store=True)
    x_garantia = fields.Text(string='Garantía')
    x_es_oferta = fields.Boolean(string='En oferta', default=False)
    x_fecha_fin_oferta = fields.Date(string='Fin de oferta')
    x_codigo_proveedor = fields.Char(string='Código del proveedor')
    x_stock_disponible = fields.Float(string='Stock disponible', compute='_compute_stock_disponible')
    
    # Campos calculados
    @api.depends('list_price', 'x_dto')
    def _compute_precio_margen(self):
        for product in self:
            if product.x_dto and product.x_dto > 0:
                product.x_precio_margen = product.list_price * (1 - (product.x_dto / 100))
            else:
                product.x_precio_margen = product.list_price
    
    @api.depends('list_price', 'standard_price')
    def _compute_beneficio_unitario(self):
        for product in self:
            if product.standard_price and product.standard_price > 0:
                product.x_beneficio_unitario = product.list_price - product.standard_price
            else:
                product.x_beneficio_unitario = 0.0
    
    def _compute_beneficio(self):
        for product in self:
            if product.standard_price and product.standard_price > 0:
                product.x_beneficio = ((product.list_price - product.standard_price) / product.standard_price) * 100
            else:
                product.x_beneficio = 0.0
    
    def _compute_stock_disponible(self):
        for product in self:
            product.x_stock_disponible = product.qty_available - product.outgoing_qty
    
    # Sobrescribir el método name_get para incluir el código del proveedor
    def name_get(self):
        result = []
        for record in self:
            name = record.name
            if record.default_code:
                name = f'[{record.default_code}] {name}'
            if record.x_codigo_proveedor:
                name = f'{name} ({record.x_codigo_proveedor})'
            result.append((record.id, name))
        return result
    
    # Método para actualizar precios desde la web
    def update_prices_from_web(self, price_dict):
        """
        Actualiza los precios desde la web
        :param price_dict: Diccionario con {product_id: {'price': x, 'discount': y}}
        """
        for product_id, values in price_dict.items():
            product = self.browse(product_id)
            if 'price' in values:
                product.x_pvp_web = values['price']
            if 'discount' in values:
                product.x_dto = values['discount']
        return True