var n = 10, m = 20;

var determineIfWorks = function(hashChoices) {
  let result = [];
  let n = hashChoices.length;
  let hashValues = Array(m).fill(null);
  for (let i = 0; i < n; ++i) {
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
      if (!found) { result.pop(); return result };
    }
    // console.log("Result", result, "hashValues", hashValues);
  }
  return result;
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
             "1984", "The Catcher in the Rye", "Invisible Man", "Fahrenheit 451", "Go Tell it on the Mountain", "To Kill a Mockingbird", "Catch-22", "I Know why the Caged Bird Sings",
             "The Color Purple"];

shuffle(books);



function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var wrap = function(fn) {
  let interrupt = 0;
  return async function() {
    ++interrupt;
    let savedInterrupt = interrupt;
    $(this).find(".book-elem").remove();
    await fn.call(this, {get interrupt() { return interrupt > savedInterrupt; }});
  };
};

var animations = {

birthdayHashCollision: wrap(async function(o) {
  let hashes = [];
  for (let i = 0; i < n && !o.interrupt; ++i) {
    let hash = Math.floor(Math.random() * m);
    let row = $(`<tr class="book-elem"><td>${books[i]}</td><td>${hash}</td></tr>`);
    await row.appendTo(this).hide().fadeIn();
    if (hashes[hash] != null) { row.addClass("error"); row.find("td:eq(0)").text(`${books[i]} (conflicts with ${books[hashes[hash]]})`); break; }
    else hashes[hash] = i;
    await sleep(300);
  }
}),

twoChoicesHash: wrap(async function(o) {
  let hashes = [];
  let rows = [];
  for (let i = 0; i < n; ++i) hashes.push([Math.floor(Math.random() * m), Math.floor(Math.random() * m)]);
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
  if (solution.length < n) rows[solution.length].addClass("error");
})

};

$(document).ready(function() {
  console.log("Loading interactivity!...");
  $(".animation").each(function() {
    $(this).prepend("<button class='btn btn-primary'>Run</button><button class='btn btn-secondary'>Hide</button>");
    var table = $(this).find("table");
    $(this).find(".btn-primary").click(animations[$(this).data("anim")].bind(table));
    $(this).find(".btn-secondary").click(() => table.toggle());
  });
});
