export function union(listA, listB) {
  if (!Array.isArray(listA) || !Array.isArray(listB)) {
    throw new TypeError("Both inputs must be arrays");
  }

  const result = [];
  let i = 0;
  let j = 0;

  while (i < listA.length && j < listB.length) {
    if (listA[i] === listB[j]) {
      result.push(listA[i]);
      i++;
      j++;
    } else if (listA[i] < listB[j]) {
      result.push(listA[i]);
      i++;
    } else {
      result.push(listB[j]);
      j++;
    }
  }

  while (i < listA.length) {
    result.push(listA[i]);
    i++;
  }

  while (j < listB.length) {
    result.push(listB[j]);
    j++;
  }

  return result;
}