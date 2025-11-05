/**
 * 住这儿APP自动开门脚本（QuantumultX）
 * 支持：外部传入 deviceName，自动匹配 deviceCode；自动刷新token；统一API封装
 * 运行方式：手动执行/定时任务
 */

const $ = API("zhuzher-open");

// 固定设备映射：从设备名称到设备编码（不入库）
const DEVICE_MAP = [
  { deviceId: "204103", deviceCode: "7ded00067223", deviceName: "AB区东北门人行" },
  { deviceId: "204105", deviceCode: "7ded00067224", deviceName: "A区东门人行" },
  { deviceId: "204125", deviceCode: "7ded00067225", deviceName: "A区东门人行" },
  { deviceId: "204166", deviceCode: "7ded00067226", deviceName: "A区南门人行" },
  { deviceId: "204654", deviceCode: "7ded00067227", deviceName: "B区东南门人行" },
  { deviceId: "204197", deviceCode: "7ded00067228", deviceName: "B区东南门人行" },
  { deviceId: "204613", deviceCode: "7ded00067229", deviceName: "B区西南门睿开" },
  { deviceId: "204610", deviceCode: "7ded00067230", deviceName: "B区山上通道" },
  { deviceId: "200515", deviceCode: "d9af00014176", deviceName: "B区东北AB门" },
  { deviceId: "170314", deviceCode: "d9af00014636", deviceName: "A区东门全高闸睿开" },
  { deviceId: "205904", deviceCode: "d9af00030320", deviceName: "B区东北AB门" },
  { deviceId: "205912", deviceCode: "d9af00030416", deviceName: "AB区东北门人行" },
  { deviceId: "205899", deviceCode: "d9af00030425", deviceName: "B区东南门人行" },
  { deviceId: "201103", deviceCode: "d9af00033768", deviceName: "A区南门人行" }
];

const CONFIG = {
  tokenRefreshApi: "https://api.5th.zone/auth/v3/external/oauth/accessToken",
  openDoorApi: "https://api.5th.zone/p/chaos/fd/api/entrance/v1/easygo/open",
  headers: {  }
};

(async () => {
  try {
    $.info("🚪 开始住这儿自动开门");

    // 1) 支持外部传入 deviceName：从URL或$arguments中读取
    const deviceName = getArg("deviceName");
    $.info(`设备名称: ${deviceName || "未提供"}`);

    // 2) 匹配 deviceCode（不存BoxJS）
    const deviceCode = mapDevice(deviceName);
    if (!deviceCode) throw new Error(`未找到设备名称对应的deviceCode: ${deviceName}`);

    // 3) 读取已保存的 accessToken
    let accessToken = $.read("#zhuzher_access_token");
    const refreshToken = $.read("#zhuzher_refresh_token");

    if (!accessToken && !refreshToken) {
      throw new Error("未找到token，请先登录住这儿APP触发拦截");
    }

    // 4) 授权头
    let headers = { ...CONFIG.headers };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    // 5) 尝试开门，如401则尝试刷新token后重试
    const body = JSON.stringify({ device_code: deviceCode });
    let resp = await $.http.post({ url: CONFIG.openDoorApi, headers, body });

    let data = safeJSON(resp.body);
    if (!data || data.code === 401) {
      $.info("授权失败或过期，尝试刷新token...");
      const refreshed = await refreshAccessToken();
      if (!refreshed) throw new Error("刷新token失败");

      accessToken = $.read("#zhuzher_access_token");
      headers = { ...CONFIG.headers, Authorization: `Bearer ${accessToken}` };
      resp = await $.http.post({ url: CONFIG.openDoorApi, headers, body });
      data = safeJSON(resp.body);
    }

    if (data && data.code === 200) {
      $.notify("住这儿开门成功", deviceName, `设备编码: ${deviceCode}\n时间: ${new Date().toLocaleString()}`);
      $.info("✅ 开门成功");
    } else {
      const msg = (data && data.message) || "开门失败";
      $.notify("住这儿开门失败", deviceName, `${msg}`);
      $.error(`❌ 开门失败: ${msg}`);
    }

    $.done();
  } catch (err) {
    $.error(`❌ 执行错误: ${err.message}`);
    $.notify("住这儿自动开门", "脚本错误", err.message);
    $.done();
  }
})();

function mapDevice(name) {
  if (!name) return null;
  const item = DEVICE_MAP.find((d) => d.deviceName === name);
  return item ? item.deviceCode : null;
}

async function refreshAccessToken() {
  // 说明：接口细节在文档中，通常需要refreshToken或用户凭据；这里采用已拦截数据结构
  const refreshToken = $.read("#zhuzher_refresh_token");
  if (!refreshToken) return false;

  try {
    const resp = await $.http.post({
      url: CONFIG.tokenRefreshApi,
      headers: { ...CONFIG.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = safeJSON(resp.body);
    if (data && data.code === 200 && data.result && data.result.accessToken) {
      $.write(data.result.accessToken, "#zhuzher_access_token");
      if (data.result.refreshToken) $.write(data.result.refreshToken, "#zhuzher_refresh_token");
      if (data.result.userID) $.write(data.result.userID, "#zhuzher_user_id");
      $.info("✅ 刷新token成功");
      return true;
    }
    $.error(`刷新失败: ${data ? data.message : "未知"}`);
    return false;
  } catch (e) {
    $.error(`刷新请求异常: ${e.message}`);
    return false;
  }
}

function safeJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function getArg(key) {
  // QuantumultX 通过 $request / $arguments 传参，兼容多场景
  if (typeof $request !== "undefined") {
    const url = $request.url || "";
    const m = url.match(new RegExp(`${key}=([^&]+)`));
    return m ? decodeURIComponent(m[1]) : null;
  }
  if (typeof $arguments !== "undefined") {
    return $arguments[key] || null;
  }
  return null;
}

// prettier-ignore
/*********************************** API *************************************/
function ENV() { const e = "undefined" != typeof $task, t = "undefined" != typeof $loon, s = "undefined" != typeof $httpClient && !t, i = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: e, isLoon: t, isSurge: s, isNode: "function" == typeof require && !i, isJSBox: i, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: i, isScriptable: n, isNode: o } = ENV(), r = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/; const u = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(l => u[l.toLowerCase()] = (u => (function (u, l) { l = "string" == typeof l ? { url: l } : l; const h = e.baseURL; h && !r.test(l.url || "") && (l.url = h ? h + l.url : l.url); const a = (l = { ...e, ...l }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...l.events }; let f, d; if (c.onRequest(u, l), t) f = $task.fetch({ method: u, ...l }); else if (s || i || o) f = new Promise((e, t) => { (o ? require("request") : $httpClient)[u.toLowerCase()](l, (s, i, n) => { s ? t(s) : e({ statusCode: i.status || i.statusCode, headers: i.headers, body: n }) }) }); else if (n) { const e = new Request(l.url); e.method = u, e.headers = l.headers, e.body = l.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } const p = a ? new Promise((e, t) => { d = setTimeout(() => (c.onTimeout(), t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)), a) }) : null; return (p ? Promise.race([p, f]).then(e => (clearTimeout(d), e)) : f).then(e => c.onResponse(e)) })(l, u))), u } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: i, isSurge: n, isNode: o, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (o) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (i || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), o) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (i || n) && $persistentStore.write(e, this.name), o && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || i) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); o && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || i ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : o ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || i) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); o && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", l = "", h = {}) { const a = h["open-url"], c = h["media-url"]; if (s && $notify(e, t, l, h), n && $notification.post(e, t, l + `${c ? "\n多媒体:" + c : ""}`, { url: a }), i) { let s = {}; a && (s.openUrl = a), c && (s.mediaUrl = c), "{}" === JSON.stringify(s) ? $notification.post(e, t, l) : $notification.post(e, t, l, s) } if (o || u) { const s = l + (a ? `\n点击跳转: ${a}` : "") + (c ? `\n多媒体: ${c}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || i || n ? $done(e) : o && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }
/*****************************************************************************/