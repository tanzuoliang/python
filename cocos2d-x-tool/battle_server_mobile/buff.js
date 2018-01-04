/**
 * Created by tanzuoliang on 17/2/22.
 */

const gameConfig = require("./gameConfig").gameConfig;

class BaseBuff{
    constructor(buff_id,model){
        this.buff_id = buff_id;
        this.model = model;
        this.dir = model.dir;
        // this.x = model.x;
        // this.y = model.y;
        this.key = "";
        this.isComplete = false;
        this.runnintTime = 0;
        this.buffConfig = gameConfig.buff[buff_id];
        this.do();
    }

    update (dt) {

        this.runnintTime += dt;
        if(this.runnintTime >= this.buffConfig.time){
            this.complete();
        }
    }


    complete (){
        this.undo();
        delete this.model.buffMap[this.key];
    }

    undo() {

    }

    do  () {

    }

    isRejectOthterBuffType (buff_type) {
        return this.buffConfig.buff_reject.indexOf(buff_type) != -1;
    }

    isReplaceOtherBuffType  (buff_type) {
        return this.buffConfig.buff_replace.indexOf(buff_type) != -1;
    }
}

class ReduceSpeedBuff extends BaseBuff{
    constructor(buff_id,model){
        super(buff_id,model);
    }

    undo  () {
        this.model.buffSpeed(this.buffConfig.value[1] * 0.01);
    }

    do () {
        this.model.buffSpeed(-this.buffConfig.value[1] * 0.01);
    }
}


class StunBuff extends BaseBuff{
    constructor(buff_id,model){
        super(buff_id,model);
    }

    undo () {
        this.model.buffProp.isStun = false;
    }

    do () {
        this.model.buffProp.isStun = true;
    }
}

class ReboundDamageBuff extends BaseBuff{
    constructor(buff_id,model){
        super(buff_id,model);
    }

    undo () {
        this.model.buffProp.bounceDamage = 0;
    }

    do () {
        this.model.buffProp.bounceDamage = this.buffConfig.value[1] * 0.01;
    }
}


class AddAtkBuff extends BaseBuff{
    constructor(buff_id,model){
        super(buff_id,model);
    }

    undo () {
        this.model.buffProp.addAtk = 0;
    }

    do () {
        this.model.buffProp.addAtk = this.buffConfig.value[1] * 0.01;
    }
}


class ReduceDamageBuff extends BaseBuff{
    constructor(buff_id,model){
        super(buff_id,model);
    }

    undo () {
        this.model.buffProp.reduceDamage = 0;
    }

    do () {
        this.model.buffProp.reduceDamage = this.buffConfig.value[1] * 0.01;
    }
}

class HoldDamageBuff extends BaseBuff{
    constructor(buff_id,model){
        super(buff_id,model);
    }

    undo () {
        this.model.buffProp.holdDamage = 0;
    }

    do () {
        this.model.buffProp.holdDamage = this.buffConfig.value[1];
    }
    update(dt){
        if(this.model.buffProp.holdDamage <= 0){
            this.complete();
        }
    }
}

class ReduceAtkBuff extends BaseBuff{
    constructor(buff_id,model){
        super(buff_id,model);
    }

    undo () {
        this.model.buffProp.reduceAtk = 0;
    }

    do () {
        this.model.buffProp.reduceAtk = this.buffConfig.value[1] * 0.01;
    }
}


class SuperTankBuff extends BaseBuff{
    constructor(buff_id,model){
        super(buff_id,model);
    }

    undo () {
        this.model.buffProp.isSuperTank = false;
    }

    do () {
        this.model.buffProp.isSuperTank = true;
    }
}

class AddSpeed extends BaseBuff{
    constructor(buff_id,model){
        super(buff_id,model);
    }

    undo () {
        this.model.buffSpeed(-this.buffConfig.value[1] * 0.01);
    }

    do () {
        this.model.buffSpeed(this.buffConfig.value[1] * 0.01);
    }
}

const BUFF_TYPE = {
    REDUCE_SPEED    : 1,
    STUN            : 2,
    REBOUND_DAMAGE  : 3,
    ADD_ATK         : 4,
    REDUCE_DAMAGE   : 5,
    HOLD_DAMAGE     : 6,
    REDUCE_ATK      : 7,
    SUPER_TANK      : 8,
    ADD_SPEED       : 9
};



let buffIndex = 0;

function buffFactory(type,buff_id,model){
    var buffClass = null;
    //类型:1攻击减少,2减速,3所受伤害减少,4晕眩,5伤害增加2点,6不能移动,7抵挡数次伤害
    switch (type){
        case BUFF_TYPE.REDUCE_SPEED:{
            buffClass = ReduceSpeedBuff;
        }break;

        case BUFF_TYPE.STUN:{
            buffClass = StunBuff;
        }break;

        case BUFF_TYPE.REBOUND_DAMAGE:{
            buffClass = ReboundDamageBuff;
        }break;

        case BUFF_TYPE.ADD_ATK:{
            buffClass = AddAtkBuff
        }break;

        case BUFF_TYPE.REDUCE_DAMAGE:{
            buffClass = ReduceDamageBuff;
        }break;

        case BUFF_TYPE.HOLD_DAMAGE:{
            buffClass = HoldDamageBuff;
        }break;

        case BUFF_TYPE.REDUCE_ATK:{
            buffClass = ReduceAtkBuff;
        }break;

        case BUFF_TYPE.SUPER_TANK:{
            buffClass = SuperTankBuff;
        }break;

        case BUFF_TYPE.ADD_SPEED:{
            buffClass = AddSpeed;
        }break;

    }

    if(buffClass){
        let buffModel = new buffClass(buff_id,model);
        buffModel.key = model.server_id + "_" + buff_id + "_" + buffIndex++;
        return buffModel;
    }

    return null;
}


module.exports.BuffFactory = buffFactory;
