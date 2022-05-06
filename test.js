const PromiseA = require('./promise')


var t = new PromiseA((resolve, reject) => {
  setTimeout(() => {
    resolve(1)
  }, 3000)
}).then(
  (value) => {
    console.log('value', value)
    return value
  },
  (reason) => {
    console.log("reason", reason);
  }
).finally((e) => {
  console.log('f')
})

// PromiseA.prototype.say = function() {
//   const P = this.constructor
//   P.resolve('a').then(res => {
//     console.log(res)
//   })
// }

// new PromiseA().say()


// console.log('start');
// setTimeout(() => {
//   console.log('setTimeout done.');
// });
// new PromiseA((resolve) => {
//   console.log('promise exec done.')
//   resolve();
// }).then(() => {
//   console.log('then done.');
// });
// console.log('end');
