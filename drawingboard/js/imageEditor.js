
var eventLister = {
    /**
     * 通过网络图片获取图片文件base64位文件流
     */
    getBase64: function(imgUrl) {
      function getBase64Image(img,width,height) {
        var tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = width ? width : img.width;
        tmpCanvas.height = height ? height : img.height;
        var ctx = tmpCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0, tmpCanvas.width, tmpCanvas.height);
        var dataURL = tmpCanvas.toDataURL();
        return dataURL;
      }
      var image = new Image();
      // image.crossOrigin = 'anonymous'; //Anonymous
      // image.src = imgUrl;
      // image.crossorigin = 'Anonymous';
      image.setAttribute('crossOrigin', 'anonymous');
      var deferred=$.Deferred();
      if(imgUrl){
        image.onload =function (){
          deferred.resolve(getBase64Image(image)); //将base64传给done上传处理
        }
        image.src = imgUrl;
        return deferred.promise(); //问题要让onload完成后再return sessionStorage['imgTest']
      }
    },
    /**
     * 添加图片
     * @param {*} url 
     * @param {*} imageName 
     */
    addImageObject: function (url) {
      try{      

        fabric.Image.fromURL(url, function (image) {
          image.set({
            originX: 'left',
            originY: 'top',
            crossOrigin: 'anonymous',
            isInitImage: true
          });
          canvas.initImageObj = image;
          canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas));
          resizeImageSize(canvas);
        });
      }catch(e){
        console.log(e);
      }
    },
    clearObjects: function () {
      var canvasList = canvas.getObjects().slice();
      for(i =0 ; i < canvasList.length; i++){
        canvas.remove(canvasList[i]);
      }
      canvas.clear();
    }
};



(function () {
  //变量声明
  var mouseFrom = {},
    mouseTo = {},
    drawType = null,
    drawWidth = 1; //笔触宽度
  var drawingObject = null; //当前绘制对象
  var moveCount = 1; //绘制移动计数器
  var doDrawing = false; // 绘制状态
  var colorPickerDom = null;

  var defaultSelectionStyle = {
      cornerStyle: 'circle',
      cornerSize: 10,
      cornerColor: '#78C2FA',
      cornerStrokeColor: '#78C2FA',
      transparentCorners: false,
      lineWidth: 2,
      borderColor: '#78C2FA'
  };

  var defaultDrawingOption = {
      fillColor: "rgba(255,255,255,0)",
      strokeColor: '#333',
      strokeLineColor: '#333',
      strokeShapeColor: '#333',
      borderColor: '#333',
      color: '#333',
      drawWidth: 1, 
      fontSize: 14,
      fontWeight:'normal',
      fontStyle:'normal',
      textAlign:'left'    
  };
  var currentTarget = null;

  function initCanvas() {
    var canvas = new fabric.Canvas("c", {
      isDrawingMode: false,
      skipTargetFind: false,
      selectable: true,
      selection: true,
      width: $("#c").width(),
      height: $("#c").height(),
      backgroundColor: 'transparent'
    });
  
    window.canvas = canvas;
    window.zoom = window.zoom ? window.zoom : 1;
  }

  function removeActivedObjects() {
    var canvasActiveObject= canvas.getActiveObject();
    if(canvasActiveObject){
      var objects = canvas.getObjects();
      for( i =0; i < objects.length; i++){
        if(canvasActiveObject == objects[i] && !objects[i].isInitImage){
          canvas.remove(objects[i]);
        }
      }
      canvas.renderAll();
    }
  }

  function initCanvasEvent() {
    //绑定画板事件
    canvas.on("mouse:down", function (options) {
      if(drawType == 'rubber'){
        removeActivedObjects();
        return;
      }
      if(drawType == "text"){
        return;
      }
      if(canvas.getActiveObject()){
        return;
      }
      var xy = transformMouse(options.e.offsetX, options.e.offsetY);
      mouseFrom.x = xy.x;
      mouseFrom.y = xy.y;
      canvas.on("mouse:move", moveEvent.bind(this));
      doDrawing = true;
     
    });

    canvas.on("mouse:up", function (options) {
      if(drawType == "text"){
        return;
      }
      var xy = transformMouse(options.e.offsetX, options.e.offsetY);
      mouseTo.x = xy.x;
      mouseTo.y = xy.y;
      drawingObject = null;
      moveCount = 1;
      doDrawing = false;
      setSelectionMode(true);
      canvas.off("mouse:move", this.moveEvent);
    });

    canvas.on("selection:created", function (e) {
      currentTarget = e.target;
      currentTarget.set(defaultSelectionStyle);
      if(currentTarget.text){
        return;
      }
      setSelectionMode(true);        
    });

    canvas.on('mouse:dblclick', function(options){
      var xy = transformMouse(options.e.offsetX, options.e.offsetY);
      mouseFrom.x = xy.x;
      mouseFrom.y = xy.y;
      if(drawType == 'text'){
        createText();
      }
    })
  }

  /**
   * 移动事件处理
   * @param {*} options 
   */
  function moveEvent(options) {
    if (moveCount % 2 && !doDrawing) {
      //减少绘制频率
      return;
    }
    setSelectionMode(false);
    moveCount++;
    var xy = transformMouse(options.e.offsetX, options.e.offsetY);
    mouseTo.x = xy.x;
    mouseTo.y = xy.y;
    drawing();
  }

  function setSelectionMode(flag) {
    canvas.selection = flag;
  }

  /**
   * 设置当前画笔模式是否启用
   * @param {*} flag 
   */
  function setCurDrawingMode(flag) {
    canvas.isDrawingMode = flag;
  }

  //坐标转换
  function transformMouse(mouseX, mouseY) {
    return { x: mouseX / window.zoom, y: mouseY / window.zoom };
  }

  
 //色板初始化
  function initColorPicker() {
    var colorpicker = tui.colorPicker.create({
      container: document.getElementById('tui-color-picker-conatiner'),
      usageStatistics: false
    });
    colorPickerDom =  $("#pen-group").find("#tui-color-picker-conatiner")[0];
    colorpicker.on('selectColor', function(obj) {   
      if(drawType == 'text'){
        defaultDrawingOption.color = obj.color;
        defaultDrawingOption.borderColor = obj.color;        
      }else if(drawType == 'line' || drawType == 'arrow'|| drawType == 'dottedline'  ){
        defaultDrawingOption.strokeLineColor = obj.color; 
      }else if(drawType == '' || drawType == 'freeline'){
        defaultDrawingOption.strokeColor = obj.color;      
        initDrawingPen();
      }  
    });
  }
  
  function initFirstToolsEvent() {
      //绑定编辑工具栏事件
      $("#toolsul").find(">li").on("click", function () {

        $(this) .addClass("active").siblings().removeClass("active");
        var _this = $(this);
        drawType = '';
        var _drawType = _this.attr("data-type");
        if(_drawType) {
          drawType = _drawType;
        }
        var dataShowItem = _this.attr('data-show');
        setCurDrawingMode(false);
        if(dataShowItem){
          var _curSubmenu = $("#editor-submenu #"+ _this.attr('data-show'));
          if(_curSubmenu.hasClass('submenu-active')){
            _curSubmenu.removeClass('submenu-active');
          }else {
            _curSubmenu.addClass('submenu-active').siblings().removeClass('submenu-active');      
          }
          switch (dataShowItem){
            case "pen-group":         
              setColorPicker('pen-group');
              initDrawingPen();
              showSizeGroup(); 
              break;
            case "line-group":        
              setColorPicker('line-group');  
              showLineGroup();
              break;
            case "text-group":  
              setColorPicker('text-group');
              showTextGroup();           
              break;
            default:
              break;
          }
        }else {
          $("#editor-submenu ul").removeClass("submenu-active");
        }
      });
  }

  function setColorPicker(type){
    var colorPenPicker = $("#pen-group").find("#tui-color-picker-conatiner");
    var colorLinePicker = $("#line-group").find("#tui-color-picker-conatiner");
    var colorTextPicker = $("#text-group").find("#tui-color-picker-conatiner");
    if(type == 'pen-group'){
      if(colorPenPicker.length == 0){
        $("#pen-group").children("div").append(colorPickerDom);     
      }
    }else if(type == 'line-group'){
      if(colorPenPicker){
        colorPenPicker.remove();
      }
      if(colorLinePicker.length == 0){
        $("#line-group").children("div").append(colorPickerDom); 
      }   
    }else if(type == 'text-group'){
      if(colorPenPicker){
        colorPenPicker.remove();
      }
      if(colorLinePicker){
        colorLinePicker.remove();
      }
      if(colorTextPicker.length == 0){
        $("#text-group").children("div").append(colorPickerDom);
      }    
    }
    $(".tui-colorpicker-slider-container")[0].style.display='none'; 
  }

  function initSecondToolsEvent() {
    $("#editor-submenu ul .submenu-tool-item").on('click',function(){
      var _this = $(this);
      $("#editor-submenu").find(".submenu-tool-item-active").removeClass("submenu-tool-item-active");
      _this.addClass("submenu-tool-item-active");
      drawType = _this.attr("data-type");

      if($(this).hasClass('fontset-area')){
        drawType = 'text';
      }
      setCurDrawingMode(false);
      if (drawType == "freeline") {
        initDrawingPen();
      }
    });
  }

  /**
   * 初始化画笔
   */
  function initDrawingPen(){
    canvas.freeDrawingBrush.color = defaultDrawingOption.strokeColor; //设置自由绘颜色
    canvas.freeDrawingBrush.width = defaultDrawingOption.drawWidth;
    setCurDrawingMode(true);
  }

  function createText() {
    var textbox = new fabric.Textbox("默认文本", {
      left: mouseFrom.x,
      top: mouseFrom.y,
      MIN_TEXT_WIDTH: 10,
      padding: 5,
      fontSize: defaultDrawingOption.fontSize,
      fontWeight: defaultDrawingOption.fontWeight,
      fontStyle: defaultDrawingOption.fontStyle,
      textAlign: defaultDrawingOption.textAlign,
      borderColor: defaultDrawingOption.borderColor,
      fill: defaultDrawingOption.color
    });
    textbox.set(defaultSelectionStyle);
    canvas.add(textbox).setActiveObject(textbox);
  }

  //绘画方法
  function drawing() {
    if (drawingObject) {
      canvas.remove(drawingObject);
    }
    var canvasObject = null;
    switch (drawType) {
      case "arrow": //箭头
        canvasObject = new fabric.Path(drawArrow(mouseFrom.x, mouseFrom.y, mouseTo.x, mouseTo.y, 15, 15), {
          stroke: defaultDrawingOption.strokeLineColor,
          fill: defaultDrawingOption.fillColor,
          strokeWidth: 1
        });
        break;
      case "line": //直线
        canvasObject = new fabric.Line([mouseFrom.x, mouseFrom.y, mouseTo.x, mouseTo.y], {
          stroke: defaultDrawingOption.strokeLineColor,
          strokeWidth: 1
        });
        break;
      case "dottedline": //虚线
        canvasObject = new fabric.Line([mouseFrom.x, mouseFrom.y, mouseTo.x, mouseTo.y], {
          strokeDashArray: [3, 1],
          stroke: defaultDrawingOption.strokeLineColor,
          strokeWidth: 1
        });
        break;
      case "circle": //正圆
        var left = mouseFrom.x,
          top = mouseFrom.y;
        var radius = Math.sqrt((mouseTo.x - left) * (mouseTo.x - left) + (mouseTo.y - top) * (mouseTo.y - top)) / 2;
        canvasObject = new fabric.Circle({
          left: left,
          top: top,
          stroke: defaultDrawingOption.strokeShapeColor,
          fill: defaultDrawingOption.fillColor,
          radius: radius,
          strokeWidth: 1
        });
        break;
      case "ellipse": //椭圆
        var left = mouseFrom.x,
          top = mouseFrom.y;
        var radius = Math.sqrt((mouseTo.x - left) * (mouseTo.x - left) + (mouseTo.y - top) * (mouseTo.y - top)) / 2;
        canvasObject = new fabric.Ellipse({
          left: left,
          top: top,
          stroke: defaultDrawingOption.strokeShapeColor,
          fill: defaultDrawingOption.fillColor,
          originX: "center",
          originY: "center",
          rx: Math.abs(left - mouseTo.x),
          ry: Math.abs(top - mouseTo.y),
          strokeWidth: 1
        });
        break;
      case "rectangle": //长方形
        var path =
          "M " +
          mouseFrom.x +
          " " +
          mouseFrom.y +
          " L " +
          mouseTo.x +
          " " +
          mouseFrom.y +
          " L " +
          mouseTo.x +
          " " +
          mouseTo.y +
          " L " +
          mouseFrom.x +
          " " +
          mouseTo.y +
          " L " +
          mouseFrom.x +
          " " +
          mouseFrom.y +
          " z";
        canvasObject = new fabric.Path(path, {
          left: left,
          top: top,
          stroke: defaultDrawingOption.strokeShapeColor,
          strokeWidth: 1,
          fill: defaultDrawingOption.fillColor
        });
        break;
      case "triangle": //等边三角形
        var height = mouseTo.y - mouseFrom.y;
        canvasObject = new fabric.Triangle({
          top: mouseFrom.y,
          left: mouseFrom.x,
          width: Math.sqrt(Math.pow(height, 2) + Math.pow(height / 2.0, 2)),
          height: height,
          stroke: defaultDrawingOption.strokeShapeColor,
          strokeWidth: 1,
          fill: defaultDrawingOption.fillColor
        });
        break;
      default:
        break;
    }
    if (canvasObject) {
      canvas.add(canvasObject);
      drawingObject = canvasObject;
    }
  }

  //绘制箭头方法
  function drawArrow(fromX, fromY, toX, toY, theta, headlen) {
    theta = typeof theta != "undefined" ? theta : 30;
    headlen = typeof theta != "undefined" ? headlen : 10;
    // 计算各角度和对应的P2,P3坐标
    var angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI,
      angle1 = (angle + theta) * Math.PI / 180,
      angle2 = (angle - theta) * Math.PI / 180,
      topX = headlen * Math.cos(angle1),
      topY = headlen * Math.sin(angle1),
      botX = headlen * Math.cos(angle2),
      botY = headlen * Math.sin(angle2);
    var arrowX = fromX - topX,
      arrowY = fromY - topY;
    var path = " M " + fromX + " " + fromY;
    path += " L " + toX + " " + toY;
    arrowX = toX + topX;
    arrowY = toY + topY;
    path += " M " + arrowX + " " + arrowY;
    path += " L " + toX + " " + toY;
    arrowX = toX + botX;
    arrowY = toY + botY;
    path += " L " + arrowX + " " + arrowY;
    return path;
  }

  function showSizeGroup(){
    var sliderDom = document.getElementById('size-slider-picker-conatiner');
    sliderDom.innerHTML = '<div class="bar"><div class="box"></div></div><p class="text"></p>';
    var box = sliderDom.getElementsByClassName('box')[0];
    var bar = sliderDom.getElementsByClassName('bar')[0];
    var p = sliderDom.getElementsByTagName('p')[0];
    var cha = bar.offsetWidth - box.offsetWidth;
    box.style.left = (drawWidth - 1) * cha /20 +'px';
    p.innerText = '画笔大小：' + drawWidth;
    //滑动事件
    box.onmousedown = function (ev) {
      var boxL = box.offsetLeft;
      var e = ev || window.event; 
      var mouseX = e.clientX; //鼠标按下的位置
      window.onmousemove = function (ev) {
        var e = ev || window.event;
        var moveL = e.clientX - mouseX; //鼠标移动的距离
        var newL = boxL + moveL; //left值
        // 判断最大值和最小值
        if (newL < 0) {
          newL = 0;
        }
        if (newL >= cha) {
          newL = cha;
        }
        // 改变left值
        box.style.left = newL + 'px';
        // 计算比例
        var bili = (newL + cha/19) / cha * 19;
        p.innerHTML = '画笔大小：' + Math.ceil(bili);
        drawWidth = Math.ceil(bili);
        defaultDrawingOption.drawWidth = drawWidth;
        initDrawingPen(); 
        return false //取消默认事件
      }
      window.onmouseup = function () {
        window.onmousemove = false; //解绑移动事件
        return false
      }
      return false
      };
      
    // 点击事件
    bar.onclick = function (ev) {
      var left = ev.clientX - 60  - sliderDom.offsetLeft - box.offsetWidth / 2;
      if (left < 0) {
        left = 0;
      }
      if (left >= cha) {
        left = cha;
      }
      box.style.left = left + 'px';
      var bili = (left+cha/19) / cha * 19;
      p.innerHTML = '画笔大小：' + Math.ceil(bili);
      drawWidth = Math.ceil(bili);
      defaultDrawingOption.drawWidth = drawWidth; 
      initDrawingPen();
      return false
      }       
  }

  function showTextGroup(){
    drawType = 'text';
    $('#fontsize').val(defaultDrawingOption.fontSize);
    $('#fontsize').change(function(){
      var fontSize = $(this).children('option:selected').val();
      defaultDrawingOption.fontSize = fontSize;
      currentTarget.fontSize = fontSize;
      canvas.renderAll();
    });
    $("[data-type$=fontbold]").click(function(){
      if(defaultDrawingOption.fontWeight == 'normal'){
        defaultDrawingOption.fontWeight = 'bold';
        currentTarget.fontWeight = 'bold';
      }else{
        defaultDrawingOption.fontWeight = 'normal';
        currentTarget.fontWeight = 'normal';
      }  
      canvas.renderAll();   
    });
    $("[data-type$=fontitalic]").click(function(){
      if(defaultDrawingOption.fontStyle == 'normal'){
        defaultDrawingOption.fontStyle = 'italic';
        currentTarget.fontStyle = 'italic';
      }else{
        defaultDrawingOption.fontStyle = 'normal';
        currentTarget.fontStyle = 'normal';      
      }  
      canvas.renderAll();  
    });
    $("[data-type$=fontleft]").click(function(){
      defaultDrawingOption.textAlign = 'left'; 
      currentTarget.textAlign = 'left';
      canvas.renderAll(); 
    });
    $("[data-type$=fontcenter]").click(function(){
      defaultDrawingOption.textAlign = 'center';
      currentTarget.textAlign = 'center';
      canvas.renderAll();
    });
    $("[data-type$=fontright]").click(function(){
      defaultDrawingOption.textAlign = 'right'; 
      currentTarget.textAlign = 'right';
      canvas.renderAll(); 
    });
  }

  function showLineGroup(){
    drawType = 'line';
    var linegroup = $('#line-group li[data-type]');
    for(var i=0;i<linegroup.length;i++){
      linegroup[i].style.color = "#000";    
      linegroup[i].style.backgroundColor = '#f4f4f4'; 
    }
    linegroup[0].style.color = defaultDrawingOption.strokeLineColor;
    linegroup[0].style.backgroundColor = '#d3d3d3';
    linegroup[0].style.borderRadius = '5px';
    $("ul#line-group").on("click","li",function(){
     var liArray = $(this).parent().children();
     for(var i=0;i<liArray.length;i++){
       liArray[i].style.color = "#000";  
       liArray[i].style.backgroundColor = '#f4f4f4';    
     }
     $(this)[0].style.color = defaultDrawingOption.strokeLineColor;
     $(this)[0].style.backgroundColor = '#d3d3d3';
     var line_type = $(this).attr("data-type");
     if(line_type == 'imaginary_line'){
      drawType = 'dottedline';
     }else if(line_type == 'rrow_line'){
      drawType = 'arrow';
     }else {
      drawType = 'line';
     }
    })
  }

  initCanvas();
  initCanvasEvent();
  initColorPicker();
  initFirstToolsEvent()
  initSecondToolsEvent();
})();
