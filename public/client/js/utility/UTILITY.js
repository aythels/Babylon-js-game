const UTILITY = {};

//remove the specified element from an array
UTILITY.removeItem = function (element, array, callback) {
  const index = array.indexOf(element);
  if (index != -1) {
    array.splice(index, 1);
    if (callback != null) callback();
    return true;
  } else {
    return false;
  }
};

//add an unique elemet to a array
UTILITY.addUnique = function (element, array, callback) {

  if (array.indexOf(element) == -1) {
    array.push(element);
    if (callback != null) callback();
  }
};

//swap the keys and values of an object
UTILITY.invertObject = function (obj) {
  const newObj = {};

  for (let prop in obj) {
    if (obj.hasOwnProperty(prop))
      newObj[obj[prop]] = prop;
  }

  return newObj;
};

//call each function in an array of functions
UTILITY.runArray = function(array, ...rest) {
  for (let i = 0; i < array.length; i++)
    array[i](...rest);
};

UTILITY.averageDelta = function([x,...xs]) {
  if (x === undefined)
    return NaN;
  else
    return xs.reduce(
      ([acc, last], x) => [acc + (x - last), x],
      [0, x]
    ) [0] / xs.length;
};

UTILITY.clamp = function(number, min, max) {
  return Math.max(min, Math.min(number, max));
};
