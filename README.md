**仓库简介**
- Quantumult X / BoxJS 自用脚本合集，涵盖彩云天气、自动定位、住这儿助手（自动开门与 Token 拦截）以及咔皮记账响应改写。
- 目标：通过重写与脚本自动化获取位置、通知天气、拦截并保存令牌、执行便捷动作；配套 BoxJS 订阅用于可视化配置与持久化变量。

**环境要求**
- iOS 上的 `Quantumult X`（主推荐）。同时兼容 `Loon`、`Surge`（脚本已给出对应示例）。
- 安装并配置 `BoxJS`（用于管理脚本变量与可视化配置）。

**仓库结构**
- `caiyun.js`：监控高德地理编码接口，结合彩云天气 Token 推送实时/预警天气。
- `locate.js`：通过系统天气接口自动解析经纬度并持久化，可供其他脚本复用。
- `zhuzher-token-intercept.js`：拦截住这儿 APP 登录/OAuth 刷新接口响应，自动保存 Token 到 BoxJS。
- `zhuzher-open-door.js`：住这儿自动开门脚本，支持按设备名称触发，自动刷新 Token，日志增强。
- `kapi-accounting.js`：咔皮记账接口响应改写示例（学习用途）。
- `quanx.conf`：Quantumult X 重写订阅示例（含 MITM/重写/任务说明）。
- `box.jx.json`：BoxJS 应用订阅定义（彩云天气、住这儿助手）。

**快速开始**
- 在 Quantumult X 导入重写订阅：`https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/quanx.conf`
- 在 BoxJS 订阅应用：`https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/box.jx.json`
- 在 BoxJS 的“彩云天气”中填写 `彩云天气API Token`（键：`@caiyun.token.caiyun`）。
- 打开系统天气定位权限：设置 → 隐私 → 定位服务 → 天气 → 永远允许 + 精确位置。
- 首次在住这儿 APP 登录或刷新 Token 时，`zhuzher-token-intercept.js` 会自动拦截并写入 `accessToken/refreshToken/userID` 到 BoxJS。

**Quantumult X 配置**
- MITM 主机名（按脚本需求汇总）：
  - `restapi.amap.com`（彩云）
  - `api.5th.zone`（住这儿）
  - `api.heylumi.cn`（咔皮记账）
  - 运行自动定位请同时添加：`weatherkit.apple.com`, `api.weather.com`
- 重写规则（示例已内置在 `quanx.conf`）：
  - 彩云天气：`https://restapi.amap.com/v3/geocode/geo` → `script-request-header` → `caiyun.js`
  - 住这儿 Token 拦截：
    - `https://api.5th.zone/auth/v3/external/oauth/accessToken` → `script-response-body`
    - `https://api.5th.zone/linksail/api/mobile/login` → `script-response-body`
  - 咔皮记账：`api.heylumi.cn` 下的用户配置、应用配置、账户状态接口 → `script-response-body`
- 任务说明：当前脚本均为自动触发型；如需定时/手动任务，可在 `[task_local]` 中自行添加运行条目。

**BoxJS 订阅**
- 订阅地址：`https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/box.jx.json`
- 应用与键：
  - 彩云天气（`Caiyun`）：`@caiyun.token.caiyun`（彩云天气 API Token）
  - 住这儿助手（`Zhuzher`）：`zhuzher_access_token`, `zhuzher_refresh_token`, `zhuzher_user_id`（拦截脚本自动写入）

**脚本说明**
- `caiyun.js`
  - 作用：监控高德地理编码接口，解析位置后调用彩云天气，推送实时/预警天气。
  - 触发：`script-request-header`（接口：`/v3/geocode/geo`）。
  - 依赖：BoxJS 中的 `@caiyun.token.caiyun`；MITM `restapi.amap.com`。
  - 平台示例：已在脚本顶部提供 Quantumult X / Loon / Surge 的配置片段。

- `locate.js`
  - 作用：自动解析系统天气相关接口的经纬度，写入持久化，供其他脚本引用。
  - 触发：`http-request`（接口匹配 `weatherkit.apple.com` 与 `api.weather.com` 多种 URL 格式）。
  - 依赖：MITM `weatherkit.apple.com`, `api.weather.com`；可选配置项 `display_location`（是否通知位置信息）。
  - 说明：无需定时任务；其他脚本可读取 `latitude` 与 `longitude` 字段使用。

- `zhuzher-token-intercept.js`
  - 作用：拦截住这儿 APP 登录与 OAuth 刷新响应，将 `accessToken/refreshToken/userID` 写入 BoxJS。
  - 触发：`script-response-body`。
  - 接口：`/auth/v3/external/oauth/accessToken`、`/linksail/api/mobile/login`。
  - 说明：首次登录或刷新时自动写入；已内置容错与通知。

- `zhuzher-open-door.js`
  - 作用：基于已保存的 Token 自动开门，支持按 `deviceName` 选择设备；内置 Token 刷新与详细日志。
  - 使用：在 Quantumult X 中手动运行脚本时传入参数，例如 `deviceName=东门`；或在 `[task_local]` 中添加带参数的任务。
  - 接口：`/p/chaos/fd/api/entrance/v1/easygo/open`；刷新接口：`/auth/v3/external/oauth/accessToken`。
  - 设备映射：脚本内置常用门禁设备名称到编码的映射，可直接使用中文名称触发。

- `kapi-accounting.js`
  - 作用：拦截并改写咔皮记账相关接口响应（示例：会员等级改 VIP、应用配置设为 999 等）。
  - 触发：`script-response-body`；MITM：`api.heylumi.cn`。
  - 说明：仅供学习与调试示例，请勿用于违反服务条款的用途。

**常见问题**
- 无法触发脚本：检查是否正确启用对应的 MITM 主机名与重写规则；确保系统天气与定位权限已打开。
- 住这儿开门失败：确认 BoxJS 中的 Token 已写入且未过期；脚本会在必要时自动刷新。
- 彩云天气无通知：确认已填写 `@caiyun.token.caiyun` 且高德接口调用能被脚本捕获。

**更新与原始地址**
- 仓库地址：`https://github.com/Lizhengbo0304/qx_boxjs`
- 重写订阅：`https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/quanx.conf`
- BoxJS 订阅：`https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/box.jx.json`
- 各脚本 Raw：将文件名替换到 `https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/<filename>`

**声明**
- 本项目仅用于个人学习与自动化示例，请遵守相关平台与应用的服务条款；禁止用于商业或违规用途。