/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import {
  def
} from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  // 获取老的数组的原型方法
  const original = arrayProto[method]
  // 分别再arrayMethods对象上定义方法
  def(arrayMethods, method, function mutator(...args) {
    const result = original.apply(this, args) //调用数组原生逻辑
    const ob = this.__ob__
    // 添加自己逻辑，函数劫持，切片
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice': // 修改 删除 添加  
        inserted = args.slice(2) // splice 方法从第三个参数起，是增添的新数据
        break
    }
    // inserted[] 遍历数组 对新增的对象或者数组进行劫持
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.dep.notify()
    return result
  })
})
