#!/usr/bin/python
#encoding=utf-8
from PIL import Image
import os,json

def run(root,savefile,ext=".png"):
	json_map = {}
	json_list_map = {}
	total = 0
	for (d,_,item) in os.walk(root):
		if not item:
			continue
		for f in item:
			f = os.path.join(d,f)	
			if os.path.splitext(f)[1] == ext:
				im = Image.open(f)
				now_size = im.width * im.height
				total = total + now_size
				json_map[f.replace("../","",1)] = now_size
				plist_path = f.replace(".png",".plist",1)
				if os.path.exists(plist_path):
					now_size = im.width * im.height
					total = total + now_size
					json_map[plist_path.replace("../","",1)] = now_size
					
	with open(savefile,"w") as f:
		ret = "var PNG_SIZE = \n%s"%json.dumps(json_map, indent=2)
		f.write(ret)
		
	print "total = ",total				


if __name__ == "__main__":
	run("../res","../src/png.js")