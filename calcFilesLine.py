#!/usr/bin/python

import os

root = "/Users/tanzuoliang/Documents/projects/tank/src"

cnt = 0

for item in os.walk(root):
	if not item[2]:
		continue
	
	for ff in item[2]:
		_file = os.path.join(item[0],ff)
		
		with open(_file,'r') as f:
			for l in f.readlines():
				if not l.strip() == "":
					cnt = cnt + 1
#					print l

print cnt						 