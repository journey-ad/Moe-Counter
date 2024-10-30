module.exports = {
  randomArray: (arr) => {
    return arr[Math.floor(Math.random() * arr.length)]
  },
  toFixed: (num, digits = 2) => {
    return parseFloat(Number(num).toFixed(digits))
  }
}
