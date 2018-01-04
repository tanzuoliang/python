const SERVER_CONST = {
	// SERVER_COMMAND_TIME : 48,
	// CLIENT_COMMAND_TIME : 50,//客户端上传时间间隔
	// CLIENT_LOG_TIME     : 50,//客户端物理帧转逻辑帧时间
	// CLIENT_MOVE_TIME	: 50,//客户端一个指令的移动时间
	// CLIENT_BUFF_TIME    : 3,//客户端加速帧阀值
	// CLIENT_TIMEOUT		: 10,//客户端断线超时10秒内没收到服务器推送数据 认为断线了
	// CLIENT_KEEP_MOVE_TIME : 100,
	// CLIENT_MAX_MOVE_TIME  : 150,
	// CLIENT_AI_EXTER_FRAME : 5,

	SERVER_COMMAND_TIME : 80,
	CLIENT_COMMAND_TIME : 80,
	CLIENT_LOG_TIME     : 80,
	CLIENT_MOVE_TIME	: 80,
	CLIENT_BUFF_TIME    : 3,//客房加速帧阀值
	CLIENT_TIMEOUT		: 5,
	CLIENT_KEEP_MOVE_TIME : 40,
	CLIENT_MAX_MOVE_TIME  : 120,
	CLIENT_AI_EXTER_FRAME : 3,

	RECIVE_MSG_KCP_IMME : true,
	ROOM_NUM	: 2,	
	INIT 	: 	"init",
	ENTER	:	"enter",
	ASSETS 	:   "assets",
	START	:	"start",
	REDAY	:	"ready",
	QUIT	:   "quit",
	CLOSE	: 	"close",
	GAME_OVER:	"gameOver",
	RE_CONN	:	"reCoon",
	KCP_SIZE	: 128,
	COMPRESS_DATA : false,

	WAIT_OTHER_PLAYER : 10000,//等候其它玩家加载超时
	ROOM_WAIT		  : 180000,//房间等待超时（一个人都没进来）
};

const WebSocketOrder = {

	TYPE            : "t",
	DATA            : "d",
	SOCKET_ID       : "sid",

	TURN_AROUND 	: 1,
	MOVE			: 2,
	LAUNCHBULLET 	: 3,
	IDLE			: 4,
	CREATE_TANK		: 5,
	BUY_LIFE		: 555,
	IMME_REVIVE		: 556,
	FAIL_USE_SKILL  : 557,//技能使用失败（死亡了（一般这样就是网卡了，客户端还没收到死亡指令））
	MODIFY_TO		: 6,
	DEAD            : 7,
	HIT_BULLET      : 8,
	HIT_TANK        : 9,
	HIT_MAP_ITEM    : 10,
	SYNC_POSTION    : 11,
	GAME_OVER       : 12,
	BULLET_BOMB     : 13,
	HIT_MAIN_BASE   : 14,
	USE_PROP_SKILL  : 15,
	PROP_HURT       : 16,
	PROP_HURT_ITEM  : 17,
	PROP_HURT_MAIN  : 18,
	CREATE_AI_TANK  : 19,
	DROP_ITEM_SKILL : 20,
	ITEM_CREATE_AI   : 21,
	ITEM_SKILL_HIT_TANK : 22,
	ITEM_SKILL_HIT_ITEM : 23,
	DROP_ITEM           : 24,
	REMOVE_BUFF         : 25,
	CREATE_PLAYER_TANK  : 28,
	GAME_START          : 29,
	RTT           		: 30,
	PLAYER_QUIT         : 31,
	FORWARD_COMPLETE    : 32,
	CONTROL_AI          : 33,
	UNLOCK_TANK         : 34,  //释放坦克
	DROP_BUY_LIFE       : 35
};

/**
 * 战斗结束
 * @type {{TIME_OUT: number, KILL_ALL_AI: number, PLAYER_NO_LIVE: number, MAIN_BASE_BE_DESTORY: number}}
 */
const FIGHT_OVER_FLAG = {
	TIME_OUT : 1,    //时间到了
	KILL_ALL_AI : 2, //AI死光
	PLAYER_NO_LIVE : 3,//玩家没复活
	MAIN_BASE_BE_DESTORY : 4,//	主基地被摧毁
	ALL_PLAYER_DIED      : 5//玩家全军阵亡
};


module.exports.SERVER_CONST = SERVER_CONST;
module.exports.WebSocketOrder = WebSocketOrder;
module.exports.FIGHT_OVER_FLAG = FIGHT_OVER_FLAG;