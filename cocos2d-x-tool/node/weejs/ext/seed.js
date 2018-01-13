/**
 * 随机数
 * @param seed    随机种子
 * @param replay  是否需要回放
 *   // test
	 var rander = new SeedRand(1000, true);
	 var list = {};
	 for ($i = 0; $i < 10000; $i++) {
				var tmp = rander.next(1, 10);
				if (list.hasOwnProperty(tmp)) {
					list[tmp]++;
				} else {
					list[tmp] = 1;
				}
			}
	 console.log(list);
	 alert(rander.getValue(666));
 */
function SeedRand(seed, replay) {
	if (seed) {
		this.seed = seed;
	} else {
		this.seed = new Date().getTime();
	}
	this.replay = replay;
	this.record = {};
	this.num = 0;

	/**
	 * 返加指定区间的随机数
	 * @param min
	 * @param max
	 * @returns {number}
	 */
	this.next = function(min, max) {
		this.seed = (this.seed * 9301 + 49297) % 233280;
		var tmp = this.seed / 233280;
		var value = Math.floor(min + tmp * (max - min + 1));
		this.num++;
		if (this.replay) {
			this.record[this.num] = value;
		}
		return value;
	}

	/**
	 * 返加指定回合的随机数
	 * @param num
	 * @returns {*}
	 */
	this.getValue = function (num) {
		return this.record[num];
	}

}