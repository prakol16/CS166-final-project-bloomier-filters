var objify = (t) => {
  let result = {};
  let dict = t.split(" ").map(prop => prop.split("="));
  for (let p of dict) {
    result[p[0].replace("/", "_")] = +p[1];
  }
  return result;
}

var parseStr = (str) => str.split("\n").filter(x => x.length > 0).map(objify);

var collect = (param, data) => {
  let result = [];
  let curObj = {objs: []};
  for (let d of data) {
    let keys = Object.keys(d);
    if (keys.length === 1 && keys[0] === param) {
      if (curObj.objs.length > 0) result.push(curObj);
      curObj = {objs: []}; curObj[param] = d[param];
    } else {
      curObj.objs.push(d);
    }
  }
  result.push(curObj);
  return result;
};

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

var nVsMNBasicConvergence = parseStr(
`n=100 m/n=1.270156265
n=300 m/n=1.244257909
n=1000 m/n=1.232717068
n=3000 m/n=1.226940509
n=10000 m/n=1.223988921
n=30000 m/n=1.222941983
n=100000 m/n=1.222535153
n=300000 m/n=1.22219623
n=1000000 m/n=1.222007321
n=3000000 m/n=1.221690752`);

var nVsMNSegmentedConvergence = collect('l', parseStr(
`l=12
n=100 m/n=1.484492109
n=300 m/n=1.359999786
n=1000 m/n=1.309636441
n=3000 m/n=1.295843317
n=10000 m/n=1.284875033
n=30000 m/n=1.283388507
n=100000 m/n=1.281689795
n=300000 m/n=1.281992557
n=1000000 m/n=1.281255189
n=3000000 m/n=1.281881236
l=25
n=100 m/n=1.871154462
n=300 m/n=1.503202506
n=1000 m/n=1.309164416
n=3000 m/n=1.25004773
n=10000 m/n=1.219799908
n=30000 m/n=1.203402017
n=100000 m/n=1.193672858
n=300000 m/n=1.190022867
n=1000000 m/n=1.186861769
n=3000000 m/n=1.18553583
l=50
n=300 m/n=1.869705839
n=1000 m/n=1.413412318
n=3000 m/n=1.266640542
n=10000 m/n=1.210165408
n=30000 m/n=1.178854471
n=100000 m/n=1.158856999
n=300000 m/n=1.148563792
n=1000000 m/n=1.142872855
n=3000000 m/n=1.138908576
l=100
n=1000 m/n=1.803763136
n=3000 m/n=1.374683161
n=10000 m/n=1.241112514
n=30000 m/n=1.190199074
n=100000 m/n=1.153427209
n=300000 m/n=1.135802042
n=1000000 m/n=1.124954901
n=3000000 m/n=1.119293983
l=150
n=1000 m/n=2.277343367
n=3000 m/n=1.615362031
n=10000 m/n=1.280662371
n=30000 m/n=1.204909529
n=100000 m/n=1.161053398
n=300000 m/n=1.136832198
n=1000000 m/n=1.121795436
n=3000000 m/n=1.114183132
l=200
n=1000 m/n=2.664838713
n=3000 m/n=1.831980086
n=10000 m/n=1.349127607
n=30000 m/n=1.219991863
n=100000 m/n=1.169145395
n=300000 m/n=1.141074587
n=1000000 m/n=1.122445619
n=3000000 m/n=1.113159444`));

var nVsMNBandConvergence = collect('band', parseStr(
`band=6
n=100 m/n=1.619570892
n=300 m/n=1.460266161
n=1000 m/n=1.381548189
n=3000 m/n=1.347625693
n=10000 m/n=1.325607894
n=30000 m/n=1.316264086
n=100000 m/n=1.309794288
n=300000 m/n=1.307634032
n=1000000 m/n=1.306976322
n=3000000 m/n=1.305976565
band=12
n=100 m/n=1.953969687
n=300 m/n=1.580188646
n=1000 m/n=1.375266529
n=3000 m/n=1.295033697
n=10000 m/n=1.252877248
n=30000 m/n=1.225518349
n=100000 m/n=1.208388447
n=300000 m/n=1.199941882
n=1000000 m/n=1.194956148
n=3000000 m/n=1.191801412
band=25
n=100 m/n=2.590978138
n=300 m/n=1.956549115
n=1000 m/n=1.524129008
n=3000 m/n=1.329584886
n=10000 m/n=1.245805703
n=30000 m/n=1.201668293
n=100000 m/n=1.172779639
n=300000 m/n=1.157147712
n=1000000 m/n=1.146960772
n=3000000 m/n=1.141907837
band=50
n=100 m/n=3.881912271
n=300 m/n=2.738049063
n=1000 m/n=1.898452113
n=3000 m/n=1.468576938
n=10000 m/n=1.279666537
n=30000 m/n=1.216869178
n=100000 m/n=1.172189955
n=300000 m/n=1.147521114
n=1000000 m/n=1.131242322
n=3000000 m/n=1.123354279
band=100
n=100 m/n=6.066406686
n=300 m/n=4.039279762
n=1000 m/n=2.709497861
n=3000 m/n=1.87630219
n=10000 m/n=1.404831671
n=30000 m/n=1.252870528
n=100000 m/n=1.196010631
n=300000 m/n=1.156861021
n=1000000 m/n=1.132573148
n=3000000 m/n=1.118527417
band=150
n=100 m/n=7.685958748
n=300 m/n=5.038367784
n=1000 m/n=3.311959536
n=3000 m/n=2.296541926
n=10000 m/n=1.569171231
n=30000 m/n=1.302698183
n=100000 m/n=1.209890337
n=300000 m/n=1.170123977
n=1000000 m/n=1.136815439
n=3000000 m/n=1.120209357`));

var mnVsLforFixedN = collect('n', parseStr(
`n=10000
l=10 n=10000 m/n=1.305232227
l=21 n=10000 m/n=1.229326957
l=24 n=10000 m/n=1.222528051
l=27 n=10000 m/n=1.214889468
l=30 n=10000 m/n=1.214100356
l=33 n=10000 m/n=1.210996001
l=36 n=10000 m/n=1.209660731
l=39 n=10000 m/n=1.211428622
l=42 n=10000 m/n=1.210414039
l=45 n=10000 m/n=1.210481731
l=48 n=10000 m/n=1.210208661
l=51 n=10000 m/n=1.213693988
l=54 n=10000 m/n=1.211082437
l=57 n=10000 m/n=1.213914094
l=60 n=10000 m/n=1.217718277
l=80 n=10000 m/n=1.228794125
l=100 n=10000 m/n=1.240035929
l=120 n=10000 m/n=1.255228492
l=140 n=10000 m/n=1.288046896
l=160 n=10000 m/n=1.321656043
l=180 n=10000 m/n=1.320074611
n=30000
l=20 n=30000 m/n=1.221402699
l=30 n=30000 m/n=1.193499288
l=35 n=30000 m/n=1.186716318
l=40 n=30000 m/n=1.182601212
l=45 n=30000 m/n=1.180850643
l=50 n=30000 m/n=1.178803598
l=55 n=30000 m/n=1.176683442
l=60 n=30000 m/n=1.177978448
l=65 n=30000 m/n=1.178530779
l=70 n=30000 m/n=1.18004803
l=80 n=30000 m/n=1.181869471
l=90 n=30000 m/n=1.185277522
l=100 n=30000 m/n=1.187783163
l=110 n=30000 m/n=1.194648936
l=120 n=30000 m/n=1.195989147
l=140 n=30000 m/n=1.202901903
l=160 n=30000 m/n=1.210116743
l=180 n=30000 m/n=1.216989902
n=100000
l=20 n=100000 m/n=1.215624239
l=40 n=100000 m/n=1.166840913
l=60 n=100000 m/n=1.155302026
l=80 n=100000 m/n=1.15350081
l=85 n=100000 m/n=1.153454862
l=90 n=100000 m/n=1.153821792
l=95 n=100000 m/n=1.153202083
l=100 n=100000 m/n=1.154418186
l=105 n=100000 m/n=1.154012092
l=110 n=100000 m/n=1.154970946
l=115 n=100000 m/n=1.155739833
l=120 n=100000 m/n=1.156244592
l=140 n=100000 m/n=1.159327027
l=160 n=100000 m/n=1.161879036
l=180 n=100000 m/n=1.165571899`));

var createPvsMNGraph = function() {
  let traces = [];
  let nToIndMap = {};
  let index = 0;
  for (let data of basicPvsMN) {
    if (nToIndMap[data.n] == null) {
      nToIndMap[data.n] = index++;
      traces.push({x: [], y: [], type: 'scatter', line: {shape: 'spline'}, name: 'n=' + data.n});
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

var createNvsMN_BasicConvergence = function() {
  let trace = {
    x: [],
    y: [],
    type: 'scatter',
    name: 'Minimum overhead',
    line: {shape: 'spline'}
  };
  let straight = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    name: 'Limiting value (1.222)',
    line: {dash: 'dash'},
    hoverinfo: 'skip'
  }
  for (let data of nVsMNBasicConvergence) {
    trace.x.push(data.n); trace.y.push(data.m_n);
    straight.x.push(data.n); straight.y.push(1.2217);
  }
  var layout = {
    title: 'Minimum overhead vs n for basic random hypergraph',
    xaxis: { title: '$n$', type: 'log' },
    yaxis: { title: 'Overhead', range: [1.15, 1.3] }
  };
  console.log("Trace basic", trace.x.map(x => Math.log(x)), trace.y.map(y => Math.pow(y - 1.2217, -0.25)));
  Plotly.newPlot('mn-vs-n-basic-convergence-graph', [trace, straight], layout);
};

var createNvsMN_SegmentConvergence = function() {
  let traces = [];
  let adjustedTraces = [];
  let straight = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    name: 'Limiting value (1.09)',
    line: {dash: 'dash'},
    hoverinfo: 'skip'
  };
  var straight2 = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    name: 'Ordinary random<br>hypergraph (1.222)',
    line: {dash: 'dash'},
    hoverinfo: 'skip'
  };
  for (let ells of nVsMNSegmentedConvergence) {
    let ell = ells.l;
    let trace = {
      x: [],
      y: [],
      type: 'scatter',
      name: '$l=' + ell + '$',
      line: {shape: 'spline'}
    };
    let adjusted = $.extend(true, {}, trace);
    adjusted.visible = false;
    for (let data of ells.objs) {
      trace.x.push(data.n); trace.y.push(data.m_n);
      adjusted.x.push(data.n); adjusted.y.push(data.m_n * (ell / (ell + 2)));
    }
    traces.push(trace);
    adjustedTraces.push(adjusted);
  }
  let visibilities = Array(traces.length * 2).fill().map((_, i) => i < traces.length);
  let adjustedVisibilities = visibilities.map(x => !x);
  for (let i = 0; i < 2; ++i) { visibilities.push(true); adjustedVisibilities.push(true); }
  var layout = {
    title: 'Minimum overhead vs n for segmented random hypergraph',
    xaxis: { title: '$n$', type: 'log' },
    yaxis: { title: 'Overhead' },
    updatemenus: [{
      buttons: [
        {args: [{'visible': visibilities}], label: 'Original', method: 'update'},
        {args: [{'visible': adjustedVisibilities}], label: 'Adjusted', method: 'update'}
      ],
        direction: 'left',
        pad: {'r': 10, 't': 10},
        showactive: true,
        type: 'buttons',
        xanchor: 'left',
        yanchor: 'top', y: 1.2
    }]
  };
  console.log("Adjusted", adjustedTraces.map(t => { return [t.x.map(x => Math.log(x)), t.y.map(y => Math.pow(y - 1.0894014266398222, -0.25))]; }));
  for (let x of traces[0].x) { straight.x.push(x); straight.y.push(1.09); straight2.x.push(x); straight2.y.push(1.22); }
  Plotly.newPlot('mn-vs-n-segmented-convergence-graph', traces.concat(adjustedTraces).concat([straight, straight2]), layout);
};


var createNvsMN_SegmentConvergenceTransform = function() {
  let traces = [];
  let straight = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    name: 'Slope -1/2 ref.',
    line: {dash: 'dash'},
    hoverinfo: 'skip'
  };
  for (let ells of nVsMNSegmentedConvergence) {
    let ell = ells.l;
    let trace = {
      x: [],
      y: [],
      type: 'scatter',
      name: '$l=' + ell + '$',
      line: {shape: 'spline'},
      visible: ell > 25 ? true : 'legendonly'
    };
    for (let data of ells.objs) {
      trace.x.push(data.n); trace.y.push(data.m_n - 1.0894014266398222 * (1 + 2/ell));
      straight.x.push(data.n); straight.y.push(10 * Math.pow(data.n, -0.5));
    }
    traces.push(trace);
  }
  var layout = {
    title: 'Log overhead vs n for segmented hypergraph',
    xaxis: { title: '$n$', type: 'log' },
    yaxis: { title: 'Distance from convergence', type: 'log' }
  };
  Plotly.newPlot('mn-vs-n-segmented-convergence-graph-transformed', traces.concat([straight]), layout);
};

var createNvsMN_BandConvergence = function() {
  let traces = [];
  let adjustedTraces = [];
  let straight = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    name: 'Limiting value (1.09)',
    line: {dash: 'dash'},
    hoverinfo: 'skip'
  };
  var straight2 = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    name: 'Ordinary random<br>hypergraph (1.222)',
    line: {dash: 'dash'},
    hoverinfo: 'skip'
  };
  for (let bands of nVsMNBandConvergence) {
    let band = bands.band;
    let trace = {
      x: [],
      y: [],
      type: 'scatter',
      name: '$b=' + band + '$',
      line: {shape: 'spline'}
    };
    let adjusted = $.extend(true, {}, trace);
    adjusted.visible = false;
    for (let data of bands.objs) {
      trace.x.push(data.n); trace.y.push(data.m_n);
      adjusted.x.push(data.n); adjusted.y.push(data.m_n * (band / (band + 1)));
    }
    traces.push(trace);
    adjustedTraces.push(adjusted);
  }
  let visibilities = Array(traces.length * 2).fill().map((_, i) => i < traces.length);
  let adjustedVisibilities = visibilities.map(x => !x);
  for (let i = 0; i < 2; ++i) { visibilities.push(true); adjustedVisibilities.push(true); }
  var layout = {
    title: 'Minimum overhead vs n for banded random hypergraph',
    xaxis: { title: '$n$', type: 'log' },
    yaxis: { title: 'Overhead', range: [1, 2] },
    updatemenus: [{
      buttons: [
        {args: [{'visible': visibilities}], label: 'Original', method: 'update'},
        {args: [{'visible': adjustedVisibilities}], label: 'Adjusted', method: 'update'}
      ],
        direction: 'left',
        pad: {'r': 10, 't': 10},
        showactive: true,
        type: 'buttons',
        xanchor: 'left',
        yanchor: 'top', y: 1.2
    }]
  };
  for (let x of traces[0].x) { straight.x.push(x); straight.y.push(1.09); straight2.x.push(x); straight2.y.push(1.22); }
  Plotly.newPlot('mn-vs-n-band-convergence-graph', traces.concat(adjustedTraces).concat([straight, straight2]), layout);
};


var createNvsMN_BandConvergenceTransform = function() {
  let traces = [];
  let straight = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    name: 'Slope -1/2 ref.',
    line: {dash: 'dash'},
    hoverinfo: 'skip'
  };
  for (let bands of nVsMNBandConvergence) {
    let band = bands.band;
    let trace = {
      x: [],
      y: [],
      type: 'scatter',
      name: '$b=' + band + '$',
      line: {shape: 'spline'},
      visible: band > 12 ? true : 'legendonly'
    };
    for (let data of bands.objs) {
      trace.x.push(data.n); trace.y.push(data.m_n - 1.0894014266398222 * (1 + 1/band));
      straight.x.push(data.n); straight.y.push(10 * Math.pow(data.n, -0.5));
    }
    traces.push(trace);
  }
  var layout = {
    title: 'Transformed overhead vs n for band random hypergraph',
    xaxis: { title: '$n$', type: 'log' },
    yaxis: { title: 'Distance from convergence', type: 'log' }
  };
  Plotly.newPlot('mn-vs-n-band-convergence-graph-transformed', traces.concat(straight), layout);
};

var createMNvsL = function() {
  var traces = [];
  for (let ns of mnVsLforFixedN) {
    let n = ns.n;
    let trace = { x: [], y: [], type: 'scatter', name: '$n=' + n + '$', mode: 'marker', line: {shape: 'spline'}};
    for (let data of ns.objs) {
      trace.x.push(data.l);
      trace.y.push(data.m_n);
    }
    traces.push(trace);
  }
  var layout = {
    title: 'Minimum overhead vs l for fixed n',
    xaxis: { title: '$l$' },
    yaxis: { title: 'Overhead' }
  };
  Plotly.newPlot("mn-vs-l-fixed-n", traces, layout);
};

$(document).ready(function() {
  console.log("Starting graphs...");
  createPvsMNGraph();
  createNvsMN_BasicConvergence();
  createNvsMN_SegmentConvergence();
  createNvsMN_BandConvergence();
  createNvsMN_SegmentConvergenceTransform();
  createNvsMN_BandConvergenceTransform();
});
