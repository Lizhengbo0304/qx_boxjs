# QX BoxJS Scripts

基于 [Peng-YM/QuanX](https://github.com/Peng-YM/QuanX) 项目进行修改适配的脚本合集，专为 Quantumult X、Loon、Surge 等代理工具优化。

## 📋 脚本列表

| 脚本 | 作用 | 推荐配置 | 状态 |
|------|------|----------|------|
| 彩云天气 | 基于彩云天气API推送实时天气预报 | `10 8-22/2 * * *` | ✅ 可用 |
| 自动定位 | 自动获取系统位置信息，支持位置变化检测 | 配合天气脚本使用 | ✅ 可用 |

## 🚀 功能特性

### 彩云天气 (caiyun.js)
- ✅ **自动定位**：智能获取当前位置信息
- ✅ **异常天气预警**：及时推送恶劣天气预警信息
- ✅ **实时天气预报**：详细的当前天气状况
- ✅ **位置变化检测**：自动检测位置变化并更新
- ✅ **多平台支持**：完美兼容 QX、Loon、Surge

### 自动定位 (locate.js)
- ✅ **精准定位**：基于系统天气应用获取准确位置
- ✅ **位置监控**：实时监测位置变化（精度约100米）
- ✅ **智能通知**：位置更新时自动推送通知
- ✅ **数据验证**：完善的经纬度数据格式验证
- ✅ **调试模式**：支持详细的调试信息输出

## 📦 BoxJS 订阅

```
https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/box.jx.json
```

## ⚙️ 配置说明

### 1️⃣ 彩云天气配置

#### Quantumult X
```ini
[MITM]
hostname = weatherkit.apple.com, api.weather.com

[rewrite_local]
https:\/\/((weatherkit\.apple)|(api.weather))\.com url script-request-header https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js

[task_local]
10 8-22/2 * * * https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js, tag=彩云天气, enabled=true
```

#### Loon
```ini
[MITM]
hostname = weatherkit.apple.com, api.weather.com

[Script]
http-request https:\/\/((weatherkit\.apple)|(api.weather))\.com script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js, require-body=false

[Task]
cron "10 8-22/2 * * *" script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js, tag=彩云天气
```

#### Surge
```ini
[MITM]
hostname = weatherkit.apple.com, api.weather.com

[Script]
type=http-request, pattern=https:\/\/((weatherkit\.apple)|(api.weather))\.com, script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js, require-body=false

彩云天气 = type=cron, cronexp="10 8-22/2 * * *", script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js
```

### 2️⃣ 自动定位配置

#### Quantumult X
```ini
[MITM]
hostname = weatherkit.apple.com, api.weather.com

[rewrite_local]
https:\/\/((weatherkit\.apple)|(api.weather))\.com url script-request-header https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/locate.js
```

#### Loon
```ini
[MITM]
hostname = weatherkit.apple.com, api.weather.com

[Script]
http-request https:\/\/((weatherkit\.apple)|(api.weather))\.com script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/locate.js, require-body=false
```

#### Surge
```ini
[MITM]
hostname = weatherkit.apple.com, api.weather.com

[Script]
type=http-request, pattern=https:\/\/((weatherkit\.apple)|(api.weather))\.com, script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/locate.js, require-body=false
```

### 3️⃣ 系统设置

1. **开启定位服务**：设置 → 隐私 → 定位服务
2. **天气应用权限**：选择天气应用 → 设置为"永远允许" → 开启"精确位置"
3. **BoxJS 配置**：添加彩云天气和腾讯地图的 API Token

## 🔧 Token 获取

### 彩云天气 Token
1. 访问 [彩云天气开放平台](https://dashboard.caiyunapp.com/)
2. 注册账号并创建应用
3. 获取 API Key（注意：是 Token 字符串，不是链接）

### 腾讯地图 Token
1. 访问 [腾讯位置服务](https://lbs.qq.com/)
2. 注册开发者账号
3. 创建应用并获取 Key

## 📱 使用说明

1. **安装脚本**：按照上述配置添加重写规则和定时任务
2. **配置 Token**：在 BoxJS 中填入相应的 API Token
3. **测试定位**：打开系统天气应用，确认定位获取成功
4. **等待推送**：脚本会按照设定时间自动推送天气信息

## 🔄 更新日志

### v2.0 (2024-12-19)
- 🆕 基于 Peng-YM 原版脚本进行全面重构
- ✨ 增加位置变化检测功能
- 🐛 修复多个已知问题
- 📱 优化通知显示效果
- 🔧 完善错误处理机制

### v1.0 (2024-12-18)
- 🎉 初始版本发布
- ✅ 基础天气推送功能
- ✅ 自动定位功能

## 🙏 致谢

本项目基于 [Peng-YM/QuanX](https://github.com/Peng-YM/QuanX) 进行修改适配，感谢原作者的优秀工作。

- **原作者**：[Peng-YM](https://github.com/Peng-YM)
- **原项目**：[QuanX](https://github.com/Peng-YM/QuanX)
- **适配作者**：lizhengbo

## ⚠️ 免责声明

- 此项目中的脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断
- 由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除
- 请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责
- 本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害
- 如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，我将在收到认证文件确认后删除此脚本

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- **GitHub Issues**：[提交问题](https://github.com/Lizhengbo0304/qx_boxjs/issues)

---

⭐ 如果这个项目对您有帮助，请给个 Star 支持一下！