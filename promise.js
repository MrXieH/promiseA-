class Promise {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError(`Promise resolver ${executor} is not a function`)
    }

    this.value = null // 终值
    this.reason = null // 拒因
    this.state = Promise.PENDING // 状态
    this.onFulfilledCallbacks = [] // 成功回调
    this.onRejectedCallbacks = [] // 失败回调

    this.resolve = this.resolve.bind(this)
    this.reject = this.reject.bind(this)

    try {
      executor(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }

  resolve(value) {
    if (this.state === Promise.PENDING) {
      this.state = Promise.FULFILLED
      this.value = value
      this.onFulfilledCallbacks.forEach(fn => fn(this.value))
    }
  }

  reject(reason) {
    if (this.state === Promise.PENDING) {
      this.state = Promise.REJECTED
      this.reason = reason
      this.onRejectedCallbacks.forEach(fn => fn(this.reason))
    }
  }

  catch(onRejected) {
    return this.then(undefined, onRejected)
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled !== 'function') {
      onFulfilled = function(value) {
        return value
      }
    }

    if (typeof onRejected !== 'function') {
      // 如果没有 onReject 直接抛出错误，或被catch到
      onRejected = function(reason) {
        throw reason
      }
    }

    let promise2 = new Promise((resolve, reject) => {
      if (this.state === Promise.FULFILLED) {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value)
            Promise.resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }

      if (this.state === Promise.REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason)
            Promise.resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }

      if (this.state === Promise.PENDING) {
        // 如果还在等待中，则将回调存起来，等待被调用
        this.onFulfilledCallbacks.push((value) => {
          setTimeout(() => {
            try {
              // 连续then调用情况下，拿到上一个then的返回值去resolve
              const x = onFulfilled(value)
              Promise.resolvePromise(promise2, x, resolve, reject)
            } catch (error) {
              reject(error)
            }
          })
        })
        this.onRejectedCallbacks.push((reason) => {
          setTimeout(() => {
            try {
              const x = onRejected(reason)
              Promise.resolvePromise(promise2, x, resolve, reject)
            } catch (error) {
              reject(error)
            }
          })
        })
      }
    })

    return promise2

  }
}

Promise.PENDING = 'pending'
Promise.FULFILLED = 'fulfilled'
Promise.REJECTED = 'reject'
Promise.resolvePromise = function(promise2, x, resolve, reject) {
  if (promise2 === x) {
    reject(new TypeError('Chaining cycle detected for promise'))
  }

  let called = false // 防止resolve和reject多次调用
  if (x instanceof Promise) {
    // 如果x为promise,则将他执行，获取value继续resolve
    x.then(value => {
      Promise.resolvePromise(promise2, value, resolve, reject)
    }, reason => {
      reject(reason)
    })
  } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    // x 为对象或函数
    try {
      const then = x.then
      if (typeof then === 'function') { // 判断是否为thenable
        then.apply(x, [
          value => {
            if (called) return
            called = true
            Promise.resolvePromise(promise2, value, resolve, reject)
          },
          reason => {
            if (called) return
            called = true
            reject(reason)
          }
        ])
      } else {
        if (called) return
        called = true
        resolve(x)
      }
    } catch (error) {
      if (called) return
      called = true
      reject(error)
    }
  } else {
    // 普通类型
    resolve(x)
  }
}

Promise.prototype.finally = function (callback) {
  let P = this.constructor;
  return this.then(
    value  => P.resolve(callback()).then(() => value),
    reason => P.resolve(callback()).then(() => { throw reason })
  );
};

Promise.defer = Promise.deferred = function () {
  let dfd = {}
  dfd.promise = new Promise((resolve,reject)=>{
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
}

module.exports = Promise