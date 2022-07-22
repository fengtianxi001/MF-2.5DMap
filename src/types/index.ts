import { MultiPolygon, Polygon } from 'geojson';

export type GeojsonType = GeoJSON.FeatureCollection<MultiPolygon | Polygon>;
export type CoordinatesType = [number, number];

export type FeatureDataType = {
  adcode: string;
  centroid: [number, number];
  name: string;
  coordinates: Array<CoordinatesType>;
};
