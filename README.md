# 住这儿APP QuantumultX 开门助手

## 功能介绍

本项目提供了一套完整的QuantumultX脚本解决方案，实现住这儿APP的自动token管理和门禁控制功能。

### 主要功能
1. **自动Token拦截**：拦截住这儿APP登录响应，自动提取并保存accessToken到BoxJS
2. **一键开门**：通过QuantumultX任务实现自动开门功能
3. **定时任务**：支持设置定时自动开门（默认早上8点和晚上7点）
4. **BoxJS集成**：完整的配置管理界面
5. **设备名称自动匹配**：支持通过 `deviceName` 参数选择设备，自动映射为 `deviceCode`
6. **自动刷新Token**：授权失败或过期时自动刷新token并重试开门

## 文件说明

### 1. BoxJS配置文件
- `zhuzher.boxjs.json` - BoxJS配置，包含token存储变量
- `zhuzher-subscribe.json` - 脚本订阅配置

### 2. QuantumultX脚本
- `zhuzher-token-intercept.js` - Token拦截脚本
- `zhuzher-open-door.js` - 自动开门脚本

### 3. QuantumultX配置
- `zhuzher-quanx.conf` - 完整的QuantumultX配置示例

## 安装步骤

### 1. 安装BoxJS（如果尚未安装）
在QuantumultX中添加BoxJS订阅：
```
https://raw.githubusercontent.com/chavyleung/scripts/master/box/rewrite/boxjs.rewrite.quanx.conf
```

### 2. 添加BoxJS配置
将 `zhuzher.boxjs.json` 添加到BoxJS中，或直接使用订阅地址：
```
https://raw.githubusercontent.com/zhuzher/quantumultx-scripts/main/zhuzher-subscribe.json
```

### 3. 配置QuantumultX
将以下内容添加到QuantumultX配置文件中：

```ini
[rewrite_local]
# 住这儿Token拦截
^https://api\.5th\.zone/auth/v3/external/oauth/accessToken url script-response-body https://raw.githubusercontent.com/zhuzher/quantumultx-scripts/main/zhuzher-token-intercept.js

[task_local]
# 住这儿自动开门（每天早上8点和晚上7点）
0 8,19 * * * https://raw.githubusercontent.com/zhuzher/quantumultx-scripts/main/zhuzher-open-door.js, tag=住这儿自动开门, enabled=true

[mitm]
hostname = api.5th.zone
```

### 4. 配置设备信息
1. 打开BoxJS → 住这儿配置
2. 无需再设置设备编号（device_code），开门脚本支持通过设备名称自动匹配设备编号
3. 其他token信息会自动获取

## 使用方法

### 自动获取Token
1. 正常登录住这儿APP
2. 脚本会自动拦截登录响应并保存token
3. 可以在BoxJS中查看保存的token信息

### 手动开门
在QuantumultX中手动执行开门任务：
1. 打开QuantumultX → 任务
2. 找到"住这儿自动开门"任务
3. 点击运行（支持参数传入设备名称，例如 `argument=deviceName=A区南门人行`）

### 定时开门
默认配置为每天早上8点和晚上7点自动开门，可在QuantumultX任务配置中修改时间。

示例（带设备名称参数）：
```
[task_local]
0 8,19 * * * zhuzher-open-door.js, tag=住这儿自动开门, enabled=true, argument=deviceName=A区南门人行
```


## 配置说明

### BoxJS变量说明
- `zhuzher_access_token` - 访问令牌（自动获取）
- `zhuzher_refresh_token` - 刷新令牌（自动获取）  
- `zhuzher_user_id` - 用户ID（自动获取）

> 设备编号不再需要存储在BoxJS中；脚本通过 `deviceName` 自动映射为 `deviceCode`。

### API接口说明
- **Token刷新接口**: `https://api.5th.zone/auth/v3/external/oauth/accessToken`
- **开门接口**: `https://api.5th.zone/p/chaos/fd/api/entrance/v1/easygo/open`

## 注意事项

1. **Token有效期**：accessToken有效期为7天，token过期后需要重新登录APP。脚本在开门失败（授权401）时会自动刷新token并重试。
2. **设备名称匹配**：`deviceName` 必须与映射表完全一致（区分中文字符、空格），当前有14个设备可选；如同名设备存在多个编码，脚本按列表中首个匹配。
3. **网络要求**：需要良好的网络连接，建议使用WiFi
4. **权限要求**：确保QuantumultX有网络访问权限

## 故障排除

### 开门失败
1. 检查token是否有效（查看BoxJS中的过期时间）
2. 确认设备编号是否正确
3. 检查网络连接是否正常

### Token未自动获取
1. 确认重写规则是否正确配置
2. 检查是否成功登录住这儿APP
3. 查看QuantumultX日志获取详细信息

### 脚本执行错误
1. 检查QuantumultX版本是否支持
2. 确认脚本文件完整
3. 查看控制台日志了解具体错误

## 更新日志

- v1.0.0 - 初始版本，实现基本功能
- v1.1.0 - 新增设备名称自动匹配与自动刷新token，支持任务参数 `argument=deviceName=…`

## 技术支持

如有问题，请在GitHub提交Issue或联系开发者。

## 免责声明

本脚本仅供学习和研究使用，请合理使用，遵守相关法律法规。