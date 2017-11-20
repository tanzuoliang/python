#!/usr/bin/python

import os
for(_dir,_,item) in os.walk("../"):
	if item:
		for f in item:
			ff = os.path.join(_dir,f)
			
			with open(ff,"r") as f:
				ext = os.path.splitext(ff)[1]
				data = f.read()
				if  ext == ".cpp" and "registerCallFromAndroid" in data:
					print ff