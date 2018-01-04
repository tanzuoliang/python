'use strict'

const gameConfig = require("./gameConfig").gameConfig;

const WebSocketOrder = require("./const").WebSocketOrder;

const getFromMap = require("./utils").getFromMap;

/**
	主要用来存储坦克命令数据
**/
class Tank{
	
	constructor(uid){
		this.uid = uid;
		//动作列表
		this.actionList = [];
		//指令列表
		this.orderList = [];
		//
		this.usingBombSkill = false;
		//是否已经存了移动和转向指令
		this.sortMoveActionIndex = -1;
		
		this.sortTurnActionIndex = -1;
		
		//是否中了炫晕类似的buff
		this.isStun = false;
		
		this.hasBomb = false;

		this.keep_last_ignore_move_cmd = null;

		this.rttData = null;

		this.hasMoveCMD = false;
	}
	
	updateBlood(v){
		this.hp -= v;
		if(this.hp <= 0){
			this.dead = true;
		}
	}
	
	//删除转向指令
	removeTurnAvtion(){
		if(this.sortTurnActionIndex > -1){
			this.actionList.splice(this.sortTurnActionIndex,1);
			this.sortTurnActionIndex = -1;
		}

		return true;
	}
	
	//删除移动指令
	removeMoveAction(){
		if(this.sortMoveActionIndex > -1){
			// this.actionList.splice(this.sortMoveActionIndex,1);
			//this.sortMoveActionIndex = -1;
			console.log("removeMoveAction ");

			this.actionList[this.sortMoveActionIndex][0] = WebSocketOrder.TURN_AROUND;
		}

		return true;
	}
	
	//添加新的指令
	addAction(action){
		//console.log("----tankAddAction " + JSON.stringify(action));
		let type = action[0];
		//当前如果收到了炫晕指令其它指令都忽略
		if(this.isStun && type != WebSocketOrder.HIT_TANK){
			console.log("ignore action " + JSON.stringify(action));
			return;
		}
		
		let validAction = true;
		//这里要过滤重复的指令
		switch (type) {
			case WebSocketOrder.TURN_AROUND:
				validAction = this.sortMoveActionIndex == -1 && this.orderList.indexOf(type) == -1;
				if(validAction){
					this.sortTurnActionIndex = this.actionList.length;
				}
				break;
			case WebSocketOrder.MOVE:
				// validAction = !this.usingBombSkill && this.orderList.indexOf(type) == -1;
				validAction = !this.usingBombSkill && !this.hasMoveCMD;
				if(validAction){
					this.removeTurnAvtion();
					this.sortMoveActionIndex = this.actionList.length;
					//action[3] = 1.4;
					this.hasMoveCMD = true;
				}
				else{
					this.keep_last_ignore_move_cmd = action;
					console.log(this.uid +  " drop action " + JSON.stringify(action) + " reason : bomgskill = "
						+ this.usingBombSkill +  " , hasMoveCMD = " + this.hasMoveCMD );
				}
				break;

			case WebSocketOrder.LAUNCHBULLET:{
				//这里要处理下自爆坦克(还有玩家冲刺) 用了这个技能就不能的移动指令了
				let skill_list = gameConfig.skill_group[action[3]].skill;

				if(skill_list.length > 0){//机器猫技能
					let move_type =  gameConfig.skill[skill_list[0][1]].move_type;
					this.usingBombSkill = move_type == 4 || move_type == 5;
				}
				this.usingBombSkill && this.removeMoveAction() && this.removeTurnAvtion();
			}
				break;
			case WebSocketOrder.HIT_TANK:{//be hit remove move command if get stun buff when beAttack
				//buff_id index = 5;
				let buffConfig = gameConfig.buff[action[5]];
				//on stun buff
				if(buffConfig && buffConfig.type == 2){
					this.isStun = true;
					this.removeMoveAction();
				}
			}break;	
			
			case WebSocketOrder.BULLET_BOMB:{
				validAction = !this.hasBomb;
				this.has = true;
			}break;

			case WebSocketOrder.RTT:
			{
				if(this.rttData == null)
					this.rttData = action;
				validAction = false;

			}break;
				
			default:
				break;
		}
		if(validAction){
			this.actionList[this.actionList.length] = action;
			//this.orderList[this.orderList.length] = type;
		}
	}
	
	cleanup(){
		this.actionList.length = 0;
		// this.orderList.length = 0;
		this.usingBombSkill = false;
		this.sortMoveActionIndex = -1;
		this.sortTurnActionIndex = -1;
		this.isStun = false;

		this.hasMoveCMD = false;

	}

	clear(){
		this.actionList = null;
		//指令列表
		this.orderList = null;
	}

	check_last_ingore_cmd(){
		if(this.sortMoveActionIndex == -1 && this.keep_last_ignore_move_cmd){
			this.addAction(this.keep_last_ignore_move_cmd);
			console.log(this.uid +  " reuse drop action " + JSON.stringify(this.keep_last_ignore_move_cmd));
		}

		this.keep_last_ignore_move_cmd = null;

		if(this.rttData){
			this.actionList[this.actionList.length] = this.rttData;
			this.rttData = null;
		}
	}
}



class ActionManager{
	constructor(){
		this.tankMap = new Map();
		//当前帧指令
		this.actionList = [];
		//当前移除buff tag
		this.removeBuffList = [];
		
		this.aiBulletHitItemList = [];
	}

	clear (){

		for(let [_,tank] of this.tankMap){
			tank.clear();
		}

		this.tankMap.clear();
		this.tankMap = null;

		this.actionList = null;
		this.removeBuffList = null;
		this.aiBulletHitItemList = null;
	}
	
	findOrCrerateTank(server_id){
		return getFromMap(this.tankMap,server_id,()=>new Tank(server_id));
	}

	/**
	 *
	 * @param data 单指令数据
	 * @param roomModel 房间模型
     */
	handlerAction(data,roomModel,room){
		// console.log("----- handlerAction" + JSON.stringify(data));
		let type = data[0];
		let validAction = true;
		switch (type) {
			case WebSocketOrder.TURN_AROUND:
			case WebSocketOrder.MOVE:
				roomModel.controlTankMove(data) && this.findOrCrerateTank(data[1]).addAction(data);
				validAction = false;
			break;
			case WebSocketOrder.LAUNCHBULLET:
				roomModel.useSkill(data) && this.findOrCrerateTank(data[1]).addAction(data);
				validAction = false;
				break;

			case WebSocketOrder.HIT_TANK:
				if(roomModel.hitTank(data)){
					let beAttackTank = this.findOrCrerateTank(data[2]);
					beAttackTank.addAction(data);
				}
				validAction = false;
				break;

			case WebSocketOrder.ITEM_SKILL_HIT_TANK:
				//ret.atk_server_id,ret.beAtkServer_id,ret.blood,ret.bounceBlood,ret.buff_id,ret.skillType,itemIndex
				validAction = roomModel.itemBombHitTank(data);
				break;
			case WebSocketOrder.PROP_HURT:
				validAction = roomModel.hitTank(data);
				//validAction && console.log("skill hurt-------- " + JSON.stringify(data));
				break;
			case WebSocketOrder.REMOVE_BUFF:
				validAction = this.removeBuffList.indexOf(data[1]) == -1;
				this.removeBuffList[this.removeBuffList.length] = data[1];
				break;
			case WebSocketOrder.HIT_MAP_ITEM:
				validAction = roomModel.hitItem(data);
				// if(validAction && data[4] == 1 && data[2] == 1){//ai bullet and normal hit
				// 	validAction = this.aiBulletHitItemList.indexOf(data[1]) == -1;
				// 	validAction && (this.aiBulletHitItemList[this.aiBulletHitItemList.length] = data[1]);
				// }
				break;
			case WebSocketOrder.ITEM_SKILL_HIT_ITEM:
				validAction = roomModel.itemBomHitItem(data);
				break;
			case WebSocketOrder.HIT_MAIN_BASE:
			case WebSocketOrder.PROP_HURT_MAIN:
				// validAction = roomModel.hitMainBase(data);
				validAction = roomModel.hitTank(data);
				break;
			case WebSocketOrder.USE_PROP_SKILL:
				//findOrCreatePlayerRecode(data[2]).useProp(data[1]);
				validAction = roomModel.useProp(data);
				break;
			case WebSocketOrder.BULLET_BOMB://自爆坦克 现在是客户算ai 所以会收到二条相同的
				if(roomModel.bulletBomb(data)){
					this.findOrCrerateTank(data[3]).addAction(data);
				}
				validAction = false;	
				break;
			case WebSocketOrder.CREATE_TANK:
				//server_id,dir,camp,tank_id,level,pos
				validAction = roomModel.revivePlayer(data[1]);
				break;
			case WebSocketOrder.BUY_LIFE:
				validAction = roomModel.pveBuyLife(data[1]);
				break;
			case WebSocketOrder.IMME_REVIVE:
				validAction = roomModel.pvpImmeRevive(data[1]);
				break;
			case WebSocketOrder.PLAYER_QUIT:
				validAction = room.player_quit(data[1]);
				break;
			case WebSocketOrder.DROP_BUY_LIFE:
				roomModel.drop_buy_life(data[1]);
				validAction = false;
				break;
			case WebSocketOrder.UNLOCK_TANK:
				validAction = room.roomModel.unLockTank(data);
				break;
			case WebSocketOrder.RTT:
				validAction = false;
				// ["type","uid","time"]
				let beAttackTank = this.findOrCrerateTank(data[1]);
				beAttackTank && beAttackTank.addAction(data);
				break;
			default:
				break;
		}
		
		if(validAction){
			this.actionList[this.actionList.length] = data;
		}
	}
	
	getAllActions(){
		for(let [_,tank] of this.tankMap){
			tank.check_last_ingore_cmd();
			if(tank.actionList.length > 0){
				this.actionList = this.actionList.concat(tank.actionList);
			}
			tank.cleanup();
			
		}
		
		return this.actionList;
	}
	
	cleanup(){
		this.actionList.length = 0;
		this.removeBuffList.length = 0;
		this.aiBulletHitItemList.length = 0;
	}
}

//let manager = new ActionManager();
module.exports.ActionManager = ActionManager;
