/**
 * 签到任务-下班签到
 * 
 * 功能：下班打卡提醒/执行
 * Cron: 21 21 * * *
 */
const $ = new Env("签到任务-下班签到");

const KEY_MORNING_DONE = "work_signin_morning_done";
const KEY_EVENING_DONE = "work_signin_evening_done";
const KEY_QYWX_KEY = "work_signin_qywx_key";

(async () => {
    try {
        $.log("开始执行下班签到检查...");

        // 1. 检查是否已上班签到
        // 如果没签上班卡，意味着今天可能不需要上班或者忘了，这里按照逻辑是不签下班卡
        const isMorningDone = $.getdata(KEY_MORNING_DONE) === "true";
        if (!isMorningDone) {
            $.log("今日尚未上班签到，跳过下班签到");
            return;
        }

        // 2. 检查是否已下班签到
        const isEveningDone = $.getdata(KEY_EVENING_DONE) === "true";
        if (isEveningDone) {
            $.log("今日下班已签到，跳过");
            return;
        }

        // 3. 执行签到
        $.log("准备执行下班签到...");
        
        // 随机睡眠 0-10 秒
        const sleepTime = Math.floor(Math.random() * 10000);
        $.log(`随机等待 ${sleepTime/1000} 秒...`);
        await sleep(sleepTime);

        // 发送消息
        await sendSignInMessage("下班签到", "👋 下班打卡成功！\n今天辛苦了，早点休息！");

        // 4. 更新状态
        $.setdata("true", KEY_EVENING_DONE);
        $.log("状态已更新：下班签到完成");

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
    this.get = (options, callback) => $httpClient.get(options, callback);
    this.post = (options, callback) => $httpClient.post(options, callback);
    this.done = (val) => $done(val);
}
