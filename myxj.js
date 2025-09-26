/******************************

脚本功能：美颜相机+解锁VIP
下载地址：https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/myxj.js
软件版本：最新版本
脚本作者：lizhengbo
更新时间：2025-09-26
*******************************

[rewrite_local]

^https:\/\/api\.account\.meitu\.com\/users\/show_current\.json url script-response-body https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/myxj.js
^https:\/\/api\.account\.meitu\.com\/common\/check_device_login_pwd_list url script-response-body https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/myxj.js

[mitm] 
hostname = api.account.meitu.com

*******************************/

var body = $response.body;
var objk = JSON.parse(body);
var url = $request.url;

// 判断API接口类型并返回对应的VIP数据
if (url.indexOf("/users/show_current.json") !== -1) {
    // 用户信息接口
    objk = {
        "meta": {
            "code": 0,
            "sid": "e2c03cfbc1f073a0d55a67954c55386a",
            "msg": "",
            "request_uri": "/users/show_current.json",
            "error": "",
            "request_id": "68d65123bdbd55.91017754721835212"
        },
        "response": {
            "suggested_info": {
                "avatar_https": "https://maavatar1.meitudata.com/63cd36b7beb9e1539.jpg",
                "province_name": "山东",
                "country_name": "中国",
                "province": 370000,
                "avatar": "https://maavatar1.meitudata.com/63cd36b7beb9e1539.jpg",
                "location": "中国 山东",
                "birthday": "1992-10-06",
                "city": 0,
                "city_name": "",
                "country": 100000,
                "screen_name": "lizhengbo",
                "gender": ""
            },
            "need_phone": false,
            "show_user_info_form": true,
            "required_fields": [
                "screen_name",
                "avatar"
            ],
            "user": {
                "created_at": 1674393265,
                "id": 1941426628,
                "silent_login_status": 1,
                "country": 100000,
                "has_phone": true,
                "location": "中国 山东",
                "has_assoc_phone": false,
                "description": "",
                "email_verified": false,
                "country_name": "中国",
                "wallet_flag": {
                    "has_income": false,
                    "has_recharge": false
                },
                "external_platforms": {
                    "weixin": {
                        "avatar": "https://thirdwx.qlogo.cn/mmopen/vi_32/pgQpy1FE8d7dRicuC7fOaNmvhZrVwuSuXPaEv8VzIwNL3HLnV2AxnlMsibGKRtl31ibQLnsy1EjGHnygSqH14H2FufV4W0xUDebEO8xAtVU4Fw/132",
                        "id": "oim5Qt3m2UBBCCd8jnwp3gqeUkYw",
                        "created_at": 1674393265,
                        "avatar_https": "https://thirdwx.qlogo.cn/mmopen/vi_32/pgQpy1FE8d7dRicuC7fOaNmvhZrVwuSuXPaEv8VzIwNL3HLnV2AxnlMsibGKRtl31ibQLnsy1EjGHnygSqH14H2FufV4W0xUDebEO8xAtVU4Fw/132",
                        "screen_name": "lizhengbo",
                        "access_token": "001AUYFa1VtRlK07bhJa1oJnor0AUYFO",
                        "is_expired": false
                    }
                },
                "email": "",
                "assoc_phone": "",
                "idcard_status": 0,
                "birthday": "1992-10-06",
                "has_any_phone": true,
                "red_v_status": 0,
                "city": 0,
                "avatar": "https://maavatar1.meitudata.com/63cd36b7beb9e1539.jpg",
                "status": "8389376",
                "phone_cc": 86,
                "screen_name": "lizhengbo",
                "province": 370000,
                "province_name": "山东",
                "gender": "",
                "city_name": "",
                "assoc_phone_cc": 0,
                "has_password": false,
                "blue_v_status": 0,
                "assoc_uid": 0,
                "old_account_uid": "1941426628",
                "profile_status": 0,
                "overseas_status": 0,
                "phone": "18005319302",
                "vip": {
                    "list": [
                        {
                            "status": 0,
                            "app_id": 19,
                            "icon": "https://account.meitu.com/static/image/meiyan.png"
                        }
                    ],
                    "meiyan_vip": 0
                },
                "avatar_https": "https://maavatar1.meitudata.com/63cd36b7beb9e1539.jpg"
            }
        }
    };

} else if (url.indexOf("/common/check_device_login_pwd_list") !== -1) {
    // 设备登录密码列表接口
    objk = {
        "meta": {
            "code": 0,
            "sid": "1776be137ae7e79430c195cd02c865e8",
            "msg": "",
            "request_uri": "/common/check_device_login_pwd_list",
            "error": "",
            "request_id": "68d655f4d08de1.36802746464567127"
        },
        "response": [
            {
                "avatar": "http://maavatar1.meitudata.com/63cd36b7beb9e1539.jpg",
                "uid": 1941426628,
                "method_list": [
                    {
                        "content": "180*****302",
                        "icon": 108,
                        "method": "手机号码"
                    },
                    {
                        "content": "李*****⁵",
                        "icon": 103,
                        "method": "微信"
                    }
                ],
                "login_history": "25年09月，用iphone 15 pro max登录",
                "refresh_device_login_pwd": "",
                "check_valid": true,
                "vip": {
                    "list": [
                        {
                            "status": 0,
                            "app_id": 19,
                            "icon": "https://account.meitu.com/static/image/meiyan.png"
                        }
                    ],
                    "meiyan_vip": 0
                },
                "screen_name": "lizhengbo",
                "device_login_pwd": "_v2NzNiN2QxYzQjMTc2NjQxMjI2MyM4Mzg5MTIwIzExIzExMjI5NDE0Y2ViZGRlNGU2NThhNDk0NDU3MDczMjgxZGUjSFVBV0VJX0FaMSNCSl9IVyM2ODM0NzRlOA==",
                "client_id": 1089867607
            }
        ]
    };
}

body = JSON.stringify(objk);

$done({ body });