#!/usr/bin/python

import json

from utils import getConfig	

def checkSkill(skill_id,model_id,isSkill):
	if skill_id == "0":
		return
	if skill_id in skillGroupConfig:
		cd = skillGroupConfig[skill_id]["cd"]
		
		if model_id in tankModelConfig:
			ani_key = ""
			if isSkill:
				ani_key = tankModelConfig[model_id]["move_skill_ani"]
			else:
				ani_key = tankModelConfig[model_id]["move_atk_ani"]
			
			if not ani_key == "":
				if ani_key in aniConfig:
					time = aniConfig[ani_key]["frame_count"] * 33
					if time > cd:
						print(" skill %s action cost more time(%d) than cd(%d) actionKey = %s"%(skill_id,time,cd,ani_key))
				else:
					print(" can not find the tank_aniConfig with %s"%ani_key)
			
		else:
			print("can not find the tank_modelConfig with %s"%(model_id))
	else:
		print("can not find skill_group config width %s"%skill_id)									

def checkSkillHurtFrame():
	for id in skillConfig:
		con = skillConfig[id]
		if con["harm_type"] == 2:
			if not con["move_effect"] == "":
				effect_id = str(con["move_effect"])
				effect_id = effect_id.replace("{dir}","L")
				
				if effect_id in effectConfig:
					totalEffectFrame = effectConfig[effect_id]["frame_count"]
					if con["harm_start"] < totalEffectFrame and con["harm_end"] <= totalEffectFrame:
						pass
					else:
						print("----waring skill %s effect just has %d frames, but in skillConfig set hurt rang from %d to %d"%(id,totalEffectFrame,con["harm_start"],con["harm_end"]))	
				else:
					print("can not find effect config with id %s"%effect_id)	
				
			else:
				print("skill %s has not move_effect"%id)
				
	print "checkSkillHurtFrame complete......"					


skillGroupConfig = getConfig("gameConfig.skill_group")
aniConfig = getConfig("gameConfig.tank_ani")
tankModelConfig = getConfig("gameConfig.tank_model")

skillConfig = getConfig("gameConfig.skill")
effectConfig = getConfig("gameConfig.effect")

def checkSkillAction():
	tankConfig = getConfig("gameConfig.tank")
	for tank_id in tankConfig:
		attack_id = "%d"%tankConfig[tank_id]["attack_id"]
		skill_id = "%d"%tankConfig[tank_id]["skill_id"]
		model_id = "%d"%tankConfig[tank_id]["model"]
		checkSkill(attack_id, model_id,False)
		checkSkill(skill_id, model_id,True)
	
	print "checkSkill complete......"

checkSkillHurtFrame()
checkSkillAction()				