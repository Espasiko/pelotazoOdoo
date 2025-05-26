{
    'name': 'El Pelotazo',
    'version': '16.0.1.0.0',
    'summary': 'Módulo personalizado para El Pelotazo',
    'description': """
        Módulo personalizado para la tienda de electrodomésticos El Pelotazo.
        Incluye campos personalizados para productos, proveedores y API REST.
    """,
    'category': 'Sales',
    'author': 'El Pelotazo',
    'website': 'https://www.elpelotazo.com',
    'depends': [
        'base',
        'product',
        'sale_management',
        'website_sale',
        'stock',
        'account',
        'website_sale_stock',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/product_views.xml',
        'views/res_partner_views.xml',
        'views/website_templates.xml',
    ],
    'demo': [
        'demo/product_demo.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
    'assets': {
        'web.assets_backend': [
            'pelotazo/static/src/scss/backend.scss',
        ],
        'web.assets_frontend': [
            'pelotazo/static/src/scss/frontend.scss',
            'pelotazo/static/src/js/website_sale.js',
        ],
    },
}