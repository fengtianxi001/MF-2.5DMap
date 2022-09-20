# 🚀 MF-2.5DMAP
<div>
  <img src="https://img.shields.io/github/languages/top/fengtianxi001/MF-2.5DMAP">
  <img src="https://travis-ci.org/boennemann/badges.svg?branch=master">
  <img src="https://img.shields.io/github/issues/fengtianxi001/MF-2.5DMAP">
  <img src="https://img.shields.io/github/forks/fengtianxi001/MF-2.5DMAP">
  <img src="https://img.shields.io/github/stars/fengtianxi001/MF-2.5DMAP">
</div>

## 简介

一个使用`THREE.js`,根据`GEOJSON`数据生成2.5地图的简单`DEMO`,项目的主要功能和思路如下:
- 使用`d3.geoMercator`将`GEOJSON`数据转成`THREE.js`的世界坐标;
- 使用`THREE.Shape`绘制2维平面图形后,拉伸平面形成厚度;
- 使用`@turf/area`计算`GEOJSON.features`面积,换算比例尺，使不同级别的行政区域模型都能正常显示;
- 接口由`GeoJSON.cn`官方提供，对查询的次数有限制，请勿恶意攻击和压力查询


## 环境

- 推荐环境: `node:>=14.8.0`
- 作者开发环境: `node:18.6.0`

## 启动

###
```shell
yarn dev
or 
npm run dev
```


## 在线预览
[https://fengtianxi001.github.io/MF-2.5DMap/)


## 效果图

![效果图](https://raw.githubusercontent.com/fengtianxi001/MF-2.5DMap/master/screenshot/screenshot_01.gif)




​    
​    
​    
