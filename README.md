# 🌵 MF-2.5DMAP

> 一个通过 geojson 渲染 2.5D 地图案例，服务地址
> ：https://fengtianxi001.github.io/MF-2.5DMap

## 项目简介

项目的主要功能和思路如下:

- 使用[DATAV.GeoAltas](https://datav.aliyun.com/portal/school/atlas/area_selector)获取行政区的`geojson`

- 原本计划将`geojson`中的`WGS84坐标系`转换成`墨卡托投影坐标系`再进行渲染, 实践中发现意义不大,且每次涉及坐标系转换都会有精度损失,最终决定直接使用`WGS84`坐标系进行渲染。

- 随后面临一个选择是，是否需要将`geojson`的中心点设置到`THREE.js`世界坐标的原点。如果要这么做的话，需要我计算出`centroid`后,将所有坐标与`centroid`相减，优点是这样做符合直觉，缺点是以后涉及坐标的计算都需要加上`centroid`的偏移量，觉得有点麻烦决定不做这个操作。

- 遍历`geojson`使用`THREE.Shape`绘制二维平面图形后，挤压平面形成厚度。

- 根据不同行政区的大小和位置不同，自动调整相机的位置和缩放比例。

- 加入开场动画和行政区选择

## 项目说明

- 项目使用[DATAV.GeoAltas](https://datav.aliyun.com/portal/school/atlas/area_selector)开源接口，对查询的次数有限制，请勿恶意攻击和压力查询

## 项目截图

![](https://raw.githubusercontent.com/fengtianxi001/MF-2.5DMap/master/screenshot/screenshot_01.gif)
