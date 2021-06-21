/*
 * 存放处理公共事情的js
 */
//html设置font-size
(function() {
  const baseSize = 100;
  function setRem() {
    const scale = document.documentElement.clientWidth / 1920; //设计稿尺寸
    document.documentElement.style.fontSize = baseSize * Math.min(scale, 2) + "px";
  }
  window.onresize = function() {
    setRem();
  };
  setRem();
})();
/*
 * 格式化时间
 * @param fmt yyyy(年)，MM(月)，dd(日)，hh(时)，mm(分)，ss(秒)，S(毫秒)，q(季度)
 * @returns {String}  fmt格式的时间字符串
 * @constructor
 */
Date.prototype.formatDate = function (fmt = 'yyyy-MM-dd hh:mm:ss') {
    if (!this) return null;
    var weekText = ['日', '一', '二', '三', '四', '五', '六'];
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "w+": weekText[this.getDay()], //周
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};
/*
 * 获取俩个数之间的随机整数
 */
window.getRandomForRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};
export default {
  msg:'wangjie'
}