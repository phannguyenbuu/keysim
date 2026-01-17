import * as THREE from "three";
import geometryToBufferGeometry from './geometryToBufferGeometry.js';

const GUTTER = 0.05;
const c = 0.05; //corner inset
const i = 0.15; // inset
const it = 0.05; // inset top edge

//stores geometry for each possible size
var computed_geometries = {};

//geometry for rectangle key
export const keyGeometry = (opts) => {
  let key = `test${opts.w}${opts.h}${opts.row}`;
  if (computed_geometries[key]) {
    return computed_geometries[key].clone();
  }
  // let geometry = new THREE.Geometry();
  let w = (opts.w || 1) - GUTTER;
  let d = opts.h - GUTTER;
  let h = 0.5;

 


  const vs = [
    // bottom verticies
    [0, 0, 0],
    // 0
    [w, 0, 0],
    // 1
    [w, 0, d],
    // 2
    [0, 0, d],
    // 3
    // top for 1
    [i, h, it + c],
    // 4
    [i + c, h, it],
    // 5
    // top for 2
    [w - i - c, h, it],
    // 6
    [w - i, h, it + c],
    // 7
    // top for 3
    [w - i, h, d - i - c],
    // 8
    [w - i - c, h, d - i],
    // 9
    // top for 4
    [i + c, h, d - i],
    // 10
    [i, h, d - i - c] // 11
  ];

  const fs = [
    // top top
    [4, 7, 5],
    [7, 6, 5],
    // top bottom
    [9, 11, 10],
    [9, 8, 11],
    // top center
    [4, 11, 7],
    [8, 7, 11],
    // corner faces
    [0, 4, 5],
    [1, 6, 7],
    [2, 8, 9],
    [3, 10, 11],
    // back side
    [0, 5, 1],
    // 10
    [1, 5, 6],
    // 11
    // right side
    [2, 7, 8],
    [2, 1, 7],
    // left side
    [0, 3, 11],
    [0, 11, 4],
    // front side
    [3, 2, 9],
    [3, 9, 10]
  ];
  
  const uvs = new Array(108).fill(0);
  [25,28,29,30,32,33].forEach((i) => uvs[i] = 1);

  return geometryToBufferGeometry(vs,fs, uvs);
};





// geometry for enter key
export const keyGeometryISOEnter = (opts) => {
  if (computed_geometries["isoent"]) {
    return computed_geometries["isoent"].clone();
  }
  // let geometry = new THREE.Geometry();
  let w = (opts.w || 1) - GUTTER;
  let d = opts.h - GUTTER;
  let h = 0.4;

  // extra with of top
  let o = 0.25;

  const _vs = [
    // bottom verticies
    [-o, 0, 0],
    // 0
    [w, 0, 0],
    // 1
    [w, 0, d],
    // 2
    [0, 0, d],
    // 3
    [0, 0, 1],
    // 4
    [-o, 0, 1],
    // 5
    // top for 0
    [i - o, h, it + c],
    // 6
    [i + c - o, h, it],
    // 7
    // top for 1
    [w - i - c, h, it],
    // 8
    [w - i, h, it + c],
    // 9
    // top for 2
    [w - i, h, d - i - c],
    // 10
    [w - i - c, h, d - i],
    // 11
    // top for 3
    [i + c, h, d - i],
    // 12
    [i, h, d - i - c],
    // 13
    // top for 4 (inside corner)
    [i, h, 1 - i],
    // 14
    [i - c, h, 1 - i],
    // 15
    // top for 5
    [i + c - o, h, 1 - i],
    // 16
    [i - o, h, 1 - i - c] // 17
  ];




  const _fs = [
    // top
    [6, 9, 7],[7, 9, 8],[6, 17, 15],[17, 16, 15],[6, 15, 9],[15, 14, 9],
    [14, 10, 9],[14, 13, 10],[13, 11, 10],[13, 12, 11],
    // corners
    [0, 6, 7],[1, 8, 9],[2, 10, 11],[3, 12, 13],[4, 14, 15],[5, 16, 17],
    // sides
    [0, 7, 8],[0, 8, 1],[9, 10, 2],[9, 2, 1],[3, 2, 11],[3, 11, 12],
    [4, 3, 13],[4, 13, 14],[5, 4, 15],[5, 15, 16],[0, 5, 17],[0, 17, 6]
  ];

  let uxo = 0.2;
  let uyo = 0.35;
  const _uvs = [
    //top
    [
      [0, 1 - c], //6
      [1, 1 - c], //9
      [c, 1], //7
    ],
    [
      [c, 1], //7
      [1, 1 - c], //9
      [1 - c, 1], //8
    ],
    [
      [0, 1 - c], //6
      [0, uyo + c], //17
      [uxo - c, uyo], //15
    ],
    [
      [0, uyo + c], //17
      [c, uyo], //16
      [uxo - c, uyo], //15
    ],
    [
      [0, 1 - c], //6
      [uxo - c, uyo], //15
      [1, 1 - c], //9
    ],
    [
      [uxo - c, uyo], //15
      [uxo, uyo], //14
      [1, 1 - c], //9
    ],
    [
      [uxo, uyo], //14
      [1, c], //10
      [1, 1 - c], //9
    ],
    [
      [uxo, uyo], //14
      [uxo, c], //13
      [1, c], //10
    ],
    [
      [uxo, c], //13
      [1 - c, 0], //11
      [1, c], //10
    ],
    [
      [uxo, c], //13
      [uxo + c, 0], //12
      [1 - c, 0], //11
    ],
    //corners
    [[0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0]],
    // sides
    [[1, 0], [1, 1], [0, 1]],
    [[1, 0], [0, 1], [0, 0]],
    [[1, 1], [0, 1], [0, 0]],
    [[1, 1], [0, 0], [1, 0]],
    [[0, 0], [1, 0], [1, 1]],
    [[0, 0], [1, 1], [0, 1]],
    [[0, 0], [1, 0], [1, 1]],
    [[0, 0], [1, 1], [0, 1]],
    [[0, 0], [1, 1], [0, 1]],
    [[0, 0], [1, 0], [1, 1]],
    [[0, 0], [1, 0], [1, 1]],
    [[0, 0], [1, 1], [0, 1]]
  ];


  const uvs = new Array(84 * 2).fill(0);
  
  const geometry = geometryToBufferGeometry(_vs,_fs,uvs);
  

  return geometry;
};













