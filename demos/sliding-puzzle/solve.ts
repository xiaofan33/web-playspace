export function isSolvable(
  idArr: number[],
  cols = Math.sqrt(idArr.length),
  blankId = 0,
) {
  const getInversions = () => {
    const arr = idArr.filter(v => v !== blankId);
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) count++;
      }
    }
    return count;
  };

  const inv = getInversions();
  if (cols % 2 === 1) {
    return inv % 2 === 0;
  }

  const blankRow = Math.floor(idArr.indexOf(blankId) / cols) + 1;
  const blankRowFromBottom = Math.floor(idArr.length / cols) - blankRow;
  return (blankRowFromBottom + inv) % 2 === 0;
}
