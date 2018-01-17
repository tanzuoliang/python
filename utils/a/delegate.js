var tank = tank || {};
tank.TankActionDelegate = (function () {
	function M(m) {
		cc.assert(m != null,"m can not be null or undefined");
		this.model = m;
	}
	M.prototype.dead = function () {
		this.model.dead();
	};
	/**
	 *
	 * @param time
	 * @param dir
	 * @param frame
	 * @param onComplete
	 */
	// this.move = function(time,frameContinueTime,tank_id,x,y,frame){
	M.prototype.move = function(time,dir,frame,onComplete){
		// //cc.log("TankActionDelegate move");
		this.model.move(time,dir,frame,onComplete);
	};
	M.prototype.moveToPoint = function (point,dir,onComplete) {
		this.model.moveToPoint(point,dir,onComplete);
	};
	M.prototype.modifyTo = function(to){
		this.model.modifyTo(to)
	};
	M.prototype.idle = function(){
		this.model.idle();
	};
	M.prototype.beHurt =  function(blood,skillType){
		this.model.beHurt(blood,skillType);
	};
	M.prototype.launchBullet = function(skill_id){
		this.model.launchBullet(skill_id);
		this.model.postCmd = false;
	};
	M.prototype.turnAround  = function(dir){
		this.model.turnAround(dir);
		this.model.postCmd = false;
	};
	M.prototype.update = function(dt){
		this.model.update(dt);
	};
	M.prototype.getRankId =  function(){
		return this.model.server_id;
	};
	M.prototype.updatePosition = function(x,y){
		this.model.updatePosition(x,y);
	};
	M.prototype.isMyself  = function () {
		return this.model.server_id == tank.RoomModel.myServerTankId;
	};
	M.prototype.isEnmey = function (camp) {
		return this.model.camp != camp;
		// return (this.model.camp == tank.Camp.SELF && camp == tank.Camp.ENEMY)
		// 	|| (this.model.camp == tank.Camp.ENEMY && camp == tank.Camp.SELF)
	};
	M.create = function (m) {
		var instance = new M(m);
		return instance;
	};
	return M;
})();
/**
 * ai 的代理
 */
tank.AIDelegate = (function () {
	var delegateList = [];
	function AIResult() {
		this.playTanks = [];
		this.right = [];
		this.down = [];
		this.left = [];
		this.up = [];
		this.paths = [];
	}
	AIResult.prototype.clear = function () {
		this.playTanks.length = 0;
		this.right.length = 0;
		this.down.length = 0;
		this.left.length = 0;
		this.up.length = 0;
		this.paths.length = 0;
	};
	AIResult.prototype.toString = function () {
		return "this.playTanks = " + JSON.stringify(this.playTanks)
				+ " , this.right = " + JSON.stringify(this.right)
				+ " , this.down = " + JSON.stringify(this.down)
				+ " , this.left = " + JSON.stringify(this.left)
				+ " , this.up = " + JSON.stringify(this.up)
				+ " , this.paths = " + JSON.stringify(this.paths);
	};
	function __class__(model) {
		this.model = model;
		this.modelHitRect = null;
		this.delegate = tank.RoomModel.getTankActionDelegate(model.server_id);
		this.roomModel = tank.RoomModel;
		this.aiResult = new AIResult();
		this.boxRect = tank.math.Rect.create(0,0,0,0);
		this.tenRectVUp = tank.math.Rect.create(0,0,0,0);//|
		this.tenRectVDown = tank.math.Rect.create(0,0,0,0);//|
		this.tenRectHLeft = tank.math.Rect.create(0,0,0,0);//--
		this.tenRectHRight = tank.math.Rect.create(0,0,0,0);//--
		//已经找到的子弹的开放列表
		// this.tankOpenList = [];
		if(tank.DEBUG){
			this.drawNode = cc.DrawNode.create();
			tank.container.helpContainer.addChild(this.drawNode);
		}
		this.tempSkillCDMap = {};
		this.currentMoveToGridPoint = cc.p(0,0);
		delegateList.push(this);
		//todo 11.11add virtue
		this.randomTurnAroundCd = 0;
		//key:[]
		this.tankLocalMap = {};
		//todo 转向强制阀值
		this.canTrunTimeCd = 0;
		//todo explore转向CD
		this.exploreCDTime = 0;
		//todo 添加目标方向暂存
		this.tempTargetDir = null;
		this.aiCanmove = tank.AICanMove.createAIMove(this.model,this.roomModel);
		this.aiCanmoveMap = {};
		this.hasFindData = false;
		this.mapItemJson = this.roomModel.mapTitleModelJson;
		this.playerList = this.roomModel.playerTankMap.data;
		this.tenWidth = cc.winSize.width;
		this.tenHeight = cc.winSize.height;
		this.bulletWidth  = 4;
	}
	__class__.prototype.update = function (dt) {
		dt = Math.floor(dt * 1000);
		for(var key in this.tempSkillCDMap){
			this.tempSkillCDMap[key] -= dt;
		}
		this.randomTurnAroundCd -= dt;
		this.canTrunTimeCd -= dt;
		this.exploreCDTime -= dt;
	};
	/**
	 *
	 * if(temp.dirKey){
                    // //cc.log("press dir key");
                    if(temp.isClick){
                        //仅仅只是点了下方向键 这里做转向处理
                        cmd = [tank.WebSocketOrder.TURN_AROUND,temp.key];
                    }
                    else{
                        //长按了方向键 做移动处理
                        cmd = [tank.WebSocketOrder.MOVE,temp.key];
                    }
                }
	 else{//技能键 这里的kye对应技能id
                    cmd = [tank.WebSocketOrder.LAUNCHBULLET,temp.key];
                }
	 *
	 * @param dir
     */
// ----------------------------------------- start  行为 -------------------------------------
	__class__.prototype.turnAround = function (dir) {
		if(dir != tank.Direction.RIGHT && dir != tank.Direction.DOWN && dir != tank.Direction.LEFT && dir != tank.Direction.UP){
			////cc.log("你说吧，你传这个给我做什么 dir = " + dir);
			return;
		}
		////cc.log("AI turnAround    index = " + tank.RoomModel.updateIndex);
		if(tank.USING_FRAM_SYNC ){
			tank.RoomModel.gameTimeLine.addAICommand(this.model,[tank.WebSocketOrder.TURN_AROUND,this.model.server_id,dir]);
		}
		else{
			this.model.turnAround(dir);
		}
		//tank.RoomModel.gameTimeLine.addAIRecode(this.model,[tank.WebSocketOrder.TURN_AROUND,this.model.server_id,dir]);
	};
	__class__.prototype.move = function (dir) {
		if(this.model.requestMove){
			////cc.log("AI move return because current had requestMove");
			return;
		}
		////cc.log("----AI move frameIndex = " + tank.RoomModel.updateIndex + " , dir = " + dir);
		this.model.requestMove = true;
		dir = cc.isUndefined(dir)?this.model.dir : dir;
		if(tank.USING_FRAM_SYNC){
			tank.RoomModel.gameTimeLine.addAICommand(this.model,[tank.WebSocketOrder.MOVE,this.model.server_id,dir]);
		}
		else{
			this.model.move(tank.RoomModel.roomInfo.logMoveTime,dir,1,null);
		}
		//tank.RoomModel.gameTimeLine.addAIRecode(this.model,[tank.WebSocketOrder.MOVE,this.model.server_id,dir]);
	};
	__class__.prototype.idle = function () {
		if(this.model.status == tank.ObserverType.MOVE_TO_POINT)return;
	};
	__class__.prototype.luanchBullet = function (skill_id,dir) {
		////cc.log("AI luanchBullet    index = " + tank.RoomModel.updateIndex);
		dir = cc.isUndefined(dir)?this.model.dir : dir;
		this.model.isLaunch = true;
		if(tank.USING_FRAM_SYNC){
			tank.RoomModel.gameTimeLine.addAICommand(this.model,[tank.WebSocketOrder.LAUNCHBULLET,this.model.server_id,dir, skill_id]);
		}
		else{
			this.model.launchBullet(skill_id);
		}
		//tank.RoomModel.gameTimeLine.addAIRecode(this.model,[tank.WebSocketOrder.LAUNCHBULLET,this.model.server_id,dir, skill_id]);
		var skillConfig = gameConfig.skill_group[skill_id];
		if(!skillConfig){
			////cc.log("can not find skillconfig " + skill_id + " , tank_id = " + this.model.tank_id + " , server_id = " + this.model.server_id);
			return;
		}
		this.tempSkillCDMap[skill_id] = skillConfig.cd;
	};
	__class__.prototype.showMoveAction = function () {
		this.model.notifyObservers(tank.ObserverType.MOVE);
	};
	/**
	 * 移动到某坐标值命令
	 * @param dir
	 * @param x
     * @param y
     */
	__class__.prototype.moveToPoint = function (dir,x,y) {
		// if(this.model.status == tank.ObserverType.MOVE_TO_POINT)return;
		//tank.GameTimeLine.addCommand([tank.WebSocketOrder.MOVE_TO_POINT,this.model.server_id,dir,x,y]);
	};
	/**
	 * 移动到某坐标值命令
	 * @param dir
	 * @param x
	 * @param y
	 */
	__class__.prototype.moveToGrid = function (dir,x,y) {
		this.currentMoveToGridPoint.x = x;
		this.currentMoveToGridPoint.y = y;
		x = x * tank.ITEM_WIDTH;
		y = y * tank.ITEM_HEIGHT;
		this.moveToPoint(dir,x,y);
	};
	__class__.prototype.moveToGridWithoutDir = function (x,y) {
		x = x * tank.ITEM_WIDTH;
		y = y * tank.ITEM_HEIGHT;
		var dir = -1;
		var dis_x = x - this.model.x;
		var dis_y = y - this.model.y;
		if(Math.abs(dis_x) > 10){
			if(dis_x > 0)
				dir = tank.Direction.RIGHT;
			else
				dir = tank.Direction.LEFT;
		}
		else if(Math.abs(dis_y) > 10){
			if(dis_y > 0)
				dir = tank.Direction.UP;
			else
				dir = tank.Direction.DOWN;
		}
		else{
			cc.assert(false,"moveToGridWithoutDir 移动方向不明");
		}
		this.moveToPoint(dir,x,y);
	};
	/**
	 * 检查可移动结果
	 * @param dir方向
	 * @param distance 当前希望移动的距离
     */
	// __class__.prototype.checkRay = function (dir) {
	// 	return this.model.rayCast.checkRay(dir,this.dt * this.model.speed);
	// };
	/**
	 * 检查可移动结果
	 * @param dir方向
	 * @param distance 当前希望移动的距离
	 */
	__class__.prototype.canForward = function (dir) {
		if(!this.aiCanmoveMap.hasOwnProperty(dir)){
			this.aiCanmoveMap[dir] = this.aiCanmove.toDir(dir) || tank.ModifyControl.checkMoveInfo(this.model,tank.RoomModel,tank.ITEM_HALF_WIDTH,dir,true);
		}
		return this.aiCanmoveMap[dir];
	};
// ----------------------------------------- end  行为   -------------------------------------
	__class__.prototype.getSkillCDTime = function (skill_id) {
		return this.tempSkillCDMap.hasOwnProperty(skill_id) && this.tempSkillCDMap[skill_id] || 0;
	};
	// ---------------------------16/10/20---------------------------
	__class__.prototype.getAIResult = function () {
		return this.aiResult;
	};
	__class__.prototype.findData = function () {
		if(this.hasFindData){
			return this.aiResult;
		}
		this.modelHitRect = this.model.hitRect;
		this.tenRectHRight.reset(this.modelHitRect.centerX
								,this.modelHitRect.centerY - this.bulletWidth
								,this.tenWidth,this.bulletWidth*2);
		this.tenRectHLeft.reset(this.modelHitRect.centerX - this.tenWidth
								,this.modelHitRect.centerY - this.bulletWidth
								,this.tenWidth,this.bulletWidth*2);
		this.tenRectVDown.reset(this.modelHitRect.centerX - this.bulletWidth
								,this.modelHitRect.centerY - this.tenHeight
								,this.bulletWidth * 2,this.tenHeight);
		this.tenRectVUp.reset(this.modelHitRect.centerX - this.bulletWidth
								,this.modelHitRect.centerY
								,this.bulletWidth * 2,this.tenHeight);
		if(tank.SHOW_AI_TEN_LINE){
			this.drawNode.clear();
			this.drawRect(this.tenRectHLeft);
			this.drawRect(this.tenRectHRight);
			this.drawRect(this.tenRectVDown);
			this.drawRect(this.tenRectVUp);
		}
		var tankGrid = this.modelHitRect.startGrid;
		//底部格子数
		var tankBottomGrid = this.modelHitRect.endGrid;
		//right
		this.checkPlayer(this.aiResult.right,this.tenRectHRight);
		for(var h = tankGrid.h; h < this.roomModel.mapSize.width;h++){
			for(var v = tankGrid.v ; v <= tankBottomGrid.v;v++){
				this.__checkGrid__(h,v,this.aiResult.right,this.tenRectHRight);
			}
		};
		this.checkPlayer(this.aiResult.down,this.tenRectVDown);
		for(var v = tankBottomGrid.v ; v > -1;v--){
			for(var h = tankGrid.h; h <= tankBottomGrid.h;h++){
				this.__checkGrid__(h,v,this.aiResult.down,this.tenRectVDown);
			}
		}
		//left
		this.checkPlayer(this.aiResult.left,this.tenRectHLeft);
		for(var h = tankBottomGrid.h; h > -1;h--){
			for(var v = tankGrid.v ; v <= tankBottomGrid.v;v++){
				this.__checkGrid__(h,v,this.aiResult.left,this.tenRectHLeft);
			}
		};
		//up
		this.checkPlayer(this.aiResult.up,this.tenRectVUp);
		for(var v = tankGrid.v ; v <= this.roomModel.mapSize.height;v++){
			for(var h = tankGrid.h; h <= tankBottomGrid.h;h++){
				this.__checkGrid__(h,v,this.aiResult.up,this.tenRectVUp);
			}
		}
		//index x 2, y 3
		this.aiResult.right.sort(function (a,b) {
			return a[2] - b[2];
		});
		this.aiResult.left.sort(function (a,b) {
			return b[2] - a[2];
		});
		this.aiResult.up.sort(function (a,b) {
			return a[3] - b[3];
		});
		this.aiResult.down.sort(function (a,b) {
			return b[3] - a[3];
		});
		////cc.log("AICoast ---------- findData" +  (sdk.SDKPlatform.getTime() - st));
		this.hasFindData = true;
		return this.aiResult;
	};
	__class__.prototype.checkPlayer = function (list,rect) {
		for (var i = 0,delegate, model, len = this.playerList.length; i < len; i++) {
			delegate = this.playerList[i];
			if(delegate){
				model = delegate.model;
				if(model && !model.ignoreAISearch && model.hitRect.interactive(rect)){
					list.push([tank.AI_TANK_FLAG,model.tank_id, model.x, model.y]);
				}
			}
		}
	};
	__class__.prototype.__checkGrid__ = function (h,v,list,rect) {
		var mapTitleModel = this.mapItemJson[h + "_" + v];
		if(mapTitleModel){
			if(mapTitleModel.__config__.pass == 0 && mapTitleModel.hitRect.interactive(rect)) {
				list.push([tank.AI_MAP_ITEM_FLAG,mapTitleModel.__config__.id, mapTitleModel.x, mapTitleModel.y, h + "_" + v]);
			}
		}
	};
	__class__.prototype.drawRect = function (rect) {
		var color = cc.color(0, 255, 0, 255);
		this.drawNode.drawSegment(cc.p(rect.x, rect.y), cc.p(rect.x,rect.bottom), 1, color);
		this.drawNode.drawSegment(cc.p(rect.x, rect.bottom), cc.p(rect.right,rect.bottom), 1, color);
		this.drawNode.drawSegment(cc.p(rect.right, rect.bottom), cc.p(rect.right,rect.y), 1, color);
		this.drawNode.drawSegment(cc.p(rect.right, rect.y), cc.p(rect.x,rect.y), 1, color);
	};
	__class__.prototype.clear = function () {
		this.aiResult && this.aiResult.clear();
		this.hasFindData = false;
		this.aiCanmoveMap = {};
	};
	// ------------------------------------------------------------
	__class__.create = function (model) {
		return new __class__(model);
	};
	__class__.update = function (dt) {
		for (var i = 0, ele, len = delegateList.length; i < len; i++) {
			ele = delegateList[i];
			ele.update(dt);
		}
	};
	__class__.clear = function () {
		delegateList.length = 0;
	};
	return __class__;
})();