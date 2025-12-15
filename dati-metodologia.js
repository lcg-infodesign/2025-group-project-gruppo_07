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

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  for (let i = 0; i < colors.length; i++) {
    let cx, cy;
    let tries = 0;
    do {
      // Posizione casuale ma con spacing minimo rispetto agli altri cluster
      cx = random(width * 0.1, width * 0.9);
      cy = random(height * 0.1, height * 0.9);
      tries++;
    } while (isClusterOverlapping(cx, cy, clusterRepulsion, clusters) && tries < 600);

    // Numero di pallini casuale
    let numPallini = int(random(minPallini, maxPallini));

    let cluster = [];
    for (let j = 0; j < numPallini; j++) {
      let size = random(minSize, maxSize);
      let angle = random(TWO_PI);
      let radius = random(30, 80); // maggiore distanza tra pallini
      let x = cx + cos(angle) * radius;
      let y = cy + sin(angle) * radius;

      cluster.push({
        x, y,
        size,
        xOff: random(1000),
        yOff: random(1000)
      });
    }

    clusters.push({color: colors[i], points: cluster, cx, cy});
  }
}

function draw() {
  background("#E7E1D1");

  for (let cluster of clusters) {
    fill(cluster.color);

    // Calcoliamo il centro del cluster dinamicamente
    let centerX = 0;
    let centerY = 0;
    for (let p of cluster.points) {
      centerX += p.x;
      centerY += p.y;
    }
    centerX /= cluster.points.length;
    centerY /= cluster.points.length;

    for (let point of cluster.points) {
      // Movimento morbido con Perlin Noise
      point.x += map(noise(point.xOff), 0, 1, -0.5, 0.5);
      point.y += map(noise(point.yOff), 0, 1, -0.5, 0.5);
      point.xOff += noiseScale;
      point.yOff += noiseScale;

      // Attrazione verso il centro del cluster
      point.x += (centerX - point.x) * clusterStrength;
      point.y += (centerY - point.y) * clusterStrength;

      // Repulsione interna tra pallini
      for (let other of cluster.points) {
        if (other !== point) {
          let d = dist(point.x, point.y, other.x, other.y);
          let minDist = (point.size + other.size)/2 + 10; // distanza maggiore
          if (d < minDist && d > 0) {
            let angle = atan2(point.y - other.y, point.x - other.x);
            let push = (minDist - d) * repulsionStrength * 0.1;
            point.x += cos(angle) * push;
            point.y += sin(angle) * push;
          }
        }
      }

      ellipse(point.x, point.y, point.size);
    }
  }
}

// Controllo per evitare sovrapposizione iniziale tra cluster
function isClusterOverlapping(x, y, minDist, clusters) {
  for (let cluster of clusters) {
    let d = dist(x, y, cluster.cx, cluster.cy);
    if (d < minDist) return true;
  }
  return false;
}

