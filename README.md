## kschedule

* 版本：1.0
* 教程：[http://gallery.kissyui.com/kschedule/1.0/guide/index.html](http://gallery.kissyui.com/kschedule/1.0/guide/index.html)
* 不显示双休demo：[http://gallery.kissyui.com/kschedule/1.0/demo/index.html](http://gallery.kissyui.com/kschedule/1.0/demo/index.html)
* 显示双休demo：[http://gallery.kissyui.com/kschedule/1.0/demo/other.html](http://gallery.kissyui.com/kschedule/1.0/demo/other.html)

## 组件说明

* 功能：组件为日程管理提供增、删、改、查功能，方便对时间进行管理。
* 优点：调用简单，功能全面，界面清新，当然还具有很大的升级空间。

## 方法

* render() 渲染组件
* gotoWeek(monday) 切换至monday日期对应该周的视图
* getMonday(date) 获取指定date日期所在周的周一的日期
* isToday(date) 判断指定date是否为当前天
* hasToday() 判断组件视图当前显示周是否包含今天
* hideLine() 用于隐藏当前时间点那条标志线

## 参数说明

* @param container{String|HTMLElement} 日程组件将渲染至该节点
* @param prev{String|HTMLElement} 上一周切换控制节点
* @param next{String|HTMLElement} 下一周切换控制节点
* @param today{String|HTMLElement} 切换至当天所在周
* @param showWeekend{Boolean} 是否显示双休
* @param rowHeight 单行高度，默认26
* @param scrollTo{int} 指定初始滚动到的时间点取值范围0 ~ 23，默认9
* @param highlight{Object} 高亮区域从几点到几点，为显示工作时间设置，默认{from: 9, to: 18}
* @param save{String} 新增日程存储接口链接，要求以jsonp格式返回存储状态，包括记录id
* @param read{String} 读取已有日程列表接口链接，要求返回jsonp数据
* @param delete{String} 删除对应id的日程记录，要求以jsonp格式返回删除状态
* @param update{String} 更新对应id的日程记录，要求以jsonp格式返回更新状态

## 调用示例

本地调试需添加如下配置：

```
var S = KISSY;
S.Config.debug = true;
if (S.Config.debug) {
    var srcPath = "../../../";
    S.config({
        packages:[
            {
                name:"gallery",
                path:srcPath,
                charset:"utf-8",
                ignorePackageNameInUri:true
            }
        ]
    });
}
```

初始化日程组件：

```
S.use('gallery/kschedule/1.0/index,gallery/kschedule/1.0/index.css', function (S, Kschedule) {
     var ksd = new Kschedule({
        container: ".J_Kschedule",
        prev: ".J_PrevWeek",
        next: ".J_NextWeek",
        today: ".J_Today",
        showWeekend: false,
        scrollTo: 8,
        highlight: {
            from: 9,
            to: 18
        },
        save: "http://www.seejs.com/demos/schedule/save.php",
        read: "http://www.seejs.com/demos/schedule/read.php",
        delete: "http://www.seejs.com/demos/schedule/delete.php",
        update: "http://www.seejs.com/demos/schedule/update.php"
     });
     ksd.render();
});
```

## changelog

### 首次提交组件代码


