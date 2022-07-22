import MyMap from "./scripts/MyMap";
import './styles/index.scss';
const app = document.getElementById("app") as HTMLElement;
const myMap = new MyMap(app);
myMap.loadData("https://geojson.cn/data/100000.json");