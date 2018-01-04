/**
 * Created by tanzuoliang on 17/2/22.
 */




class Rect{
    constructor(x,y,width,height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.right = this.x + this.width;
        this.up = this.y + this.height;

        this.halfWidth = this.width * 0.5;
        this.halfHeight = this.height * 0.5;

        this.centerX = this.x + this.halfWidth;
        this.centerY = this.y + this.halfHeight;

        this.outCircle = new Circle(this.centerX, this.centerY, Math.sqrt(this.halfWidth * this.halfWidth + this.halfHeight * this.halfHeight));
        this.innerCircle = new Circle(this.centerX, this.centerY, Math.min(this.halfWidth,this.halfHeight));
    }

    containsPoint(x,y){
        return x >= this.x && x <= this.right && y >= this.y && y <= this.up;
    }

    interactive(rect){
        return Math.abs(this.centerX - rect.centerX) < (this.halfWidth + rect.halfWidth) &&
            Math.abs(this.centerY - rect.centerY) < (this.halfHeight + rect.halfHeight);
    }
}


class Circle{
    constructor(x,y,radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    toString() {
        console.log("x = " + this.x + " , y = " + this.y + " , radius = " + this.radius);
    }

    lerpCircle (circle) {
        return Math.sqrt(Math.pow(this.x - circle.x, 2) + Math.pow(this.y - circle.y, 2)) < (this.radius + circle.radius);
    }

    containsPoint (x,y) {
        return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)) < this.radius;
    }

    lerpRect(rect) {
        return this.lerpCircle(rect.innerCircle,"inner") ||
            this.lerpCircle(rect.outCircle,"out")	&& (
                this.containsPoint(rect.x, rect.y) ||
                this.containsPoint(rect.x,rect.up) ||
                this.containsPoint(rect.right,rect.up) ||
                this.containsPoint(rect.right,rect.y)
            );
    }
}


let __link__class_id__ = 1;

class LinkArray{
    constructor(data){
        this.data = !data?[]:data;
        this.recycleIndexs = [];

        this.class_id = __link__class_id__++;
        this.itemkey = "INDEX" + this.class_id + "";
    }

    clear () {
        this.data.length = 0;
        this.recycleIndexs.length = 0;
    }

    add (item) {
        let index = this.recycleIndexs.length > 0?this.recycleIndexs.shift():this.data.length;
        this.data[index] = item;
        item[this.itemkey] = index;
    }

    get (key,tag) {
        for(let item of this.data){
            if(item && item[key] == tag){
                return item;
            }
        }

        return null;
    }

    addWithTag (item,tag) {
        let index = this.recycleIndexs.length > 0?this.recycleIndexs.shift():this.data.length;
        this.data[index] = item;
        item[this.itemkey] = index;
        item.__tag__ = tag;
    }

    getByTag  (tag) {
        for(let item of this.data){
            if(item.__tag__ == tag){
                return item;
            }
        }
        return null;
    }

    remove (item) {
        if(item.hasOwnProperty(this.itemkey)){
            let index = item[this.itemkey];
            if(index > -1){
                this.data[index] = null;
                this.recycleIndexs.push(index);
                item[this.itemkey] = -1;
            }
        }
    }
}


class Random{
    constructor(seed=5){
        this.seed = seed;
    }

    random(min, max){
        max = max || 1;
        min = min || 0;
        this.seed = (this.seed * 9301 + 49297) % 233280;
        var rnd = this.seed / 233280.0;
        var ret =  min + rnd * (max - min);
        return ret;
    }
}



class __MyData__{
    constructor(){
        this.offset = 1;
    }

    compress(data){
        let len = data.length;
        let flag = len % 2;
        len -= flag;
        let out = [];
        for(let i = 0; i < len; i+= 2){
            out[out.length] = String.fromCharCode(((data.charCodeAt(i) + this.offset) << 8) + data.charCodeAt(i + 1) + this.offset);
        }

        if(flag == 1){
            out[out.length] = String.fromCharCode(data.charCodeAt(len) + this.offset);
        }
        return out.join("");
    }

    unCompress(data){

        let len = data.length;
        let out = [];
        for(let i = 0; i < len;i++){
            let n = data.charCodeAt(i);
            if(n > 255){
                out[out.length] = String.fromCharCode((n>>8) - this.offset);
                out[out.length] = String.fromCharCode((n & 0XFF) - this.offset);
            }
            else{
                out[out.length] = String.fromCharCode(n - this.offset);
            }

        }

        return out.join("");
    }


}

const MY_DATA = new __MyData__();


const getFromMap = (map,key,callback)=>map.get(key) || map.set(key,callback()).get(key);

class XOR{
    constructor(){
        this.key = "MIIEpAIBAAKCAQEAqCGRKgEQCxUvkV8WQUJpSuCYKMy2jkiQNau/got/QRdFM83kmg0wjwll5BhYblqujnIJdgLhflLG9TzxzxcnMtNsZfRkO6PnKZQmMvn19N/jQy12/f0517sxe5GFDD/zJHttWI+Zl0cTZ9RfjpVoh3JqtliNy2tn7Txpi68kWX+vVRM13SpLMwDCPlLF4g6NY6B15BGcv986Ns0vx8WfF6aQjuI4PO0AMhJoFOptlyzPEM8l3Y6Nb4D/UlvBioWTo2BgHf1KVbSh1pHiM7FECdwb4hHxPOkxQhw9QkXcamaxr9Q9pkd9Lwbix6r0IlfTSmjHn87gQwUMwENuglvwIDAQABAoIBAFmTKKfcURPWgbVNl6nFHBvMdMSn7Er51fsCOdHvSCkBoNjsxPJePJS4SRSw88w3e/BgSTIabtDCmY+IcHpTzT9QpbIdFf11b/B9VbHM7j5WpFLetIebDwDLUnAkH3UY8pMv0o1STtvMKgF3Kl7xMj/sDK8Jedrk3GN2RpX0IQWZuQ8gssKdhH6Vqn13bV/fmD3Z+woXfxSAtLt74KKnqpjLBkP1f8QNGRpLCpsbeiJIb9jVLiDYCpUj/CVMvGRTmWJguUMRgmE5cjFW17/oV1MktzkGHeyfgIjMf9m0H3HC+eeoCYdbn48pZRWvimtUA3HliIFAhl3y8vTCBgd+GuECgYEA2H7c5LeJiS5E+aiRpwpqUUjRGuySr50piXK2+B2Xy+OSYeTOWypuHm3Ax2tZDN6AeCskqfqjUbn7TjB6gk1/tvSP0M/hnirJx40HCef0Yc9ocG8WE2h4mv42NnDDo9mVIUslTNoHIYu4IXWakUiGATCZ1g/nEA4Me1zn+MNWZsCgYEAxs";
        this.buff_size = 256;

        this.xorCode = [];
        for(var i = 0,len = this.key.length; i < len;i++){
            this.xorCode[this.xorCode.length] = this.key.charCodeAt(i);
        }

        this.__move_len__ = 7;
    }

    encodeMsg(msg){
        return msg;
        let ret = [];

        for(let i = 0,step = 0,len = msg.length; i < len;){
            // ret[ret.length] = String.fromCharCode( ((msg.charCodeAt(i)  << this.__move_len__) + (msg.charCodeAt(i+1) || 0)));
            // ret[ret.length] = String.fromCharCode((++step % 64 ) +  ((msg.charCodeAt(i)  << this.__move_len__) + (msg.charCodeAt(i+1) || 0)));
            ret[ret.length] = String.fromCharCode((msg.charCodeAt(i)  << this.__move_len__) + (msg.charCodeAt(i+1) || 0));
            i += 2;
        }
        return ret.join("");
    }

    decodeMsg(msg) {
        return msg;
        let ret = [];
        for(var i = 0,step = 0,code,temp,len = msg.length; i < len;i++){
            // code = msg.charCodeAt(i);
            // code = msg.charCodeAt(i) - (++step % 64);
            code = msg.charCodeAt(i);
            temp = code >> this.__move_len__;
            ret[ret.length] = String.fromCharCode(temp);
            temp = code - (temp << this.__move_len__);
            if(temp > 0)ret[ret.length] = String.fromCharCode(temp);
        }

        return ret.join("");
    }

    update(data){
        var keys = [];
        var boxs = [];
        var cipher = [];
        for (let i = 0, j = 0; i < this.buff_size; i++) {
            keys[i] = this.key.charCodeAt(i % this.key.length);
            boxs[i] = i;
        }
        for (let i = 0, j = 0; i < this.buff_size; i++) {
            j = (j + boxs[i] + keys[i]) % this.buff_size;
            var tmp = boxs[i];
            boxs[i] = boxs[j];
            boxs[j] = tmp;
        }
        for (let a = 0, i = 0, j = 0; i < data.length; i++) {
            a = (a + 1) % this.buff_size;
            j = (j + boxs[a]) % this.buff_size;
            var tmp = boxs[a];
            boxs[a] = boxs[j];
            boxs[j] = tmp;
            var k = boxs[((boxs[a] + boxs[j]) % this.buff_size)];
            cipher[i] = String.fromCharCode(data.charCodeAt(i) ^ k);
        }
        return cipher.join("");

    }
}

const xor = new XOR();


var crypto = require('crypto');

function getMD5(text){
    let hasher = crypto.createHash("md5");
    hasher.update("tianyi_tank" + text);
    return hasher.digest('hex');//hashmsg为加密之后的数据
}

module.exports = {
    Rect,
    Circle,
    LinkArray,
    Random,
    getFromMap,
    MY_DATA,
    xor,
    getMD5
};


function defineProperty(obj,proto,v){
    Object.defineProperty(obj,proto,{
        writeable : false,
        configurable : false,
        enumerable : false,
        value :v

    });
}

defineProperty(Array.prototype,"merge",function (list) {
    for(let i = 0,len = list.length; i < len;i++){
        this[this.length] = list[i];
    }
});

defineProperty(Object.prototype,"getSize",function () {
    var n = 0;
    for(var key in this){
        n++;
    }
    return n;
});

defineProperty(Object.prototype,"str",function () {
   return JSON.stringify(this);
});

// module.exports.Rect = Rect;
// module.exports.Circle = Circle;
// module.exports.LinkArray = LinkArray;
//
// module.exports.Random = Random;