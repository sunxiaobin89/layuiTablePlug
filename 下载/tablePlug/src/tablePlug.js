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
    , NONE = 'layui-none'
    , HIDE = 'layui-hide'

    // 检测是否满足智能重载的条件
    , checkSmartReloadCodition = (function () {
      return !!table.thisTable;
    })()
    , getIns = function (id) {
      if (checkSmartReloadCodition) {
        return table.thisTable.that[id];
      }
      hint.error('getIns方法需要在对layui的table进行一定必要的改造才能使用！请到 https://fly.layui.com/jie/43124/ 里面的查看相关内容将table.js进行一个非常小的改造，之后再试试看。');
      return {};
    }

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
    }

    // 如果配置了字段筛选的记忆需要更新字段的hide设置
    if (settingTemp.colFilterRecord) {
      var record = colFilterRecord.get(tableId, config.colFilterRecord);
      $.each(config.cols, function (i, item1) {
        $.each(item1, function (j, item2) {
          // item2.hide = !!record[i + '-' + j]
          item2.hide = !!record[item2.field];
        });
      });
    } else {
      colFilterRecord.clear(tableId);
    }

    var insTemp = tableRender.call(that, config);
    var tableView = insTemp.config.elem.next();
    // 如果table的视图上的lay-id不等于当前表格实例的id强制修改,这个是个非常实用的配置。
    tableView.attr('lay-id') !== insTemp.config.id && tableView.attr('lay-id', insTemp.config.id);

    if (smartReload && checkSmartReloadCodition && insTemp.config.smartReloadModel) {
      var insObj = getIns(insTemp.config.id);
      // 暂时用这个什么时候数据成功与否都会调用的方法来打补丁后面调优
      var setColsWidth = insObj.setColsWidth;
      insObj.setColsWidth = function () {
        var that = this;
        setColsWidth.call(that);
        if (that.elem.data('patch') !== true) {
          return ;
        }

        // 调整过了之后也把状态重置一下
        that.elem.data('patch', null);

        // 打补丁
        var noneElem = tableView.find('.' + NONE);
        if (noneElem.length) {
          // 出现异常
          that.layFixed.find('tbody').html('');
          that.layFixed.addClass(HIDE);

          var laymain = ['<table cellspacing="0" cellpadding="0" border="0" class="layui-table"><tbody></tbody></table>'];

          var prevElem = noneElem.prev();
          if (!prevElem || !prevElem.length) {
            $(laymain.join('')).insertBefore(noneElem);
          }
          that.layTotal.addClass(HIDE);
          that.layPage.addClass(HIDE);
          that.layBox.find('input[lay-filter="layTableAllChoose"]').prop('checked', false);
        } else {
          var layPreELem = that.layFixed.prevObject;
          if (!layPreELem.find(that.layFixed.selector).length) {
            // 数据为空的时候会remove掉固定列的dom，正常了要加回来
            that.layBox.append(that.layFixed);
          }
          // 出现异常的时候隐藏了，正常就显示回来
          that.layFixLeft.removeClass(HIDE);
          that.layTotal.removeClass(HIDE);
          // that.layPage.removeClass(HIDE);
        }

        that.renderForm('checkbox')
      }
    }

    return tabelIns[insTemp.config.id] = insTemp;
  };

  // 改造table reload
  var tableReload = table.reload;
  var queryParams = (function () {
    // 查询模式的白名单
    var params = ['url', 'method', 'where', 'contentType', 'headers', 'parseData', 'request', 'response', 'data', 'page'];
    return {
      // 获得查询的属性
      getParams: function () {
        return params;
      },
      // 注册查询的属性，方便后面自己有扩展新的功能的时候，有一些配置可以注册成不重载的属性
      registParams: function () {
        var that = this;
        layui.each(arguments, function (i, value) {
          if (isArray(value)) {
            that.registParams.apply(that, value);
          } else {
            if (typeof value === 'string' && params.indexOf(value) === -1) {
              params.push(value);
            }
          }
        });
      },
      check: function () {
        
      }
    }
  })();

  // 是否弃用只能重载模式
  var smartReload = (function() {
    var enable = false;
    return {
      enable: function () {
        if (arguments.length) {
          var isEnable = arguments[0];
          if (typeof isEnable !== "boolean") {
            hint.error('如果要开启或者关闭全局的表格智能重载模式，请传入一个true/false为参数');
          } else {
            enable = isEnable;
          }
        } else {
          return enable;
        }
      }
    }
  })();

  // 如何注册新的查询属性的例子
  // queryParams.registParams('initSort', 'test1');
  // console.log(queryParams.getParams());
  // queryParams.registParams(['test1','test2','test3']);
  // console.log(queryParams.getParams());

  // 添加两个目前tablePlug扩展的属性到查询模式白名单中
  queryParams.registParams('colFilterRecord', 'checkStatus');

  table.reload = function (tableId, config) {
    var that = this;

    var configTemp = $.extend(true, {}, getConfig(tableId), config);
    if (smartReload.enable() && configTemp.smartReloadModel) {

      // 如果开启了智能重载模式
      // 是否为重载模式
      var reloadModel = false;
      if (!!configTemp.page !== !!config.page) {
        // 如果是否分页发生了改变
        reloadModel = true;
      }
      if (!reloadModel) {
        var dataParamsTemp = $.extend(true, [], queryParams.getParams());

        layui.each(config, function (_key, _value) {
          var indexTemp = dataParamsTemp.indexOf(_key);
          if (indexTemp === -1) {
            return reloadModel = true;
          } else {
            // 如果匹配到去掉这个临时的属性，下次查找的时候减少一个属性
            dataParamsTemp.splice(indexTemp, 1);
          }
        });
      }

      if (!reloadModel) {
        if (!checkSmartReloadCodition) {
          console.log('您开启了智能重载模式，但是未检测到一个必要的前提，另参考帖子 https://fly.layui.com/jie/43124/ 里面的相关内容将table.js进行一个非常小的改造，之后再试试看。')
        } else {
          var insTemp = getIns(tableId);
          if (typeof config.page === 'object') {
            config.page.curr && (insTemp.page = config.page.curr);
            delete config.elem;
            delete config.jump;
          }
          $.extend(true, insTemp.config, config);
          if (!insTemp.config.page) {
            insTemp.page = 1;
          }
          // 记录一下需要打补丁
          insTemp.elem.data('patch', true);
          insTemp.loading();
          insTemp.pullData(insTemp.page);
          return table.thisTable.call(insTemp);
        }
      }
    }

    // 如果是重载
    var insTemp = tableReload.call(that, tableId, config);
    return tabelIns[insTemp.config.id] = insTemp;
  };

  // 获得table的config
  var getConfig = function (tableId) {
    return tabelIns[tableId] && tabelIns[tableId].config;
  };


  // 原始的
  var checkStatus = table.checkStatus;
  // 重写table的checkStatus方法
  table.checkStatus = function (tableId) {
    var that = this;
    var config = getConfig(tableId);
    var statusTemp = checkStatus.call(that, tableId);
    if (config && config.checkStatus) {
      // 状态记忆
      statusTemp.status = tableCheck.get(tableId);
    }
    return statusTemp;
  };

  // 监听所有的表格中的type:'checkbox'注意不要在自己的代码里面也写这个同名的监听，不然会被覆盖，如果需要可以写checkbox()这样子的，
  table.on('checkbox', function (obj) {

    var tableView = $(this).closest('.layui-table-view');
    // lay-id是2.4.4版本新增的绑定到节点上的当前table实例的id,经过plug的改造render将旧版本把这个id也绑定到视图的div上了。
    var tableId = tableView.attr('lay-id');
    var config = getConfig(tableId);
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

  // 让被美化的复选框支持原始节点的change事件
  form.on('checkbox', function (data) {
    $(data.elem).change();
  });

  // 表格筛选列的状态记录的封装
  var colFilterRecord = (function () {
    var recodeStoreName = 'tablePlug_col_filter_record';
    var getStoreType = function (recordType) {
      return recordType === 'local' ? 'data' : 'sessionData';
    };
    return {
      // 记录
      set: function (tableId, key, checked, recordType) {
        if (!tableId || !key) {
          return;
        }
        // 默认用sessionStore
        var storeType = getStoreType(recordType);
        // var dataTemp = layui[storeType](recodeStoreName)[tableId] || {};
        var dataTemp = this.get(tableId, recordType);
        dataTemp[key] = !checked;
        layui[storeType](recodeStoreName, {
          key: tableId,
          value: dataTemp
        })
      },
      get: function (tableId, recordType) {
        return layui[getStoreType(recordType)](recodeStoreName)[tableId] || {};
      },
      clear: function (tableId) {
        $.each(['data', 'sessionData'], function (index, type) {
          layui[type](recodeStoreName, {
            key: tableId,
            remove: true
          });
        });
      }
    };
  })();

  // 监听表格筛选的点
  $(document).on('change', 'input[lay-filter="LAY_TABLE_TOOL_COLS"]', function (event) {
    var elem = $(this);
    // var key = elem.data('key');
    var key = elem.attr('name');
    var tableView = elem.closest('.layui-table-view');
    var tableId = tableView.attr('lay-id');
    var config = getConfig(tableId);
    var filterRecord = config.colFilterRecord;
    if (filterRecord) {
      colFilterRecord.set(tableId, key, this.checked, filterRecord);
    } else {
      colFilterRecord.clear(tableId)
    }
  });

  //外部接口
  var tablePlug = {
    CHECK_TYPE_ADDITIONAL: CHECK_TYPE_ADDITIONAL
    , CHECK_TYPE_REMOVED: CHECK_TYPE_REMOVED
    , CHECK_TYPE_ORIGINAL: CHECK_TYPE_ORIGINAL
    , tableCheck: tableCheck
    , getConfig: getConfig  // 表格复选列的方法封装
    , colFilterRecord: colFilterRecord  // 表格字段筛选记忆功能的封装
    , getIns: getIns  // 获得某个表格的实例的封装
    , queryParams: queryParams // 表格查询模式的配置封装
    , smartReload: smartReload // 全局设置一个是否开启智能重载模式
    
  };

  exports('tablePlug', tablePlug);
});

 
