/**
 * 自动定位脚本 v2.0
 * @author: lizhengbo (基于 Peng-YM 原版适配)
 * 更新地址：https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/locate.js
 * 
 * 功能特性：
 * √ 自动获取位置信息
 * √ 位置变化检测与通知
 * √ 多平台兼容支持
 * √ 错误处理与调试
 * 
 * 配置说明：
 * 1️⃣ 根据平台添加如下配置
 * (1). Quantumult X
 * [MITM]
 * hostname=weatherkit.apple.com, api.weather.com
 * [rewrite_local]
 * https:\/\/((weatherkit\.apple)|(api.weather))\.com url script-request-header https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/locate.js
 * 
 * (2). Loon
 * [MITM]
 * hostname=weatherkit.apple.com, api.weather.com
 * [Script]
 * http-request https:\/\/((weatherkit\.apple)|(api.weather))\.com script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/locate.js, require-body=false
 * 
 * (3). Surge
 * [MITM]
 * hostname=weatherkit.apple.com, api.weather.com
 * [Script]
 * type=http-request, pattern=https:\/\/((weatherkit\.apple)|(api.weather))\.com, script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/locate.js, require-body=false
 * 
 * 2️⃣ 打开手机设置 > 隐私 > 定位服务
 * (1) 打开定位服务
 * (2) 选择天气，设置永远允许天气访问位置信息，并允许使用精确位置
 * 
 * 注意：此重写不要禁用，需要安装系统自带的天气应用
 * 在其他脚本中可通过 "latitude" 和 "longitude" 字段引用当前经纬度
 */

/********************** SCRIPT START *********************************/
const $ = API("locate");

/**
 * 显示位置信息配置
 * 可通过 BoxJS 或脚本内部设置
 */
let display_location = $.read("display_location");
if (display_location === undefined) {
  display_location = false;
} else {
  display_location = JSON.parse(display_location);
}

if (typeof $request !== "undefined") {
  // 获取位置信息处理逻辑
  const url = $request.url;
  
  /**
   * 支持多种URL格式的正则表达式匹配
   * 兼容不同版本的天气API接口
   */
  const res =
    url.match(/weather\/.*?\/(.*)\/(.*)\?/) ||
    url.match(/geocode\/([0-9.]*)\/([0-9.]*)\//) ||
    url.match(/geocode=([0-9.]*),([0-9.]*)/) ||
    url.match(/v2\/availability\/([0-9.]*)\/([0-9.]*)\//) ||
    url.match(/v2\/weather\/.*?\/([0-9.-]+)\/([0-9.-]+)\?/);
    
  if (res === null) {
    $.info(`❌ 正则表达式匹配错误，无法从URL: ${url} 获取位置信息`);
    $.done({ body: $request.body });
    return;
  }
  
  const location = {
    latitude: res[1],
    longitude: res[2],
  };
  
  // 数据验证
  const isNumeric = (input) => input && !isNaN(input);
  if (!isNumeric(location.latitude) || !isNumeric(location.longitude)) {
    $.info("❌ 获取到的经纬度数据格式错误");
    $.done({ body: $request.body });
    return;
  }
  
  if (Number(location.latitude) > 90 || Number(location.longitude) > 180) {
    $.info("❌ 经纬度数值超出有效范围");
    $.done({ body: $request.body });
    return;
  }
  
  // 获取之前保存的位置信息
  const oldLocation = $.read("location");
  
  // 检查位置是否发生变化（精度0.001度，约100米）
  const locationChanged = !oldLocation || 
    Math.abs(parseFloat(oldLocation.latitude) - parseFloat(location.latitude)) > 0.001 ||
    Math.abs(parseFloat(oldLocation.longitude) - parseFloat(location.longitude)) > 0.001;
  
  // 位置变化通知
  if (!oldLocation) {
    $.notify("[自动定位]", "🎉 定位服务已启用", "成功获取当前位置信息");
  } else if (locationChanged) {
    $.notify("[自动定位]", "📍 位置已更新", 
      `新位置：纬度 ${location.latitude}, 经度 ${location.longitude}`);
  }
  
  // 调试信息输出
  if (display_location) {
    $.info(
      `✅ 成功获取当前位置：纬度 ${location.latitude}, 经度 ${location.longitude}`
    );
  }

  // 兼容性存储 - 支持旧版本脚本调用
  $.write(res[1], "#latitude");
  $.write(res[2], "#longitude");
  
  // 新版本存储方式 - 完整位置对象
  $.write(location, "location");
  
  // 更新时间戳
  $.write(new Date().getTime(), "location_updated");
  
  $.done({ body: $request.body });
} else {
  // 非请求模式 - 可用于调试或状态检查
  const location = $.read("location");
  const lastUpdated = $.read("location_updated");
  
  if (location && lastUpdated) {
    const updateTime = new Date(lastUpdated);
    $.info(`📍 当前位置：纬度 ${location.latitude}, 经度 ${location.longitude}`);
    $.info(`🕐 更新时间：${updateTime.toLocaleString()}`);
  } else {
    $.info("❌ 未找到位置信息，请确保已正确配置MITM重写规则");
  }
  
  $.done();
}

// prettier-ignore
/*********************************** API *************************************/
function ENV() { const e = "undefined" != typeof $task, t = "undefined" != typeof $loon, s = "undefined" != typeof $httpClient && !t, i = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: e, isLoon: t, isSurge: s, isNode: "function" == typeof require && !i, isJSBox: i, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: i, isScriptable: n, isNode: o } = ENV(), r = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/; const u = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(l => u[l.toLowerCase()] = (u => (function (u, l) { l = "string" == typeof l ? { url: l } : l; const h = e.baseURL; h && !r.test(l.url || "") && (l.url = h ? h + l.url : l.url); const a = (l = { ...e, ...l }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...l.events }; let f, d; if (c.onRequest(u, l), t) f = $task.fetch({ method: u, ...l }); else if (s || i || o) f = new Promise((e, t) => { (o ? require("request") : $httpClient)[u.toLowerCase()](l, (s, i, n) => { s ? t(s) : e({ statusCode: i.status || i.statusCode, headers: i.headers, body: n }) }) }); else if (n) { const e = new Request(l.url); e.method = u, e.headers = l.headers, e.body = l.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } const p = a ? new Promise((e, t) => { d = setTimeout(() => (c.onTimeout(), t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)), a) }) : null; return (p ? Promise.race([p, f]).then(e => (clearTimeout(d), e)) : f).then(e => c.onResponse(e)) })(l, u))), u } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: i, isSurge: n, isNode: o, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (o) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (i || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), o) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (i || n) && $persistentStore.write(e, this.name), o && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || i) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); o && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || i ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : o ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || i) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); o && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", l = "", h = {}) { const a = h["open-url"], c = h["media-url"]; if (s && $notify(e, t, l, h), n && $notification.post(e, t, l + `${c ? "\n多媒体:" + c : ""}`, { url: a }), i) { let s = {}; a && (s.openUrl = a), c && (s.mediaUrl = c), "{}" === JSON.stringify(s) ? $notification.post(e, t, l) : $notification.post(e, t, l, s) } if (o || u) { const s = l + (a ? `\n点击跳转: ${a}` : "") + (c ? `\n多媒体: ${c}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || i || n ? $done(e) : o && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }
/****************************************************************************/