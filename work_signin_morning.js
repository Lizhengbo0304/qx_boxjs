/**
 * 签到任务-上班签到
 * 
 * 功能：上班打卡提醒/执行
 * Cron: 31 8 * * *
 */
const $ = new Env("签到任务-上班签到");

const KEY_IS_WORKDAY = "work_signin_is_workday";
const KEY_IS_LEAVE = "work_signin_is_leave";
const KEY_MORNING_DONE = "work_signin_morning_done";
const KEY_QYWX_KEY = "work_signin_qywx_key";

(async () => {
    try {
        $.log("开始执行上班签到检查...");

        // 1. 检查是否请假
        const isLeave = $.getdata(KEY_IS_LEAVE) === "true";
        if (isLeave) {
            $.log("今日已设置请假，跳过签到");
            return;
        }

        // 2. 检查是否为工作日
        const isWorkDay = $.getdata(KEY_IS_WORKDAY) === "true";
        if (!isWorkDay) {
            $.log("今日非工作日，跳过签到");
            return;
        }

        // 3. 检查是否已签到
        const isDone = $.getdata(KEY_MORNING_DONE) === "true";
        if (isDone) {
            $.log("今日上班已签到，跳过");
            return;
        }

        // 4. 执行签到
        $.log("准备执行上班签到...");
        
        // 随机睡眠 0-10 秒
        const sleepTime = Math.floor(Math.random() * 10000);
        $.log(`随机等待 ${sleepTime/1000} 秒...`);
        await sleep(sleepTime);

        // 发送消息
        await sendSignInMessage("上班签到", "✅ 上班打卡成功！\n祝你今天工作愉快！");

        // 5. 更新状态
        $.setdata("true", KEY_MORNING_DONE);
        $.log("状态已更新：上班签到完成");

    } catch (e) {
        $.log(`❌ 错误: ${e.message}`);
        $.msg($.name, "运行出错", e.message);
    } finally {
        $.done();
    }
})();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendSignInMessage(title, content) {
    const webhookKey = $.getdata(KEY_QYWX_KEY);
    if (!webhookKey) {
        throw new Error("未配置企业微信 Key (work_signin_qywx_key)");
    }

    const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${webhookKey}`;
    const body = {
        msgtype: "markdown",
        markdown: {
            content: `### ${title}\n------------------------\n${content}\n\n时间: ${new Date().toLocaleString()}`
        }
    };

    return new Promise((resolve, reject) => {
        $.post({
            url,
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" }
        }, (error, response, data) => {
            if (error) {
                reject(new Error(`请求失败: ${error}`));
                return;
            }
            try {
                const res = JSON.parse(data);
                if (res.errcode === 0) {
                    $.log("企业微信消息发送成功");
                    $.msg($.name, title, "消息已推送");
                    resolve(res);
                } else {
                    reject(new Error(`发送失败: [${res.errcode}] ${res.errmsg}`));
                }
            } catch (e) {
                reject(new Error(`解析响应失败: ${e.message}`));
            }
        });
    });
}

// Env Helper (Loon Only)
function Env(name) {
    this.name = name;
    this.log = (msg) => console.log(`[${this.name}] ${msg}`);
    this.msg = (title, subtitle, body) => $notification.post(title, subtitle, body);
    this.getdata = (key) => $persistentStore.read(key);
    this.setdata = (val, key) => $persistentStore.write(val, key);
    this.post = (options, callback) => $httpClient.post(options, callback);
    this.done = (val) => $done(val);
}
