{
    'name': 'Odoo API REST',
    'version': '1.0',
    'summary': 'API REST para integración con Next.js y React',
    'description': """
        Este módulo proporciona una API REST para integrar Odoo con aplicaciones frontend
        desarrolladas con Next.js y React.
    """,
    'author': 'Tu Nombre',
    'category': 'Technical',
    'depends': ['base', 'web', 'product', 'sale', 'contacts'],
    'data': [
        'views/views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
