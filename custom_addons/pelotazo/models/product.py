from odoo import models, fields, api

class ProductTemplate(models.Model):
    _inherit = 'product.template'
    
    x_pvp_web = fields.Float(string='P.V.P. Web')
    x_dto = fields.Float(string='Descuento %')
    x_precio_margen = fields.Float(string='Precio con margen')
    x_beneficio_unitario = fields.Float(string='Beneficio unitario', compute='_compute_beneficio', store=True)
    x_beneficio_total = fields.Float(string='Beneficio total', compute='_compute_beneficio', store=True)
    x_nombre_proveedor = fields.Char(string='Proveedor', help='Nombre del proveedor del producto')
    x_marca = fields.Char(string='Marca')
    x_vendidas = fields.Integer(string='Unidades vendidas')
    
    @api.depends('standard_price', 'list_price', 'x_vendidas')
    def _compute_beneficio(self):
        for product in self:
            if product.standard_price and product.list_price:
                product.x_beneficio_unitario = product.list_price - product.standard_price
                product.x_beneficio_total = product.x_beneficio_unitario * (product.x_vendidas or 0)
            else:
                product.x_beneficio_unitario = 0
                product.x_beneficio_total = 0