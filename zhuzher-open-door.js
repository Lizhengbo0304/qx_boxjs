/**
 * 住这儿APP自动开门脚本（QuantumultX）
 * 支持：外部传入 deviceName，自动匹配 deviceCode；自动刷新token；统一API封装
 * 运行方式：手动执行/定时任务
 *
 * 日志增强版：
 * - 关键步骤详细日志
 * - 设备匹配过程日志
 * - Token状态与刷新流程日志（敏感信息打码）
 * - API请求/响应日志（包含耗时）
 * - 错误处理日志与总耗时统计
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
  headers: {
    Host: "api.5th.zone",
    "Zhuzher-Project-Code": "37010105",
    "Content-Type": "application/json",
    Accept: "*/*",
    "Zhuzher-Street-Code": "370102016000",
    "X-Version": "6.0.10",
    "Accept-Language": "zh-Hans-CN;q=1, en-CN;q=0.9",
    "X-API-Version": "20251030",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent": "VKProprietorAssistant/6.0.10 (iPhone; iOS 18.7.1; Scale/3.00)",
    "X-Device-ID": "41052EC8-CAD1-47AB-9D43-BC1043267157",
    "X-Platform": "iOS",
    Connection: "keep-alive",
    "X-channel": "zhuzher",
    "Zhuzher-Project-Role": "6",
  },
};

(function main() {
  const scriptStart = Date.now();
  $.info("================== 开门脚本启动 ==================");
  $.info(`环境: QX=${ENV().isQX} Loon=${ENV().isLoon} Surge=${ENV().isSurge}`);
  
  (async () => {
    try {
      $.info("🚪 开始住这儿自动开门流程");

      // 1) 支持外部传入 deviceName：从URL或$arguments中读取
      const deviceName = getArg("deviceName");
      $.info(`步骤1: 读取设备名称 deviceName=${deviceName ?? "<未提供>"}`);

      // 2) 匹配 deviceCode（不存BoxJS）
      const deviceCode = mapDevice(deviceName);
      $.info(`步骤2: 设备映射 deviceName→deviceCode=${deviceCode ?? "<未匹配>"}`);
      if (!deviceCode) throw new Error(`未找到设备名称对应的deviceCode: ${deviceName}`);

      // 3) 读取已保存的 accessToken/refreshToken
      let accessToken = $.read("#zhuzher_access_token");
      const refreshToken = $.read("#zhuzher_refresh_token");
      $.info(
        `步骤3: Token状态 accessToken=${maskToken(accessToken)} refreshToken=${maskToken(refreshToken)}`
      );

      if (!accessToken && !refreshToken) {
        throw new Error("未找到token，请先登录住这儿APP触发拦截");
      }

      // 4) 构建授权头
      let headers = { ...CONFIG.headers };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      $.info(`步骤4: 请求头构建 -> ${stringifyHeaders(headers)}`);

      // 5) 发送开门请求，如401则刷新token后重试
      const requestBody = { device_code: deviceCode };
      const body = JSON.stringify(requestBody);
      $.info(`步骤5: 开门请求 URL=${CONFIG.openDoorApi}`);
      $.info(`步骤5: 开门请求 Body=${body}`);

      const openStart = Date.now();
      let resp = await $.http.post({ url: CONFIG.openDoorApi, headers, body });
      const openElapsed = Date.now() - openStart;
      $.info(`步骤5: 开门响应 status=${resp.statusCode ?? resp.status} 耗时=${openElapsed}ms`);
      $.info(`步骤5: 开门响应 Headers=${safeString(resp.headers)}`);
      $.info(`步骤5: 开门响应 BodyLen=${resp.body ? resp.body.length : 0}`);

      let data = safeJSON(resp.body);
      if (!data || data.code === 401) {
        $.info(`步骤6: 授权失败或过期 code=${data ? data.code : "<解析失败>"}，尝试刷新token...`);
        const refreshStart = Date.now();
        const refreshed = await refreshAccessToken();
        const refreshElapsed = Date.now() - refreshStart;
        $.info(`步骤6: 刷新token结果 refreshed=${refreshed} 耗时=${refreshElapsed}ms`);
        if (!refreshed) throw new Error("刷新token失败");

        accessToken = $.read("#zhuzher_access_token");
        headers = { ...CONFIG.headers, Authorization: `Bearer ${accessToken}` };
        $.info(`步骤6: 刷新后Authorization=${maskToken(accessToken)}`);

        const retryStart = Date.now();
        resp = await $.http.post({ url: CONFIG.openDoorApi, headers, body });
        const retryElapsed = Date.now() - retryStart;
        $.info(`步骤6: 重试开门响应 status=${resp.statusCode ?? resp.status} 耗时=${retryElapsed}ms`);
        $.info(`步骤6: 重试开门响应 Headers=${safeString(resp.headers)}`);
        $.info(`步骤6: 重试开门响应 BodyLen=${resp.body ? resp.body.length : 0}`);
        data = safeJSON(resp.body);
      }

      if (data && data.code === 200) {
        $.notify(
          "住这儿开门成功",
          deviceName,
          `设备编码: ${deviceCode}\n时间: ${new Date().toLocaleString()}`
        );
        $.info(`✅ 开门成功，服务返回: ${safeString(data)}`);
      } else {
        const msg = (data && data.message) || "开门失败";
        $.notify("住这儿开门失败", deviceName, `${msg}`);
        $.error(`❌ 开门失败 code=${data ? data.code : "<未知>"} msg=${msg}`);
        $.info(`失败响应体: ${typeof resp.body === "string" ? resp.body.slice(0, 500) : safeString(resp.body)}`);
      }

      const scriptElapsed = Date.now() - scriptStart;
      $.info(`================== 开门脚本结束 总耗时=${scriptElapsed}ms ==================`);
      $.done();
    } catch (err) {
      $.error(`❌ 执行错误: ${err.message}`);
      $.info(err.stack || "<no stack>");
      $.notify("住这儿自动开门", "脚本错误", err.message);
      const scriptElapsed = Date.now() - scriptStart;
      $.info(`================== 脚本异常结束 总耗时=${scriptElapsed}ms ==================`);
      $.done();
    }
  })();
})();

function mapDevice(name) {
  $.info(`mapDevice: 输入名称='${name}' 映射表条目=${DEVICE_MAP.length}`);
  if (!name) {
    $.info("mapDevice: 名称为空，返回null");
    return null;
  }
  const candidates = DEVICE_MAP.filter(d => d.deviceName === name);
  $.info(`mapDevice: 命中条目数=${candidates.length}`);
  if (candidates.length === 0) return null;
  const picked = candidates[0];
  $.info(`mapDevice: 选用 deviceCode='${picked.deviceCode}' deviceId='${picked.deviceId}'`);
  return picked.deviceCode;
}

async function refreshAccessToken() {
  // 说明：接口细节在文档中，通常需要refreshToken或用户凭据；这里采用已拦截数据结构
  const refreshToken = $.read("#zhuzher_refresh_token");
  $.info(`refreshAccessToken: 读取refreshToken=${maskToken(refreshToken)}`);
  if (!refreshToken) return false;

  try {
    const payload = { refreshToken };
    $.info(`refreshAccessToken: 请求 URL=${CONFIG.tokenRefreshApi}`);
    $.info(`refreshAccessToken: 请求 Body=${safeString(payload)}`);
    const start = Date.now();
    const resp = await $.http.post({
      url: CONFIG.tokenRefreshApi,
      headers: { ...CONFIG.headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const elapsed = Date.now() - start;
    $.info(`refreshAccessToken: 响应 status=${resp.statusCode ?? resp.status} 耗时=${elapsed}ms`);
    $.info(`refreshAccessToken: 响应 Headers=${safeString(resp.headers)}`);
    $.info(`refreshAccessToken: 响应 BodyLen=${resp.body ? resp.body.length : 0}`);

    const data = safeJSON(resp.body);
    if (data && data.code === 200 && data.result && data.result.accessToken) {
      $.write(data.result.accessToken, "#zhuzher_access_token");
      if (data.result.refreshToken) $.write(data.result.refreshToken, "#zhuzher_refresh_token");
      if (data.result.userID) $.write(data.result.userID, "#zhuzher_user_id");
      $.info(
        `refreshAccessToken: 刷新成功 accessToken=${maskToken(data.result.accessToken)} userID=${data.result.userID ?? "<未知>"}`
      );
      return true;
    }
    $.error(`refreshAccessToken: 刷新失败 code=${data ? data.code : "<解析失败>"} msg=${data ? data.message : "<无>"}`);
    $.info(`refreshAccessToken: 失败响应体预览=${typeof resp.body === "string" ? resp.body.slice(0, 500) : safeString(resp.body)}`);
    return false;
  } catch (e) {
    $.error(`refreshAccessToken: 请求异常 ${e.message}`);
    $.info(e.stack || "<no stack>");
    return false;
  }
}

function safeJSON(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (e) {
    $.info(`safeJSON: JSON解析失败 ${e.message} 源预览='${typeof text === "string" ? text.slice(0, 300) : safeString(text)}'`);
    return null;
  }
}

function getArg(key) {
  // 统一参数解析：支持 $request.url、$arguments(Object/String)、$argument(String)、$shortcut(String/Object)、$context.query/$context.input、Node argv/env
  // 并记录详细日志，便于排查不同运行场景
  
  // 1) 从 $request.url 解析（Rewrite 场景）
  if (typeof $request !== "undefined" && $request && typeof $request.url === "string") {
    const url = $request.url || "";
    $.info(`getArg: 在$request.url中查找 ${key}，url='${url.slice(0, 200)}'...`);
    const m = url.match(new RegExp(`${key}=([^&]+)`));
    const val = m ? decodeURIComponent(m[1].replace(/\+/g, "%20")) : null;
    $.info(`getArg: 来源=$request, key='${key}', value='${val}'`);
    if (val !== null) return val;
  }

  // 2) 从 $arguments（Quantumult X 定时任务的 argument / URL Scheme 的 param 被映射到此）
  if (typeof $arguments !== "undefined" && $arguments) {
    if (typeof $arguments === "string") {
      // 兼容部分环境 $arguments 传为查询串或 JSON
      let val = null;
      try {
        const maybeJson = JSON.parse($arguments);
        val = maybeJson && maybeJson[key] != null ? `${maybeJson[key]}` : null;
        $.info(`getArg: 来源=$arguments(JSON-string), key='${key}', value='${val}' 原始长度=${$arguments.length}`);
      } catch {
        const parsed = qsToObj($arguments);
        val = parsed[key] || null;
        // 同时兼容常见的 param / argument 字段
        if (val === null && (parsed.param || parsed.argument)) {
          const nested = qsToObj(parsed.param || parsed.argument);
          val = nested[key] || null;
        }
        $.info(`getArg: 来源=$arguments(qs-string), key='${key}', value='${val}' 原始='${$arguments}'`);
      }
      if (val !== null) return val;
    } else if (typeof $arguments === "object") {
      // 直接对象或包含 param/argument 子字段
      let val = $arguments[key] != null ? `${$arguments[key]}` : null;
      if (val === null) {
        const holder = $arguments.param || $arguments.argument;
        if (holder) {
          if (typeof holder === "string") {
            const parsed = qsToObj(holder);
            val = parsed[key] || null;
          } else if (typeof holder === "object") {
            val = holder[key] != null ? `${holder[key]}` : null;
          }
        }
      }
      $.info(`getArg: 来源=$arguments(object), key='${key}', value='${val}'`);
      if (val !== null) return val;
    }
  }

  // 3) 从 $shortcut（iPhone 快捷指令通过 Quantumult X 传参）
  if (typeof $shortcut !== "undefined" && $shortcut) {
    let val = null;
    if (typeof $shortcut === "string") {
      // 尝试按 JSON 或查询串解析
      try {
        const maybeJson = JSON.parse($shortcut);
        val = maybeJson && maybeJson[key] != null ? `${maybeJson[key]}` : null;
        $.info(`getArg: 来源=$shortcut(JSON-string), key='${key}', value='${val}' 原始长度=${$shortcut.length}`);
      } catch {
        const parsed = qsToObj($shortcut);
        val = parsed[key] || null;
        $.info(`getArg: 来源=$shortcut(qs-string), key='${key}', value='${val}' 原始='${$shortcut}'`);
      }
      if (val !== null) return val;
    } else if (typeof $shortcut === "object") {
      // 常见字段：input/text/value/url/dict/param/argument
      const candidates = [
        $shortcut[key],
        $shortcut.input,
        $shortcut.text,
        $shortcut.value,
        $shortcut.url,
        $shortcut.dict,
        $shortcut.param,
        $shortcut.argument
      ];
      for (const c of candidates) {
        if (typeof c === "string") {
          // 进一步按 JSON 或查询串解析
          try {
            const maybeJson = JSON.parse(c);
            val = maybeJson && (maybeJson[key] != null ? `${maybeJson[key]}` : null);
            $.info(`getArg: 来源=$shortcut(object).string(JSON), key='${key}', value='${val}'`);
          } catch {
            const parsed = qsToObj(c);
            val = parsed[key] || null;
            // 支持内嵌 param/argument 再解析
            if (val === null && (parsed.param || parsed.argument)) {
              const nested = qsToObj(parsed.param || parsed.argument);
              val = nested[key] || null;
            }
            $.info(`getArg: 来源=$shortcut(object).string(qs), key='${key}', value='${val}'`);
          }
          if (val !== null) return val;
        } else if (typeof c === "object" && c) {
          val = c[key] != null ? `${c[key]}` : null;
          if (val === null && (c.param || c.argument)) {
            const nested = c.param || c.argument;
            if (typeof nested === "string") {
              const parsed = qsToObj(nested);
              val = parsed[key] || null;
            } else if (typeof nested === "object") {
              val = nested[key] != null ? `${nested[key]}` : null;
            }
          }
          $.info(`getArg: 来源=$shortcut(object).object, key='${key}', value='${val}'`);
          if (val !== null) return val;
        }
      }
    }
  }

  // 4) 从 $argument（Surge/Loon 或脚本路径带 ?a=b 传参）
  if (typeof $argument !== "undefined" && $argument) {
    let val = null;
    // 兼容 JSON 或查询串
    try {
      const maybeJson = JSON.parse($argument);
      val = maybeJson && maybeJson[key] != null ? `${maybeJson[key]}` : null;
      $.info(`getArg: 来源=$argument(JSON-string), key='${key}', value='${val}' 原始长度=${$argument.length}`);
    } catch {
      const parsed = qsToObj($argument);
      val = parsed[key] || null;
      $.info(`getArg: 来源=$argument(qs-string), key='${key}', value='${val}' 原始='${$argument}'`);
    }
    if (val !== null) return val;
  }

  // 5) Quantumult X URL Scheme 或上下文：$context.query / $context.input / $context.link
  if (typeof $context !== "undefined" && $context) {
    const parts = [];
    if (typeof $context.query === "string") parts.push($context.query);
    if (typeof $context.input === "string") parts.push($context.input);
    if (typeof $context.link === "string") {
      const link = $context.link;
      const idx = link.indexOf("?");
      if (idx >= 0) parts.push(link.slice(idx + 1));
    }
    $.info(`getArg: 检查$context，parts数量=${parts.length}`);
    for (const p of parts) {
      let val = null;
      try {
        const maybeJson = JSON.parse(p);
        val = maybeJson && maybeJson[key] != null ? `${maybeJson[key]}` : null;
        $.info(`getArg: 来源=$context(JSON-string), key='${key}', value='${val}'`);
      } catch {
        const parsed = qsToObj(p);
        val = parsed[key] || null;
        // 支持内嵌 param/argument 再解析
        if (val === null && (parsed.param || parsed.argument)) {
          const nested = qsToObj(parsed.param || parsed.argument);
          val = nested[key] || null;
        }
        $.info(`getArg: 来源=$context(qs-string), key='${key}', value='${val}' 原始='${p}'`);
      }
      if (val !== null) return val;
    }
  }

  // 6) Node 环境：支持命令行参数与环境变量
  try {
    const env = ENV();
    if (env && env.isNode) {
      const argv = (typeof process !== "undefined" && process.argv) ? process.argv.join(" ") : "";
      const fromArgv = (() => {
        const m = argv.match(new RegExp(`(?:--|)${key}=?([^\s]+)`));
        return m ? decodeURIComponent(m[1].replace(/\+/g, "%20")) : null;
      })();
      if (fromArgv) {
        $.info(`getArg: 来源=process.argv, key='${key}', value='${fromArgv}'`);
        return fromArgv;
      }
      const fromEnv = (typeof process !== "undefined" && process.env) ? process.env[key] || null : null;
      $.info(`getArg: 来源=process.env, key='${key}', value='${fromEnv}'`);
      if (fromEnv !== null) return fromEnv;
    }
  } catch (e) {
    $.info(`getArg: Node参数解析异常 ${e.message}`);
  }

  // 7) 兜底：扫描全局对象可能的字符串或对象字段中携带的 deviceName
  try {
    const g = typeof globalThis !== "undefined" ? globalThis : (typeof this !== "undefined" ? this : {});
    const names = Object.getOwnPropertyNames(g);
    $.info(`getArg: 全局兜底扫描，共有全局属性=${names.length}`);
    for (const n of names) {
      const v = g[n];
      if (typeof v === "string") {
        // 直接包含 deviceName=xxx 或 JSON {"deviceName":"..."}
        const m1 = v.match(/(?:^|[?&])deviceName=([^&\s]+)/);
        if (m1) {
          const val = decodeURIComponent(m1[1].replace(/\+/g, "%20"));
          $.info(`getArg: 来源=globalThis.${n}(string.qs), key='${key}', value='${val}'`);
          return val;
        }
        try {
          const j = JSON.parse(v);
          if (j && j[key] != null) {
            const val = `${j[key]}`;
            $.info(`getArg: 来源=globalThis.${n}(string.JSON), key='${key}', value='${val}'`);
            return val;
          }
        } catch {}
      } else if (v && typeof v === "object") {
        if (v[key] != null) {
          const val = `${v[key]}`;
          $.info(`getArg: 来源=globalThis.${n}(object), key='${key}', value='${val}'`);
          return val;
        }
        // 尝试 param/argument 子字段
        const holder = v.param || v.argument;
        if (holder) {
          if (typeof holder === "string") {
            const parsed = qsToObj(holder);
            const val = parsed[key] || null;
            if (val !== null) {
              $.info(`getArg: 来源=globalThis.${n}(object.param-string), key='${key}', value='${val}'`);
              return val;
            }
          } else if (typeof holder === "object") {
            if (holder[key] != null) {
              const val = `${holder[key]}`;
              $.info(`getArg: 来源=globalThis.${n}(object.param-object), key='${key}', value='${val}'`);
              return val;
            }
          }
        }
      }
    }
  } catch (e) {
    $.info(`getArg: 全局兜底扫描异常 ${e.message}`);
  }

  // 8) 最后回退：读取持久化键（允许快捷指令先写入）
  const persisted = $.read("#zhuzher_device_name");
  if (persisted) {
    $.info(`getArg: 来源=persisted('#zhuzher_device_name'), key='${key}', value='${persisted}'`);
    return persisted;
  }

  $.info(`getArg: 未检测到可用来源, key='${key}'`);
  return null;
}

// 简易查询串解析工具：支持 'a=b&c=d'，处理 + 空格与 decode
function qsToObj(qs) {
  const out = {};
  if (!qs || typeof qs !== "string") return out;
  try {
    qs.split("&").forEach(pair => {
      const [k, v] = pair.split("=");
      if (!k) return;
      out[decodeURIComponent(k)] = v ? decodeURIComponent(v.replace(/\+/g, "%20")) : "";
    });
  } catch (e) {
    $.info(`qsToObj: 解析失败 ${e.message} 原始='${qs.slice(0, 200)}'`);
  }
  return out;
}

// 工具：打码敏感token
function maskToken(t) {
  if (!t || typeof t !== "string") return "<空>";
  if (t.length <= 8) return `${t.slice(0, 4)}***`;
  return `${t.slice(0, 6)}***${t.slice(-4)}`;
}

// 工具：安全字符串化，避免循环与超长
function safeString(obj) {
  try {
    const s = typeof obj === "string" ? obj : JSON.stringify(obj);
    return s.length > 800 ? s.slice(0, 800) + "...<truncated>" : s;
  } catch {
    return "<unserializable>";
  }
}

// 工具：格式化输出请求头（Authorization打码）
function stringifyHeaders(h) {
  const copy = { ...(h || {}) };
  if (copy.Authorization) copy.Authorization = `Bearer ${maskToken(copy.Authorization.replace(/^Bearer\s+/, ""))}`;
  return safeString(copy);
}

// prettier-ignore
/*********************************** API *************************************/
function ENV() { const e = "undefined" != typeof $task, t = "undefined" != typeof $loon, s = "undefined" != typeof $httpClient && !t, i = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: e, isLoon: t, isSurge: s, isNode: "function" == typeof require && !i, isJSBox: i, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: i, isScriptable: n, isNode: o } = ENV(), r = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/; const u = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(l => u[l.toLowerCase()] = (u => (function (u, l) { l = "string" == typeof l ? { url: l } : l; const h = e.baseURL; h && !r.test(l.url || "") && (l.url = h ? h + l.url : l.url); const a = (l = { ...e, ...l }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...l.events }; let f, d; if (c.onRequest(u, l), t) f = $task.fetch({ method: u, ...l }); else if (s || i || o) f = new Promise((e, t) => { (o ? require("request") : $httpClient)[u.toLowerCase()](l, (s, i, n) => { s ? t(s) : e({ statusCode: i.status || i.statusCode, headers: i.headers, body: n }) }) }); else if (n) { const e = new Request(l.url); e.method = u, e.headers = l.headers, e.body = l.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } const p = a ? new Promise((e, t) => { d = setTimeout(() => (c.onTimeout(), t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)), a) }) : null; return (p ? Promise.race([p, f]).then(e => (clearTimeout(d), e)) : f).then(e => c.onResponse(e)) })(l, u))), u } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: i, isSurge: n, isNode: o, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (o) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (i || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), o) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (i || n) && $persistentStore.write(e, this.name), o && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || i) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); o && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || i ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : o ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || i) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); o && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", l = "", h = {}) { const a = h["open-url"], c = h["media-url"]; if (s && $notify(e, t, l, h), n && $notification.post(e, t, l + `${c ? "\n多媒体:" + c : ""}`, { url: a }), i) { let s = {}; a && (s.openUrl = a), c && (s.mediaUrl = c), "{}" === JSON.stringify(s) ? $notification.post(e, t, l) : $notification.post(e, t, l, s) } if (o || u) { const s = l + (a ? `\n点击跳转: ${a}` : "") + (c ? `\n多媒体: ${c}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || i || n ? $done(e) : o && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }
/*****************************************************************************/