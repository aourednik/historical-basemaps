# Contributing

Many thanks for contributing with your historical knowledge about ancient territories. 

Suggested editor: [QGIS](https://qgis.org). Since version 3, QGIS can natively edit gejson, no coversion to shp needed.

Maps are in WGS 84 geographic projection EPSG:4326. Coordinates are recorded in LatLon. Some show a 20km shift. This must yet be corrected. 

Precision: please keep in mind that these files are intedended for maps at the scale of a continent or the whole world. They should remain generalied in order to ahieve minimal file size.

When correcting individual geojson files, please make sure that boundaries that do not change between two given time periods remain aligned over all files. The multilayer topological editing tool in QGIS 3 might help you with that.
