/**

 @Name：tablePlug 表格拓展插件
 @Author：岁月小偷
 @License：MIT

 */

layui.define(['table'], function (exports) {
  "use strict";

  var $ = layui.$
    , laytpl = layui.laytpl
    , laypage = layui.laypage
    , layer = layui.layer
    , form = layui.form
    , util = layui.util
    , table = layui.table
    , hint = layui.hint()
    , device = layui.device()
    , tabelIns = {}
    , CHECK_TYPE_ADDITIONAL = 'additional'  // 新增的
    , CHECK_TYPE_REMOVED = 'removed'  // 删除的
    , CHECK_TYPE_ORIGINAL = 'original' // 原有的

    , tableCheck = function () {
      var checked = {};
      return {
        // 检验是否可用，是否初始化过
        check: function (tableId) {
          return !!checked[tableId];
        },
        reset: function (tableId) {
          if (!checked[tableId]) {
            checked[tableId] = {
              original: [],
              additional: [],
              removed: []
            };
          } else {
            this.set(tableId, CHECK_TYPE_ADDITIONAL, []);    // 新增的
            this.set(tableId, CHECK_TYPE_REMOVED, []);       // 删除的
          }
        },
        init: function (tableId, data) {
          debugger;
          this.reset(tableId);
          this.set(tableId, CHECK_TYPE_ORIGINAL, data);
        },
        // 获得当前选中的，不区分状态
        getChecked: function (tableId) {
          var delArr = this.get(tableId, CHECK_TYPE_REMOVED);

          var retTemp = this.get(tableId, CHECK_TYPE_ORIGINAL).concat(this.get(tableId, CHECK_TYPE_ADDITIONAL));
          var ret = [];
          layui.each(retTemp, function (index, data) {
            if (delArr.indexOf(data) === -1 && ret.indexOf(data) === -1) {
              ret.push(data);
            }
          });
          return ret;
        },
        get: function (tableId, type) {
          if (type === CHECK_TYPE_ADDITIONAL
            || type === CHECK_TYPE_REMOVED
            || type === CHECK_TYPE_ORIGINAL) {
            return checked[tableId] ? checked[tableId][type] : [];
          } else {
            return checked[tableId];
          }
        },
        set: function (tableId, type, data) {
          if (type !== CHECK_TYPE_ORIGINAL
            && type !== CHECK_TYPE_ADDITIONAL
            && type !== CHECK_TYPE_REMOVED) {
            console.log('代码有误：类型出错！');
            return;
          }
          checked[tableId][type] = (!data || !isArray(data)) ? [] : data;
        },
        update: function (tableId, id, checkedStatus) {
          var _original = checked[tableId][CHECK_TYPE_ORIGINAL];
          var _additional = checked[tableId][CHECK_TYPE_ADDITIONAL];
          var _removed = checked[tableId][CHECK_TYPE_REMOVED];
          if (checkedStatus) {
            // 勾选
            // if (_additional.indexOf(id) !== -1) {
            //     // 已经存在，
            // }
            if (_original.indexOf(id) === -1) {
              // 不在原来的集合中
              if (_additional.indexOf(id) === -1) {
                _additional.push(id);
              } else {
                // 多余的，但是应该是避免这从情况的
              }
            } else {
              // 在原来的集合中，意味着之前有去掉勾选的操作
              if (_removed.indexOf(id) !== -1) {
                _removed.splice(_removed.indexOf(id), 1);
              }
            }
          } else {
            // 取消勾选
            if (_original.indexOf(id) === -1) {
              // 不在原来的集合中，意味着以前曾经添加过
              if (_additional.indexOf(id) !== -1) {
                _additional.splice(_additional.indexOf(id), 1);
              }
            } else {
              // 在原来的集合中
              if (_removed.indexOf(id) === -1) {
                _removed.push(id);
              }
            }
          }
        }
      }
    }()

    , isArray = function (obj) {
      // 判断一个变量是不是数组
      return Object.prototype.toString.call(obj) === '[object Array]';
    }

    // 针对表格中是否选中的数据处理
    , dataRenderChecked = function (data, tableId, checkName) {
      debugger;
      if (!data || !tableId) {
        return;
      }
      var arrAdd = tableCheck.get(tableId, CHECK_TYPE_ADDITIONAL) || [],
        arrOld = tableCheck.get(tableId, CHECK_TYPE_ORIGINAL) || [],
        arrDel = tableCheck.get(tableId, CHECK_TYPE_REMOVED) || [],
        tableCheckStatus = arrAdd.concat(arrOld.filter(function (_data, _index) {
          return arrDel.indexOf(_data) === -1;
        }));
      for (var i = 0; i < data.length; i++) {
        if (tableCheckStatus.indexOf(data[i].id) !== -1) {
          data[i][checkName || table.config.checkName] = true;
        }
      }
    };

  // 改造table.render和reload记录返回的对象
  var tableRender = table.render;
  table.render = function (config) {
    var that = this;
    var settingTemp = $.extend(true, {}, table.config, config);
    // table一般要给定id而且这个id就是当前table的实例的id
    var tableId = settingTemp.id || $(settingTemp.elem).attr('id');

    if (settingTemp.checkStatus && !tableCheck.check(tableId)) {
      // 如果render的时候设置了checkStatus或者全局设置了默认跨页保存那么重置选中状态
      tableCheck.init(tableId, settingTemp.checkStatus.default);
    }

    var parseData = settingTemp.parseData;
    if (!parseData || !parseData.plugFlag) {
      config.parseData = function (ret) {
        ret = typeof parseData === 'function' ? (parseData.call(that, ret) || ret) : ret;
        var dataName = settingTemp.response ? (settingTemp.response.dataName || 'data') : 'data';
        dataRenderChecked(ret[dataName], tableId);
        return ret;
      };
      config.parseData.plugFlag = true;
    } else {
      console.log('已经初始化过')
    }

    var insTemp = tableRender.call(that, config);
    return tabelIns[insTemp.config.id] = insTemp;
  };
  var tableReload = table.reload;
  table.reload = function (tableId, config) {
    var that = this;
    var insTemp = tableReload.call(that, tableId, config);
    return tabelIns[insTemp.config.id] = insTemp;
  };

  // 获得table的config
  table.getConfig = function (tableId) {
    return tabelIns[tableId] && tabelIns[tableId].config;
  };


  // 原始的
  var checkStatus = table.checkStatus;
  // 重写table的checkStatus方法
  table.checkStatus = function (tableId) {
    debugger;
    var that = this;
    var config = table.getConfig(tableId);
    if (!config || !config.checkStatus) {
      // 不跨页存储
      return checkStatus.call(that, tableId);
    } else {
      var statusTemp = checkStatus.call(that, tableId);
      // 跨页存储
      return {
        data: tableCheck.get(tableId),
        isAll: statusTemp.isAll
      }
    }
  };

  // 监听所有的checkbox注意不要在自己的代码里面也写这个同名的监听，不然会被覆盖，如果需要可以写checkbox()这样子的，
  table.on('checkbox', function (obj) {
    // console.log(obj.checked); //当前是否选中状态
    // console.log(obj.data); //选中行的相关数据
    // console.log(obj.type); //如果触发的是全选，则为：all，如果触发的是单选，则为：one

    var tableView = $(this).closest('.layui-table-view');
    // lay-id是2.4.4版本新增的绑定到节点上的当前table实例的id,
    // 然后再早之前的版本目前做法是去找到它的原始表格的id，所以这里有一个限制，不要自己在render的时候指定跟table的id不一样的id！！！！
    var tableId = tableView.attr('lay-id') || tableView.prev().attr('id');
    var config = table.getConfig(tableId);
    if (config.page && config.checkStatus && tableCheck.check(tableId)) {
      var _checked = obj.checked;
      var _data = obj.data;
      var _type = obj.type;

      var primaryKey = config.checkStatus.primaryKey || 'id';

      if (_type === 'one') {
        tableCheck.update(tableId, _data[primaryKey], _checked);
      } else if (_type === 'all') {
        // 全选或者取消全不选
        layui.each(layui.table.cache[tableId], function (index, data) {
          tableCheck.update(tableId, data[primaryKey], _checked);
        });
      }
    }
  });

  //外部接口
  var tablePlug = {
    CHECK_TYPE_ADDITIONAL: CHECK_TYPE_ADDITIONAL
    , CHECK_TYPE_REMOVED: CHECK_TYPE_REMOVED
    , CHECK_TYPE_ORIGINAL: CHECK_TYPE_ORIGINAL
    , tableCheck: tableCheck
  };

  exports('tablePlug', tablePlug);
});

 
