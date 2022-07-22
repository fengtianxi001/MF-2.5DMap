import MyMap from "./scripts/MyMap";
import './styles/index.scss';
const app = document.getElementById("app") as HTMLElement;
const myMap = new MyMap(app);
myMap.loadData("/geojson/ChinaMap_full.json");