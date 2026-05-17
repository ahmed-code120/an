import * as d3Geo from "d3-geo";

const projection = d3Geo.geoOrthographic()
  .center([9.5375, 33.8869])
  .scale(200)
  .translate([400, 300])
  .rotate([-9.5375, -33.8869])
  
const pathGenerator = d3Geo.geoPath().projection(projection);

const geojson = {
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [9.5375, 33.8869]
  }
};

console.log(pathGenerator(geojson as any));
