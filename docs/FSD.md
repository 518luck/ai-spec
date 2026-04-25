# 概念

Feature-Sliced Design（FSD）是一种用于构建前端应用程序的架构方法论。简单来说，它是组织代码的规则和约定的汇编。该方法论的主要目的是在不断变化的业务需求面前，使项目更加易于理解和稳定

App — 使应用程序运行的一切 — 路由、入口点、全局样式、providers。
Processes（已废弃）— 复杂的跨页面场景。
Pages — 完整页面或嵌套路由中页面的大部分。
Widgets — 大型自包含的功能或 UI 块，通常提供整个用例。
Features — 整个产品功能的*可重用*实现，即为用户带来业务价值的操作。
Entities — 项目处理的业务实体，如 user 或 product。
Shared — 可重用功能，特别是当它与项目/业务的具体细节分离时，但不一定如此。

警告

Layers App 和 Shared 与其他 layers 不同，它们没有 slices，直接分为 segments。

然而，所有其他 layers — Entities、Features、Widgets 和 Pages，保持您必须首先创建 slices 的结构，在其中创建 segments。
