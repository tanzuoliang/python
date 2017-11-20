#!/usr/bin/python

import os,json


class Frame(object):
	
	def __init__(self,data):
		self.data = data.replace("JS: get from server is ","")
		_list = self.data.split(" ")
		self.action = _list[0]
		try:
			self.actionJson = json.loads(self.action)
			self.serverFrame = self.actionJson[0][0]
			self.getTime = self.actionJson[0][1]
			self.frameIndex = _list[3]
			self.time = _list[7].replace("\n","")
			if "." in self.time:
				self.time = float(self.time)
			else:
				self.time = int(self.time)
				
			self.hasJson = True	
		except:
			self.serverFrame = -1
			self.frameIndex = -1
			self.time = 0
			self.hasJson = False
			self.getTime = 0
			
		self.downLoadTime = int(self.time - self.getTime)			
			
	def checkSome(self):
		print "frame %d downloadtime : %d"%(self.serverFrame,self.downLoadTime)
		if not self.hasJson:
			return
		tList = {"2":[],"3":[]}
		for action in self.actionJson[1:len(self.actionJson)]:
			if not action[1] == 60:
				continue
			if action[0] == 2 or action[0] == 3:
				if not action[0] in tList[str(action[0])]:
					tList[str(action[0])].append(action)
						
		
		if len(tList["2"]) > 1:
			print " has two action about move in %s"%self.data					
	
		if len(tList["3"]) > 1:
			print " has two action about launch in %s"%self.data

	def handlerAction(self):
		uid = 60
		actions = []
		for action in self.actionJson[1:len(self.actionJson)]:
			if action[1] == uid:
				if not action[0] == 2 or not action == 3:
					continue
				if not action[0] in actions:
					actions.append(action[0])
				else:
					print("frame %s  has some action %d\n\n"%(json.dumps(data),action[0]))	

with open("temp.txt","r") as f:
	frameList = []
	lastFrame = None
	for line in f.readlines():
		if not "camp" in line:
			frame = Frame(line)
			frameList.append(frame)
			if lastFrame == None:
				lastFrame = frame
			else:
				print("from frame %d to frame %d pass time %d"%(lastFrame.serverFrame,frame.serverFrame,frame.time - lastFrame.time))
				lastFrame = frame
			
			
	indexMap = {}
	for frame in frameList:
		if not frame.frameIndex in indexMap:
			indexMap[frame.frameIndex] = []
		
		indexMap[frame.frameIndex].append(frame.data)
	
	
	print "---------------------------------"
	for frameIndex in indexMap:
		if frameIndex > 0 and len(indexMap[frameIndex]) > 1:
			print json.dumps(indexMap[frameIndex],indent=2)		
			
			
	print "**************************************************"
	
	for frame in frameList:
		frame.checkSome()		
		
#	print "+++++++++++++++++++++++++++++++++++++++++++++"		
#	for frame in frameList:
#		if "[3,60" in frame.data:
#			print frame.data			

				
		