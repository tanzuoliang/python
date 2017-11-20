import os

action = []
effect = []
with open("log.txt","r") as f:
	for line in f.readlines():
		line = line.replace("remove Texture : /var/containers/Bundle/Application/8E7C0A3F-32CB-4DD8-9670-7CEE668CCA23/tank-mobile.app/res/","").replace("\n","")
		if "effect" in line:
			effect.append(line)
		elif "action" in line:
			action.append(line)
	
	print("action %d:\n%s"%(len(action),'\n'.join(action)))
	print("effect %d:\n%s"%(len(effect),'\n'.join(effect)))
	
li = ["res/scene/element.plist","res/effect/revive.plist","res/effect/atkhit_TKTY.plist","res/ui/prop_icon/prop_icon.plist","res/tank/action/tank_25030.plist","res/effect/1081_atklaunch.plist","50013","res/effect/1081_atkfly.plist","res/effect/1081_atkhit.plist","res/effect/2031_atklaunch.plist","50014","res/effect/2031_atkfly.plist","res/effect/2031_atkhit.plist",55000,55001,55002,"res/tank/action/tank_20001.plist","res/effect/1000_atklaunch.plist","50002","res/effect/1000_atkfly.plist","res/effect/1000_atkhit.plist",55000,55001,55002,"res/tank/action/tank_20005.plist","res/effect/1002_atklaunch.plist","50004","res/effect/1002_atkfly_L.plist","res/effect/1002_atkfly_U.plist","res/effect/1002_atkfly_D.plist","res/effect/1002_atkhit.plist","res/effect/1002_atklaunch.plist","50004","res/effect/1002_atkfly_L.plist","res/effect/1002_atkfly_U.plist","res/effect/1002_atkfly_D.plist","res/effect/1002_atkhit.plist",55000,55001,55002,"res/tank/action/tank_20002.plist","res/effect/1000_atklaunch.plist","50002","res/effect/1000_atkfly.plist","res/effect/1000_atkhit.plist",55000,55001,55002,"res/tank/action/tank_20006.plist","res/effect/1005_atklaunch.plist","50001","res/effect/1005_atkfly.plist","res/effect/1005_atkhit.plist",55000,55001,55002,"res/tank/action/tank_20003.plist","res/effect/1002_atklaunch.plist","50004","res/effect/1002_atkfly_L.plist","res/effect/1002_atkfly_U.plist","res/effect/1002_atkfly_D.plist","res/effect/1002_atkhit.plist",55000,55001,55002,"res/tank/action/tank_20007.plist","res/effect/2000_atklaunch_L.plist","50005","res/effect/2000_atklaunch_U.plist","50005","res/effect/2000_atklaunch_D.plist","50005","res/effect/2000_atkhit.plist","50006",55000,55001,55002,55000,55000,55000,59001,59001,59001,59000,59001,59001,59000,59001,55000,55000,55000,59001,55000,"res/effect/9_addspeedbuff_L.plist","res/effect/9_addspeedbuff_U.plist","res/effect/9_addspeedbuff_D.plist","res/effect/6000_atkhit.plist","res/effect/holybaseeff.plist","res/effect/2000_atkhit.plist","50006","res/effect/8_holybuff.plist","res/effect/tankStartEffect.plist","res/effect/AItankStartEffect.plist","res/effect/dropitem_eff.plist","res/effect/dropitem_eff_glow.plist","res/effect/baseeff.plist"]


action1 = []
effect1 = []
for line in li:
	line = str(line).replace("res/", "").replace(".plist", ".png")
	if "effect" in str(line):
		effect1.append(line)
	elif "action" in str(line):
		action1.append(line)
		
print("action %d:\n%s"%(len(action1),'\n'.join(action1)))
print("effect %d:\n%s"%(len(effect1),'\n'.join(effect1)))	


print "-----------------------"

for i in action1:
	if not i in action:
		print "missing action : %s"%i

print "-----------------------"
		
for i in effect1:
	if not i in effect:
		print "missing effect : %s"%i		
	
							