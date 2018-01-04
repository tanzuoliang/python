/**
 * @Author: wbsifan
 * @Date:   2017-03-13T14:10:56+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 21-Sep-2017
 */

function countLength(str) {
    var r = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        // Shift_JIS: 0x0 ～ 0x80, 0xa0 , 0xa1 ～ 0xdf , 0xfd ～ 0xff
        // Unicode : 0x0 ～ 0x80, 0xf8f0, 0xff61 ～ 0xff9f, 0xf8f1 ～ 0xf8f3
        if ((c >= 0x0 && c < 0x81) || (c == 0xf8f0) || (c >= 0xff61 && c < 0xffa0) || (c >= 0xf8f1 && c < 0xf8f4)) {
            r += 1;
        } else {
            r += 2;
        }
    }
    return r;
}

var str = `96c69a0f["assets",246,368,44]&fd0d954f["assets",246,368,50]&81ab9a9b["assets",246,368,56]&b56dfa7c["assets",246,368,63]&pAe28ef1e1["assets",246,368,69]&#37fab53f["assets",246,368,75]&63355202["assets",246,368,81]&ivac7fb0de["assets`;
var len = countLength(str);
console.log("len:", len);
