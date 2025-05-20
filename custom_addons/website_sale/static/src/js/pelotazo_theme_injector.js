// Script para inyectar el tema personalizado de El Pelotazo en la tienda de Odoo

odoo.define('website_sale.pelotazo_theme', function (require) {
    'use strict';
    
    var publicWidget = require('web.public.widget');
    
    publicWidget.registry.PelotazoTheme = publicWidget.Widget.extend({
        selector: '.oe_website_sale',
        
        start: function () {
            var self = this;
            
            // Inyectar CSS
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = '/website_sale/static/src/css/pelotazo_theme.css';
            document.head.appendChild(link);
            
            // Añadir banner de El Pelotazo
            if (this.$el.find('.o_wsale_products_main_row').length > 0 && this.$el.find('.pelotazo-banner').length === 0) {
                var banner = document.createElement('div');
                banner.className = 'pelotazo-banner';
                banner.innerHTML = 'Bienvenido a la tienda online de El Pelotazo - ¡Los mejores electrodomésticos al mejor precio!';
                this.$el.find('.o_wsale_products_main_row').before(banner);
            }
            
            return this._super.apply(this, arguments);
        },
    });
    
    return publicWidget.registry.PelotazoTheme;
});
