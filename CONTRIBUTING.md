# Contributing

You are welcome to contribute by making your [git forks](https://docs.github.com/en/github/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-and-deleting-branches-within-your-repository) and filing [git pull requests](https://docs.github.com/en/github/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork).

## Tools and technicities

### Suggested editor: QGIS

Since version 3, [QGIS](https://qgis.org) can natively edit gejson. This is especially helpful for making quick fixes. For heavier edditing, geojson support remains suboptimal: slow and bug-prone. In this case, I suggest converting geojson to geopackage, make edits and and to reexport them to geojson. __Do not use ESRI shape files as an interemediary editing format, as this would kill UTF-8 Unicode data !__ (all ë à è and ø would become ÂÃƒâ€šÃ)

A good introduction to advanced editing in QGIS can be found in [this video by Klas Karlsson](https://www.youtube.com/watch?v=jZYKGrIyVCA).

### Projection

Maps are in WGS 84 geographic projection EPSG:4326. Coordinates are recorded in LatLon. Some show a 20 km shift. This must yet be corrected.

Precision: please keep in mind that these files are intended for maps at the scale of a continent or the whole world. They should remain generalized enough to achieve file size below 3 MB.

### Deontology

When editing, please consider that the primary purpose of this repository is to facilitate mapping historical regions. There are, today, many examples of disputed territories. Contemporary India, for instance, has [territorial disputes with China, Pakistan and Nepal](https://en.wikipedia.org/wiki/List_of_disputed_territories_of_India). A solution could be to draw the borders of the India polygon as perceived / recognized by the Indian government, leaving the polygons of the surrounding countries intact (i.e., as perceived by the governments of those countries). In this manner, overlaps could help to identify disputed regions. I hope such issues can be solved in a diplomatic manner, like they have been between India and Bangladesh in 2015 or India and Sri Lanka in 1974.

### Other practical aspects

When correcting the geometries of individual geojson files, please make sure that:

1. You don't introduce topological errors (gaps and overlaps unless overlaps signify disputed borders). The QGIS plugin called _Digitizing Tools_ is particularly helpful to carve out a region out of an existing polygon with the tool "Cut with selected polygons"...
2. Boundaries that have not moved between two or more successive files remain aligned. This will allow others to make animations. The multilayer topological editing tool in QGIS 3 might help you with that.
