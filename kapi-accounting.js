/**
 * 咔皮记账 QuantumultX 脚本
 * @author: lizhengbo
 * 更新地址：https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js
 * 
 * 功能：
 * √ 拦截用户配置接口，修改会员等级为VIP
 * √ 拦截应用配置接口，修改配置值为999
 * 
 * 配置：
 * 1️⃣ 根据平台添加如下配置（提供两种配置方式，任选其一）
 * 
 * 🔸 方式一：精确匹配（推荐，更安全）
 * (1). Quantumult X
 * [MITM]
 * hostname = api.heylumi.cn
 * [rewrite_local]
 * ^https:\/\/api\.heylumi\.cn\/note\/note-api\/settings\/profile\/get url script-response-body https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js
 * ^https:\/\/api\.heylumi\.cn\/note\/note-api\/common\/app\/config\/list url script-response-body https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js
 * 
 * (2). Loon
 * [MITM]
 * hostname = api.heylumi.cn
 * [Script]
 * http-response ^https:\/\/api\.heylumi\.cn\/note\/note-api\/settings\/profile\/get script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true
 * http-response ^https:\/\/api\.heylumi\.cn\/note\/note-api\/common\/app\/config\/list script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true
 * 
 * (3). Surge
 * [MITM]
 * hostname = api.heylumi.cn
 * [Script]
 * 咔皮记账-用户配置 = type=http-response, pattern=^https:\/\/api\.heylumi\.cn\/note\/note-api\/settings\/profile\/get, script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true
 * 咔皮记账-应用配置 = type=http-response, pattern=^https:\/\/api\.heylumi\.cn\/note\/note-api\/common\/app\/config\/list, script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true
 * 
 * 🔸 方式二：简化匹配（兼容性更好，配置更简单）
 * (1). Quantumult X
 * [MITM]
 * hostname = api.heylumi.cn
 * [rewrite_local]
 * https:\/\/api\.heylumi\.cn\/note\/note-api\/settings\/profile\/get url script-response-body https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js
 * https:\/\/api\.heylumi\.cn\/note\/note-api\/common\/app\/config\/list url script-response-body https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js
 * 
 * (2). Loon
 * [MITM]
 * hostname = api.heylumi.cn
 * [Script]
 * http-response https:\/\/api\.heylumi\.cn\/note\/note-api\/settings\/profile\/get script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true
 * http-response https:\/\/api\.heylumi\.cn\/note\/note-api\/common\/app\/config\/list script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true
 * 
 * (3). Surge
 * [MITM]
 * hostname = api.heylumi.cn
 * [Script]
 * 咔皮记账-用户配置 = type=http-response, pattern=https:\/\/api\.heylumi\.cn\/note\/note-api\/settings\/profile\/get, script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true
 * 咔皮记账-应用配置 = type=http-response, pattern=https:\/\/api\.heylumi\.cn\/note\/note-api\/common\/app\/config\/list, script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true
 * 
 * 📝 配置说明：
 * • 方式一（带^）：精确匹配URL开头，更安全，避免误匹配
 * • 方式二（不带^）：模糊匹配URL包含，兼容性更好，配置简单
 * • 建议优先使用方式一，如遇到匹配问题可尝试方式二
 * 
 * 注意：此脚本会自动拦截咔皮记账的API响应并修改数据，无需额外配置。
 */

const url = $request.url;
let body = $response.body;

try {
    // 解析响应数据
    let data = JSON.parse(body);
    
    // API1: 用户配置信息接口
    if (url.includes('/note/note-api/settings/profile/get')) {
        console.log('拦截到用户配置接口，开始修改数据...');
        
        if (data && data.data && data.data.userRightsAccount) {
            // 修改会员等级为VIP
            data.data.userRightsAccount.memberLevel = "VIP";
            data.data.userRightsAccount.vipLevel = "VIP";
            
            // 修改到期时间为2099年
            data.data.userRightsAccount.endTime = "2099-12-31 23:59:59";
            
            console.log('用户配置数据修改完成');
            console.log('memberLevel:', data.data.userRightsAccount.memberLevel);
            console.log('vipLevel:', data.data.userRightsAccount.vipLevel);
            console.log('endTime:', data.data.userRightsAccount.endTime);
        }
    }
    
    // API2: 应用配置列表接口
    else if (url.includes('/note/note-api/common/app/config/list')) {
        console.log('拦截到应用配置接口，开始修改数据...');
        
        if (data && data.dataList && Array.isArray(data.dataList)) {
            // 遍历配置列表，将所有value修改为999
            data.dataList.forEach((item, index) => {
                if (item && typeof item.value !== 'undefined') {
                    const originalValue = item.value;
                    item.value = 999;
                    console.log(`配置项 ${index + 1}: ${item.code} - 原值: ${originalValue} -> 新值: ${item.value}`);
                }
            });
            
            console.log(`应用配置数据修改完成，共修改了 ${data.dataList.length} 个配置项`);
        }
    }
    
    // 返回修改后的数据
    body = JSON.stringify(data);
    
} catch (error) {
    console.log('数据解析或修改出错:', error);
    console.log('原始响应数据:', body);
}

$done({ body });