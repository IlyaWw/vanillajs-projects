const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 1) {
    const index = Math.floor(Math.random() * counter);

    counter--;
    [arr[index], arr[counter]] = [arr[counter], arr[index]];
  }

  return arr;
};
