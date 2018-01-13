#!/usr/bin/python

import json,os

from utils import getConfig

class CheckConfig(object):
	
	def __init__(self):
		self.effectConfig = getConfig("gameConfig.effect")
		self.soundConfig = getConfig("gameConfig.sound")
		
		self.skillConfig = getConfig("gameConfig.skill")
		self.skillPropConfig = getConfig("gameConfig.skill_prop")
		self.buffConfig = getConfig("gameConfig.buff")
		self.skillItemConfig = getConfig("gameConfig.skill_item")
		
		self.itemConfig = getConfig("gameConfig.item")
		self.tankConfig = getConfig("gameConfig.tank")
		self.tankAniConfig = getConfig("gameConfig.tank_ani")
		
		self.rootActionPath = "/Users/tanzuoliang/Documents/projects/tank/res/tank/action"
	
	def checkEffect(self,effect_id,where):
		base_effect_id = effect_id		
		effect_id = str(effect_id)
		if effect_id == "" or effect_id == "0":
			return	
		if "{dir}" in effect_id:
			list = ["L","D","U"]
			for k in list:
				effect_id = effect_id.replace("{dir}",k)
				if not effect_id in self.effectConfig:
					print "effect_id %s from %s is error can not find in effectConfig"%(base_effect_id,where)
		else:
			if not effect_id in self.effectConfig:
				print "effect_id %s from %s is error can not find in effectConfig"%(base_effect_id,where)
				
				
	def checkSound(self,sound_id,where):
		sound_id = str(sound_id)
		if sound_id == "" or sound_id == "0":
			return
		if not sound_id	in self.soundConfig:
			print "sound_id %s from %s is error can not find in soundConfig"%(sound_id,where)						
			
	def check_skill(self):
		for key in self.skillConfig:
			self.checkEffect(self.skillConfig[key]["launch_effect"], "skillConfig_%s_launch_effect"%key)
			self.checkEffect(self.skillConfig[key]["move_effect"], "skillConfig_%s_move_effect"%key)
			self.checkEffect(self.skillConfig[key]["hit_effect"], "skillConfig_%s_hit_effect"%key)
			
			if self.skillConfig[key]["move_type"] == 3 and self.skillConfig[key]["speed"] == 0:
				print "skill config %s set move_type is 3 but speed value is 0"%key
				
			collide_type = self.skillConfig[key]["collide_type"]
			collide_range = self.skillConfig[key]["collide_range"]
			if collide_type == 1:
				if not len(collide_range) == 2:
					print "skillConfig %s set collide_type is 1 but collide_range just has one parmas"
			elif collide_type == 2:
				if not len(collide_range) == 1:
					print "skillConfig %s set collide_type is 2 but collide_range has more than one parmas"
					 
			
	def checkSkillProp(self):
		for key in self.skillPropConfig:
			self.checkEffect(self.skillPropConfig[key]["effect"], "skillPropConfig_%s_effect"%key)
	
	def checkBuff(self):
		for key in self.buffConfig:
			self.checkEffect(self.buffConfig[key]["effect"], "buffConfig_%s_effect"%key)		
	
	def checkSkillItem(self):
		for key in self.skillItemConfig:
			self.checkEffect(self.skillItemConfig[key]["effect"], "skillItemConfig_%s_effect"%key)		
			
			
	def checkAllEffect(self):
		self.check_skill()
		self.checkBuff()
		self.checkSkillProp()
		self.checkSkillItem()
		
		
	def checkTankAniFrame(self):
		total = 0	
		for ac in self.tankAniConfig:
			tank_model_id = ac.split("_")[0]
			tank_plist = "tank_%s.plist"%tank_model_id
			cnt = 0
			hasDir = False
			ff = os.path.join(self.rootActionPath,tank_plist)
			if not os.path.exists(ff):
				print "can not find the file%s"%ff
				return
			with open(ff) as f:
				for line in f.readlines():
					if ".png</key>" in line:
						line_ = line.replace('<key>','').replace('</key>','').strip().replace(".png","")
						if "L" in line_:
							hasDir = True
						line = line_.replace('L_','').replace('U_','').replace('D_','')
						line = line[0:len(line)-6]
#						print ac , line , line_
						if ac == line:
							cnt = cnt + 1
			if hasDir:
				cnt = cnt / 3				
			if cnt > self.tankAniConfig[ac]["frame_count"]:
				total = total + cnt - self.tankAniConfig[ac]["frame_count"]
				print "tank_ani id = %s set only %d frames, but has %d spriteFrames"%(ac,self.tankAniConfig[ac]["frame_count"],cnt)
				
		print "total = %d"%total								
		
#------------------------------ check config sound ------------------------------------------------------

	def checkAllSoundCondfig(self):
		for key in self.itemConfig:
			self.checkSound(self.itemConfig[key]["hit_sound"], "itemConfig_%s_hit_sound"%key)
			self.checkSound(self.itemConfig[key]["destroy_sound"], "itemConfig_%s_destroy_sound"%key)
			
		for key in self.tankConfig:
			self.checkSound(self.tankConfig[key]["hit_sound"], "tankConfig%s_hit_sound"%key)
			self.checkSound(self.tankConfig[key]["destroy_sound"], "tankConfig%s_destroy_sound"%key)
			self.checkSound(self.tankConfig[key]["move_sound"], "tankConfig%s_move_sound"%key)				
			
#---------------------------- start---------------
	def startup(self):
		self.checkAllEffect()
		self.checkAllSoundCondfig()
		print "check complete......"	
#if __name__ == "__main__":
#	CheckConfig().startup()		

#CheckConfig().checkTankAniFrame()						
				