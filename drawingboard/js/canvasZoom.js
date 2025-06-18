//配置
var config = function() {
  return {
    height: 300, //默认画板高、宽
    width: 500,
    canvasParentId: "canvasDiv",
    canvasId: "c"
  };
};

//初次设置画板
(function() {
  resizeImageSize(window.canvas);
})();

//设置缩放
function setZoom(canvas) {
  var canvasDiv = $("#" + config().canvasParentId);
  var zoom = 1;
  var eleHeight = canvasDiv.height(),
    eleWidth = canvasDiv.width(),
    cHeight = canvas.height,
    cWidth = canvas.width;
  var height = eleHeight > cHeight ? eleHeight : cHeight;
  var width = eleWidth > cWidth ? eleWidth : cWidth;
  if (width > height) {
    //横版
    width = eleWidth;
    height = eleHeight;
    zoom = width / config().width;
  } else {
    //竖版
    height = height * eleHeight / config().height * 0.8;
    zoom = height / config().height;
  }
  canvas.setZoom(zoom);
  canvas.setWidth(width);
  canvas.setHeight(height);

  window.zoom = zoom;
  canvas.renderAll();
}

function resizeImageSize(canvas) {
  var canvasDiv = $("#canvasDiv");
  var maxSize = 0;
  if(canvasDiv.width() > canvasDiv.height()){
    maxSize = canvasDiv.height();
  }else {
    maxSize = canvasDiv.width();
  }
  maxSize = maxSize > 60 ? maxSize - 60 : maxSize;
  var cwidth = maxSize;
  var cheight = maxSize;
  if(canvas.initImageObj) {
    var imageObj = canvas.initImageObj;
    var imgWidth = imageObj.width;
    var imgHeight = imageObj.height;
    if(imageObj.width >= imageObj.height && imageObj.width > maxSize){
      imgWidth = maxSize;
      imgHeight = (maxSize / imageObj.width) * imageObj.height;
    }else if(imageObj.width < imageObj.height && imageObj.height > maxSize){
      imgHeight = maxSize;
      imgWidth = (maxSize / imageObj.height) * imageObj.width;
    }
    imageObj.set({
      left: 20,
      top: 20
    });
    imageObj.scaleToWidth(imgWidth);
    imageObj.scaleToHeight(imgHeight);
    cwidth = imgWidth + 40;
    cheight = imgHeight + 40;
  }
  canvas.setWidth(cwidth);
  canvas.setHeight(cheight);
  canvas.renderAll();
}

//监听窗体变化
window.onresize = function() {
  // setZoom(window.canvas);
  resizeImageSize(window.canvas);
};
