export const EXTRUDE_GEOMETRY_OPTIONS = {
  depth: 1, // 挤出的形状的深度，默认值为1。
  steps: 1, // 用于沿着挤出样条的深度细分的点的数量，默认值为1。
  bevelEnabled: true, // 对挤出的形状应用是否斜角，默认值为true。
  bevelThickness: 0, // 设置原始形状上斜角的厚度。默认值为0.2。
  bevelSize: 0, // 斜角与原始形状轮廓之间的延伸距离，默认值为bevelThickness-0.1。
  bevelOffset: 0, // 与倒角开始的形状轮廓的距离。 默认值为 0。
  curveSegments: 0, // 曲线上点的数量，默认值是12。
};
