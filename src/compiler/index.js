/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 解析将 html模板字符串 解析为 ast 对象
  const ast = parse(template.trim(), options)

  // 优化，遍历 ast,标记静态节点和静态根节点
  if (options.optimize !== false) {
    optimize(ast, options)
  }
  // 代码生成，将ast转换成可执行的render函数的字符串形式
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
