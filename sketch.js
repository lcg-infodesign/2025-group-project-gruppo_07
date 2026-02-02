

//javascript

//botton/ancore per scendere/salire
const buttons = document.querySelectorAll('.SlideBtn, .skipBtn, .UpperSlide, .re-watch');
//div che racchiude tutte le sezioni
const closedContainer = document.querySelector('.no_scroll');
//pagina del grafico
const ending = document.querySelector('.ending');

const animatedElements = document.querySelectorAll(
  '.bg_wrapper, .text, .text2, .pointer, .pointer2, .pointer3, .text3, ' +
  '#falseControls, ' +
  '.falseBtn, .falseTimeLine, .text4, .text5, .sl1, .sl2, .sl3, .sl4, ' +
  '.sl6, .explanation4, .explanation5, .text6, .text7, .hover-demo, ' +
  '.demo-video, .sl5, .sl7, .sl8, .up1, .up2, .up3, .up4, .u3b'
);



//Animazioni quando si entra in vista   
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    } else {
      entry.target.classList.remove('show');
    }
  });
}, {
  threshold: 0.2
});

animatedElements.forEach(el => observer.observe(el));







//SLIDESHOW


// interazione coi bottoni
buttons.forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();

    const targetSelector = btn.getAttribute('href');
    const arrivo = document.querySelector(targetSelector);
    if (!arrivo) return;

    arrivo.scrollIntoView({ behavior: 'smooth' });
  });
});


//evita che i bottoni vengano cliccati prima che essi compaiano
const animatedButtons = document.querySelectorAll('.SlideBtn, .UpperSlide');

animatedButtons.forEach(btn => {
  btn.style.pointerEvents = 'none';

  btn.addEventListener('animationstart', () => {
    btn.style.pointerEvents = 'auto';
  });
});

//fine javascript classico




//p5js

let table;
let tableTime;
let colonne = []
let costumRadius = {
  "britain": { r: 295 },
  "france": { r: 255 },
  "spain": { r: 255 },
  "portugal": { r: 180 },
  "germany": { r: 200 },
  "belgium": { r: 90 },
  "netherlands": { r: 110 },
  "italy": { r: 90 }
};
let clusters = [];
let outerCluster;
let forceSlider;
let colonizerGroups = new Map();
let clusterColorsByName = {
  "britain": "#81201A",
  "france": "#4D4871",
  "spain": "#C49A00",
  "portugal": "#99AB59",
  "germany": "#8799BD",
  "belgium": "#CA5D84",
  "netherlands": "#D97963",
  "italy": "#7EC1AF"
};


let customPositions = {};

function preload() {
  table = loadTable("assets/COLDAT_dyads - Foglio6.csv", "csv", "header");
  tableTime = loadTable("assets/colonie_per_anno.csv", "csv", "header")
}




function setup() {
  noCanvas()

  for (let i = 0; i < table.getRowCount(); i++) {
    let row = table.getRow(i);
    let colonizer = row.get("colonizer");
    let country = row.get("country");
    let duration = parseFloat(row.get("Duration")) || 0;
    let endYear = parseFloat(row.get("colend_max")) || 0;
    let startYear = parseFloat(row.get("colstart_max")) || 0;

    if (!colonizerGroups.has(colonizer)) colonizerGroups.set(colonizer, []);
    colonizerGroups.get(colonizer).push({ country, duration, endYear, startYear });
  }

  for (let i = 0; i < 2; i++) {
    let colums = tableTime.getColumn(i);
    colonne[i] = colums.map(i => float(i))
    console.log(colonne)
  }

  //new p5(sketch, 'general_view')
  new p5(sketch1, 'time_view')
}


let sketch1 = function (p) {
  let localClusters = [];
  let outerCluster;
  let forceSlider;
  let globalMinStart = Infinity;
  let globalMaxStart = -Infinity;
  let globalMinEnd = Infinity;
  let globalMaxEnd = -Infinity;
  let globalMinDuration = Infinity;
  let globalMaxDuration = -Infinity;
  let playCheckBox;
  let speedCheckBox;
  let isPlaying = false;
  let isSpeeding = false;
  let hoveredSphere = null;
  let sliderHover = false;
  let sliderX = 0;
  let sliderY = 0;
  let sliderW = 0;
  let sliderH = 0;
  let hoverAlpha = 0;
  let hoverAlpha2 = 0
  let hoverOffset = 20;




  let paragraphs = [
    {
      start: 1500,
      end: 1600,
      dates: "1500-1600",
      title: "Early Overseas Expansion",
      text: "In the sixteenth century, European powers began extending their presence across the oceans. Spain and Portugal established early maritime empires following the voyages of Columbus and Vasco da Gama, linking Europe with the Americas, Africa, and Asia. These routes created the first global trading systems and marked the beginning of sustained European activity beyond the continent.",
      alpha: 0,
      yOffset: 20,
      titleAlpha: 0,
      titleOffset: 40,
      datesAlpha: 0,
      datesOffset: 50
    },
    {
      start: 1750,
      end: 1820,
      dates: "1750-1820",
      title: "Commercial Empires Growth",
      text: "By the late eighteenth century, colonial empires had become central to global trade and power. Britain, France, and the Netherlands expanded their maritime networks, while Spain and Portugal declined. Conflicts such as the Seven Years’ War confirmed British dominance in India and North America. Colonial economies increasingly supplied raw materials for industrial growth, reinforcing the connection between empire and commerce.",
      alpha: 0,
      yOffset: 20,
      titleAlpha: 0,
      titleOffset: 40,
      datesAlpha: 0,
      datesOffset: 50
    },
    {
      start: 1880,
      end: 1914,
      dates: "1880-1914",
      title: "Peak of Imperialism",
      text: "The decades before World War I represented the peak of European imperial power. Driven by industrialization, nationalism, and competition, European states pursued territorial control in Africa, Asia, and the Pacific. The Scramble for Africa and the spread of colonial administration extended European authority over much of the world, creating vast empires that defined global politics by 1914.",
      alpha: 0,
      yOffset: 20,
      titleAlpha: 0,
      titleOffset: 40,
      datesAlpha: 0,
      datesOffset: 50
    },
    {
      start: 1945,
      end: 2000,
      dates: "1945-2000",
      title: "Postcolonial Era",
      text: "After World War II, European dominance declined as decolonization reshaped global structures. Economic weakness, independence movements, and shifting international norms led to the dissolution of most colonial empires. Beginning with India in 1947, the process spread across Asia and Africa and continued into the late twentieth century. By 2000, nearly all colonies had gained sovereignty, yet new forms of economic and political dependence, often termed neo-colonialism, continued to influence global relations.",
      alpha: 0,
      yOffset: 20,
      titleAlpha: 0,
      titleOffset: 40,
      datesAlpha: 0,
      datesOffset: 50
    }
  ];



  p.createContainerCanvas = function (container) {
    let w = container.width;
    let h = container.height;
    let canvas = p.createCanvas(w, h);
    canvas.parent(container);
  }

  p.setup = function () {
    let container = p.select('#canvas_layer');
    p.createContainerCanvas(container);

    forceSlider = p.createSlider(0, 100, 0, 0.01);
    let sliderWidth = p.constrain(p.floor(p.windowWidth * 0.4), 200, 800);
    forceSlider.style('width', sliderWidth + 'px');
    forceSlider.style("z-index", "99999")
    forceSlider.parent('slider_wrapper');

    for (let i = 0; i < table.getRowCount(); i++) {
      let row = table.getRow(i);
      let duration = parseFloat(row.get("Duration")) || 0;

      if (duration < globalMinDuration) globalMinDuration = duration;
      if (duration > globalMaxDuration) globalMaxDuration = duration;
    }


    p.updateSliderGradient = function () {
      let val = forceSlider.value();
      let min = forceSlider.elt.min;
      let max = forceSlider.elt.max;
      let percent = ((val - min) / (max - min)) * 100;

      let leftOffset = 1;
      let rightOffset = 1;
      let fillPercent = leftOffset + ((percent / 100) * (100 - leftOffset - rightOffset));

      forceSlider.elt.style.background = `
    linear-gradient(
      to right,
      transparent 0.9%,
      #313131 ${leftOffset}%,
      #313131 ${fillPercent}%,
      transparent ${fillPercent}%,
      transparent ${100 - rightOffset}%
    )
  `;
    }


    forceSlider.input(p.updateSliderGradient);

    playCheckBox = p.select('#playBtn')
    playCheckBox.changed(() => {
      // Se siamo al massimo e si riclicca play, riparti da zero
      if (playCheckBox.checked() && forceSlider.value() >= 100) {
        forceSlider.value(0);
        p.updateSliderGradient();
      }
      isPlaying = playCheckBox.checked();
    });

    speedCheckBox = p.select('#speedBtn');
    speedCheckBox.changed(() => {
      isSpeeding = speedCheckBox.checked()
    })



    // calcolo timeline globale
    for (let i = 0; i < table.getRowCount(); i++) {
      let row = table.getRow(i);
      let start = parseFloat(row.get("colstart_max")) || 0;
      let end = parseFloat(row.get("colend_max")) || 0;
      if (start < globalMinStart) globalMinStart = start;
      if (start > globalMaxStart) globalMaxStart = start;
      if (end < globalMinEnd) globalMinEnd = end;
      if (end > globalMaxEnd) globalMaxEnd = end;
    }

    outerCluster = { x: (p.width / 2) + 200, y: p.height / 2, r: 400 };

    // posizioni cluster
    let positions = {
      "britain": { x: (p.width * 0.48) + 200, y: p.height * 0.54 },
      "france": { x: (p.width * 0.38) + 200, y: p.height * 0.68 },
      "spain": { x: (p.width * 0.42) + 200, y: p.height * 0.23 },
      "portugal": { x: (p.width * 0.56) + 200, y: p.height * 0.30 },
      "germany": { x: (p.width * 0.65) + 200, y: p.height * 0.43 },
      "belgium": { x: (p.width * 0.60) + 200, y: p.height * 0.60 },
      "netherlands": { x: (p.width * 0.53) + 200, y: p.height * 0.79 },
      "italy": { x: (p.width * 0.38) + 200, y: p.height * 0.37 }
    };

    Array.from(colonizerGroups.keys()).forEach(colonizer => {
      let pos = positions[colonizer];
      let colr = clusterColorsByName[colonizer];
      let rad = costumRadius[colonizer].r;
      localClusters.push(new Cluster(pos.x, pos.y, rad, colonizerGroups.get(colonizer), colonizer, colr));
    });

    // Ripristina la posizione della timeline se esiste
    let savedSliderPosition = localStorage.getItem('timelinePosition');
    if (savedSliderPosition) {
      forceSlider.value(parseFloat(savedSliderPosition));
      p.updateSliderGradient();
      // Pulisci il localStorage dopo il caricamento
      localStorage.removeItem('timelinePosition');
    }
  }

  p.keyPressed = function () {
    // SPACE bar
    if (p.key === ' ') {
      isPlaying = !isPlaying;


      if (playCheckBox) {
        playCheckBox.checked(isPlaying);
      }

      // evita lo scroll della pagina
      return false;
    }
  };



  p.draw = function () {
    p.clear();

    if (isPlaying) {
      let val = forceSlider.value();
      if (val < 100) {
        forceSlider.value(val + 0.05);
        p.updateSliderGradient();
      } else {
        isPlaying = false;
        playCheckBox.checked(false);
      }
    }

    if (isPlaying && isSpeeding) {
      let val = forceSlider.value()
      if (val < 100) {
        forceSlider.value(val + 0.1);
        p.updateSliderGradient();
      } else {
        isPlaying = false;
        playCheckBox.checked(false)
        isSpeeding = false;
        speedCheckBox.checked(false)
      }
    }

    for (let cl of localClusters) {
      cl.update();
      cl.show();

    }



    hoveredSphere = null;
    p.cursor('default');

    for (let cl of localClusters) {

      let centerDist = p.dist(p.mouseX, p.mouseY, cl.x, cl.y);
      if (centerDist < cl.r / 12) {
        p.cursor('pointer')
      }
      for (let s of cl.sphere) {

        let d = p.dist(p.mouseX, p.mouseY, s.x, s.y);
        let distToClusterCenter = p.dist(cl.x, cl.y, s.x, s.y);
        //valori dello slider
        let f = forceSlider.elt.getBoundingClientRect();
        sliderX = f.left - p.canvas.getBoundingClientRect().left;
        sliderY = f.top - p.canvas.getBoundingClientRect().top;
        sliderW = f.width;
        sliderH = f.height;

        let hoverSlider = p.mouseX >= sliderX &&
          p.mouseX <= sliderX + sliderW &&
          p.mouseY >= sliderY - 20 &&
          p.mouseY <= sliderY + sliderH

        let sliderVal = forceSlider.value() / 100;
        let tStart = p.map(s.startYear, globalMinStart, globalMaxStart, 0.0218, 0.9709);
        let tEnd = p.map(s.endYear, globalMinEnd, globalMaxEnd, 0.3464, 0.9701);


        p.text(forceSlider.value(), sliderX, sliderY + 50)


        if (hoverSlider) continue; //Evita che le sfere dietro lo slider abbiano uno stato di hover
        if (d < s.r / 2) {
          p.cursor('pointer');
          hoveredSphere = s;
          p.push();


          p.stroke("#313131");
          p.fill("#e7e1d1ff");

          p.textSize(14);
          let textW = p.textWidth(s.country);
          let textW2 = p.textWidth(cl.name)

          let padding = 20;
          let boxW = textW + padding * 2;
          let boxW2 = textW2 + padding * 2;
          let boxH = 30;



          //targhette per i nomi delle colonie
          p.rect(p.mouseX + 10, p.mouseY - boxH - 5, boxW, boxH, 0);

          if (sliderVal < tStart || sliderVal > tEnd) {

            p.push()
            p.noStroke()
            p.fill("#313131");
            p.textFont("montserrat")
            p.textAlign(p.CENTER, p.CENTER);
            p.text(s.country, p.mouseX + 10 + boxW / 2, p.mouseY - boxH / 2 - 5);
            p.pop()
            p.pop()

          } else {
            p.push()
            p.noStroke()
            p.fill(cl.colr);
            p.textFont("montserrat");
            p.textStyle(p.BOLD)
            p.textAlign(p.CENTER, p.CENTER);
            p.text(cl.name.toUpperCase(), p.mouseX + 10 + boxW / 2, p.mouseY - boxH / 2 - 30);
            p.pop()

            p.push()
            p.noStroke()
            p.fill("#313131");
            p.textFont("montserrat")
            p.textAlign(p.CENTER, p.CENTER);
            p.text(s.country, p.mouseX + 10 + boxW / 2, p.mouseY - boxH / 2 - 5);
            p.pop()
            p.pop()
          }



        }
      }
    }

    // Ottieni posizione reale dello slider
    let r = forceSlider.elt.getBoundingClientRect();
    sliderX = r.left - p.canvas.getBoundingClientRect().left;
    sliderY = r.top - p.canvas.getBoundingClientRect().top;
    sliderW = r.width;
    sliderH = r.height;




    // Detect hover
    if (
      p.mouseX >= sliderX &&
      p.mouseX <= sliderX + sliderW &&
      p.mouseY >= sliderY - 20 &&
      p.mouseY <= sliderY + sliderH
    ) {
      sliderHover = true;
    } else {
      sliderHover = false;
    }

    // Animazione
    if (sliderHover) {
      hoverAlpha = p.lerp(hoverAlpha, 200, 0.15);
      hoverAlpha2 = p.lerp(hoverAlpha2, 255, 0.15)
      hoverOffset = p.lerp(hoverOffset, 0, 0.15);
    } else {
      hoverAlpha = p.lerp(hoverAlpha, 0, 0.15);
      hoverAlpha2 = p.lerp(hoverAlpha2, 0, 0.15)
      hoverOffset = p.lerp(hoverOffset, 20, 0.15);
    }



    if (hoverAlpha > 1) {
      let fixedX = sliderX + sliderW / 2;

      // Rettangolo
      p.push();
      p.noStroke();
      //p.fill(49, 49, 49, hoverAlpha);  
      p.noFill()
      p.rectMode(p.CENTER);
      p.rect(fixedX, sliderY - 30 + hoverOffset, sliderW, 50, 3);
      p.pop();

      // Grafico
      let graphHeight = 50;
      p.push();

      p.translate(sliderX, sliderY - 30 + hoverOffset - graphHeight / 2);

      p.curveTightness(-0.2);
      p.beginShape();
      p.fill(231, 225, 209, hoverAlpha2)
      p.stroke(49, 49, 49, hoverAlpha2)
      p.strokeWeight(1)


      let firstX = p.map(colonne[0][0], p.min(...colonne[0]), p.max(...colonne[0]), sliderW * 0, sliderW * 1);
      let firstY = p.map(colonne[1][0], p.min(...colonne[1]), p.max(...colonne[1]), graphHeight, graphHeight * 0.05);
      p.curveVertex(firstX, firstY);

      for (let i = 0; i < colonne[0].length; i += 40) {
        let x = p.map(colonne[0][i], p.min(...colonne[0]), p.max(...colonne[0]), sliderW * 0, sliderW * 1);
        let y = p.map(colonne[1][i], p.min(...colonne[1]), p.max(...colonne[1]), graphHeight, graphHeight * 0.05);

        p.curveVertex(x, y);
      }


      let lastIndex = colonne[0].length - 1;
      let lastX = p.map(colonne[0][lastIndex], p.min(...colonne[0]), p.max(...colonne[0]), sliderW * 0, sliderW * 1);
      let lastY = p.map(colonne[1][lastIndex], p.min(...colonne[1]), p.max(...colonne[1]), graphHeight, graphHeight * 0.05);
      p.curveVertex(lastX, lastY); // Punto di controllo finale



      p.endShape();
      p.pop();






      //progress graph
      p.push()
      p.beginClip()
      p.push()
      p.translate(sliderX, sliderY - 30 + hoverOffset - graphHeight / 2);
      p.beginShape();

      p.curveVertex(firstX, firstY);

      for (let i = 0; i < colonne[0].length; i += 40) {
        let x = p.map(colonne[0][i], p.min(...colonne[0]), p.max(...colonne[0]), sliderW * 0, sliderW * 1);
        let y = p.map(colonne[1][i], p.min(...colonne[1]), p.max(...colonne[1]), graphHeight * 0.96, graphHeight * 0.05);

        p.curveVertex(x, y);

      }

      p.curveVertex(lastX, lastY);

      p.vertex(lastX, graphHeight);
      p.vertex(firstX, graphHeight);

      p.endShape(p.CLOSE)
      p.pop()
      p.endClip()

      let progressWidth = p.map(forceSlider.value(), 0, 100, 0, sliderW);
      p.fill(49, 49, 49, hoverAlpha2)
      p.rect(sliderX, sliderY - 58, progressWidth, 60)

      p.pop()

      // evidenziazione prova

      p.push()
      // evidenziazione linea del grafico
      p.push()
      p.beginClip()
      p.rect(sliderX + sliderW * 0.09, sliderY - 58, sliderW * 0.1819, 50)
      p.rect(sliderX + sliderW * 0.5446, sliderY - 30, sliderW * 0.1213, 50)
      p.rect(sliderX + sliderW * 0.7810, sliderY - 58, sliderW * 0.0635, 50)
      p.rect(sliderX + sliderW * 0.8991, sliderY - 50, sliderW * 0.1009 + 50, 60)
      p.endClip()

      p.translate(sliderX, sliderY - 30 + hoverOffset - graphHeight / 2);
      p.beginShape();
      p.stroke(49, 49, 49, hoverAlpha2)
      p.strokeWeight(4)
      p.noFill()

      p.curveVertex(firstX, firstY);

      for (let i = 0; i < colonne[0].length; i += 40) {
        let x = p.map(colonne[0][i], p.min(...colonne[0]), p.max(...colonne[0]), sliderW * 0, sliderW * 1);
        let y = p.map(colonne[1][i], p.min(...colonne[1]), p.max(...colonne[1]), graphHeight * 0.96, graphHeight * 0.05);

        p.curveVertex(x, y);
      }

      p.curveVertex(lastX, lastY);
      p.curveVertex(lastX, lastY);


      p.endShape();
      p.pop()
      p.pop()
      p.push()
      p.fill(49, 49, 49, hoverAlpha2)
      //primo picco
      p.circle(sliderX + sliderW * 0.09, sliderY - 10 + hoverOffset, 12)
      p.circle(sliderX + sliderW * 0.2736, sliderY - 20 + hoverOffset, 12)
      //secondo picco
      p.circle(sliderX + sliderW * 0.5446, sliderY - 27 + hoverOffset, 12)
      p.circle(sliderX + sliderW * 0.6719, sliderY - 25 + hoverOffset, 12)
      //terzo picco
      p.circle(sliderX + sliderW * 0.7810, sliderY - 33 + hoverOffset, 12)
      p.circle(sliderX + sliderW * 0.8445, sliderY - 50 + hoverOffset, 12)

      //quarto picco
      p.circle(sliderX + sliderW * 0.8991, sliderY - 45 + hoverOffset, 12)
      p.circle(sliderX + sliderW * 1, sliderY - 10 + hoverOffset, 12)
      p.pop()

    }







    //data 

    // --- NUOVA LOGICA COUNTER E ANNO ---
    let currentYear = Math.round(
      p.map(forceSlider.value(), 0, 100, 1450, 2000)
    );

    let activeCount = 0;

    for (let cl of localClusters) {
      for (let s of cl.sphere) {

        if (currentYear >= s.startYear && currentYear < s.endYear) {
          activeCount++;
        }

      }
    }


    // Usiamo window.document per essere sicuri di uscire dallo scope di p5
    let yearEl = window.document.getElementById('year-display');
    let countEl = window.document.getElementById('counter-colonies');

    if (yearEl) yearEl.innerText = currentYear;
    if (countEl) countEl.innerText = activeCount;

    for (let pg of paragraphs) {
      let inRange = currentYear >= pg.start && currentYear <= pg.end;

      let targetAlpha = inRange ? 255 : 0;
      let targetOffset = inRange ? 0 : 30;

      pg.alpha = p.lerp(pg.alpha, targetAlpha, 0.08);
      pg.yOffset = p.lerp(pg.yOffset, targetOffset, 0.08);


      let titleTarget = inRange ? 255 : 0;
      let titleOffsetTarget = inRange ? 0 : 40;

      pg.titleAlpha = p.lerp(pg.titleAlpha, titleTarget, 0.1);
      pg.titleOffset = p.lerp(pg.titleOffset, titleOffsetTarget, 0.1);

      let datesTarget = inRange ? 255 : 0;
      let datesOffsetTarget = inRange ? 0 : 50;

      pg.datesAlpha = p.lerp(pg.datesAlpha, datesTarget, 0.12)
      pg.datesOffset = p.lerp(pg.datesOffset, datesOffsetTarget, 0.12)

    }

    p.push()
    p.stroke("#313131")
    p.strokeWeight(1)



    //paragrafi

    let baseX = p.width * 0.10;
    let baseY = p.height * 0.18;
    let boxW = 410;

    for (let pg of paragraphs) {

      //DATE
      if (pg.datesAlpha > 1) {
        p.push()
        p.noStroke();
        p.fill(49, 49, 49, pg.datesAlpha);
        p.textFont("montserrat");
        p.textSize(14);
        p.textStyle(p.BOLD);
        p.textAlign(p.LEFT, p.TOP);

        p.text(pg.dates, baseX, (baseY + pg.datesOffset) - 30, boxW)
        p.pop()
      }

      // TITOLO
      if (pg.titleAlpha > 1) {
        p.push();
        p.noStroke();
        p.fill(49, 49, 49, pg.titleAlpha);
        p.textFont("benton-modern-display");
        p.textSize(28);
        p.textStyle(p.BOLD);
        p.textAlign(p.LEFT, p.TOP);

        p.text(pg.title, baseX, (baseY + 20 + pg.titleOffset) - 30, boxW);
        p.pop();
      }

      // TESTO
      if (pg.alpha > 1) {
        p.push();
        p.noStroke();
        p.fill(49, 49, 49, pg.alpha);
        p.textFont("montserrat");
        p.textSize(14);
        p.textStyle(p.NORMAL);
        p.textAlign(p.LEFT, p.TOP);

        p.text(
          pg.text, baseX, baseY + 28 + pg.yOffset, boxW, 190);

        p.push()
        p.textFont("montserrat");
        p.textSize(14);
        p.textLeading(20);

        let lines = Math.ceil(
          p.textWidth(pg.text) / boxW
        );

        let textHeight = lines * p.textLeading();

        p.noStroke()
        p.fill(49, 49, 49, pg.alpha);
        p.rect(baseX - 10, baseY + 28 + pg.yOffset, 1, textHeight - 5)
        p.pop()
        p.pop();
      }
    }




  }

  p.mousePressed = function () {
    let sliderBox = forceSlider.elt.getBoundingClientRect();
    let mx = p.mouseX + window.scrollX;
    let my = p.mouseY + window.scrollY;

    if (
      mx >= sliderBox.left && mx <= sliderBox.right &&
      my >= sliderBox.top && my <= sliderBox.bottom
    ) {
      return;
    }

    for (let cl of localClusters) {
      // Click sui pallini grandi (paesi)
      for (let s of cl.sphere) {
        let d = p.dist(p.mouseX, p.mouseY, s.x, s.y);
        //valori dello slider
        let f = forceSlider.elt.getBoundingClientRect();
        sliderX = f.left - p.canvas.getBoundingClientRect().left;
        sliderY = f.top - p.canvas.getBoundingClientRect().top;
        sliderW = f.width;
        sliderH = f.height;

        let hoverSlider = p.mouseX >= sliderX &&
          p.mouseX <= sliderX + sliderW &&
          p.mouseY >= sliderY - 20 &&
          p.mouseY <= sliderY + sliderH

        if (hoverSlider) continue;

        if (d < s.r) {
          // SALVA la posizione dello slider prima di andare alla pagina
          localStorage.setItem('timelinePosition', forceSlider.value());
          let pageUrl = "inghilterra.html?colonizer=" + cl.name + "&country=" + encodeURIComponent(s.country);
          window.location.href = pageUrl;
          return;
        }
      }

      // Click sul pallini centrale (colonizzatore)
      let dCenter = p.dist(p.mouseX, p.mouseY, cl.x, cl.y);
      if (dCenter < 10) {
        // SALVA la posizione dello slider
        localStorage.setItem('timelinePosition', forceSlider.value());
        let pageUrl = "inghilterra.html?colonizer=" + cl.name;
        window.location.href = pageUrl;
        return;
      }

      // Click sul nome colonizzatore
      /*if (cl.nameAlpha > 2) {
      let textX = cl.x;
      let textY = cl.y - 25;
      let textWidth = p.textWidth(cl.name.toUpperCase());
      let textHeight = 12;
      let padding = 10;

      if (p.mouseX > textX - textWidth / 2 - padding &&
          p.mouseX < textX + textWidth / 2 + padding &&
          p.mouseY > textY - textHeight / 2 - padding &&
          p.mouseY < textY + textHeight / 2 + padding) {
        // SALVA la posizione dello slider
        localStorage.setItem('timelinePosition', forceSlider.value());
        let pageUrl = "inghilterra.html?colonizer=" + cl.name;
        window.location.href = pageUrl;
        return;
      }
    }*/
    }
  };

  class Cluster {
    constructor(x, y, r, data, name, colr) {
      this.x = x;
      this.y = y;
      this.r = r;
      this.name = name;
      this.colr = colr;
      this.data = data;
      this.sphere = [];
      this.rectWidth = 0;
      this.rectHeight = 0;
      this.alpha = 255;
      this.nameAlpha = 255;

      let maxDur = Math.max(...data.map(d => d.duration));
      for (let rec of data) {
        let angle = p.random(0, p.TWO_PI);
        let x = outerCluster.x + p.cos(angle) * outerCluster.r;
        let y = outerCluster.y + p.sin(angle) * outerCluster.r;
        let br = p.map(rec.duration, globalMinDuration, globalMaxDuration, 10, 42); //grandezza delle sfere compresa tra 5 e 36

        this.sphere.push({
          x, y, r: 10, targetR: br,
          v: p.createVector(0, 0),
          startYear: rec.startYear,
          endYear: rec.endYear,
          country: rec.country,
          colr: p.color(colr),
          currentColor: p.color(180),
          fadeAlpha: 255
        });
      }
    }

    update() {
      let sliderVal = forceSlider.value();
      for (let s of this.sphere) {
        let sliderYear = p.map(
          forceSlider.value(), 0, 100, 1450, 2000);
        // Timeline globale corretta 
        let tStart = s.startYear
        let tEnd = s.endYear
        if (sliderYear < tStart) {
          let angle = p.atan2(s.y - outerCluster.y, s.x - outerCluster.x);
          s.x = outerCluster.x + p.cos(angle) * outerCluster.r;
          s.y = outerCluster.y + p.sin(angle) * outerCluster.r;
          s.r = 10;
          s.currentColor = p.color(180);
        } else if (sliderYear >= tStart && sliderYear < tEnd) {
          s.currentColor = p.lerpColor(s.currentColor, s.colr, 0.1);
          let dInternal = p.createVector(this.x - s.x, this.y - s.y);
          dInternal.mult(0.005);
          s.v.add(dInternal);
          let distToCenter = p.dist(s.x, s.y, this.x, this.y);
          let localProgress = p.map(sliderYear, tStart, tEnd, 0, 1);
          localProgress = p.constrain(localProgress, 0, 1);
          if (distToCenter < this.r * 0.9) {
            s.r = p.lerp(10, s.targetR, localProgress);
          } else {
            s.r = p.lerp(s.r, 10, 0.2);

          }
        } else {
          s.currentColor = p.lerpColor(s.currentColor, p.color(100), 0.05);
          let toCenter = p.createVector(s.x - outerCluster.x, s.y - outerCluster.y);
          if (toCenter.mag() > 0) toCenter.normalize();
          let targetPos = p5.Vector.add(p.createVector(outerCluster.x, outerCluster.y), toCenter.mult(outerCluster.r));
          let current = p.createVector(s.x, s.y);
          let newPos = p5.Vector.lerp(current, targetPos, 0.001);
          let moveForce = newPos.sub(current);
          s.v.add(moveForce);
          s.r = p.lerp(s.r, 10, 0.05);
        }
        s.x += s.v.x;
        s.y += s.v.y;
        s.v.mult(0.88);
      }

      // Collisioni tra sfere 
      for (let i = 0; i < this.sphere.length; i++) {
        for (let j = i + 1; j < this.sphere.length; j++) {
          let A = this.sphere[i];
          let B = this.sphere[j];
          let dx = B.x - A.x;
          let dy = B.y - A.y;
          let distAB = p.sqrt(dx * dx + dy * dy);
          let minDist = A.r + B.r + 1;
          if (distAB < minDist) {
            let overlap = (minDist - distAB) * 0.02;
            let ang = p.atan2(dy, dx);
            A.v.x -= p.cos(ang) * overlap;
            A.v.y -= p.sin(ang) * overlap;
            B.v.x += p.cos(ang) * overlap;
            B.v.y += p.sin(ang) * overlap;
          }
        }
      }
    }

    show() {

      p.push();
      p.stroke(this.colr);
      p.strokeWeight(2);
      p.fill("#E7E1D1");
      p.circle(this.x, this.y, 10);
      p.pop();

      // Aggiorna alpha del nome in base allo slider
      if (forceSlider.value() === 0) {
        this.nameAlpha = p.lerp(this.nameAlpha, 255, 0.1);
      } else {
        this.nameAlpha = p.lerp(this.nameAlpha, 0, 0.08);
      }

      // Mostra nome colonizzatore con transizione smooth
      if (this.nameAlpha > 2) {
        p.push();
        let textColor = p.color("#313131");
        textColor.setAlpha(this.nameAlpha);
        p.fill(textColor);
        p.noStroke();
        p.textFont("montserrat");
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(this.name.toUpperCase(), this.x, this.y - 25);
        p.pop();
      }

      for (let s of this.sphere) {

        if (hoveredSphere) {

          if (s === hoveredSphere) {
            s.fadeAlpha = p.lerp(s.fadeAlpha, 255, 0.2);
          } else {
            s.fadeAlpha = p.lerp(s.fadeAlpha, 50, 0.15);
          }

        } else {
          s.fadeAlpha = p.lerp(s.fadeAlpha, 255, 0.1);
        }

        let c = p.color(s.currentColor);
        c.setAlpha(s.fadeAlpha);

        p.fill(c);
        p.noStroke();
        p.circle(s.x, s.y, s.r);
      }



    }

  }
}




