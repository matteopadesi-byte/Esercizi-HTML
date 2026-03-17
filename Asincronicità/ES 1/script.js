async function primo() {
  console.log("1");
  await Promise.resolve();
  console.log("2");
}

console.log("3");
primo();
console.log("4");
