{
    'name': 'Theme El Pelotazo',
    'description': 'Tema personalizado para la tienda de electrodomésticos El Pelotazo',
    'version': '1.0',
    'author': 'El Pelotazo',
    'category': 'Theme/Creative',
    'depends': ['website', 'website_sale'],
    'data': [
        'views/assets.xml',
        'views/layout.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'theme_pelotazo/static/src/scss/theme.scss',
        ],
    },
    'images': [
        'static/description/banner.png',
        'static/description/theme_screenshot.png',
    ],
    'license': 'LGPL-3',
    'installable': True,
    'application': False,
}