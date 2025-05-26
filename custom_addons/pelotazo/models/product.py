from odoo import models, fields, api

class ProductTemplate(models.Model):
    _inherit = 'product.template'
    
    x_nombre_proveedor = fields.Char(string='Proveedor')
    x_marca = fields.Char(string='Marca')
    x_precio_venta_web = fields.Float(string='Precio de venta web', digits='Product Price')
    x_beneficio = fields.Float(string='Beneficio (%)', compute='_compute_beneficio', store=True)
    
    @api.depends('list_price', 'standard_price')
    def _compute_beneficio(self):
        for product in self:
            if product.standard_price and product.standard_price > 0:
                product.x_beneficio = ((product.list_price - product.standard_price) / product.standard_price) * 100
            else:
                product.x_beneficio = 0.0