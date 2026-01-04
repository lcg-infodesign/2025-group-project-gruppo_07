

function setup(){
  noCanvas();
  new p5(sketch, 'dati_sfondo')
}


let sketch = function(p){
let colors = ["#81201A", "#4D4871", "#C49A00", "#99AB59",
              "#8799BD", "#CA5D84", "#D97963", "#7EC1AF"];
let clusters = [];
let minSize = 3;
let maxSize = 30;
let noiseScale = 0.005; 
let clusterStrength = 0.03;
let repulsionStrength = 7.0; 
let clusterRepulsion = 200; // distanza minima tra i cluster
let minPallini = 3; // numero minimo di pallini per cluster
let maxPallini = 68; // numero massimo di pallini per cluster

p.containerCanvas = function(container){
  let w = container.width
  let h = container.height
  let canvas = p.createCanvas(w, h)
  canvas.parent(container)
}

p.setup = function() {
    let container = p.select('#dati_sfondo')
    p.containerCanvas(container)
    p.noStroke();

    for (let i = 0; i < colors.length; i++) {
      let cx, cy;
      let tries = 0;
      do {
        cx = p.random(p.width * 0.1, p.width * 0.9);
        cy = p.random(p.height * 0.1, p.height * 0.9);
        tries++;
      } while (isClusterOverlapping(cx, cy, clusterRepulsion, clusters) && tries < 600);

      let numPallini = p.int(p.random(minPallini, maxPallini));
      let clusterPoints = [];

      for (let j = 0; j < numPallini; j++) {
        let size = p.random(minSize, maxSize);
        let angle = p.random(p.TWO_PI);
        let radius = p.random(30, 80);
        let x = cx + p.cos(angle) * radius;
        let y = cy + p.sin(angle) * radius;

        clusterPoints.push({
          x, y,
          size,
          xOff: p.random(1000),
          yOff: p.random(1000)
        });
      }

      clusters.push({ color: colors[i], points: clusterPoints, cx, cy });
    }
  };

  p.draw = function() {
    p.background("#E7E1D1");

    for (let cluster of clusters) {
      p.fill(cluster.color);

      // Calcolo centro dinamico
      let centerX = 0;
      let centerY = 0;
      for (let pt of cluster.points) {
        centerX += pt.x;
        centerY += pt.y;
      }
      centerX /= cluster.points.length;
      centerY /= cluster.points.length;

      for (let point of cluster.points) {
        // Movimento Perlin Noise
        point.x += p.map(p.noise(point.xOff), 0, 1, -0.5, 0.5);
        point.y += p.map(p.noise(point.yOff), 0, 1, -0.5, 0.5);
        point.xOff += noiseScale;
        point.yOff += noiseScale;

        // Attrazione verso il centro
        point.x += (centerX - point.x) * clusterStrength;
        point.y += (centerY - point.y) * clusterStrength;

        // Repulsione interna
        for (let other of cluster.points) {
          if (other !== point) {
            let d = p.dist(point.x, point.y, other.x, other.y);
            let minDist = (point.size + other.size) / 2 + 10;
            if (d < minDist && d > 0) {
              let angle = p.atan2(point.y - other.y, point.x - other.x);
              let push = (minDist - d) * repulsionStrength * 0.1;
              point.x += p.cos(angle) * push;
              point.y += p.sin(angle) * push;
            }
          }
        }

        p.ellipse(point.x, point.y, point.size);
      }
    }
  };

  // Funzione di utilità interna
  function isClusterOverlapping(x, y, minDist, clusters) {
    for (let cluster of clusters) {
      let d = p.dist(x, y, cluster.cx, cluster.cy);
      if (d < minDist) return true;
    }
    return false;
  }

  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

