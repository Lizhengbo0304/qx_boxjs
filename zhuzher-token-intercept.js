/**
 * 住这儿APP Token拦截脚本（Loon）
 * 目标：拦截响应，提取 result.accessToken 等信息并写入 BoxJS
 * 行为：script-response-body
 */

const $ = API("zhuzher-token");

try {
  if (typeof $response === "undefined") {
    $.info("当前不在响应拦截模式，跳过。");
    $.done();
  } else {
    const body = $response.body || "";
    if (!body) {
      $.info("⚠️ 响应体为空");
      $.done();
      return;
    }

    // 识别接口路径（保持向后兼容）
    const url = (typeof $request !== "undefined" && $request && $request.url) ? $request.url : "";
    const isLogin = /https:\/\/api\.5th\.zone\/linksail\/api\/mobile\/login\b/.test(url);
    const isOAuthRefresh = /https:\/\/api\.5th\.zone\/auth\/v3\/external\/oauth\/accessToken\b/.test(url);
    if (isLogin) {
      $.info("拦截登录接口响应: linksail/api/mobile/login");
    } else if (isOAuthRefresh) {
      $.info("拦截OAuth刷新接口响应: external/oauth/accessToken");
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      $.error("⚠️ 响应不是有效JSON: " + e.message);
      $.done();
      return;
    }

    if (data.code !== 200 || !data.result) {
      $.info(`⚠️ 接口返回异常 code=${data.code}`);
      $.done();
      return;
    }

    const result = data.result;
    if (!result.accessToken) {
      $.info("⚠️ 未找到accessToken");
      $.done();
      return;
    }

    // 写入到 BoxJS（使用持久化存储键）
    $.write(result.accessToken, "zhuzher_access_token");
    if (result.refreshToken) $.write(result.refreshToken, "zhuzher_refresh_token");
    if (result.userID) $.write(result.userID, "zhuzher_user_id");

    // 一些可读信息
    const exp = result.expires ? new Date(result.expires * 1000).toLocaleString() : "未知";
    $.notify("住这儿Token更新", "Token自动保存成功", `用户: ${result.userID || "未知"}\n过期: ${exp}`);
    $.info(`✅ Token保存成功: ${String(result.accessToken).slice(0, 12)}...`);

    $.done({ body });
  }
} catch (err) {
  $.error(`❌ 脚本错误: ${err.message}`);
  $.notify("住这儿Token拦截", "脚本执行错误", err.message);
  $.done();
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