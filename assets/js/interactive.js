const n = 10, m = 20;

var determineIfWorks = function(hashChoices) {
  let result = [];
  let n = hashChoices.length;
  let hashValues = Array(m).fill(null);
  for (let i = 0; i < n; ++i) {
    let savedResult = result.slice();
    let choices = hashChoices[i];
    // console.log("Trying to insert element", i, "with choices", choices);
    if (hashValues[choices[0]] === null) {
      hashValues[choices[0]] = i;
      result[i] = 0;
    } else if (hashValues[choices[1]] === null) {
      hashValues[choices[1]] = i;
      result[i] = 1;
    } else {
      let searched = Array(result.length).fill(false);
      let found = false;
      for (let j = 0; j < 2; ++j) {
        let choice = choices[j];
        let k = i, l = j;
        while (!searched[k]) {
          let newK = hashValues[choice];
          // console.log("Putting item", k, "at", choice, "kicking out", hashValues[choice], "which had hashes", hashChoices[newK]);
          hashValues[choice] = k;
          result[k] = l;
          searched[k] = true;
          if (newK === null) { found = true; break; }
          k = newK;
          l = 1 - result[k];
          choice = hashChoices[k][l];
        }
        if (found) break;
        //else console.log("Failed");
      }
      if (!found) { return savedResult };
    }
    // console.log("Result", result, "hashValues", hashValues);
  }
  return result;
};

var doFindMatch = function(hashChoices) {
  let result = [];
  let queue = [];
  let hashTable = Array(m).fill().map(() => []);
  const k = 3;
  for (let i = 0; i < n; ++i) {
    for (let c = 0; c < k; ++c) hashTable[hashChoices[i][c]].push({i, c});
  }
  for (let i = 0; i < m; ++i) if (hashTable[i].length === 1) queue.push(hashTable[i][0]);
  while (queue.length) {
    let elem = queue.pop();
    if (hashTable[hashChoices[elem.i][elem.c]].length === 0) continue;
    hashTable[hashChoices[elem.i][elem.c]].pop();
    result.push(elem);
    for (let c = 0; c < k; ++c) {
      if (c === elem.c) continue;
      let hash = hashChoices[elem.i][c];
      console.assert(hashTable[hash].some(obj => obj.i === elem.i));
      hashTable[hash] = hashTable[hash].filter(obj => obj.i !== elem.i || obj.c !== c);
      if (hashTable[hash].length === 1) queue.push(hashTable[hash][0]);
    }
  }
  return result.reverse();
};

function generateHashes() {  // generate 3 distinct hashes; distinct bc I'm too lazy to make algo's work with repeats
  const k = 3;
  let h = Array(k).fill().map(() => Math.floor(Math.random() * m));
  if (h[1] === h[0]) h[1] = (h[1] + 1) % m;
  while (h[2] === h[0] || h[2] === h[1]) h[2] = (h[2] + 1) % m;
  return h;
};

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


let books = ["Heart of Darkness", "The Jungle", "Brave New World", "Of Mice and Men", "The Sun Also Rises", "The Great Gatsby", "The Sound and the Fury", "The Grapes of Wrath",
             "1984", "The Catcher in the Rye", "Invisible Man", "Fahrenheit 451", "Go Tell it on the Mountain", "To Kill a Mockingbird", "Catch-22", "The Color Purple"];

shuffle(books);



function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForClick(button) {
  return new Promise((resolve) => button.off("click").on("click", resolve));
}

var wrap = function(fn) {
  let interrupt = 0;
  return async function() {
    ++interrupt;
    let savedInterrupt = interrupt;
    $(this).find(".book-elem").remove();
    this.parents(".animation").find(".success").hide();
    this.parents(".animation").find(".failure").hide();
    await fn.call(this, {get interrupt() { return interrupt > savedInterrupt; }});
  };
};

var animations = {

birthdayHashCollision: wrap(async function(o) {
  let hashes = [];
  let collision = false;
  for (let i = 0; i < n && !o.interrupt; ++i) {
    let hash = Math.floor(Math.random() * m);
    let row = $(`<tr class="book-elem"><td>${books[i]}</td><td>${hash}</td></tr>`);
    await row.appendTo(this).hide().fadeIn();
    if (hashes[hash] != null) { row.addClass("error"); row.find("td:eq(0)").text(`${books[i]} (conflicts with ${books[hashes[hash]]})`); collision = true; break; }
    else hashes[hash] = i;
    await sleep(300);
  }
  if (!collision) this.parents(".animation").find(".success").show();
}),

twoChoicesHash: wrap(async function(o) {
  let hashes = [];
  let rows = [];
  for (let i = 0; i < n; ++i) hashes.push(generateHashes().slice(0, 2));
  for (let i = 0; i < n && !o.interrupt; ++i) {
    let row = $(`<tr class="book-elem"><td>${books[i]}</td><td>${hashes[i][0]}</td><td>${hashes[i][1]}</td></tr>`);
    row.appendTo(this).hide().fadeIn();
    rows.push(row);
    await sleep(300);
  }
  let solution = determineIfWorks(hashes);
  for (let i = 0; i < solution.length && !o.interrupt; ++i) {
    rows[i].find("td").eq(1 + solution[i]).addClass("picked");
    await sleep(300);
  }
  if (solution.length < n) { rows[solution.length].addClass("error"); this.parents(".animation").find(".failure").show(); }
  else this.parents(".animation").find(".success").show();
}),

findMatch1: wrap(async function(o) {
  let hashTable = this.eq(0), mainTable = this.eq(1);
  let R = 5;
  let databases = [];
  let mod = (x, m) => ((x % m) + m) % m;
  hashTable.find(".hash-row").remove();
  for (let i = 0; i < m / 2; ++i) {
    $(`<tr class="hash-row"><td>${i}</td><td>0</td><td>${i+m/2}</td><td>0</td></tr>`).appendTo(hashTable);
  }
  let hashes = [];
  for (let i = 0; i < n; ++i) hashes.push(generateHashes());
  for (let i = 0; i < n; ++i) databases.push(Math.floor(Math.random() * R));
  for (let i = 0; i < n; ++i) {
    $(`<tr class="book-elem"><td>${books[i]} (v=${databases[i]})</td><td>${hashes[i].join("</td><td>")}</td></tr>`).appendTo(mainTable);
  }
  let btnStep = $(".hash-table").parents(".animation").find(".step-btn");
  let result = doFindMatch(hashes);
  let getTDsFromIndex = ind => { let tds = hashTable.find(".hash-row").eq(ind % 10).find("td"); return ind < 10 ? tds.slice(0, 2) : tds.slice(2); };
  let realTable = Array(m).fill(0);
  for (let i = 0; i < result.length && !o.interrupt; ++i) {
    hashTable.find("td.recent-frozen").removeClass("recent-frozen");
    hashTable.find("td.critical").removeClass("critical");
    let elem = result[i];
    mainTable.find(".book-elem").eq(elem.i).find("td").eq(1 + elem.c).addClass("picked");
    let change = mod(databases[elem.i] - hashes[elem.i].map(hash => realTable[hash]).reduce((a, b) => a + b), R);
    let newVal;
    newVal = realTable[hashes[elem.i][elem.c]] = mod(realTable[hashes[elem.i][elem.c]] + change, R);
    for (let c = 0; c < 3; ++c) getTDsFromIndex(hashes[elem.i][c]).addClass("frozen recent-frozen");
    getTDsFromIndex(hashes[elem.i][elem.c]).addClass("critical").eq(1).text(newVal.toString());
    await waitForClick(btnStep);
  }
  if (result.length === n) this.parents(".animation").find(".success").show();
  else this.parents(".animation").find(".failure").show();
}),

};

$(document).ready(function() {
  console.log("Loading interactivity!...");
  $(".animation").each(function() {
    $(this).prepend("<button class='btn btn-primary run-btn'>Run</button><button class='btn btn-secondary hide-btn'>Hide</button>");
    let stepBtn = $(this).find(".step-btn");
    var table = $(this).find("table");
    $(this).find(".run-btn").click(() => stepBtn.show()).click(animations[$(this).data("anim")].bind(table));
    $(this).find(".hide-btn").click(() => { table.toggle(); stepBtn.hide(); });
  });
  $(".animation .desc-btn").click(function() { $(this).next(".description").slideToggle(); });
});
