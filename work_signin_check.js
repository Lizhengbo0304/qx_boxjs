/**
 * 签到任务-每日检查
 * 
 * 功能：重置每日签到状态，判断当天是否为工作日
 * Cron: 0 1 * * *
 */
const $ = new Env("签到任务-每日检查");

const KEY_IS_WORKDAY = "work_signin_is_workday";
const KEY_MORNING_DONE = "work_signin_morning_done";
const KEY_EVENING_DONE = "work_signin_evening_done";

(async () => {
    try {
        $.log("开始执行每日签到检查任务...");

        // 1. 重置签到状态
        $.setdata("false", KEY_MORNING_DONE);
        $.setdata("false", KEY_EVENING_DONE);
        $.log("已重置早/晚签到状态为 false");

        // 2. 检查是否为工作日
        const isWorkDay = await checkIsWorkDay();
        $.setdata(isWorkDay.toString(), KEY_IS_WORKDAY);
        $.log(`今日工作日状态更新为: ${isWorkDay}`);

        $.msg($.name, "检查完成", `工作日: ${isWorkDay ? "是" : "否"}\n签到状态已重置`);
    } catch (e) {
        $.log(`❌ 错误: ${e.message}`);
        $.msg($.name, "运行出错", e.message);
    } finally {
        $.done();
    }
})();

async function checkIsWorkDay() {
    // 使用 timor.tech API 检查节假日
    // type: 0 工作日, 1 周末, 2 节日, 3 调休(上班)
    const now = new Date();
    // 格式化为 YYYY-MM-DD
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const url = `https://timor.tech/api/holiday/info/${dateStr}`;

    return new Promise((resolve, reject) => {
        $.get({ url, headers: { "User-Agent": "Mozilla/5.0" } }, (error, response, data) => {
            if (error) {
                // 如果 API 失败，降级为简单的周末判断
                $.log(`API 请求失败: ${error}，降级为周末判断`);
                const day = now.getDay();
                resolve(day !== 0 && day !== 6);
                return;
            }
            
            try {
                const res = JSON.parse(data);
                if (res.code === 0) {
                    const type = res.type.type;
                    // 0:工作日, 3:调休(上班) -> 是工作日
                    // 1:周末, 2:节日 -> 非工作日
                    const isWork = (type === 0 || type === 3);
                    $.log(`API 查询结果: ${dateStr} type=${type} (${res.type.name}), result=${isWork}`);
                    resolve(isWork);
                } else {
                    $.log(`API 返回错误代码: ${data}`);
                    // 降级
                    const day = now.getDay();
                    resolve(day !== 0 && day !== 6);
                }
            } catch (e) {
                $.log(`解析 API 数据失败: ${e.message}`);
                const day = now.getDay();
                resolve(day !== 0 && day !== 6);
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
