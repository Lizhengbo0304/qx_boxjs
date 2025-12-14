/**
彩云天气 v2.0 自用 - 自动触发版本
@author: lizhengbo
更新地址：https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js
 *
功能：
√ 监控高德API自动获取位置
√ 异常天气预警
√ 实时天气预报

TODO:
- 降雨提醒
- 每日睡前预报

配置：
1️⃣ 配置高德API监控
根据平台添加如下配置
(1). Quantumult X
[MITM]
hostname=restapi.amap.com
[rewrite_local]
https:\/\/restapi\.amap\.com\/v3\/geocode\/geo url script-request-header https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js

(2). Loon
[MITM]
hostname=restapi.amap.com
[Script]
http-request https:\/\/restapi\.amap\.com\/v3\/geocode\/geo script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js, require-body=false

(3). Surge
[MITM]
hostname=restapi.amap.com
[Script]
type=http-request, pattern=https:\/\/restapi\.amap\.com\/v3\/geocode\/geo, script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js, require-body=false

2️⃣ 打开box.js设置彩云令牌(不是链接！！！）即可。
注意：此脚本会自动监控高德API调用，无需手动定时任务。
*/

/********************** SCRIPT START *********************************/
const $ = API("caiyun");
const ERR = MYERR();

if (typeof $request !== "undefined") {
  // 监控高德API接口调用
  const url = $request.url;
  
  // 检查是否是高德地理编码API
  if (url.includes('restapi.amap.com/v3/geocode/geo')) {
    $.log(`🔍 检测到高德API调用: ${url}`);
    
    // 同步处理API响应，获取经纬度并调用天气API
    (async () => {
      try {
        await processAmapResponse(url);
      } catch (error) {
        $.error(`处理高德API响应时出错: ${error.message}`);
      }
      $.done({ body: $request.body });
    })();
    return; // 防止重复调用$.done()
  }
  
  $.done({ body: $request.body });
} else {
  // 非请求模式，检查配置
  const token = $.read('@caiyun.token.caiyun');
  if (!token) {
    $.notify('[彩云天气]', '❌ 配置错误', '请在BoxJS中配置彩云天气API Token');
  } else {
    $.log('✅ 彩云天气配置正常，等待高德API调用触发');
  }
  $.done();
}

// 处理高德API响应，提取经纬度并获取天气信息
async function processAmapResponse(url) {
  try {
    // 从URL中提取address参数
    const addressMatch = url.match(/address=([^&]+)/);
    if (!addressMatch) {
      $.error('❌ 无法从URL中提取地址参数');
      return;
    }
    
    const address = decodeURIComponent(addressMatch[1]);
    $.log(`📍 检测到地址查询: ${address}`);
    
    // 调用高德API获取经纬度
    const amapResponse = await $.http.get({
      url: url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });
    
    const amapData = JSON.parse(amapResponse.body);
    
    if (amapData.status !== '1' || !amapData.geocodes || amapData.geocodes.length === 0) {
      $.error('❌ 高德API返回数据异常');
      return;
    }
    
    const geocode = amapData.geocodes[0];
    const location = geocode.location.split(',');
    const longitude = parseFloat(location[0]);
    const latitude = parseFloat(location[1]);
    const formatted_address = geocode.formatted_address;
    
    $.log(`✅ 获取到坐标: 经度${longitude}, 纬度${latitude}`);
    $.log(`📍 详细地址: ${formatted_address}`);
    
    // 检查彩云Token
    const token = $.read('@caiyun.token.caiyun');
    if (!token) {
      $.notify('[彩云天气]', '❌ 未配置彩云Token', '请在BoxJS中配置彩云天气API Token');
      return;
    }
    
    // 调用彩云天气API
    await getWeatherInfo(longitude, latitude, formatted_address, token);
    
  } catch (error) {
    $.error(`处理高德API响应失败: ${error.message}`);
  }
}

// 获取天气信息
async function getWeatherInfo(longitude, latitude, address, caiyunToken) {
  try {
    const url = `https://api.caiyunapp.com/v2.6/${caiyunToken}/${longitude},${latitude}/weather?lang=zh_CN&dailystart=0&hourlysteps=384&dailysteps=16&alert=true`;
    
    $.log('🌤 正在获取天气信息...');
    
    const weather = await $.http.get({
      url,
      headers: {
        'User-Agent': 'ColorfulCloudsPro/5.0.10 (iPhone; iOS 14.0; Scale/3.00)',
      },
    });
    
    const weatherData = JSON.parse(weather.body);
    
    if (weatherData.status === 'failed') {
      throw new Error(weatherData.error);
    }
    
    // 处理天气数据并发送通知
    await processWeatherData(weatherData, address);
    
  } catch (error) {
    $.error(`获取天气信息失败: ${error.message}`);
    $.notify('[彩云天气]', '❌ 获取天气失败', error.message);
  }
}

// 处理天气数据并发送通知
async function processWeatherData(weatherData, address) {
  try {
    // 处理天气预警
    processWeatherAlert(weatherData.result.alert, address);
    
    // 发送实时天气通知
    sendRealtimeWeatherNotification(weatherData.result, address);
    
  } catch (error) {
    $.error(`处理天气数据失败: ${error.message}`);
  }
}

function processWeatherAlert(alertData, address) {
  // 添加数据验证，防止undefined错误
  if (!alertData) {
    $.log("⚠️ 天气预警数据不存在，跳过预警检查");
    return;
  }
  
  const alerted = $.read("alerted") || [];

  // 检查data是否存在且有status属性
  if (alertData && alertData.status === "ok") {
    // 确保content数组存在
    if (alertData.content && Array.isArray(alertData.content)) {
      alertData.content.forEach((alert) => {
        if (alerted.indexOf(alert.alertId) === -1) {
          $.notify(
            `[彩云天气] ${address}`,
            alert.title,
            alert.description
          );
          alerted.push(alert.alertId);
          if (alerted.length > 10) {
            alerted.shift();
          }
          $.write(alerted, "alerted");
        }
      });
    } else {
      $.log("⚠️ 预警内容数据格式异常");
    }
  } else {
    $.log(`⚠️ 预警数据状态异常: ${alertData ? alertData.status : 'data为空'}`);
  }
}

function sendRealtimeWeatherNotification(data, address) {
  // 添加数据验证，防止undefined错误
  const alert = data.alert;
  let alertInfo = "";
  
  if (alert && alert.content && Array.isArray(alert.content)) {
    alertInfo = alert.content.length == 0
      ? ""
      : alert.content.reduce((acc, curr) => {
        if (curr.status === "预警中") {
          return acc + "\n" + mapAlertCode(curr.code) + "预警";
        } else {
          return acc;
        }
      }, "[预警]") + "\n\n";
  } else {
    $.log("⚠️ 预警数据不存在或格式异常");
    alertInfo = "";
  }

  const realtime = data.realtime;
  const keypoint = data.forecast_keypoint;
  const hourly = data.hourly;

  let hourlySkycon = "[未来3小时]\n";
  for (let i = 0; i < 3; i++) {
    const skycon = hourly.skycon[i];
    const dt = new Date(skycon.datetime);
    const now = dt.getHours() + 1;
    dt.setHours(dt.getHours() + 1);
    hourlySkycon +=
      `${now}-${dt.getHours() + 1}时 ${mapSkycon(skycon.value)[0]}` +
      (i == 2 ? "" : "\n");
  }

  $.notify(
    `[彩云天气] ${address}`,
    `${mapSkycon(realtime.skycon)[0]} ${realtime.temperature} ℃  🌤 空气质量 ${realtime.air_quality.description.chn}`,
    `🔱 ${keypoint}\n🌡 体感${realtime.life_index.comfort.desc} ${realtime.apparent_temperature} ℃  💧 湿度 ${(realtime.humidity * 100).toFixed(0)}%\n🌞 紫外线 ${realtime.life_index.ultraviolet.desc} 💨 ${mapWind(realtime.wind.speed, realtime.wind.direction)}\n\n${alertInfo}${hourlySkycon}\n`,
    {
      "media-url": `${mapSkycon(realtime.skycon)[1]}`,
    }
  );
}

/************************** 天气对照表 *********************************/

function mapAlertCode(code) {
  const names = {
    "01": "🌪 台风",
    "02": "⛈ 暴雨",
    "03": "❄️ 暴雪",
    "04": "❄ 寒潮",
    "05": "💨 大风",
    "06": "💨 沙尘暴",
    "07": "☄️ 高温",
    "08": "☄️ 干旱",
    "09": "⚡️ 雷电",
    "10": "💥 冰雹",
    "11": "❄️ 霜冻",
    "12": "💨 大雾",
    "13": "💨 霾",
    "14": "❄️ 道路结冰",
    "15": "🔥 森林火灾",
    "16": "⛈ 雷雨大风",
  };

  const intensity = {
    "01": "蓝色",
    "02": "黄色",
    "03": "橙色",
    "04": "红色",
  };

  const res = code.match(/(\d{2})(\d{2})/);
  return `${names[res[1]]}${intensity[res[2]]}`;
}

function mapWind(speed, direction) {
  let description = "";
  let d_description = "";

  if (speed < 1) {
    description = "无风";
    return description;
  } else if (speed <= 5) {
    description = "1级 微风徐徐";
  } else if (speed <= 11) {
    description = "2级 清风";
  } else if (speed <= 19) {
    description = "3级 树叶摇摆";
  } else if (speed <= 28) {
    description = "4级 树枝摇动";
  } else if (speed <= 38) {
    description = "5级 风力强劲";
  } else if (speed <= 49) {
    description = "6级 风力强劲";
  } else if (speed <= 61) {
    description = "7级 风力超强";
  } else if (speed <= 74) {
    description = "8级 狂风大作";
  } else if (speed <= 88) {
    description = "9级 狂风呼啸";
  } else if (speed <= 102) {
    description = "10级 暴风毁树";
  } else if (speed <= 117) {
    description = "11级 暴风毁树";
  } else if (speed <= 133) {
    description = "12级 飓风";
  } else if (speed <= 149) {
    description = "13级 台风";
  } else if (speed <= 166) {
    description = "14级 强台风";
  } else if (speed <= 183) {
    description = "15级 强台风";
  } else if (speed <= 201) {
    description = "16级 超强台风";
  } else if (speed <= 220) {
    description = "17级 超强台风";
  }

  if (direction >= 348.76 || direction <= 11.25) {
    d_description = "北";
  } else if (direction >= 11.26 && direction <= 33.75) {
    d_description = "北东北";
  } else if (direction >= 33.76 && direction <= 56.25) {
    d_description = "东北";
  } else if (direction >= 56.26 && direction <= 78.75) {
    d_description = "东东北";
  } else if (direction >= 78.76 && direction <= 101.25) {
    d_description = "东";
  } else if (direction >= 101.26 && direction <= 123.75) {
    d_description = "东东南";
  } else if (direction >= 123.76 && direction <= 146.25) {
    d_description = "东南";
  } else if (direction >= 146.26 && direction <= 168.75) {
    d_description = "南东南";
  } else if (direction >= 168.76 && direction <= 191.25) {
    d_description = "南";
  } else if (direction >= 191.26 && direction <= 213.75) {
    d_description = "南西南";
  } else if (direction >= 213.76 && direction <= 236.25) {
    d_description = "西南";
  } else if (direction >= 236.26 && direction <= 258.75) {
    d_description = "西西南";
  } else if (direction >= 258.76 && direction <= 281.25) {
    d_description = "西";
  } else if (direction >= 281.26 && direction <= 303.75) {
    d_description = "西西北";
  } else if (direction >= 303.76 && direction <= 326.25) {
    d_description = "西北";
  } else if (direction >= 326.26 && direction <= 348.75) {
    d_description = "北西北";
  }

  return `${d_description}风 ${description}`;
}

// 天气状况 --> 自然语言描述
// icon来源：github@58xinian
function mapSkycon(skycon) {
  const map = {
    CLEAR_DAY: [
      "☀️ 日间晴朗",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/CLEAR_DAY.gif",
    ],
    CLEAR_NIGHT: [
      "✨ 夜间晴朗",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/CLEAR_NIGHT.gif",
    ],
    PARTLY_CLOUDY_DAY: [
      "⛅️ 日间多云",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/PARTLY_CLOUDY_DAY.gif",
    ],
    PARTLY_CLOUDY_NIGHT: [
      "☁️ 夜间多云",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/PARTLY_CLOUDY_NIGHT.gif",
    ],
    CLOUDY: [
      "☁️ 阴",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/CLOUDY.gif",
    ],
    LIGHT_HAZE: [
      "😤 轻度雾霾",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HAZE.gif",
    ],
    MODERATE_HAZE: [
      "😤 中度雾霾",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HAZE.gif",
    ],
    HEAVY_HAZE: [
      "😤 重度雾霾",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HAZE.gif",
    ],
    LIGHT_RAIN: [
      "💧 小雨",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/LIGHT.gif",
    ],
    MODERATE_RAIN: [
      "💦 中雨",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/MODERATE_RAIN.gif",
    ],
    HEAVY_RAIN: [
      "🌧 大雨",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/STORM_RAIN.gif",
    ],
    STORM_RAIN: [
      "⛈ 暴雨",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/STORM_RAIN.gif",
    ],
    LIGHT_SNOW: [
      "🌨 小雪",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/LIGHT_SNOW.gif",
    ],
    MODERATE_SNOW: [
      "❄️ 中雪",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/MODERATE_SNOW.gif",
    ],
    HEAVY_SNOW: [
      "☃️ 大雪",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HEAVY_SNOW.gif",
    ],
    STORM_SNOW: [
      "⛄️暴雪",
      "https://raw.githubusercontent.com/58xinian/icon/master/Weather/HEAVY_SNOW",
    ],
    FOG: ["🌫️ 雾"],
    DUST: ["💨 浮尘"],
    SAND: ["💨 沙尘"],
    WIND: ["🌪 大风"],
  };
  return map[skycon];
}

// 雷达降 水/雪 强度 --> skycon
function mapPrecipitation(intensity) {
  if (0.031 < intensity && intensity < 0.25) {
    return "LIGHT";
  } else if (intensity < 0.35) {
    return "MODERATE";
  } else if (intensity < 0.48) {
    return "HEADY";
  } else if (intensity >= 0.48) {
    return "STORM";
  }
}

/************************** ERROR *********************************/
function MYERR() {
  class TokenError extends Error {
    constructor(message) {
      super(message);
      this.name = "TokenError";
    }
  }

  return {
    TokenError,
  };
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