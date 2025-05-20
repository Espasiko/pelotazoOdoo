# -*- coding: utf-8 -*-
{
    'name': 'El Pelotazo - Tema Tienda Online',
    'version': '1.0',
    'category': 'Website/Website',
    'summary': 'Tema personalizado para la tienda online de El Pelotazo',
    'description': """
        Este módulo añade un tema personalizado con los colores rojo, blanco y negro
        para la tienda online de El Pelotazo.
    """,
    'depends': ['website_sale'],
    'data': [
        'views/pelotazo_assets.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            '/website_sale/static/src/css/pelotazo_theme.css',
            '/website_sale/static/src/js/pelotazo_theme_injector.js',
        ],
    },
    'installable': True,
    'auto_install': True,
    'application': False,
}
