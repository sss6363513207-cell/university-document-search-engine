
export function intersection(listA, listB) {
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
      i++;
    } else {
      j++;
    }
  }

  return result;
}
