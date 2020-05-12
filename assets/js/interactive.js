console.log("Loading interactivity!...");

var determineIfWorks = function(hashChoices) {
  let result = [];
  let n = hashChoices.length;
  let hashValues = Array(m).fill(null);
  for (let i = 0; i < n; ++i) {
    let choices = hashChoices[i];
    console.log("Trying to insert element", i, "with choices", choices);
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
          console.log("Putting item", k, "at", choice, "kicking out", hashValues[choice], "which had hashes", hashChoices[newK]);
          hashValues[choice] = k;
          result[k] = l;
          searched[k] = true;
          if (newK === null) { found = true; break; }
          k = newK;
          l = 1 - result[k];
          choice = hashChoices[k][l];
        }
        if (found) break;
        else console.log("Failed");
      }
      if (!found) return false;
    }
    console.log("Result", result, "hashValues", hashValues);
  }
  return result;
};


