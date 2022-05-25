/* @flow */

import config from '../config'
import {
  initProxy
} from './proxy'
import {
  initState
} from './state'
import {
  initRender
} from './render'
import {
  initEvents
} from './events'
import {
  mark,
  measure
} from '../util/perf'
import {
  initLifecycle,
  callHook
} from './lifecycle'
import {
  initProvide,
  initInjections
} from './inject'
import {
  extend,
  mergeOptions,
  formatComponentName
} from '../util/index'

let uid = 0

export function initMixin(Vue: Class < Component > ) {
  Vue.prototype._init = function (options ? : Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++


    // a flag to avoid this being observed
    // 处理组件的配置项
    vm._isVue = true
    // merge options
    // 选项合并
    // 全局的选项Vue.options跟用户的合并
    // console.log(options)
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 子组件的性能优化,减少原型链的动态查找线路,提高执行效率
      initInternalComponent(vm, options)
    } else {
      // console.log('根组件', vm.constructor.super)
      // 根组件 选项合并,将全局配置选项合并到跟组件的局部配置上
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 组件关系属性的初始化
    initLifecycle(vm)
    // 初始化自定义事件
    initEvents(vm)
    // 初始化插槽  定义_v _h _t方法
    initRender(vm)
    // 执行beforeCreate生命周期
    callHook(vm, 'beforeCreate')
    // 多用于库开发
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    // 执行created生命周期
    callHook(vm, 'created')

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

// 性能优化,打平配置对象上的属性,减少运行时原型链的查找,提高运行效率
export function initInternalComponent(vm: Component, options: InternalComponentOptions) {
  // 基于构造函数（vm.constructor==>Vue）上的配置对象创建  vm.$options
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  // 有render函数将齐赋值到vm.$options
  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

// 解析从构造函数上解析配置项
export function resolveConstructorOptions(Ctor: Class < Component > ) {
  // 从示例的构造函数上获取选项
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    // 缓存
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // 不一致说明,说明配置项发生了更改
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      // 找到更改的选项
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        // 将更改的选项和etendd合并
        extend(Ctor.extendOptions, modifiedOptions)
      }
      // 将新的选项赋值
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions(Ctor: Class < Component > ): ? Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}

/* Vue 的初始化过程（new Vue(options)）都做了什么？

1.处理组件配置项

   初始化根组件时进行了选项合并操作，将全局配置合并到根组件的局部配置上

   初始化每个子组件时做了一些性能优化，将组件配置对象上的一些深层次属性放到 vm.$options 选项中，以提高代码的执行效率

2.初始化组件实例的关系属性，比如 $parent、$children、$root、$refs 等

3.处理自定义事件

4.调用 beforeCreate 钩子函数

5.初始化组件的 inject 配置项，得到 ret[key] = val 形式的配置对象，然后对该配置对象进行浅层的响应式处理（只处理了对象第一层数据），并代理每个 key 到 vm 实例上

6.数据响应式，处理 props、methods、data、computed、watch 等选项

7.解析组件配置项上的 provide 对象，将其挂载到 vm._provided 属性上

8.调用 created 钩子函数

9.如果发现配置项上有 el 选项，则自动调用 $mount 方法，也就是说有了 el 选项，就不需要再手动调用 $mount 方法，反之，没提供 el 选项则必须调用 $mount

10.接下来则进入挂载阶段
 */
// 
