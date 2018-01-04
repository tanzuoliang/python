#!/usr/bin/python
#encoding=utf-8
"""
GameIcon("./icon.png","res/effect/2000_atklaunch_D.png","./icon_out").start()
"""	
import os
from PIL import Image
from optparse import OptionParser
from myutil.utils import copyDir
class GameIcon():
	def __init__(self,icon,water,out):
		
#		self.android_size = {"drawable":48,"drawable-hdpi":72,"drawable-ldpi":36,"drawable-mdpi":48,"drawable-xhdpi":96,"drawable-xxhdpi":144,"max":512}
#		self.android_size = {"drawable-hdpi":72,"drawable-mdpi":48,"drawable-xhdpi":96,"drawable-xxhdpi":144}
		self.android_size = {"drawable-hdpi":144,"drawable-mdpi":96,"drawable-xhdpi":192,"drawable-xxhdpi":288}
		self.ios_size = [29,40,50,57,58,72,76,80,87,100,114,120,144,152,175,180,512]
		self.icon = icon
		self.water = water
		self.outdir = out
		self.create_dir(self.outdir)
	
	def create_dir(self,_dir):
		if not os.path.exists(_dir):
			os.system("mkdir %s && chmod -R 777 %s"%(_dir,_dir))
			print "create ",_dir
	
	def start(self,platform="android"):
		self.megerimage()
			
		if platform == "android":
			for d in self.android_size:
				dd = os.path.join(self.outdir,d)
				self.create_dir(dd)
				self.resize(self.android_size[d], os.path.join(dd, "icon.png"))
		elif platform == "ios":
			for si in self.ios_size:
				self.resize(si, os.path.join(self.outdir, "Icon-%d.png"%si))
				
	
	def megerimage(self):
		if self.water and os.path.exists(self.water):
			with Image.open(self.icon) as icon_im, Image.open(self.water) as water_im:
				self.im = Image.alpha_composite(icon_im, water_im)
		else:
			with Image.open(self.icon) as icon_im:
				self.im = Image.new("RGBA", (icon_im.width,icon_im.height))
				self.im.paste(icon_im)
		
	
	def resize(self,size,f):
		cim = self.im.copy()
		cim.thumbnail((size,size))
		cim.save(f)
		
def toproject(platform,channel,from_p):
	out_pro = ""
	if platform == "android":
		out_pro = os.path.join("..", "frameworks","runtime-src","proj.android-studio","app","src",channel,"res")
		copyDir(from_p,out_pro)
		print from_p, " ===  ",out_pro
	elif platform == "ios":
		pass
#		out_pro = os.path.join("..", "frameworks","runtime-src","proj.android-studio","app","src",channel,"res")			

from myutil.utils import getparse	
if __name__ == "__main__":
	"""
	python -p android -c xxx exeute dir ../
	"""
	options = getparse([{'name':'p','desc':'platform','help':'平台 android | ios'},{'name':'c','desc':'channel','help':'选择icon渠道'}])
	pa = "../../../appIcon"
	icon_p = os.path.join(pa, "icon.png")
	water_p = os.path.join(pa, "channel",options.channel,"water.png")
	out_P = os.path.join(pa, "out",options.channel)
	GameIcon(icon_p,water_p,out_P).start(options.platform)
	toproject(options.platform,options.channel,out_P)
	
	
			