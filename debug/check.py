#!/usr/bin/python

import os,re,sys

def check():
	with open("temp.txt","r") as f:
		_list = []
		#JS: [time:531030735][1204] player position start retime = 0.05
		#JS: [time:881778385][PlayerAIFactory update end]
		cnt = 0
		slist = []
		elist = []		
		for line in f.readlines():
			ti = int(line.split("][")[0].split(":")[2])
			if cnt == 0 and "start" in line:
				slist.append(ti)
				cnt = cnt + 1
			elif cnt == 1 and "end" in line:
				elist.append(ti)
				cnt = 0
			
		
		for i in range(0,len(slist)):
			de = elist[i] - slist[i]
			if de > 3000:
				print "delay more than %d mis  from %d to %d"%(de,elist[i],slist[i])	
			
			
#check()	
import json
def ch():
	with open("temp.txt","r") as f:
		send_list =[]
		get_list = []
		frame = -1
		move_action_list = []
		
		send_action = {}
		get_action = {}
		for line in f.readlines():
			if "send to" in line:
				#[time:1498628935837000]1784[send to server] [2,173,3,1,173] time = 0.06579899974167347
				_l = line.split("[send to server] ")
#				print _l
				frame = int(_l[0].split("]")[1])
				
				time = _l[0].split("]")[0].split(":")[2]
				time = int(time[0:len(time)-3])
				lastSendData = json.loads(_l[1].split(" time ")[0])
				send_list.append((frame,lastSendData))
				send_action[lastSendData[5]] = (lastSendData,frame,time)
#				move_action_list.append(lastSendData)
			elif "[server]" in line:			
				#[time:1498628916991000]855[server] [[339],[30,173,1498628916926000],[30,170,916360491],[2,173,3,1,173]]
				_l = line.split("[server] ")
				frame = int(_l[0].split("]")[1])
				time = _l[0].split("]")[0].split(":")[2]
				time = int(time[0:len(time)-3])
				da = json.loads(_l[1])
				for i in range(1,len(da)):
					if da[i][0] == 2:
#						print da[i]
						get_list.append((frame,da[i]))
						get_action[da[i][5]] = (da[i],frame,time)
						break	
		last_time = 0	
		last_time_send = 0						
		for i in range(0,len(send_list)):
			s_d = send_list[i][1]
			if s_d[5] in get_action:
				send_data = send_action[s_d[5]]
				get_data = get_action[s_d[5]]
#				print "pass %d send [%d] %s get [%d] %s"%(get_data[2] - send_data[2], send_data[1],json.dumps(send_data[0]), get_data[1],json.dumps(get_data[0]))
				cur = get_data[2]
				cur_send = send_data[2]
				if not last_time == 0:
					detal = cur - last_time
					if detal > 70:
						print "----------------------------------------- two move pass %d"%(cur - last_time) 
				last_time = cur
				
				if not last_time_send == 0:
					detal = cur_send - last_time_send
#					if detal > 70:
#					print "----------------------------------------- two move send pass %d"%(detal) 
				last_time_send = cur_send	
	
			else:
				print "drop action %s"%(json.dumps(send_action[s_d[5]][0]))	
							
ch()						
		