{
    'name': 'El Pelotazo',
    'version': '1.0',
    'category': 'Sales',
    'summary': 'Módulo personalizado para El Pelotazo',
    'description': """
        Este módulo añade campos personalizados y funcionalidades
        específicas para la tienda de electrodomésticos El Pelotazo.
    """,
    'depends': ['base', 'product', 'stock', 'sale_management', 'purchase', 'website_sale'],
    'data': [
        'security/ir.model.access.csv',
        'views/assets.xml',
        'views/product_views.xml',
        'views/partner_views.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            '/pelotazo/static/src/css/pelotazo_store_theme_direct.css',
        ],
    },
    'installable': True,
    'application': True,
}