# 🌵 MF-2.5DMAP

>  一个通过geojson渲染2.5D地图案例，服务地址：https://fengtianxi001.github.io/MF-2.5DMap

## 项目简介

项目的主要功能和思路如下:

- 使用`d3.geoMercator`将`GEOJSON`数据转成`THREE.js`的世界坐标。
  
- 使用`THREE.Shape`绘制二维平面图形后，拉伸平面形成厚度。
  
- 使用`@turf/area`计算`GEOJSON.features`面积,换算比例尺，使不同级别的行政区域模型都能正常显示。
  

## 项目说明

- 项目内接口由`GeoJSON.cn`官方提供，对查询的次数有限制，请勿恶意攻击和压力查询
  

## 项目截图

![](https://raw.githubusercontent.com/fengtianxi001/MF-2.5DMap/master/screenshot/screenshot_01.gif)
