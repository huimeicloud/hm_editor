(function () {
    function validatorNum(msg) {
        return function () {
            var value = this.getValue(),
                pass = !!(CKEDITOR.dialog.validate.integer()(value) && value > 0);

            if (!pass) {
                alert(msg);
                this.select();
            }

            return pass;
        };
    }

    function customInsert(editor, type) {
        var tableLangs = editor.lang.table;
        var rowInsertDirection = [
            ['在上方插入', 'before'],
            ['在下方插入', 'after'],
        ]
        var columnInsertDirection = [
            ['在左侧插入', 'left'],
            ['在右侧插入', 'right'],
        ]
        return {
            title: type === 'customInsertRow' ? tableLangs.row.customInsert : tableLangs.column.customInsert,
            minWidth: 350,
            minHeight: 100,
            contents: [
                {
                    id: 'customInsert',
                    elements: [{
                        type: 'hbox',
                        children: [
                            {
                                id: 'insertDirection',
                                type: 'select',
                                'default': type === 'customInsertRow' ? 'before' : 'left',
                                label: '插入位置',
                                controlStyle: 'width:130px',
                                items: type === 'customInsertRow' ? rowInsertDirection : columnInsertDirection,
                                commit: function (data) {
                                    var id = this.id;
                                    data[id] = this.getValue();
                                }
                            },
                            {
                                id: 'insertNum',
                                type: 'text',
                                controlStyle: 'width:100px',
                                label: type === 'customInsertRow' ? '插入行数' : '插入列数',
                                'default': 1,
                                validate: type === 'customInsertRow' ? validatorNum(tableLangs.row.insertValidate) : validatorNum(tableLangs.column.insertValidate),
                                commit: function (data) {
                                    var id = this.id;
                                    data[id] = this.getValue();
                                }
                            }
                        ]
                    },{
                        type: 'hbox',
                        style: type === 'customInsertRow'?'margin-top:10px':'display:none',
                        children: [{
                                id: 'insertWithDataSource',
                                type: 'checkbox',
                                'default': true,
                                label: '带数据元插入',
                                commit: function (data) {
                                    var id = this.id;
                                    data[id] = this.getValue();
                                }
                        }]
                    }
                ]}
            ],
            onOk: function () {
                var selection = editor.getSelection(),
                    cells = editor.plugins.tabletools.getSelectedCells(selection);
                var data = {};
                this.commitContent(data);
                var insertNum = Number(data.insertNum);
                var insertWithDataSource = data.insertWithDataSource;
                if(type === 'customInsertRow'){
                    if (data.insertDirection === 'before') {
                        editor.plugins.tabletools.insertRow(editor, cells, true, insertNum ,insertWithDataSource);
                    } else {
                        editor.plugins.tabletools.insertRow(editor, cells, false, insertNum ,insertWithDataSource);
                    }
                }else{
                    if (data.insertDirection === 'left') {
                        editor.plugins.tabletools.insertColumn(cells, true, insertNum);
                    } else {
                        editor.plugins.tabletools.insertColumn(cells, false, insertNum);
                    }
                }
            },
        };
    }

    CKEDITOR.dialog.add('customInsertRow', function (editor) {
        return customInsert(editor, 'customInsertRow');
    });
    CKEDITOR.dialog.add('customInsertColumn', function (editor) {
        return customInsert(editor, 'customInsertColumn');
    });
}())
