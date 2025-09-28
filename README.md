# QX BoxJS Scripts

基于 [Peng-YM/QuanX](https://github.com/Peng-YM/QuanX) 项目进行修改适配的脚本合集，专为 Quantumult X、Loon、Surge 等代理工具优化。

## 📋 脚本列表

| 脚本 | 作用 | 触发方式 | 状态 |
|------|------|----------|------|
| 彩云天气 | 基于彩云天气API推送实时天气预报 | 快捷指令自动触发 | ✅ 可用 |

## 🚀 功能特性

### 彩云天气 (caiyun.js)
- ✅ **智能定位**：基于高德地图API获取精准位置信息
- ✅ **自动触发**：检测到高德API调用后自动获取天气信息
- ✅ **异常天气预警**：及时推送恶劣天气预警信息
- ✅ **实时天气预报**：详细的当前天气状况
- ✅ **快捷指令集成**：配合iOS快捷指令获取当前位置
- ✅ **多平台支持**：完美兼容 QX、Loon、Surge

### 定位说明
- ⚠️ **Apple天气坐标不准确**：系统天气应用的坐标精度存在偏差
- ✅ **快捷指令定位**：使用iOS快捷指令获取当前精确位置
- ✅ **高德坐标转换**：通过高德地图API进行坐标转换和地址解析
- ✅ **自动触发机制**：脚本监听高德API调用，无需定时任务

## 📦 BoxJS 订阅

```
https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/box.jx.json
```

## ⚙️ 配置说明

### 1️⃣ 彩云天气配置

#### Quantumult X
```ini
[MITM]
hostname = restapi.amap.com

[rewrite_local]
https:\/\/restapi\.amap\.com\/v3\/geocode\/geo url script-request-header https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js
```

#### Loon
```ini
[MITM]
hostname = restapi.amap.com

[Script]
http-request https:\/\/restapi\.amap\.com\/v3\/geocode\/geo script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js, require-body=false
```

#### Surge
```ini
[MITM]
hostname = restapi.amap.com

[Script]
type=http-request, pattern=https:\/\/restapi\.amap\.com\/v3\/geocode\/geo, script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/caiyun.js, require-body=false
```

### 2️⃣ 快捷指令设置

#### 创建获取位置的快捷指令
1. 打开iOS「快捷指令」应用
2. 创建新的快捷指令，命名为「获取当前位置」
3. 添加以下操作：
   - 「获取当前位置」→ 选择「总是允许」
   - 「获取URL内容」→ URL设置为：
     ```
     https://restapi.amap.com/v3/geocode/geo?key=您的高德地图API Key&address=当前位置
     ```
4. 保存快捷指令

#### 使用说明
- 运行快捷指令时，脚本会自动检测到高德API调用
- 脚本将获取坐标信息并调用彩云天气API
- 无需设置定时任务，完全自动触发

### 3️⃣ 系统设置

1. **开启定位服务**：设置 → 隐私与安全性 → 定位服务
2. **快捷指令权限**：设置 → 快捷指令 → 允许运行脚本
3. **BoxJS 配置**：仅需添加彩云天气 API Token

## 🔧 Token 获取

### 彩云天气 Token
1. 访问 [彩云天气开放平台](https://dashboard.caiyunapp.com/)
2. 注册账号并创建应用
3. 获取 API Key（注意：是 Token 字符串，不是链接）

### 高德地图说明
- 使用的是公开的地理编码接口进行坐标转换
- 快捷指令中的URL已包含必要的参数

## 📱 使用说明

1. **安装脚本**：按照上述配置添加重写规则（无需定时任务）
2. **配置 Token**：在 BoxJS 中填入彩云天气 API Token
3. **创建快捷指令**：按照上述步骤创建获取位置的快捷指令
4. **运行快捷指令**：需要天气信息时运行快捷指令即可
5. **自动推送**：脚本检测到高德API调用后自动获取并推送天气信息

### 工作原理
1. 🎯 **快捷指令触发**：用户运行快捷指令获取当前位置
2. 🌐 **API调用监听**：脚本监听高德地图API的调用请求
3. 📍 **坐标解析**：从API响应中提取经纬度和地址信息
4. 🌤️ **天气获取**：使用坐标调用彩云天气API获取天气数据
5. 📱 **推送通知**：自动推送天气预报和预警信息

## 🔄 更新日志

### v3.0 (2024-12-19)
- 🚀 **重大更新**：改用高德地图API进行精准定位
- ⚠️ **重要说明**：不再依赖Apple天气应用（坐标不准确）
- ✨ **快捷指令集成**：支持iOS快捷指令获取当前位置
- 🎯 **自动触发**：监听高德API调用，无需定时任务
- 🔧 **简化配置**：仅需彩云天气Token，移除其他配置项
- 📱 **优化通知**：改进通知逻辑，减少干扰信息

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