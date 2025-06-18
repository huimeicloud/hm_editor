/**
 * 惠每电子病历编辑器提醒端功能
 * 用于显示和处理系统提醒
 */
commonHM.component['hmAi'].fn({
    /**
     * 初始化提醒端
     * @param {Object} opts - 配置参数
     */
    initReminder: function(messageList) {
        var _t = this;
        _t.reminderList = messageList || []; // 存储提醒列表
        _t.reminderCount = messageList ? messageList.length : 0; // 提醒数量
        if(!_t.reminderCount){
            return;
        }

        // 初始化提醒面板
        _t.initReminderPanel(messageList);

        // 绑定提醒事件
        _t.bindReminderEvents();
    },

    /**
     * 初始化提醒面板
     */
    initReminderPanel: function(messageList) {
        var _t = this;
        // 加载提醒面板模板
        var tpl = $.getTpl($docAi_tpl['docAi/tpl/reminderSimple'],{count:_t.reminderCount});
        // 将模板添加到编辑器
        // 判断当前是否是分页状态
        if(_t.editor.HMConfig.realtimePageBreak){
            _t.$body.find('.hm-logic-page').first().prepend(tpl);
        }else{
            _t.$body.prepend(tpl);
        }
        _t.$reminderPanel = _t.$body.find('.doc-reminder');
        _t.$reminderPanel.find('.doc-reminder-list').append($.getTpl($docAi_tpl['docAi/tpl/reminder'],{list:_t.reminderList.slice(0,3)}));
        
    },


    /**
     * 创建提醒项DOM
     */
    createReminderItem: function(item) {
        // 使用模板创建单个提醒项
        var tpl = $.getTpl($docAi_tpl['docAi/tpl/reminder-item'],{item: item});
        return $(tpl);
    },

    /**
     * 处理评估按钮点击事件的通用方法
     * @param {string} uucode - 提醒项的唯一标识
     */
    handleEvaluateClick: function(uucode) {
        var _t = this;
        var item = _t.cachWarn[uucode];
        var qcPatient = _t.cachWarn['patientInfo'];
        
        if (!item) {
            console.error('未找到对应的提醒项数据, uucode:', uucode);
            return;
        }
        
        if (!item.businessField) {
            console.error('提醒项缺少businessField数据', item);
            return;
        }
        
        if (!qcPatient) {
            console.error('缺少患者信息数据');
            return;
        }
        
        // 处理评估逻辑
        var sdkWindow = _t.utils.getSDKWindow(); 
        if (!sdkWindow || !sdkWindow.HM) {
            console.error('无法获取SDK窗口或HM对象不存在');
            return;
        }
        
        try {
            sdkWindow.HM.openComponent({
                type: '5',
                data: {
                    id: item.businessField.assessId,
                    path: item.businessField.assessFileName,
                    name: item.businessField.assessName,
                    recordId: qcPatient.recordId
                }
            });
        } catch (error) {
            console.error('打开评估组件时发生错误:', error);
        }
    },

    /**
     * 绑定提醒面板事件
     */
    bindReminderEvents: function() {
        var _t = this;
        // 绑定忽略全部按钮事件
        _t.$reminderPanel.on('click', '.btt-ignore-all', function() {
            _t.handleIgnoreAll();
        });

        // 绑定查看全部按钮事件
        _t.$reminderPanel.on('click', '.btt-view-all', function() {
            _t.handleViewAll();
        });

        // 绑定单个忽略按钮事件
        _t.$reminderPanel.on('click', '.btt-ignore', function() {
            var uucode = $(this).attr('uucode');
            var item = _t.cachWarn[uucode];
            if (item) {
                _t.handleReminderIgnore(item);
            }
        });

        // 绑定评估按钮事件
        _t.$reminderPanel.on('click', '.btt-evalute', function() {
            var uucode = $(this).attr('uucode');
            _t.handleEvaluateClick(uucode);
        });
    },


    /**
     * 处理暂不采用事件
     * @param {Object} item - 提醒项数据
     */
    handleReminderIgnore: function(item) {
        var _t = this;

        // 发送忽略请求
        // _t.utils.request({
        //     url: _t.Url.ignoreWarn,
        //     data: {
        //         id: item.uucode,
        //         ignoreReason: '用户选择暂不采用'
        //     },
        //     success: function() {
        //         // 从提醒列表中移除
        //         _t.removeReminderItem(item);
        //     }
        // });
        _t.removeReminderItem(item.uucode);
    },


    /**
     * 处理忽略全部事件
     */
    handleIgnoreAll: function() {
        var _t = this;

        // 批量忽略请求
        // _t.utils.request({
        //     url: _t.Url.ignoreWarn,
        //     data: ignoreRequests,
        //     success: function() {
        //         // 清空提醒列表
        //         _t.reminderList = [];
        //         _t.reminderCount = 0;
        //     }
        // });

        // 清空数据
        _t.reminderList = [];
        _t.reminderCount = 0;

        // 添加过渡效果，使面板平滑消失
        var $panel = _t.$reminderPanel;

        // 先记录面板的高度和宽度
        var panelHeight = $panel.height();

        // 设置初始样式，准备过渡
        $panel.css({
            'height': panelHeight + 'px',
            'opacity': '1',
            'overflow': 'hidden',
            'transition': 'all 0.3s ease' // 需要显式设置过渡效果，因为CSS可能没有为面板设置
        });

        // 触发重排
        $panel[0].offsetHeight;

        // 开始过渡动画
        $panel.css({
            'opacity': '0',
            'height': '0'
        });

        // 监听过渡结束，移除面板
        $panel.one('transitionend', function() {
            $panel.remove();
        });
    },

    /**
     * 处理查看全部事件
     */
    handleViewAll: function() {
        var _t = this;
        var tpl = $.getTpl($docAi_tpl['docAi/tpl/reminderFrame'],{count:_t.reminderCount});
      
        _t.$reminderAllPanel = $(tpl);
          // 将模板添加到编辑器
          $('body').append(_t.$reminderAllPanel);
        _t.$reminderAllPanel.find('.doc-reminder-list').css({
            'height': 'calc(100% - 30px)'
        }).append($.getTpl($docAi_tpl['docAi/tpl/reminder'],{list:_t.reminderList || []}));
        
       _t.bindReminderAllEvents();

    },
    /**
     * 全部面板事件绑定
     */
    bindReminderAllEvents: function(){
        var _t = this;
        
        // 绑定关闭按钮事件
        _t.$reminderAllPanel.on('click', '.btt-view-close', function() {
            _t.$reminderAllPanel.remove();
            _t.$reminderAllPanel = null;
        });
        
        // 绑定单个忽略按钮事件
        _t.$reminderAllPanel.on('click', '.btt-ignore', function() {
            var uucode = $(this).attr('uucode');
            var item = _t.cachWarn[uucode];
            if (item) {
                _t.handleReminderIgnore(item);
            }
        });
        
        // 绑定评估按钮事件
        _t.$reminderAllPanel.on('click', '.btt-evalute', function() {
            var uucode = $(this).attr('uucode');
            _t.handleEvaluateClick(uucode);
        });
        
        // 绑定忽略全部按钮事件
        _t.$reminderAllPanel.on('click', '.btt-ignore-all', function() {
            _t.$reminderAllPanel.remove();
            _t.$reminderAllPanel = null;
            _t.handleIgnoreAll();
        });
    },

    /**
     * 从提醒列表中移除项并添加新项
     * @param {Object} uucode - 要移除的提醒项
     */
    removeReminderItem: function(uucode) {
        var _t = this;



        // 从列表中移除
        var index = -1;
        for (var i = 0; i < _t.reminderList.length; i++) {
            if (_t.reminderList[i].uucode === uucode) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            // 移除当前项目
            _t.reminderList.splice(index, 1);
            _t.reminderCount--;
            // 获取要移除的项的DOM元素
            var $item = _t.$reminderPanel.find('.doc-reminder-item[uucode="' +uucode + '"]');
            if($item.length > 0){
                // 使用一次性事件监听器监听过渡结束
                $item.one('transitionend', function() {
                    $item.css('height', '0px');

                    // 监听高度过渡结束
                    $item.one('transitionend', function() {
                        $item.remove();

                        // 如果当前显示的项目数量不足3个且列表中有更多项目
                        var displayedCount = _t.$reminderPanel.find('.doc-reminder-item').length;
                        if (displayedCount < 3 && _t.reminderCount > displayedCount) {
                            // 添加下一个项目
                            var nextItemIndex = displayedCount;
                            if (nextItemIndex < _t.reminderList.length) {
                                var nextItem = _t.reminderList[nextItemIndex];
                                var $nextItem = _t.createReminderItem(nextItem);

                                // 添加初始样式，准备过渡效果
                                $nextItem.css({
                                    'height': '0',
                                    'opacity': '0',
                                    'overflow': 'hidden'
                                    // 不需要设置transition，CSS中已经设置了
                                });

                                _t.$reminderPanel.find('.doc-reminder-list').append($nextItem);

                                // 触发重排，必须的，强制浏览器计算布局
                                $nextItem[0].offsetHeight;

                                // 设置目标样式，触发过渡效果
                                $nextItem.css({
                                    'height': 'auto',
                                    'opacity': '1'
                                });
                            }
                        }

                        // 更新提醒数量
                        _t.$reminderPanel.find('.doc-reminder-number').text(_t.reminderCount + '条提醒');

                        // 如果没有提醒了，隐藏面板
                        if (_t.reminderCount === 0) {
                            _t.$reminderPanel.hide();
                        }
                    });
                });

                // 设置初始样式，触发过渡效果
                $item.css({
                    'opacity': '0',
                    'height': $item.height() + 'px',
                    'overflow': 'hidden'
                    // 不需要设置transition，CSS中已经设置了
                });
            }
            if(_t.$reminderAllPanel){
                _t.$reminderAllPanel.find('.doc-reminder-item[uucode="' +uucode + '"]').remove();
                _t.$reminderAllPanel.find('.doc-reminder-number-idx').text('['+_t.reminderCount + ']');
            }


        }
    }
});