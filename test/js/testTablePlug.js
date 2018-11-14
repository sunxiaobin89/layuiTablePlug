/**

 @Name：testTablePlug tablePlug测试页面引用的组件
 @Author：岁月小偷
 @License：MIT

 */
layui.config({base: 'layui/src/lay/plug/'}).define(['tablePlug'], function (exports) {
  "use strict";


  var $ = layui.$,
    form = layui.form,
    layer = layui.layer,
    table = layui.table,
    tablePlug = layui.tablePlug;

  // 重置选中状态的按钮点击触发
  window.resetCheckboxStatus = function (elem) {
    elem = $(elem);
    var tableId = elem.data('id');
    tablePlug.tableCheck.reset(tableId);
    // 如果是data模式的需要重新同步一下数据
    var tableConfig = tablePlug.getConfig(tableId);
    !tableConfig.url && tableConfig.data && tablePlug.dataRenderChecked(tableConfig.data, tableId);
    table.reload(tableId, {
      page: {curr: 1}
    });
  };

  // 是否跨页的开关监听
  form.on('switch(statusSwitch)', function (data) {
    var elem = $(data.elem);
    var formElem = elem.closest('.layui-form');
    var tableElem = formElem.next('table');

    var tableId = tableElem.next() ? (tableElem.next().attr('lay-id') || tableElem.attr('id')) : tableElem.attr('id');
    tablePlug.tableCheck.reset(tableId);
    table.reload(tableId, {
      checkStatus: data.elem.checked ? {} : null,
      page: {
        curr: 1
      }
    });
  });

  // 是否启用智能reload
  form.on('switch(smartSwitch)', function (data) {

    tablePlug.smartReload.enable(data.elem.checked);
    $('[lay-event="reload"][data-url="data11"]').first().click();

  });

  // 当前表格要不要智能reload
  form.on('switch(tableSmartSwitch)', function (data) {

    var elem = $(data.elem);
    var formElem = elem.closest('.layui-form');
    var tableElem = formElem.next('table');

    var tableId = tableElem.next() ? (tableElem.next().attr('lay-id') || tableElem.attr('id')) : tableElem.attr('id');
    tablePlug.tableCheck.reset(tableId);
    table.reload(tableId, {
      smartReloadModel: data.elem.checked
    });

  });

  //监听头工具栏事件
  table.on('toolbar(test)', function (obj) {
    var config = obj.config;
    var btnElem = $(this);
    var tableId = config.id;
    switch (obj.event) {
      case 'getChecked':
        layer.alert(JSON.stringify(table.checkStatus(tableId)));
        break;
      case 'deleteSome':
        // 获得当前选中的，不管它的状态是什么？只要是选中的都会获得
        var checkedIds = tablePlug.tableCheck.getChecked(tableId);
        layer.confirm('您是否确定要删除选中的' + checkedIds.length + '条记录？', function () {
          layer.alert('do something with: ' + JSON.stringify(checkedIds));
        });
        break;
      case 'jump':
        var pageCurr = btnElem.data('page');
        table.reload(config.id, {url: 'json/data1' + pageCurr + '.json', page: {curr: pageCurr}});
        break;
      case 'reload':
        var options = {page: {curr: 1}};
        var urlTemp = btnElem.data('url');
        if (urlTemp) {
          options.url = 'json/' + urlTemp + '.json';
        }
        var optionTemp = eval('(' + (btnElem.data('option') || '{}') + ')');

        table.reload(config.id, $.extend(true, options, optionTemp));
        break;
      case 'reloadIns':
        debugger;
        tablePlug.getIns(config.id).reload({
          page: false
        });
        break;
    }
  });

  //监听行工具事件
  table.on('tool(test)', function (obj) { //注：tool 是工具条事件名，test 是 table 原始容器的属性 lay-filter="对应的值"
    var data = obj.data //获得当前行数据
      , layEvent = obj.event; //获得 lay-event 对应的值
    if (layEvent === 'detail') {
      layer.msg('查看操作');
    } else if (layEvent === 'del') {
      layer.confirm('真的删除行么', function (index) {
        obj.del(); //删除对应行（tr）的DOM结构
        layer.close(index);
        //向服务端发送删除指令
      });
    } else if (layEvent === 'edit') {
      layer.msg('编辑操作');
    }
  });

  exports('testTablePlug', {});
});


