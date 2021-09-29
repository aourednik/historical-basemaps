!(function () {
    var yes = function () { return true; };

    L.GeoJSON.MultiStyle = L.GeoJSON.extend({
        options: {
            styles: [
                {color: 'black', opacity: 0.15, weight: 9},
                {color: 'white', opacity: 0.8, weight: 6},
                {color: '#444', opacity: 1, weight: 2}
            ],
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {radius: 0})
            },
            filters: [yes, yes, yes]
        },

        addData: function(data) {
            if (!this._isAdding) {
                this._isAdding = true;
                if (this.options.styles) {
                    var styler = this.options.style,
                        filter = this.options.filter;
                    this.options.styles.forEach(L.bind(function(style, i) {
                        this.options.style = style;
                        if (this.options.filters && this.options.filters[i]) {
                            this.options.filter = this.options.filters[i];
                        }
                        L.GeoJSON.prototype.addData.call(this, data);
                    }, this));
                }
                if (this.options.pointToLayers) {
                    this.options.pointToLayers.forEach(L.bind(function(pointToLayer, i) {
                        this.options.pointToLayer = pointToLayer;
                        if (this.options.filters && this.options.filters[i]) {
                            this.options.filter = this.options.filters[i];
                        }
                        L.GeoJSON.prototype.addData.call(this, data);
                    }, this));
                }
                this.options.style = styler;
                this.options.filter = filter;
                this._isAdding = false;
            } else {
                L.GeoJSON.prototype.addData.call(this, data);
            }
        }
    });

    L.geoJson.multiStyle = function(data, options) {
        return new L.GeoJSON.MultiStyle(data, options);
    }
})();
