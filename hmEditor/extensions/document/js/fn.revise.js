/**
 * 修订模式相关功能
 */
commonHM.component['documentModel'].fn({
    /**
     * 设置文档修订模式
     * @param {Boolean} reviseMode 是否启用修订模式
     */
    setReviseMode: function(reviseMode) {
        var _t = this;
        _t.editor.HMConfig.reviseMode = reviseMode;
        if (reviseMode) {
            _t.editor.commands["revise"].frozen = false;
            _t.editor.commands["revise"].enable();
            _t.editor.execCommand('revise', {reviseState: '显示修订'});
        } else if (!reviseMode && _t.editor.reviseModelOpened) {
            _t.editor.reviseModelOpened = reviseMode;

            // 创建确认对话框
            var $dialog = $('<div class="revise-confirm-dialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 1000; min-width: 400px;">' +
                '<div style="position: relative;">' +
                '<span class="close-icon" style="position: absolute; right: -10px; top: -10px; color: gray; cursor: pointer; font-size: 20px;">×</span>' +
                '<h3 style="margin-top: 0; font-size: 20px; margin-bottom: 25px;">关闭修订模式</h3>' +
                '<p style="margin-bottom: 20px;">请选择如何处理修订内容：</p>' +
                '<div style="display: flex; justify-content: space-between; margin-top: 30px;">' +
                '<button class="accept-all-btn" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">全部接受修订</button>' +
                '<button class="reject-all-btn" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">全部拒绝修订</button>' +
                '</div>' +
                '</div>' +
                '</div>');

            // 添加到body
            $('body').append($dialog);
            $dialog.show();

            // 绑定关闭图标事件
            $dialog.find('.close-icon').on('click', function() {
                $dialog.remove();
            });

            // 绑定按钮事件
            $dialog.find('.accept-all-btn').on('click', function() {
                _t.acceptAllRevisions();
                $dialog.remove();
                _t.editor.commands["revise"].frozen = true;
                _t.editor.commands["revise"].disable();
            });

            $dialog.find('.reject-all-btn').on('click', function() {
                _t.rejectAllRevisions();
                $dialog.remove();
                _t.editor.commands["revise"].frozen = true;
                _t.editor.commands["revise"].disable();
            });
        }
    },

    /**
     * 接受所有修订
     */
    acceptAllRevisions: function() {
        var _t = this;
        var $body = $(_t.editor.document.getBody().$);
        
        // 处理新增内容
        $body.find('.hm_revise_ins').each(function() {
            var $ins = $(this);
            $ins.replaceWith($ins.text());
        });

        // 处理删除内容
        $body.find('.hm_revise_del').each(function() {
            var $del = $(this);
            $del.remove();
        });
    },

    /**
     * 拒绝所有修订
     */
    rejectAllRevisions: function() {
        var _t = this;
        var $body = $(_t.editor.document.getBody().$);
        
        // 处理新增内容
        $body.find('.hm_revise_ins').each(function() {
            var $ins = $(this);
            $ins.remove();
        });

        // 处理删除内容
        $body.find('.hm_revise_del').each(function() {
            var $del = $(this);
            $del.replaceWith($del.text());
        });
    }
}); 