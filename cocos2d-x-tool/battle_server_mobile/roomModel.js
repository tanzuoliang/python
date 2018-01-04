/**
 * Created by tanzuoliang on 17/2/21.
 */

"use strict";

const gameConfig = require("./gameConfig").gameConfig;

const BUFF_FACTORY = require("./buff").BuffFactory;

const WebSocketOrder = require("./const").WebSocketOrder;

const SERVER_CONST = require("./const").SERVER_CONST;

const Rect = require("./utils").Rect;
const Random = require("./utils").Random;

const getFromMap = require("./utils").getFromMap;
const dbBattle = require("./lib/db-battle");

const  C_AI = "c_ai_";


/**
 * 机器猫展示技能
 * @type {string}
 */
const MACHINE_CAT_SKILL_ID = 1234567;


function __transformMapData__(mapData){
    var t = [];
    var height = 10, width = 13;
    for (var i = 0,_x,_y, len = mapData.mapInfo.length; i < len; i++) {
        _x = Math.floor( i / height);
        _y = i % height;

        t[_x + width * _y] = mapData.mapInfo[i];
    }
    // t[6] = t[19] = t[32] = t[45] = t[58] = t[71]= t[84] = 0;
    mapData.mapInfo = t;

    var ii,_x,_y;
    var obj = {};
    for(var p in mapData.batchInfo){
        obj[p] = {};
        for(var key in mapData.batchInfo[p]){
            ii = Math.floor(key);
            _x = Math.floor( ii / height);
            _y = ii % height;
            obj[p]["" + (_x + width * _y)] = mapData.batchInfo[p][key];

        }
    }

    mapData.batchInfo = obj;

    if(mapData.beSurrounded){
        var so = {};
        for (var i = 0,_x,_y, data, len = mapData.beSurrounded.length; i < len; i++) {
            data = mapData.beSurrounded[i];
            _x = Math.floor(data / height);
            _y = data % height;

            so[_x + width * _y] = true;
        }
        mapData.beSurrounded = so;
    }

    return mapData;

};


function valid_object(data){
    for(let key in data){
        return true;
    }

    return false;
}


const TANK_TYPE = {
  AI : 1,
  MAIN_BASE : 2,
  PLAYER   : 3
};

const TANK_CAMP = {
    RED : 2,
    BLUE : 1,
    AI   : 3
};


class BuffProp  {
    constructor(){
        this.addAtk = 0;
        this.reduceAtk = 0;
        this.reduceDamage = 0;
        this.bounceDamage = 0;
        this.holdDamage = 0;
        this.isSuperTank = false;
        this.isStun = false;
    }
};


class BaseCD{
    constructor(skill_id){
        this.skill_id = skill_id;
        this.lastUseTime = 0;
    }

    use(){
        this.lastUseTime = Date.now();
    }

    update(dt){
        // if(this.time > 0)
        //     this.time -= dt;
    }

    isFree(){
        // return this.time <= 300;
        let time = Date.now();
        return this.lastUseTime == 0 ||
                (time - this.lastUseTime >= this.CDTime) ||
                (this.lastUseTime + this.CDTime - time)  < 500;
    }
}

class Skill extends BaseCD{
    /**
     *
     * @param skill_id 技能id
     */
    constructor(skill_id){
        super(skill_id);
        this.CDTime = gameConfig.skill_group[this.skill_id].cd;
        this.cdOffset = this.CDTime * 0.1;
    }
}

class PropSkill extends BaseCD{
    /**
     *
     * @param prop_id 道具id
     * @param count   数量
     */
    constructor(prop_id,count,type){
        super(gameConfig.prop[prop_id].skill_id);
        this.CDTime = gameConfig.skill_prop[this.skill_id].cd[type];
        console.log("prop cdTime is " + this.CDTime);
        this.cdOffset = this.CDTime * 0.1;
        this.count = count;
        this.prop_id = prop_id;
    }

    use(time){
        super.use(time);
        this.count--;
        console.log("use propSkill: " + this.prop_id);
    }

    isFree(){
        return this.count > 0 && super.isFree();
    }
}


const SIZE_OFFSET = 2;

class BaseTankModel{
    constructor(tank_id,server_id,level,roomModel,type){
        this.tank_id = tank_id;
        this.server_id = server_id;
        this.level = level;
        this.remainLife = 1;
        this.deadTimes = 0;

        //动作指令
        this.actions = [];

        this.roomModel = roomModel;
        this.tankAttr = gameConfig.tank_attr[this.tank_id + "_" + this.level];
        !this.tankAttr && console.log("can not find thd tan_attr config with id " + this.tank_id + "_" + this.level);

        if(type != TANK_TYPE.PLAYER){
            this.totalHp = this.hp = this.tankAttr.hp;
            this.configSpeed = this.speed = this.tankAttr.speed;

        }


        this.tankConfig = gameConfig.tank[this.tank_id];
        this.attack_id = this.tankConfig.attack_id;
        this.skill_id = this.tankConfig.skill_id;

        this.type = type;
        this.dead = false;
        this.buffMap = {};

        this.buffProp = new BuffProp();

        //status prototype
        this.currentUseSkill = -1;

        /**
         * 技能和道具cd
         * @type {{}}
         */
        this.cdMap = {};
        this.beHitMap = new Map();

        this.deadScore = 0;

        /**
         * 参加死亡记录
         * @type {boolean}
         */
        this.joinDeadRecode = true;
    }


    validBullet(id){
        return !this.beHitMap.has(id);
    }

    putBulletId(id){
        this.beHitMap.set(id,true);
    }

    initStatus(x,y,dir){
        this.x = x;
        this.y = y;
        this.dir = dir;

        if(this.tankConfig.collide_offset.length > 1){
            this.hitRect = new Rect(x + SIZE_OFFSET + this.tankConfig.collide_offset[0],
                y + SIZE_OFFSET + this.tankConfig.collide_offset[1],
                64 - 2*SIZE_OFFSET,
                64 - 2*SIZE_OFFSET);
        }
        else{
            this.hitRect = new Rect(x + SIZE_OFFSET,y + SIZE_OFFSET,64 - 2*SIZE_OFFSET,
                64 - 2*SIZE_OFFSET);
        }
    }


    update(dt){
        for(var key in this.buffMap){
            this.buffMap[key].update(dt);
        }

        for(var key in this.cdMap){
            this.cdMap[key].update(dt);
        }
    }

    buffSpeed (bSpeed) {
        this.speed += bSpeed * this.configSpeed;
    }

    /**
     *
     * @param blood 伤害
     * @param byWho 谁打的
     */
    beHit(blood,byWho,hitId){
        if(this.dead ){
            console.log(hitId + " has dead");
            return false;
        }

        if(hitId){
            if(this.beHitMap.has(hitId))return false;
            this.beHitMap.set(hitId,true);
        }

        //about buff
        if(!this.buffProp.isSuperTank){
            this.buffProp.holdDamage--;
        }
        this.hp -= blood;
        //console.log("tank " + this.server_id + " , beHit " + blood + " and just remain " + this.hp +  " blood");
        if(this.hp > this.totalHp)this.hp = this.totalHp;
        if(this.hp <= 0){
            this.remainLife--;
            this.deadTimes++;
            this.dead = true;
            this.roomModel.tankDead(this,byWho);
            this.deadHandle();
        }else{
            blood > 0 && this.roomModel.recodeHurt(byWho,this.getRecoredTag(),blood);
        }

        return true;
    }

    deadHandle(){

    }

    getRecoredTag(){return this.server_id + "_" + this.deadTimes;}

    addBuff(buff_id){
        var buffConfig = gameConfig.buff[buff_id];
        !buffConfig && console.log("can not find buffConfig " + buff_id);

        for(var key in this.buffMap){
            let buff = this.buffMap[key];
            if(buff.isRejectOthterBuffType(buffConfig.type)){
                return;
            }

            if((buff.buffConfig.type == buffConfig.type && buffConfig.buff_same == 1)
                || buff.isReplaceOtherBuffType(buffConfig.type))
            {

                buff.complete();
            }
        }

        let buffModel = BUFF_FACTORY(buffConfig.type,buff_id,this);
        if(buffModel){
            this.buffMap[buffModel.key] = buffModel;
        }
        
        
    }

    //----------------
    turnAround(dir){
        this.dir = dir;
    }

    move(dir){
         //这里目前是假设没有阻挡
        this.dir = dir;
        let move_distance = this.speed * SERVER_CONST.CLIENT_MOVE_TIME;
        switch (dir){
            case 1:
                this.x += move_distance;
            break;
            case 2:
                this.y -= move_distance;
            break;
            case 3:
                this.x -= move_distance;
            break;
            case 4:
                this.y += move_distance;
            break;
        }
    }

    /**
     * 使用技能
     * @param dir
     * @param skill_id
     * @param time 使用时间
     * @returns {boolean}
     */
    useSkill(dir,skill_id){
        if(this.dead){

            console.log(this.server_id + ":都他妈挂了还想咬人 ");
            // this.actions[this.actions.length] = [WebSocketOrder.FAIL_USE_SKILL,parseInt(this.server_id),skill_id];
            return false;
        }
        if(skill_id != this.skill_id && skill_id != this.attack_id){
            console.log(this.server_id + ":少年你作弊了(你没有技能" + skill_id + ")");
            return false;
        }


        //----------------------------- 如果是机器猫随机出现真实技能 在这里处理 -----------------------------------

        let reallyUseSkillId = skill_id;//
        // if(skill_id == MACHINE_CAT_SKILL_ID){
        //     reallyUseSkillId = "";
        // }

        let cd = this.cdMap[reallyUseSkillId] || (this.cdMap[reallyUseSkillId] = new Skill(reallyUseSkillId));
        if(cd.isFree()){
            this.dir = dir;
            this.currentUseSkill = reallyUseSkillId;
            cd.use();
            this.afterUseSkill(reallyUseSkillId);
            return true;
        }
        else{
            console.log("技能" + skill_id + "正在cd ");
        }

        return false;
    }

    /**
     * skill_group
     * @param skill_id
     */
    afterUseSkill(skill_id){

    }
}


class PlayerTankModel extends BaseTankModel{
    constructor(uid,data,roomModel,remainLife,total_pve_buy_num){
        super(data.tankInfo.tankId,uid,data.tankInfo.level,roomModel,TANK_TYPE.PLAYER);
        this.data = data;
        this.tankInfo = data.tankInfo;
        this.userInfo = data.userInfo;
        this.camp = data.camp;
        this.pos = data.pos;
        this.propList = data.prop;
        this.remainLife = remainLife;
        this.propUsedRecode = {};
        this.waitingForRevive = false;

        this.bornDir = gameConfig.module[roomModel.fightType][this.camp == 1?"tank_face1":"tank_face2"];

        //[tank.WebSocketOrder.CREATE_TANK,server_id,dir,camp,tank_id,level,pos]
        this.currentReviveNeedTime = 10;

        this.isBuyLifing = false;
        this.total_pve_buy_num = total_pve_buy_num;
        this.has_buy_lift_num = 0;

        //this.currentUsingForwardSkilltime = 0;

        this.hasUnLockMap = new Map();

        this.totalHp = this.hp = this.tankInfo.hp;
        this.configSpeed = this.speed = this.tankInfo.speed;


        this.playerCMDIndex = 0;
    }

    unLockTank(tag){
        if(!this.hasUnLockMap.has(tag)){
            this.hasUnLockMap.set(tag,true);
            return true;
        }

        return false;
    }

    can_buy_life(){
        return this.has_buy_lift_num < this.total_pve_buy_num;
    }

    /**
     *
     * @returns {boolean}
     */
    longDead(){
        return this.dead && !this.can_buy_life();
    }

    deadHandle(){
        this.currentReviveNeedTime = this.roomModel.reviveTime();
        this.revive();
    }

    getActions(){
        return this.actions;

    }

    // useSkill(dir,skill_id){
    //     if(this.currentUsingForwardSkilltime > 0)return false;
    //     return super.useSkill(dir,skill_id);
    // }
    //
    // /**
    //  * skill_group
    //  * @param skill_id
    //  */
    // afterUseSkill(skill_id){
    //     if(skill_id == 7077){
    //         let config = gameConfig.skill["2026"];
    //         let time = config.distance / config.speed;
    //         this.currentUsingForwardSkilltime = time * 1000;
    //     }
    // }

    clearActions(){
        this.actions.length = 0;
    }

    update(dt){
        super.update(dt);
        if(this.waitingForRevive){
            this.reviveWaitTime += dt;
            if(this.reviveWaitTime > this.currentReviveNeedTime){
                this.hp = this.totalHp;
                this.dead = false;
                console.log(this.server_id + ": revive successfully time " + Date.now());
                this.waitingForRevive = false;

                this.actions[this.actions.length] = [WebSocketOrder.CREATE_TANK,parseInt(this.server_id),
                    this.bornDir,this.camp,this.tank_id,this.tankInfo.level,this.pos,this.data.ai];
            }
        }

        // if(this.currentUsingForwardSkilltime > 0){
        //     this.currentUsingForwardSkilltime -= dt;
        //     if(this.currentUsingForwardSkilltime <= 0){
        //         this.actions[this.actions] = [WebSocketOrder.FORWARD_COMPLETE,this.server_id];
        //     }
        // }
    }

    revive(){
        if(this.dead && !this.waitingForRevive && this.remainLife > 0){
            this.reviveWaitTime = 0;
            this.waitingForRevive = true;
            console.log(this.server_id + ": start to revive  time " + Date.now());
            return true;
        }

        return false;
    }

    /**
     * pve买命
     */
    buyLife(){
        this.remainLife++;
        this.reviveWaitTime = 0;
        this.currentReviveNeedTime = 0;
        this.waitingForRevive = true;
        this.has_buy_lift_num++;
    }

    /**
     * pvp 立即复活
     */
    immeRevive(){
        this.reviveWaitTime = 0;
        this.currentReviveNeedTime = 0;
        this.waitingForRevive = true;
    }
    /**
     * 请求使用道具 这里要判定一下是否有此道具 并且道具不在cd中
     * @param prop_id
     * @param time 请求时间
     * @returns {boolean}
     */
    useProp(prop_id){

        if(this.dead && this.remainLife <=0){
            console.log(this.server_id + ":少年你作弊了(你他妈的都没命了)");
            return false;
        }
        // else{
        //     console.log(this.server_id + ": dead = " + this.dead + " , lives = " + this.remainLife);
        // }

        if(this.propList[prop_id]){
            let cd = this.cdMap[prop_id] || (this.cdMap[prop_id] = new PropSkill(prop_id,this.propList[prop_id],this.roomModel.fightType));
            if(cd.isFree()){
                cd.use();
                this.propUsedRecode[prop_id] = this.propUsedRecode[prop_id]?(this.propUsedRecode[prop_id] + 1) : 1;
                return true;
            }
            else{
                console.log("道具" + prop_id + "正在cd ");
            }

            return false;
        }
        else{
            console.log(this.server_id + ":少年你作弊了(你没有道具" + prop_id + ")");
        }

        return false;
    }
}

class MainBaseTankModel extends  BaseTankModel{

    constructor(tank_id,server_id,level,roomModel){
        super(tank_id,server_id,level,roomModel,TANK_TYPE.MAIN_BASE);
        this.camp = TANK_CAMP.BLUE;
    }
}


class AITankModel extends BaseTankModel{

    constructor(tank_id,server_id,level,roomModel){
        super(tank_id,server_id,level,roomModel,TANK_TYPE.AI);
        this.camp = TANK_CAMP.AI;

        this.deadScore = gameConfig.tank[tank_id].score;
    }

    /**
     * 自爆
     */
    selfBomb(){
        this.beHit(this.hp,"self");
    }
}

class ItemModel{
    constructor(h,v,item_id,index,roomModel){
        this.h = h;
        this.v = v;
        this.key = this.h + "_" + this.v;
        this.item_id = item_id;
        this.index = index;
        this.itemConfig = gameConfig.item_cate[gameConfig.item[this.item_id].cate_id];
        this.totalHp = this.hp = this.itemConfig.state;
        this.roomModel = roomModel;

        this.hitRect = new Rect(h * 64,v * 64,64,64);

        this.hitMyBulletList = [];

        this.command_list = [];

        this.runningTime = 0;

        if(this.itemConfig.event_type == 4){
            this.tank_trigge_config = gameConfig.tank_trigger[""+this.itemConfig.event];
            if(this.tank_trigge_config){
                this.refresh_tank_time = this.tank_trigge_config.time * 1000;
            }
        }

        this.current_refresh_num = 0;
    }

    clearCommand(){
        this.command_list.length = 0;
    }

    is_ai_event_item(){
        return this.itemConfig.event_type == 4 && this.current_refresh_num <= this.tank_trigge_config.max_turn;
    }

    beHit(isSkill,bullet_id){

        if(this.hitMyBulletList.indexOf(bullet_id) != -1)return false;
        this.hitMyBulletList[this.hitMyBulletList.length] = bullet_id;
        if(!isSkill && this.itemConfig.bullet_destroy == 0 ||
            isSkill && this.itemConfig.skill_destroy == 0){
            return true;
        }
        let blood = isSkill ? this.totalHp : 1;
        this.hp -= blood;
        //console.log("-----item " + this.key  + " , reduce blood = " + blood + " , remain = " + this.hp + " , total = " + this.totalHp);
        if(this.hp <= 0){
            let model = this.roomModel.itemMap.get(this.key);
            this.roomModel.itemMap.delete(this.key);
            //console.log("item " + this.key  + " , be destoryed blood = " + blood);
            if(this.itemConfig.event_trigger > 0){
                this.roomModel.itemEvent(this.index);
            }
        }

        return true;
    }

    update(dt){
        //SERVER_CONST.ITEM_CREATE_AI
        //[21,server_id,tank_id,index,dir]
        this.runningTime += dt;
        if(this.runningTime > this.refresh_tank_time){
            this.runningTime -= this.refresh_tank_time;
            this.current_refresh_num++;
            //create
            for(let i = 0,data = null; i < this.tank_trigge_config.tank_num;i++){
                data = [WebSocketOrder.ITEM_CREATE_AI,this.roomModel.getAIServerID(),
                    this.getDropTAnkID(),this.index,
                    this.tank_trigge_config.tank_face];
                this.command_list[this.command_list.length] = data;
                this.roomModel.create_random_ai_tank(data);
            }
            
        }
    }

    //10008:50|10007:50
    getDropTAnkID(){
        var tank_id = -1;
        var v = Math.floor(Math.random() * 100);
        var list = this.tank_trigge_config.content;
        for (var i = 0, cur = 0, len = list.length; i < len; i++) {
            cur += list[i][1];
            if(cur > v){
                tank_id = list[i][0];
                break;
            }
        }

        return tank_id;
    }
}


/**
 * 房间模型
 */
class RoomModel{
    constructor(rid){
        this.rid = rid;
        this.mapData = null;
        this.tankMap = new Map();
        this.itemMap = new Map();

        this.mapSize = {
            width : 13,
            height  : 10
        };

        this.currentAISeg = 0;
        this.totalAISeg = 0;
        this.seqList = [];

        this.roomDataReady = false;
        
        this.fightData = null;

        this.currentAICount = 0;

        /**
         * 当前波次ai死光了
         * @type {boolean}
         */
        this.allAIDead = false;

        /**
         * 主基地被干了
         * @type {boolean}
         */
        this.isMainBaseDead = false;

        /**
         * 已经爆炸了的地表元素
         * @type {Array}
         */
        this.itemBombedList = [];

        /**
         * 已经请求处理了的地表爆炸
         * @type {Array}
         */
        this.hasReqItemBombMap = new Map();


        this.pvePos1List = [];
        this.pvePos2List = [];
        this.pvpRedPosList = [];
        this.pvpBluePosList = [];


        this.buffRandom = new Random();

        /**
         * 伤害记录
         * @type {Map}
         */
        this.bloodRecode = new Map();

        this.killRecode = new Map();

        this.killScore = new Map();

        this.deadTimeMap = new Map();
        this.killTimeMap = new Map();

        /**
         * 杀死了ai记录
         * @type {Map}
         */
        this.AIKillRecode = new Map();

        this.deadSet = new Set();

        this.livePlayerCount = 0;

        this.player_relive_wait = 0;

        this.player_relive_need = null;

        this.player_relive_need_list = null;

        this.runningTime = 0;

        this.fightStyle = "pve";

        //等玩家买命
        this.waitingBuyLifeMap = new Map();

        this.create_ai_index = 0;

        /**
         * 随机坦克
         * @type {Map}
         */
        this.random_ai_tank_map = new Map();


        this.pvp_score_kill = gameConfig.config["scoreKill"].value;
        this.pvp_score_dead = gameConfig.config["scoreDead"].value;
        this.pvp_score_help = gameConfig.config["scoreHelp"].value;

    }

    clear(){
        this.tankMap.clear();
        this.tankMap = null;

        this.itemMap.clear();
        this.itemMap = null;

        this.mapSize = null;
        this.seqList = null;
        this.itemBombedList = null;

        this.hasReqItemBombMap.clear();
        this.hasReqItemBombMap = null;

        this.pvePos1List = null;
        this.pvePos2List = null;
        this.pvpRedPosList = null;
        this.pvpBluePosList = null;

        this.buffRandom = null;

        /**
         * 伤害记录
         * @type {Map}
         */
        this.bloodRecode.clear();
        this.bloodRecode = null;

        this.killRecode.clear();
        this.killRecode = null;

        this.killScore.clear();
        this.killScore = null;

        this.deadTimeMap.clear();
        this.deadTimeMap = null;

        this.killTimeMap.clear();
        this.killTimeMap = null;

        this.AIKillRecode.clear();
        this.AIKillRecode = null;

        this.deadSet.clear();
        this.deadSet = null;

        this.waitingBuyLifeMap.clear();
        this.waitingBuyLifeMap = null;

        this.random_ai_tank_map.clear();
        this.random_ai_tank_map = null;
    }

    getAIServerID(){
        return C_AI + this.create_ai_index++;
    }


    reviveTime(){
        // return this.fightStyle == "pve"?2000:10000;
        return this.player_relive_wait;
    }


    /**
     * 获取服务器主动推送给玩家的信息（玩家复活相关）
     */
    getActions(){
        let ret = [];
        for(let [key , tankModel] of this.tankMap){
            if(tankModel.type == TANK_TYPE.PLAYER){
                 let l = tankModel.getActions();
                 if(l.length > 0){
                     // ret.splice.apply(ret,ret.length - 1,0,l);
                     ret.merge(l);
                     tankModel.clearActions();
                 }

            }
        }

        /**
         * 生成AI代码
         */
        for(let [key ,itemModel] of this.itemMap){
            if(itemModel.is_ai_event_item()){
                let l = itemModel.command_list;
                if(l.length > 0){
                    ret.merge(l);
                    console.log("meger ai command " + JSON.stringify(l));
                    itemModel.clearCommand();
                }
            }
        }

        return ret;
    }

    update(dt){
        for(let [key,model] of this.tankMap){
            model.update(dt);
        }

        for(let [key ,itemModel] of this.itemMap){
            itemModel.update(dt);
        }

        for(let [key,time] of this.waitingBuyLifeMap){
           time -= dt;
           if(time < 0){
               this.livePlayerCount--;
               this.waitingBuyLifeMap.delete(key);
           }
           else{
               this.waitingBuyLifeMap.set(key,time);
           }

        }

        this.runningTime += dt;
    }

    drop_buy_life(server_id){
        if(this.waitingBuyLifeMap.has(server_id)){
            this.waitingBuyLifeMap.set(server_id,-1);
        }
    }

    syncAction(list){
        let tankModel = null;
        for(let data of list){
            switch (data[0]){
                case WebSocketOrder.TURN_AROUND:
                    tankModel = this.tankMap.get(data[1]);
                    !tankModel && console.log("can not find tank " + JSON.stringify(data));
                    tankModel && tankModel.turnAround(data[2]);
                    break;
                case WebSocketOrder.MOVE:
                    tankModel = this.tankMap.get(data[1]);
                    !tankModel && console.log("can not find tank " + JSON.stringify(data));
                    tankModel && tankModel.move(data[2]);
                    break;
                // case WebSocketOrder.LAUNCHBULLET:
                //     tankModel = this.tankMap[data[1]];
                //     !tankModel && console.log("can not find tank " + JSON.stringify(data));
                //     tankModel && tankModel.launch(data[2],data[3]);
                    break;
            }
        }
    }

    initMapItemElement(){
        let key = null;
        let itemModel = null;
        for (var i = 0,h,v, id,len = this.mapData.mapInfo.length; i < len; i++) {
            id = this.mapData.mapInfo[i];
            if(id != 0){
                h = i % this.mapSize.width; // x
                v = Math.floor(i / this.mapSize.width); // y
                key = h + "_" + v;
                itemModel = new ItemModel(h,v,id,i,this);
                this.itemMap.set(key,itemModel);


                switch (id){
                    case "50":{
                        let server_id = "born" + i;
                        let model = new MainBaseTankModel(19999,server_id,1,this);
                        this.tankMap.set(server_id,model);
                        model.initStatus(h * 64,v * 64,4);
                    }break;
                    case "51":{
                        this.pvePos1List.push(i);
                    }break;

                    case "52":{
                        this.pvePos2List.push(i);
                    }break;

                    case "60":{
                        this.pvpBluePosList.push(i);
                    }break;

                    case "61":{
                        this.pvpRedPosList.push(i);
                    }break;
                }

            }
        }
    }

    /**
     *
     * @param tankModel
     * @param bywho 凶手
     */
    tankDead(tankModel,bywho){
        let tag = tankModel.getRecoredTag();
        this.deadSet.add(tag);
        if(tankModel.joinDeadRecode){
            getFromMap(this.killRecode,bywho,()=>[]).push(tag);
            getFromMap(this.killScore,bywho,()=>[]).push(this.totalGameTime - this.runningTime);

            this.deadTimeMap.set(tankModel.server_id,this.runningTime);
            getFromMap(this.killTimeMap,""+bywho,()=>[]).push(this.runningTime);
            getFromMap(this.killTimeMap,""+tankModel.server_id,()=>[]).push(0);
        }

        //killTimeMap

        switch (tankModel.type){
            case TANK_TYPE.AI:
                this.tankMap.delete(tankModel.server_id);
                //console.log("tank " + tankModel.server_id + " dead" +  " , currentAICount = " + this.currentAICount);
                if(this.random_ai_tank_map.has(tankModel.server_id)){
                    this.random_ai_tank_map.delete(tankModel.server_id);
                }
                else{
                    getFromMap(this.AIKillRecode,bywho,()=>[]).push(tankModel.deadScore);
                    this.currentAICount--;
                    if(this.currentAICount == 0){
                        // this.currentAISeg++;
                        this.createAITank(this.currentAISeg);
                    }
                }

            break;
            case TANK_TYPE.PLAYER:
                if(tankModel.remainLife == 0){
                    //玩家坦克复活失败，就是没命了
                    if(this.fightType == 1){//试玩
                        this.livePlayerCount--;
                    }
                    else{
                        if(tankModel.can_buy_life()){
                            this.waitingBuyLifeMap.set(parseInt(tankModel.server_id),10500);
                        }
                        else{
                            this.livePlayerCount--;
                        }
                    }

                    // this.livePlayerCount--;
                    // if(this.livePlayerCount == 0){
                    //
                    // }
                }

                // console.log("tank " + tankModel.server_id + " dead" +  " , deadTimes = " + tankModel.deadTimes
                // + " , lives = " + tankModel.remainLife + " , isdead = " + tankModel.dead);
            break;
            case TANK_TYPE.MAIN_BASE:
                this.isMainBaseDead = true;

            break;
        }

    }

    /**
     * 玩家复活
     * @param server_id
     */
    revivePlayer(server_id){
        let tankModel = this.tankMap.get(server_id);
        //return tankModel && tankModel.revive();
        tankModel && tankModel.revive();
        return false;
    }

    /**
     * 买命
     * @param server_id
     */
    pveBuyLife(server_id){
        if(this.waitingBuyLifeMap.has(server_id)){
            let tankModel = this.tankMap.get(server_id);
            if(tankModel && !tankModel.isBuyLifing){
                tankModel.isBuyLifing = true;
                dbBattle.battleRevive(this.rid,server_id).then((res) => {
                    if(res){
                        console.log(server_id + " buy life successfully " + JSON.stringify(res));
                        tankModel.buyLife();
                        this.waitingBuyLifeMap.delete(server_id);
                        tankModel.isBuyLifing = false;
                    }
                    else{
                        console.log(server_id + " buy life fail because  " + JSON.stringify(res));
                        this.waitingBuyLifeMap.set(server_id,1);
                    }
                });
            }

        }

        return false;
    }

    /**
     * 
     */
    pvpImmeRevive (server_id){
        let tankModel = this.tankMap.get(server_id);
        if(tankModel && tankModel.dead){
            if(!tankModel.isBuyLifing){
                tankModel.isBuyLifing = true;
                dbBattle.battleRevive(this.rid,server_id).then((res) => {
                    if(res){
                        tankModel.immeRevive();
                        tankModel.isBuyLifing = false;
                    }
                });
            }
        }

        return false;
    }

    /**
     * 创建随机坦克
     * data [21,server_id,tank_id,index,dir]
     */
    create_random_ai_tank(data){
        //tank_id,server_id,level,roomModel
        let model = new AITankModel(data[2],data[1],1,this);
        model.joinDeadRecode = false;
        let index = data[3];
        model.initStatus((index % 13) * 64,(Math.floor(index / 13)) * 64,2);
        this.tankMap.set(data[1],model);
        this.random_ai_tank_map.set(data[1],model);
    }

    /**
     * 场上是否还有随机生成的坦克
     */
    hasRandomAITank(){
        return this.random_ai_tank_map.size > 0;
    }

    createAITank(seq){
        if(this.currentAISeg >= this.totalAISeg) {
            this.allAIDead = true;
            //console.log("------------- all ai dead----");
            return;
        }
        
        // let AIData = this.mapData.batchInfo["p" + this.currentAISeg];

        let AIData = this.seqList[seq];
        if(!AIData){
            this.createAITank(seq + 1);
            return;
        }

        //console.log("------ create AI------ " + JSON.stringify(AIData));

        for(let p in AIData){
            let server_id = p + "_" + this.currentAISeg;
            let model = new AITankModel(AIData[p],server_id,1,this);
            let index = parseInt(p);
            model.initStatus((index % 13) * 64,(Math.floor(index / 13)) * 64,2);

            this.tankMap.set(server_id,model);
            this.currentAICount++;
        }

        this.currentAISeg++;
    }

    createPlayerTank(){
        //console.log("---createPlayer----");
        let list = this.fightData.userList;
        let index = -1;
        for(let key in list){
            let model = new PlayerTankModel(key,list[key],this,this.player_tank_alives,this.player_relive_need_list.length);
            this.tankMap.set(parseInt(key),model);
            if(list[key].pos == 0){
                index = this.pvePos1List[0];
            }
            else{
                index = this.pvePos2List[0];
            }
            model.initStatus((index % 13) * 64,(Math.floor(index / 13)) * 64,4);

            this.livePlayerCount++;
        }
    }

    hasValidCMDIndex(uid,index){
        if(this.tankMap.has(uid)){
            let tank = this.tankMap.get(uid);
            if(tank.playerCMDIndex < index){
                tank.playerCMDIndex = index;
                return 1;
            }
            else{
                return 0;
            }
        }

        return -1;
    }

    valid_player(uid){
        return true;
        return this.fightData.userList.hasOwnProperty(uid);
    }

    /**
     *
     * @param data {roomInfo,mapInfo,userList}
     */
    initFightData(data){
        this.fightData = data;
        /**
         * {"batchInfo":{"p1":{"8":"10001","18":"10001","48":"10001","68":"10001","88":"10001","118":"10001","128":"10001"}},
         * "mapInfo":[0,0,0,0,"35",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,"35","35","35",0,"35","35","35","35",0,0,0,0,0,0,"35","35","35","35",0,"51",0,0,0,0,0,0,0,0,0,"35","35","35","35",0,"35","35","35","35",0,"50",0,0,"35",0,0,0,0,0,0,"35","35","35","35",0,"35","35","35","35",0,"52",0,0,0,0,0,0,0,0,0,0,0,0,0,0,"35","35","35","35",0,0,"35","35","35",0,"35","35","35","35",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,"35",0,0,0,0,0],
         * "mapType":null,"mapId":2,"styleId":"5","mapName":""}
         */
        this.mapData = __transformMapData__(JSON.parse(new Buffer(data.mapInfo.content,"base64").toString()));


        this.fightType = data.roomInfo.type;

        this.mapConfig = gameConfig.module[this.fightType];
        this.totalGameTime = this.mapConfig.pass_time * 1000;

        if(this.mapConfig.tank_lives > 0){
            this.player_tank_alives = this.mapConfig.tank_lives;
        }
        else{
            this.player_tank_alives = 1000;
            this.fightStyle = "pvp";
        }


        this.player_relive_wait = this.mapConfig.relive_wait > 0 ? (this.mapConfig.relive_wait * 1000) :  100;
        // this.player_relive_wait = this.mapConfig.relive_wait * 1000;
        this.player_relive_need = this.mapConfig.relive_need;
        this.player_relive_need_list = (""+this.player_relive_need).split("|");

        this.initMapItemElement();

        for(let key in this.mapData.batchInfo){
            let pData = this.mapData.batchInfo[key];
            if(pData.getSize() > 0){
                this.seqList[this.seqList.length] = pData;
                this.totalAISeg++;
            }
            else{
                this.seqList[this.seqList.length] = null;
            }
        }

        this.checkCreateAITank();

        this.createPlayerTank();

        this.roomDataReady = true;
    }

    checkCreateAITank(){
        this.totalAISeg > 0 && this.fightStyle == "pve" && this.createAITank(this.currentAISeg);
    }

    //ret.atk_server_id,ret.beAtkServer_id,ret.blood,ret.bounceBlood,ret.buff_id,ret.skillType,uid
    hitTank(data){
        // console.log("hit --- " + JSON.stringify(data));
        let beModel = this.tankMap.get(data[2]);
        let ret = beModel && beModel.beHit(data[3],data[1],data[7]);
        if(ret){
            let attackTankModel = this.tankMap.get(data[1]);
            attackTankModel && data[4] > 0  && attackTankModel.beHit(data[4],data[2]);
            data[5] > 0 && beModel.addBuff(data[5]);
        }

        return ret;

        // let attackTankModel = this.tankMap.get(data[1]);
        // attackTankModel && data[4] > 0  && attackTankModel.beHit(data[4]);
        //
        // let beAttackTankModel = this.tankMap.get(data[2]);
        // if(beAttackTankModel && !beAttackTankModel.dead){
        //     beAttackTankModel.beHit(data[3],data[1]);
        //     if(data[5] > 0){
        //         beAttackTankModel.addBuff(data[5]);
        //     }
        //
        //     return true;
        // }
        //
        // return false;
    }


    hitMainBase(data){
        let mainBase = this.tankMap.get(data[2]);
        if(mainBase){
            // if(mainBase.validBullet(data[7])){
            //     mainBase.putBulletId(data[7]);
            //     return this.hitTank(data);
            // }

            return this.hitTank(data);
        }

        return false;
    }


    //ret.atk_server_id,ret.beAtkServer_id,ret.blood,ret.bounceBlood,ret.buff_id,ret.skillType,itemIndex
    itemBombHitTank(data){
        let bombIndex = data[7];
        //服务器计算地表还没被打爆
        if(this.itemBombedList.indexOf(bombIndex) == -1){
            return false;
        }

        // let list = this.hasReqItemBombMap[data[2]] || (this.hasReqItemBombMap[data[2]] = []);
        let list = getFromMap(this.hasReqItemBombMap,data[2],()=>[]);
        if(list.indexOf(bombIndex) == -1){
            list[list.length] = bombIndex;
            return this.hitTank(data);
        }

        return false;
    }


    //bulletModel.id, gameConfig.skill_group[bulletModel.skill_config.group_id].type,
    //mapItemModel.mapKey(),bulletModel.is_ai_create?1:0
    hitItem(data){
        let itemModel = this.itemMap.get(data[3]);
        if(itemModel){
            return itemModel.beHit(data[2] == 2,data[1]);
        }
        return false;
    }

    //itemIndex,item_server_id
    itemBomHitItem(data){
        let itemModel = this.itemMap.get(data[2]);
        if(itemModel){
            return itemModel.beHit(true,data[1]);
        }
        return false;
    }


    //tank.RoomModel.myServerTankId,this.delegate.model.dir,this.skill_id
    launchBullet(data){
        let skillList = gameConfig.skill_group[data[3]].skill;

        for(let action of skillList){
            let type = gameConfig.skill[action[1]].move_type;
            if(type == 4){
                let tankModel = this.tankMap.get(data[1]);
                tankModel && tankModel.selfBomb();
            }
        }
    }

    bulletBomb(data){
        let tankModel = this.tankMap.get(data[3]);
        if(tankModel){
            tankModel.selfBomb();
            return true;
        }

        return false;
    }

    /***
     * 控制坦克移动
     * @param server_id
     * @returns {*}
     */
    controlTankMove(data){
        let useTankModel = this.tankMap.get(data[1]);
        if(!useTankModel){
           // console.log("controlTankMove can not find the player with " + data[1]);
        }
        else if(useTankModel.dead){
            //console.log("player " + data[1] + " is dead");
        }
        let ret = useTankModel && !useTankModel.dead;
        // if(!ret)
        //     console.log("controlTankMove fail so ignore move action");
        return ret;
    }

    /**
     *  使用技能
     * @param data tank.RoomModel.myServerTankId,this.delegate.model.dir,this.skill_id
     */
    useSkill(data){
        let useTankModel = this.tankMap.get(data[1]);
        // if(!useTankModel){
        //     console.log("useSkill can not find the player with " + data[1]);
        // }
        return useTankModel && useTankModel.useSkill(data[2],data[3]);
    }

    unLockTank(data){
        let useTankModel = this.tankMap.get(data[1]);
        if(useTankModel){
            return useTankModel.unLockTank(data[2]);
        }

        return false;
    }

    /**
     * 使用道具
     * @param data prop_id,prop_skill_id,tank.RoomModel.myServerTankId,tank.RoomModel.myCamp
     */
    useProp(data){

        let useTankModel = this.tankMap.get(data[3]);
        // if(!useTankModel){
        //     console.log("useProp can not find player with " + data[3]);
        // }
        return useTankModel && useTankModel.useProp(data[1]);//国为其它的不是服务器算，如果这个服务器算的话 唯一不好确定的是随机数同步（不确定客户用了几次），原则上客户自己算就可以了，省流量 省事

        let propConfig = gameConfig.skill_prop[data[2]];
        if(propConfig){
            for(let type of propConfig.target){
                switch (type){
                    case 1:
                        this.propHitTank(data[2],useTankModel,useTankModel);
                        break;

                    case 2:
                        for(let [_,tankModel] of this.tankMap){
                            tankModel && tankModel.camp != data[4] && this.propHitTank(data[2],useTankModel,tankModel);
                        }
                        break;

                    case 3:
                        for(let [_,tankModel] of this.tankMap){
                            tankModel && tankModel.camp == data[4] &&
                            tankModel.type == TANK_TYPE.PLAYER && this.propHitTank(data[2],useTankModel,tankModel);
                        }
                        break;
                    case 5:
                        for(let [_,tankModel] of this.tankMap){
                            tankModel && tankModel.camp == data[4] &&
                            tankModel.type == TANK_TYPE.MAIN_BASE && this.propHitTank(data[2],useTankModel,tankModel);
                        }
                        break;
                }

                return true;
            }
        }
        // else{
        //     console.log("can not find propskill config with " + data[2]);
        // }

        return false;

    }
    //暂时没用到
    propHitTank(prop_skill_id,attackModel,beAttackModel){
        let config = gameConfig.skill_prop[prop_skill_id];
        let list = config.value;
        let blood  = list[1];

        if(attackModel){
            if(attackModel.buffProp.addAtk > 0){
                blood *= (1 + attackModel.buffProp.addAtk);
            }

            if(attackModel.buffProp.reduceAtk > 0){
                blood *= (1 - attackModel.buffProp.reduceAtk);
            }
        }

        if(config.have_treat == 1){
            blood *= -1;
        }
        else if(config.have_damage == 1){

            if(!beAttackModel.buffProp.isSuperTank){
                //计算buff减成
                if(beAttackModel.buffProp.holdDamage > 0){
                    beAttackModel.buffProp.holdDamage--;
                }
                else{
                    if(beAttackModel.buffProp.reduceDamage > 0){
                        blood *= (1 - beAttackModel.buffProp.reduceDamage);
                    }

                }
            }
        }

        blood > 0 && beAttackModel.beHit(blood,attackModel.server_id);

        if(config.buff_id != 0 && config.have_buff == 1){

            if(this.buffRandom.random(0,100) < config.buff_pro){
                //
                beAttackModel.addBuff(config.buff_id);
            }
        }
    }
    
    itemEvent(index){
        this.itemBombedList[this.itemBombedList.length] = index;
    }

   //------------------------------------ recode blood and dead -----------------------------
    /**
     * 谁打了谁
     * @param from
     * @param to
     */
   recodeHurt(from,to,blood){
        getFromMap(this.bloodRecode,from,()=>new Set()).add(to);
   }

   getplayerPropUse(uid){
        if(this.tankMap.has(uid)){
            return this.tankMap.get(uid).propUsedRecode;
        }
        return {};
   }


   stillHasPlayer(uid){
        var ret = false;
        for(let [key,model] of this.tankMap){
            if(key != uid && model.longDead && !model.longDead()){
                ret = true;
                break;
            }
        }

        return ret;
   }


    player_quit_room(uid){
       if(this.tankMap.has(uid)){
           this.tankMap.delete(uid);
           //this.livePlayerCount--;
       }
   }

   showFightRecode(){
       let ret = {};
       let toClient = {};

       let f_type = parseInt(this.fightType);

       for(let [key,model] of this.tankMap){
           if(model.type == TANK_TYPE.PLAYER){
               let data = {};
               data.prop = f_type == 1?{} : model.propUsedRecode;
               if(f_type == 5 || f_type == 6 || f_type == 8){
                   let killList  = this.killRecode.get(key);
                   data.kill = killList?killList.length:0;
                   data.killScore = (list=>(list = this.killScore.get(key))?list.reduce((a,b)=>a+b):0)([]);
                   data.deadTime = this.deadTimeMap.get(""+key) || 0;
                   let set = this.bloodRecode.get(key);
                   data.help = set?( ()=>{
                       let ret = [];
                       for(let id of set.values()){
                           killList && killList.indexOf(id) == -1  && this.deadSet.has(id) && ret.push(id);
                       }
                       return ret.length;
                   })() : 0;
                   data.killInfo = this.getKillInfo(""+key);
                   data.dead = model.deadTimes;
               }

               data.camp = model.camp;
               data.tankId = model.tank_id;
               data.level = model.userInfo.level;
               //data.name = model.userInfo.name;
               data.ai = model.data.ai;
               data.uid = key;
               this.getScore(data,f_type);
               (ret[model.camp] = ret[model.camp] || []).push(data);

               let data_client = {
                   kill : data.kill,
                   killScore : data.killScore,
                   tankId : data.tankId,
                   help : data.help,
                   dead : data.dead,
                   camp : data.camp,
                   level : data.level,
                   // ai : data.ai,
                   uid : data.uid,
                   score : data.score,
               };

               (toClient[model.camp] = toClient[model.camp] || []).push(data_client);

           }
       }
       return [ret,toClient];
   }


   getKillInfo(uid){
        if(this.killTimeMap.has(uid)){
            let list = this.killTimeMap.get(uid);
            let max_num = 0;
            let current_num = 0;
            for(let i = 0,len = list.length; i < len;i++){
                if(list[i] == 0){
                    if(current_num > max_num){
                        max_num = current_num;
                    }
                    current_num = 0;
                }
                else{
                    current_num++;
                }
            }

            return max_num;
        }
        return 0;
   }


   getScore(data,f_type){
        switch (f_type){
            case 1:
            case 2:
            case 3:
            case 4:
            case 7:
                data.score = (list=>(list = this.AIKillRecode.get(data.uid))?list.reduce((a,b)=>a+b):0)([]);
            break;
            case 5:
            case 6:
            case 8:
                data.score = Math.max(2.0,Math.min(25.0,parseFloat(( (this.pvp_score_kill * data.kill + data.help * this.pvp_score_help) / Math.sqrt((data.dead || 1) * this.pvp_score_dead) ).toFixed(1)) ));
            break;
        }
   }
}

module.exports.RoomModel = RoomModel;
