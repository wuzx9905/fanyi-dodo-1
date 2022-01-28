import * as https from 'https';
import * as querystring from 'querystring';
import md5 = require('md5');
import {appID, appSecret} from './private';
import {type} from 'os';

type ErrorMap = {
    [k: string] : string | undefined,
}
const errorMap: ErrorMap = {
    52001: '请求超时，请重试',
    52002: '系统错误，请重试',
    52003: '用户认证失败',
    54000: '必填参数为空',
    54001: '签名错误',
    54003: '访问频率受限',
    54005: '长query请求频繁',
    58000: '客户端IP非法',
    58001: '译文方向不支持',
    90107: '认证未通过',
    58002: '服务器繁忙'
};

export const translate = (word:string) => {


    const salt = Math.random();
    const sign = md5(appID + word + salt + appSecret);
    let from,to

    if (/[a-zA-Z]/.test( word[0])){
    //英译中
        from = 'en'
        to = 'zh'
    }else{
        //中译英
        from = 'zh'
        to = 'en'
    }

    const query: string = querystring.stringify({
        q: word,
        appid: appID,
        from,
        to,
        salt,
        sign
        //q=apple&from=en&to=zh&appid=20220127001069577&salt=1435660288&sign=eb0e7c0b6b82147d343ea0290a33ceef
    });

    const options = {
        hostname: 'api.fanyi.baidu.com',
        port: 443,
        path: `/api/trans/vip/translate?` + query,
        method: 'GET'
    };
    const request = https.request(options, (response) => {
        let chunks:Buffer[] = [];

        response.on('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            const string = Buffer.concat(chunks).toString();
            type BaiduResult = {
                error_code?: string,
                error_msg?: string,
                from: string,
                to: string,
                trans_result: { src: string, dst: string, }[]
            }
            const object: BaiduResult = JSON.parse(string);
            if (object.error_code) {
                console.error(errorMap[object.error_code] || object.error_msg);
                process.exit(2);
            } else {
                object.trans_result.map(obj=>{
                    console.log(obj.dst)
                });
                process.exit(0);
            }
        });
    });
    request.on('error', (e) => {
        console.error(e);
    });
    request.end();
};