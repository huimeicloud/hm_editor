// 页码格式
(function () {
  function pagenum(editor, type) {
    var format = [
      ["第1页", "page"],
      ["第1/N页", "page/total"],
    ];

    return {
      title: "页码格式",
      minWidth: 160,
      minHeight: 60,
      contents: [
        {
          id: "pagenum",
          elements: [
            {
              type: "hbox",
              children: [
                {
                  id: "pageformat",
                  type: "select",
                  default: "page",
                  items: format,
                  label:'格式：',
                  style: 'display: flex;align-items: center;',
                  commit: function (data) {
                    var id = this.id;
                    data[id] = this.getValue();
                  },
                }
              ],
            }
          ],
        },
      ],
      onOk: function () {
        var data = {};
        this.commitContent(data);
        var cell = editor.elementPath().contains('td',1);
	    $(cell.$).empty();
	    cell.appendHtml('第<span contentEditable=false class="page" type="'+data['pageformat']+'">\u0020</span>页');
        
      },
    };
  }

  CKEDITOR.dialog.add("pagenum", function (editor) {
    return pagenum(editor, "pagenum");
  });
})();
