var objify = (t) => {
  let result = {};
  let dict = t.split(" ").map(prop => prop.split("="));
  for (let p of dict) {
    result[p[0]] = +p[1];
  }
  return result;
}

var parseStr = (str) => str.split("\n").filter(x => x.length > 0).map(objify);

var basicPvsMN = parseStr(
`n=100 m=120 p=0.1
n=100 m=121 p=0.1
n=100 m=122 p=0.18
n=100 m=123 p=0.23
n=100 m=124 p=0.34
n=100 m=125 p=0.29
n=100 m=126 p=0.39
n=100 m=127 p=0.49
n=100 m=128 p=0.47
n=100 m=129 p=0.59
n=1000 m=1200 p=0.07
n=1000 m=1210 p=0.13
n=1000 m=1220 p=0.28
n=1000 m=1230 p=0.5
n=1000 m=1240 p=0.63
n=1000 m=1250 p=0.82
n=1000 m=1260 p=0.77
n=1000 m=1270 p=0.94
n=1000 m=1280 p=0.98
n=1000 m=1290 p=1
n=10000 m=12000 p=0
n=10000 m=12100 p=0.03
n=10000 m=12200 p=0.23
n=10000 m=12300 p=0.82
n=10000 m=12400 p=0.99
n=10000 m=12500 p=1
n=10000 m=12600 p=1
n=10000 m=12700 p=1
n=10000 m=12800 p=1
n=10000 m=12900 p=1
n=100000 m=120000 p=0
n=100000 m=121000 p=0
n=100000 m=122000 p=0.11
n=100000 m=123000 p=1
n=100000 m=124000 p=1
n=100000 m=125000 p=1
n=100000 m=126000 p=1
n=100000 m=127000 p=1
n=100000 m=128000 p=1
n=100000 m=129000 p=1`
);

var createPvsMNGraph = function() {
  let traces = [];
  let nToIndMap = {};
  let index = 0;
  for (let data of basicPvsMN) {
    if (nToIndMap[data.n] == null) {
      nToIndMap[data.n] = index++;
      traces.push({x: [], y: [], type: 'scatter', opacity: 0.5, line: {shape: 'spline'}, name: 'n=' + data.n});
    }
  }
  for (let data of basicPvsMN) {
    let ind = nToIndMap[data.n];
    traces[ind].x.push(data.m / data.n);
    traces[ind].y.push(data.p);
  }
  var layout = {
    title: 'Probability of peelability vs overhead for various n',
    xaxis: { title: 'Overhead' },
    yaxis: { range: [0, 1.1], title: 'Probability of success' }
  };
  console.log("Traces", traces);
  Plotly.newPlot('p-vs-mn-basic-graph', traces, layout);
};

$(document).ready(function() {
  console.log("Starting graphs...");
  createPvsMNGraph();
});
