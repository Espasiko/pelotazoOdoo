from odoo import models, fields, api

class Partner(models.Model):
    _inherit = 'res.partner'
    
    x_fecha_alta = fields.Date(string='Fecha de alta')
    x_activo_proveedor = fields.Boolean(string='Proveedor activo', default=True)
    x_notas_proveedor = fields.Text(string='Notas del proveedor')
    x_codigo_proveedor = fields.Char(string='Código de proveedor')