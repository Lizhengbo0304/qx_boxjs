/**
 * 住这儿APP自动开门脚本（Loon）
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
  { deviceId: "204103", deviceCode: "7ded00067223", deviceName: "东北门" },
  { deviceId: "204105", deviceCode: "7ded00067224", deviceName: "快递门" },
  { deviceId: "204125", deviceCode: "7ded00067225", deviceName: "东门" },
  { deviceId: "204166", deviceCode: "7ded00067226", deviceName: "南门" },
  { deviceId: "204197", deviceCode: "7ded00067228", deviceName: "东南门" },
  { deviceId: "204613", deviceCode: "7ded00067229", deviceName: "西南门" },
  { deviceId: "204610", deviceCode: "7ded00067230", deviceName: "上山门" }
];

const CONFIG = {
  tokenRefreshApi: "https://api.5th.zone/auth/v3/external/oauth/accessToken",
  openDoorApi: "https://api.5th.zone/p/chaos/fd/api/entrance/v1/easygo/open",
  headers: {
    "Host": "api.5th.zone",
    "Zhuzher-Project-Code": "37010105",
    "Content-Type": "application/json",
    "Accept": "*/*",
    "X-Version": "6.0.10",
    "Accept-Language": "zh-Hans-CN;q=1, en-CN;q=0.9",
    "X-API-Version": "20251030",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent": "VKProprietorAssistant/6.0.10 (iPhone; iOS 18.7.1; Scale/3.00)",
    "X-Platform": "iOS",
    "Connection": "keep-alive",
    "X-channel": "zhuzher",
    "Zhuzher-Project-Role": "6",
  },
};

(function main() {
  const scriptStart = Date.now();
  $.info("住这儿开门脚本启动");

  (async () => {
    try {
      const deviceName = getArg("deviceName");
      const must = typeof $request !== "undefined" && $request && typeof $request.url === "string" && /(?:^|[?&])deviceName=/.test($request.url);
      if (!must) { $done({ response: { status: 200, headers: { "Content-Type": "application/json" }, body: "{}" } }); return; }
      const nowTs = Date.now();
      const lastTs = parseInt($.read("zhuzher_last_trigger_ts") || "0", 10);
      if (lastTs && nowTs - lastTs < 2000) { $.info("短时间重复触发，忽略"); $done({ response: { status: 200, headers: { "Content-Type": "application/json" }, body: "{}" } }); return; }
      $.write(String(nowTs), "zhuzher_last_trigger_ts");
      const deviceCode = mapDevice(deviceName);
      if (!deviceCode) {
        $.notify("住这儿开门失败", deviceName || "<未提供>", "未找到匹配的设备编码");
        throw new Error(`未找到设备名称对应的deviceCode: ${deviceName}`);
      }

      let accessToken = $.read("zhuzher_access_token");
      const refreshToken = $.read("zhuzher_refresh_token");
      if (!accessToken && !refreshToken) {
        throw new Error("未找到token，请先登录住这儿APP触发拦截");
      }

      let headers = { ...CONFIG.headers };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const requestBody = { device_code: deviceCode };
      const body = JSON.stringify(requestBody);

      // 简洁请求日志
      $.info(`准备开门: deviceName=${deviceName || "<未提供>"} deviceCode=${deviceCode}`);

      let resp = await $.http.post({ url: CONFIG.openDoorApi, headers, body });
      let data = safeJSON(resp.body);
      if (!data || data.code === 401) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) throw new Error("刷新token失败");
        accessToken = $.read("zhuzher_access_token");
        headers = { ...CONFIG.headers, Authorization: `Bearer ${accessToken}` };
        $.info("授权过期，刷新token后重试");
        resp = await $.http.post({ url: CONFIG.openDoorApi, headers, body });
        data = safeJSON(resp.body);
      }

      if (data && data.code === 200) {
        $.notify("住这儿开门成功", deviceName, `设备编码: ${deviceCode}`);
      } else {
        const msg = (data && data.message) || "开门失败";
        $.notify("住这儿开门失败", deviceName, msg);
        $.error(`开门失败 code=${data ? data.code : "<未知>"} msg=${msg}`);
      }

      $.info("住这儿开门脚本结束");
      $done({ response: { status: 200, headers: { "Content-Type": "application/json" }, body: "{}" } });
    } catch (err) {
      $.error(err.message);
      $.notify("住这儿自动开门", "脚本错误", err.message);
      $.info("住这儿开门脚本结束");
      $done({ response: { status: 200, headers: { "Content-Type": "application/json" }, body: "{}" } });
    }
  })();
})();

function mapDevice(name) {
  if (!name) return null;
  const candidates = DEVICE_MAP.filter(d => d.deviceName === name);
  if (candidates.length === 0) return null;
  return candidates[0].deviceCode;
}

async function refreshAccessToken() {
  const refreshToken = $.read("zhuzher_refresh_token");
  if (!refreshToken) return false;

  try {
    const payload = { refreshToken };
    const resp = await $.http.post({
      url: CONFIG.tokenRefreshApi,
      headers: { ...CONFIG.headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = safeJSON(resp.body);
    if (data && data.code === 200 && data.result && data.result.accessToken) {
      $.write(data.result.accessToken, "zhuzher_access_token");
      if (data.result.refreshToken) $.write(data.result.refreshToken, "zhuzher_refresh_token");
      if (data.result.userID) $.write(data.result.userID, "zhuzher_user_id");
      return true;
    }
    return false;
  } catch (e) {
    $.error(`刷新token异常 ${e.message}`);
    return false;
  }
}

function safeJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function getArg(key) {
  if (typeof $request !== "undefined" && $request && typeof $request.url === "string") {
    const url = $request.url || "";
    const m = url.match(new RegExp(`${key}=([^&]+)`));
    const val = m ? decodeURIComponent(m[1].replace(/\+/g, "%20")) : null;
    if (val !== null) return val;
  }
  if (typeof $arguments !== "undefined" && $arguments) {
    if (typeof $arguments === "string") {
      try {
        const maybeJson = JSON.parse($arguments);
        if (maybeJson && maybeJson[key] != null) return `${maybeJson[key]}`;
      } catch {
        const parsed = qsToObj($arguments);
        let val = parsed[key] || null;
        if (val === null && (parsed.param || parsed.argument)) {
          const nested = qsToObj(parsed.param || parsed.argument);
          val = nested[key] || null;
        }
        if (val !== null) return val;
      }
    } else if (typeof $arguments === "object") {
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
      if (val !== null) return val;
    }
  }
  if (typeof $shortcut !== "undefined" && $shortcut) {
    if (typeof $shortcut === "string") {
      try {
        const maybeJson = JSON.parse($shortcut);
        if (maybeJson && maybeJson[key] != null) return `${maybeJson[key]}`;
      } catch {
        const parsed = qsToObj($shortcut);
        if (parsed[key] != null) return parsed[key];
      }
    } else if (typeof $shortcut === "object") {
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
          try {
            const maybeJson = JSON.parse(c);
            if (maybeJson && maybeJson[key] != null) return `${maybeJson[key]}`;
          } catch {
            const parsed = qsToObj(c);
            let val = parsed[key] || null;
            if (val === null && (parsed.param || parsed.argument)) {
              const nested = qsToObj(parsed.param || parsed.argument);
              val = nested[key] || null;
            }
            if (val !== null) return val;
          }
        } else if (typeof c === "object" && c) {
          let val = c[key] != null ? `${c[key]}` : null;
          if (val === null && (c.param || c.argument)) {
            const nested = c.param || c.argument;
            if (typeof nested === "string") {
              const parsed = qsToObj(nested);
              val = parsed[key] || null;
            } else if (typeof nested === "object") {
              val = nested[key] != null ? `${nested[key]}` : null;
            }
          }
          if (val !== null) return val;
        }
      }
    }
  }
  if (typeof $argument !== "undefined" && $argument) {
    try {
      const maybeJson = JSON.parse($argument);
      if (maybeJson && maybeJson[key] != null) return `${maybeJson[key]}`;
    } catch {
      const parsed = qsToObj($argument);
      if (parsed[key] != null) return parsed[key];
    }
  }
  if (typeof $context !== "undefined" && $context) {
    const parts = [];
    if (typeof $context.query === "string") parts.push($context.query);
    if (typeof $context.input === "string") parts.push($context.input);
    if (typeof $context.link === "string") {
      const link = $context.link;
      const idx = link.indexOf("?");
      if (idx >= 0) parts.push(link.slice(idx + 1));
    }
    for (const p of parts) {
      try {
        const maybeJson = JSON.parse(p);
        if (maybeJson && maybeJson[key] != null) return `${maybeJson[key]}`;
      } catch {
        const parsed = qsToObj(p);
        let val = parsed[key] || null;
        if (val === null && (parsed.param || parsed.argument)) {
          const nested = qsToObj(parsed.param || parsed.argument);
          val = nested[key] || null;
        }
        if (val !== null) return val;
      }
    }
  }
  try {
    const env = ENV();
    if (env && env.isNode) {
      const argv = (typeof process !== "undefined" && process.argv) ? process.argv.join(" ") : "";
      const m = argv.match(new RegExp(`(?:--|)${key}=?([^\s]+)`));
      const fromArgv = m ? decodeURIComponent(m[1].replace(/\+/g, "%20")) : null;
      if (fromArgv) return fromArgv;
      const fromEnv = (typeof process !== "undefined" && process.env) ? process.env[key] || null : null;
      if (fromEnv !== null) return fromEnv;
    }
  } catch {}
  try {
    const g = typeof globalThis !== "undefined" ? globalThis : (typeof this !== "undefined" ? this : {});
    const names = Object.getOwnPropertyNames(g);
    for (const n of names) {
      const v = g[n];
      if (typeof v === "string") {
        const m1 = v.match(/(?:^|[?&])deviceName=([^&\s]+)/);
        if (m1) return decodeURIComponent(m1[1].replace(/\+/g, "%20"));
        try {
          const j = JSON.parse(v);
          if (j && j[key] != null) return `${j[key]}`;
        } catch {}
      } else if (v && typeof v === "object") {
        if (v[key] != null) return `${v[key]}`;
        const holder = v.param || v.argument;
        if (holder) {
          if (typeof holder === "string") {
            const parsed = qsToObj(holder);
            if (parsed[key] != null) return parsed[key];
          } else if (typeof holder === "object") {
            if (holder[key] != null) return `${holder[key]}`;
          }
        }
      }
    }
  } catch {}
  const persisted = $.read("zhuzher_device_name");
  if (persisted) return persisted;
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
  } catch (e) {}
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
/*********************************** API Helper (Loon Only) *************************************/
function ENV() { return { isLoon: true, isNode: false, isQX: false }; }
function API(name) { return new Env(name); }
function Env(name) {
    this.name = name;
    this.log = (msg) => console.log(`[${this.name}] ${msg}`);
    this.info = this.log;
    this.error = (msg) => console.log(`[${this.name}] ❌ ${msg}`);
    this.notify = (title, subtitle, body) => $notification.post(title, subtitle, body);
    this.read = (key) => {
        let val = $persistentStore.read(key);
        try { return JSON.parse(val); } catch(e) { return val; }
    };
    this.write = (val, key) => {
        if (typeof val === 'object') val = JSON.stringify(val);
        return $persistentStore.write(val, key);
    };
    this.done = (val) => $done(val);
    this.http = {
        get: (opts) => new Promise((resolve, reject) => {
            $httpClient.get(opts, (err, resp, body) => {
                if (err) reject(err);
                else resolve({ statusCode: resp.status, headers: resp.headers, body });
            });
        }),
        post: (opts) => new Promise((resolve, reject) => {
            $httpClient.post(opts, (err, resp, body) => {
                if (err) reject(err);
                else resolve({ statusCode: resp.status, headers: resp.headers, body });
            });
        })
    };
}
