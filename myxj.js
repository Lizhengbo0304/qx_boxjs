/******************************

�ű����ܣ��������+����VIP
���ص�ַ��http://mtw.so/6co6Pp
����汾�����°汾
�ű����ߣ�������
����ʱ�䣺2024-12-19
���ⷴ����QQ+89996462
ʹ��������??�˽ű�����ѧϰ�뽻��������ת���뷷����??????

*******************************

[rewrite_local]

^https:\/\/api\.account\.meitu\.com\/users\/show_current\.json url script-response-body https://raw.githubusercontent.com/89996462/Quantumult-X/main/ycdz/myxj.js

[mitm] 
hostname = api.account.meitu.com

*******************************/

var body = $response.body;
var objk = JSON.parse(body);

// �޸ķ������ݣ�����VIP����
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
            "province_name": "ɽ��",
            "country_name": "�й�",
            "province": 370000,
            "avatar": "https://maavatar1.meitudata.com/63cd36b7beb9e1539.jpg",
            "location": "�й� ɽ��",
            "birthday": "1992-10-06",
            "city": 0,
            "city_name": "",
            "country": 100000,
            "screen_name": "???",
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
            "location": "�й� ɽ��",
            "has_assoc_phone": false,
            "description": "",
            "email_verified": false,
            "country_name": "�й�",
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
                    "screen_name": "������????",
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
            "screen_name": "???",
            "province": 370000,
            "province_name": "ɽ��",
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

body = JSON.stringify(objk);

$done({body});