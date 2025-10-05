/*
 * 咔皮记账 QuantumultX 脚本
 * 用于拦截和修改咔皮记账应用的API响应数据
 * 
 * 使用方法：
 * 1. 在QuantumultX配置文件中添加以下重写规则：
 *    ^https://api\.heylumi\.cn/note/note-api/settings/profile/get url script-response-body https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js
 *    ^https://api\.heylumi\.cn/note/note-api/common/app/config/list url script-response-body https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js
 * 
 * 2. 在[mitm]部分添加：
 *    hostname = api.heylumi.cn
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