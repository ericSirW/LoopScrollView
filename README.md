# LoopScrollView
循环滚动视图

挂载到任意节点 
必要viewPort 视窗节点 含mask
必要content item的父节点 viewPort的子节点 最好如此
必要itemNode  显示的子项

支持循环模式 首尾相接
非循环模式 首尾即停

滚动惯性 -_-

使用视窗大小 会根据视窗大小计算要创建的item个数
个数始终为视窗可显示个数+1 

未使用layout组件 可以自由播动画 动画结束前请先禁用滚动
--
--节点位置排布是手写基于锚点的排列 日常使用可以替代一些layout不可解决的场景 毕竟按传入顺序排布不受节点顺序影响,同时不会每帧更新 子节点有缩放可能需要再处理下 多layout场景性能算有提升吧 测过_--
未使用scrollView组件 需要动画事件的自己加个事件 应该不难
--

计时器用的事setTimeout 可能会觉得schedule比较好 毕竟更安全  也可以替换之
关于调用
组件.showAllItem(数据长度, 显示回调);回调参数 itemNode idx(数据下标) isSartShowEnd(第一次创建n+1结束的回调)标识启动滚动事件
显示回调在节点被创建时会调用 可以拿来播动画之类... 
