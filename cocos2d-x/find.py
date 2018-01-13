
import os,sys


def findContent(dir,s):
	li = [".js",".json"]
	for item in os.walk(dir):
		if not item[2]:
			continue
		for f  in item[2]:	
			ext = os.path.splitext(f)[1]
			if ext in li:
				file = os.path.join(item[0],f)
				data = open(file,"r").read()
				if data.find(s) > 0:
					print("file: %s  %s  %d"%(file,s,data.find(s)))
#					os.system("open %s"%file)
				# else:
				# 	print("filter %s"%file)	
from PIL import Image				
def findImage(dir,w,h):
	for(d,_,item) in os.walk(dir):
		for f in item:
			ff = os.path.join(d, f)
			ext_name = os.path.splitext(ff)[1]
			if ext_name == ".jpg" or ext_name == ".png":
				im = Image.open(ff)
				if im.width == w and im.height == h:
					print ff,im.width,im.height
								
#findContent("res","tanke_dianshiduan_BG")				
findImage("res",1136,640)				
