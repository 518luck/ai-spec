export function AppHeader() {
  return (
    // TODO 顶部布局
    //  - bg-background/60：背景色用主题里的 background，透明度 60%
    //   - sticky top-0：吸顶，滚动时会粘在顶部
    //   - z-20：层级较高，避免被普通内容盖住
    //   - flex：用弹性布局
    //   - h-14：高度 3.5rem
    //   - shrink-0：空间不够时自己不要被压缩
    //   - items-center：flex 交叉轴居中，这里是垂直居中
    //   - justify-between：左右两边内容拉开，一边靠左一边靠右
    //   - gap-2：内部项目之间间距 0.5rem
    //   - rounded-t-xl：顶部两个角做较大的圆角
    //   - border-b：底部加一条边框
    //   - backdrop-blur-md：给背景后面的内容加中等模糊，常见于毛玻璃效果
    //   - px-4：左右内边距 1rem
    <header className="bg-background/60 flex h-14">
      <div className="flex items-center gap-2">
        <div>布局伸缩</div>
        <div>间隔符号 separator</div>
        <div>面包屑导航</div>
      </div>

      <div className="flex items-center gap-2">
        <div>github图标</div>
        <div>
          <div>搜索框</div>
        </div>
        <div>黑白主题切换</div>
        <div>
          <div>界面主题切换</div>
        </div>
        <div>信息框</div>
      </div>
    </header>
  );
}
