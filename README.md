# layuiTablePlug

#### 项目介绍
对layui的table组件的功能进行一些加强和拓展，主要实现的有
1. 智能重载  
这个是一个对用户体验提升较大的点，直观的就是普通的数据重新请求reload的时候不闪，
比较内在的还可以减少表格实例的数量，对性能也有一定的帮助。
2. 复选列的状态记忆以及部分不可操作的支持
3. 修复了复杂表头的一些bug
4. 字段筛选
5. 其他的一些细节，比如table中有select美化之后下拉看不到的优化、筛选列的字段选择中加入全选和反选的便捷操作支持、
page的多语言设置、处理工具列宽度如果不够显示点击显示更多内容的时候点击里面的按钮无法触发对应的监听的问题等


#### 使用说明

>tips: 建议是fork一下或者star、watch一下，后面有更新也能比较

一. 改table.js的源码！
> 这个算是一个必要的前提，如果觉得坚决不想改，那么可以直接return了，主要改的就是将table内部的构造器给透漏出来，后面可以更方便
的去调整一些内部的逻辑而不用更多的去修改源码，这个好比你要修改数组的toString的方法我相信你不会考虑去修改JavaScript的底层的
代码，而是通过它的类的原型去修改，同理的如果表格能把它的构造器透漏出来后面如果需要去调整内部的逻辑就可以通过原型的去修改了。
(期待后面layui的升级考虑下能不能这么给透漏出来) 
```
  layui.define(['laytpl', 'laypage', 'layer', 'form', 'util'], function(exports){
    "use strict";
    // 此处省略了很多内容，主要看下面的代码
  
    // 把thisTable和Class透漏出去，方便拓展
    table.thisTable = thisTable;
    table.Class = Class;
  
    //自动完成渲染
    table.init();
    
    exports(MOD_NAME, table);
  });
``` 
> tips: 后续会在layui发版之后release出对应的版本的tablePlug，同时下载的文件夹里面也会提供对应版本的修改过（如果需要）
的对应的table.js和layui.all.js，所以也可以直接下载覆盖到自己本地的项目中的对应文件。

二. 从"下载"的文件夹里面得到tablePlug整个文件夹，拷贝到自己项目中的合适的位置，然后通过layui.use的方式加到项目中。
>注意：最好不要去修改tablePlug这个文件夹内部的结构，因为在tablePlug.js中在第一次加载的时候会去link使用到的css文件，
当然也不是绝对的，只要你对layui足够熟悉了，实际这个文件结构自己放在任意地方都可以，只要能找到就行，
然后去掉tablePlug.js中对应的引入css文件的代码，然后自己在页面中自己link或者在head里面引进去，当然我是不建议这么没事找事做额。
>>下载下来的文件里面会有一个tablePlug.js和对应的经过混淆压缩的tablePlug.min.js这个大家看需要引入。
（主要的就是在layui.extend的时候修改一下就好）

三. 使用  
这一部分可以看看之前在layui的fly社区里面发的一些帖子，后面会找时间开发一个文档的页面出来。  
[关于 table 的 checkbox 跨页状态保存的一种实现方式](https://fly.layui.com/jie/43124/)  
[table 如何更优雅的 reload（第二版）](https://fly.layui.com/jie/43423/)  
[解决复杂的复杂表头表格的种种翻车](https://fly.layui.com/jie/43993/)  
[表格部分复选框不能操作的一种实现方式](https://fly.layui.com/jie/45124/)  
[如何让表格的工具按钮列显示更多的时候也能点击触发table的事件](https://fly.layui.com/jie/45361/)  
[layui table 字段筛选功能](https://fly.layui.com/jie/45890/)  
[处理下拉在表格中看不到的选项的一种解决方案](https://fly.layui.com/jie/47162/)  

四. 其他

- 引入了layui.all.js这种费模块的如何使用这个插件  
引入了all.js一般来说就是不想要模块化开发，那么如何使用tablePlug这插件呢？是不是需要直接引入一个普通的js？实际可以不用这样子的，
引入了layui.all.js后面，还是可以用layui.use去引入一个模块，只不过内置的模块就不需要这么去引入了，在all.js里面已经涵盖了，
即使绕弯路还是用layui.use这么去用也不会报错的，但是use不是没用了，对于不是内置的模块比如这个tablePlug或者你自己按照layui
模块规范写的模块，后面换成非模块使用了，也不需要说非得把这些模块给改成普通的js引入才能使用，还是可以用layui.use去加载进去，
也就是说即使换成了非模块化的，也可以不改以前的代码的情况下使用的。但是！！有个例外，就是如果一个模块依赖了一个未加载过的非内置的模块，
在加载的时候会出现没有加载依赖模块就直接进入回调的问题，这个是因为目前layui.js的一个bug，所以只要不出现上面说的这种依赖情况，
(比如我例子里面页面use一个testTablePlug然后在这个js里面再依赖了tablePlug)就可以无缝切换使用的，也跟layui的作者贤心沟通过了，
后面的版本也会修复这个bug
- layuiAdmin如何使用该插件  
如果获得了layuiAdmin的授权，开发过一段时间了一般会知道里面可以在config里面添加一个，然后把对应的js文件放在extend文件夹下面，
后面需要的时候直接use就可以了，但是上面说了因为需要在插件里面去引入一些相关的css文件，所以最好是一个整体，而且目前实际里面的逻辑
还是不够灵活，限定太多，没办法extend一样的用tablePlug.min.js，so，不走config extend的逻辑，个人建议直接把tablePlug这个
文件夹放在lib/extend下然后再index.js里面写extend然后作为index的依赖模块。




#### 码云特技

1. 使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2. 码云官方博客 [blog.gitee.com](https://blog.gitee.com)
3. 你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解码云上的优秀开源项目
4. [GVP](https://gitee.com/gvp) 全称是码云最有价值开源项目，是码云综合评定出的优秀开源项目
5. 码云官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6. 码云封面人物是一档用来展示码云会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)
