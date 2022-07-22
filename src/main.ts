import './styles/index.scss';
import axios from 'axios';
import * as d3 from 'd3';
import * as THREE from 'three';
import turfCenter from '@turf/center';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

//@ts-ignore
import ThreeBase from './ThreeBase.js';

const colorArr = {
  canvasColor: 0x000000, //0x051435, // 画布背景色
  phongMapColor: 0x171f34, // 地图版块颜色
  baseMapColor: 0x188ef7, //0x008BFB // 地图拉高颜色
  flowingLineColor: 0xffffff, // 流光底线色
  visibleEdgeColor: '#4EC0E9', // 发光呼吸显示的颜色
  hiddenEdgeColor: '#4EC0E9', // 发光呼吸隐藏的颜色
  mapHighlightColor: 0xffaa00, // 地图高亮颜色
};

const meshGroup = new THREE.Group();
// meshGroup.scale.x = 0.01 / 5;
// meshGroup.scale.y = 0.01 / 5;
// meshGroup.scale.z = 0.01 / 5;

const mapGeometryArray: THREE.BufferGeometry[] | THREE.ExtrudeGeometry[] = [];
const mapMaterialArray = [];
let mergeMesh = [];
class ThreeMap {
  projection: any;
  threeBase: any;
  element: HTMLElement;
  constructor(element: HTMLElement) {
    this.element = element;
    this.projection = null;
    this.threeBase = new ThreeBase(element);
    this.threeBase.initHelp();
    this.threeBase.scene.add(meshGroup);
  }
  async loadData(url?: string) {
    const { data } = await axios.get(url ?? '/geojson/ChinaMap_full.json');
    this.drawMapWithFeatures(data);
  }
  drawMapWithFeatures(data: any) {
    const features = data.features;
    this.initD3(data);
    features.forEach((feature: any) => {
      const adcode = feature.properties.adcode;
      const centerpoint = feature.properties.center;
      const coordinates = feature.geometry.coordinates;
      const type = feature.geometry.type;
      if (type === 'MultiPolygon') {
        coordinates.forEach((coordinate: any) => {
          // coordinate多边形(包含多数组)数据
          coordinate.forEach((rows: any) => {
            // console.log('rows', rows);
            this.drawMapExtrudeMesh(rows, adcode, centerpoint, feature.properties); // 绘制地图信息
            this.drawMapLine(rows); // 绘制线条和保存边界
          });
        });
      } else if (type === 'Polygon') {
        coordinates.forEach((coordinate) => {
          // coordinate多边形数据
          this.drawMapExtrudeMesh(coordinate, adcode, centerpoint, feature.properties); // 绘制地图信息
          this.drawMapLine(coordinate); // 绘制线条和保存边界
        });
      }
      //console.log('feature',feature.geometry.type)
    });
    setTimeout(() => {
      this.mergeMapMesh();
    }, 1000);
  }
  initD3(data: any) {
    console.log('turfCenter', turfCenter(data));
    // const coords = data.features[0].properties.centroid;
    const center = turfCenter(data).geometry.coordinates;
    this.projection = d3.geoMercator().scale(30).center(center).translate([0, 0]);
  }
  drawMapExtrudeMesh(polygon, adcode, centerpoint, properties) {
    let shape = new THREE.Shape();
    // const [x, y] = this.projection(polygon[0]);
    // shape.moveTo(x, -y);
    polygon.forEach((row: any, index) => {
      const [x, y] = this.projection(row);
      if (index === 0) {
        shape.moveTo(x, -y);
      } else {
        shape.lineTo(x, -y);
      }
    });
    let geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 1, // 挤出的形状的深度，默认值为1。
      steps: 1, // 用于沿着挤出样条的深度细分的点的数量，默认值为1。
      bevelEnabled: true, // 对挤出的形状应用是否斜角，默认值为true。
      bevelThickness: 0, // 设置原始形状上斜角的厚度。默认值为0.2。
      bevelSize: 0, // 斜角与原始形状轮廓之间的延伸距离，默认值为bevelThickness-0.1。
      bevelOffset: 0, // 与倒角开始的形状轮廓的距离。 默认值为 0。
      bebelSegments: 3, // 斜角的分段层数，默认值为3。
      curveSegments: 0, // 曲线上点的数量，默认值是12。
    });
    // let material_phong = new THREE.MeshPhongMaterial({
    //   color: colorArr.phongMapColor, // 材质的颜色
    //   // specular: colorArr.phongMapColor, // 材质的高光颜色
    // });
    var material_phong = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    });

    // 基础网格材质
    let material_base = new THREE.MeshBasicMaterial({
      color: colorArr.baseMapColor, //拉高边缘色
    });
    let mesh = new THREE.Mesh(geometry, [material_phong]);
    meshGroup.add(mesh);
    mapGeometryArray.push(geometry);
    mapMaterialArray.push(material_base);
    // console.log('geometry', geometry);
    // this.threeBase.scene.add(mesh)
    // let box = new THREE.Box3().setFromObject(meshGroup);
    // // 长、宽、高
    // let proportion = {
    //   x: Math.abs(box.max.x - box.min.x),
    //   y: Math.abs(box.max.y - box.min.y),
    //   z: Math.abs(box.max.z - box.min.z),
    // };
  }
  drawMapLine(polygon: any) {
    let geometry = new THREE.BufferGeometry();
    let pointsArray = new Array();

    polygon.forEach((row) => {
      const [x, y] = this.projection(row); // 墨卡托投影转换点坐标
      pointsArray.push(new THREE.Vector3(x, -y, 1.2));
    });

    geometry.setFromPoints(pointsArray);

    let material = new THREE.MeshBasicMaterial({
      color: colorArr.baseMapColor,
    });

    let line = new THREE.Line(geometry, material);
    meshGroup.add(line);
  }
  mergeMapMesh() {
    const mergeGeometries = mergeBufferGeometries(mapGeometryArray, true); // 合并几何体
    mergeMesh = new THREE.Mesh(mergeGeometries, mapMaterialArray); // 形成一个整体
    mergeMesh.translateZ(-0.5); // 设置位置
    mergeMesh.position.set(0, 0, -0.1); // 设置位置
    meshGroup.add(mergeMesh); // 合并后添加到场景
    this.displayGlowing();
  }
  displayGlowing() {
    const { clientWidth, clientHeight } = this.element;
    const { camera, scene, renderer } = this.threeBase;
    // console.log(' mergeMesh', mergeMesh)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const outlinePass = new OutlinePass(new THREE.Vector2(clientWidth, clientHeight), scene, camera, [mergeMesh]);
    outlinePass.renderToScreen = true;
    outlinePass.selectedObjects = [mergeMesh];
    composer.addPass(renderPass);
    composer.addPass(outlinePass);
    const params = {
      edgeStrength: 10,
      edgeGlow: 1,
      edgeThickness: 1,
      pulsePeriod: 10,
      usePatternTexture: false,
    };
    outlinePass.edgeStrength = params.edgeStrength;
    outlinePass.edgeGlow = params.edgeGlow;
    outlinePass.visibleEdgeColor.set('#4EC0E9');
    outlinePass.hiddenEdgeColor.set('#4EC0E9');
    composer.render(scene, camera);
    this.threeBase.composers.push(composer);
  }
}

const element = document.querySelector('#app') as HTMLElement;
const threeMap = new ThreeMap(element);
threeMap.loadData();
console.log('threeMap', threeMap);
