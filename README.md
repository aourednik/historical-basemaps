# Historical boundaries of world countries

![world bc 2000 DRAFT](https://github.com/aourednik/historical-basemaps/world_bc2000.png)

This historical boundaries project aims at providing ready-to-use base maps for mapping historical data.

All maps are stored in the geojson format: single file per feature layer, human and machine readable, easy to import in qGIS. Maps resolution is adapted for mapping data on the scale of the whole world.

Maps are in WGS 84 projection EPSG:4326. For now, a 2km shift in most places.

When correcting individual geojson files, please make sure that boundaries remain aligned over all files. The multilayer topological editing tool in QGIS 3 might help you with that.

When using the data, keep in mind that

1. historical boundaries are even more disputed than contemporary ones, that
2. the actual concept of territory and national boundary becomes meaningful, in Europe, only since the [Peace of Westphalia](https://en.wikipedia.org/wiki/Peace_of_Westphalia) (1648), that
3. areas of civilizations actually overlap, especially in ancient history, and that
4. overlaying these ancient vector maps on contemporary physical maps can be misleading; rivers, lakes, shorelines _do_ change very much over millenia; think for instance about the evolution of the [Aral sea](https://en.wikipedia.org/wiki/Aral_Sea) since the 1980s.

Finally, note that overlapping areas are useally dealt with as topological errors in traditional GIS. Fuzzy borders are difficult to handle. Certainly a field to investigate...

## Credits

This project is a collection of basemaps collected, adpated and converted from diverse sources, sometimes only available through the wayback machine. Among these, anonymous students from the "ThinkQuest Team C006628".

## Some (rare) GIS resources on the web

* [GIS data : historical country boundaries](https://www.gislounge.com/find-gis-data-historical-country-boundaries/)
* [CShapes by Niels Weidman](http://nils.weidmann.ws/projects/cshapes.html), also available as an R package.
* [Interactive World History Atlas since 3000 BC](http://geacron.com/home-en/)

## Other, non-GIS resources

* [Wikimedia: Maps of the world showing history](https://commons.wikimedia.org/wiki/Category:Maps_of_the_world_showing_history)
