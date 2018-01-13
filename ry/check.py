#!/usr/bin/python

"""
remove Texture Texture2D: 0x17411dc70 - id=93   size = 256
create Texture Texture2D: 0x17011fad0 - id=91   size = 256
"""
import json
def total(list):
	t = 0
	for v in list:
		t = t + v;
	return t;	


def addRecode(_map,address,size):
	if not address in _map:
		_map[address] = []
	_map[address].append(size)
	
def getsize(_map):
	r = 0
	for address in _map.keys():
		for v in _map[address]:
			r = r + v
	return r				

with open("info.txt","r") as f:
	add_list = []
	remove_list = []
	
	add_id = []
	rem_id = []
	_M = {}
	
	_size = 16384
	add_num = 0
	re_num = 0
	
	add_map = {}
	rem_map = {}
	
	for line in f.readlines():
		si = int(line.split("size = ")[1])
		id = int(line.split("-")[1].split("=")[1].split("   size")[0])
		address = line.split(": ")[1].split(" - ")[0]
		if "remove" in line:
			remove_list.append(si)
			rem_id.append(id)
			_M[str(id)] = -1
			if si == _size:
				re_num = re_num + 1
			addRecode(rem_map,address,si)	
		elif "create" in line:
			add_list.append(si)
			add_id.append(id)
			_M[str(id)] = si
			if si == _size:
				add_num = add_num + 1
			addRecode(add_map,address,si)	
	to_add = total(add_list)
	to_rem = total(remove_list)
	print "add = ",to_add , " ", len(add_list)
	print "rem = ",to_rem , " ", len(remove_list)
	print "lase = ",(to_add - to_rem)
	
	print "size %s create %d remove %d"%(_size,add_num,re_num)	
	for address in add_map.keys():
		if address in rem_map:
			for i in range(0,len(rem_map[address])):
				if len(add_map[address]):
					add_map[address].pop(0)
#					print "remove address ",address
				else:
					pass
#					print "address:%s size is zero re_len = %d"%(address,len(rem_map[address]))	
			rem_map.pop(address)
			if len(add_map[address]) == 0:
				add_map.pop(address)
	
	
	print "map_size = ",getsize(add_map)
	print json.dumps(add_map,indent=2)								