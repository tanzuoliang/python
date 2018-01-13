#!/usr/bin/python

import websocket
import json,thread
import time



class Clinet(object):
	
	def __init__(self,id):
		self.index = 0
#		websocket.enableTrace(True)
		self.ws = websocket.WebSocketApp("ws://192.168.1.117:8080")
		self.ws.on_open = self.onOpen
		self.ws.on_message = self.onMessage
		self.ws.run_forever()
		#{"type":"re",id:21,msg:msg}
		self.strMsg = "var info = %s"
		self.jsonMsg = "var info = JSON.stringify(%s)"
		print "p0--"

	def onMessage(self,ws,data):
		print data
	
	def pauseGame(self,uid):
		self.sendMsg(uid, 'cc.textureCache.getCachedTextureInfo();')
	def releaseGame(self,uid):
		self.sendMsg(uid, 'cc.textureCache.removeUnusedTextures();')	
		
	def onOpen(self,ws):
		print "websocket connect successfully"
		def run(**args):
			while True:
#				time.sleep(0.05)
#				data = [[self.index,time.time()]]
#				data.extend([[[1,2,3,4,5,6,7,8,9]] * 31])
#				self.ws.send("%s\xFF"%json.dumps(data))
#				self.index = self.index + 1
#				msg = raw_input("please input command\n")
#				self.ws.send("%s\xFF"%msg)
				msg = raw_input("please input command\n1: getCachedTextureInfo game\n2: cc.textureCache.removeUnusedTextures\n")
				if msg == "1":
					#uid = raw_input("input uid\n")
					self.pauseGame(60)
				elif msg == "2":
					#uid = raw_input("input uid\n")
					self.releaseGame(60)	
				else:
					l = msg.split(":")
					self.sendMsg(l[0],l[1])
					pass
		thread.start_new_thread(run, ())				
		
	def sendMsg(self,id,msg):
		msg = json.dumps({"type":"re","id":id,"msg":"var info = %s"%msg})
		print "send info is %s"%msg
		self.ws.send(msg)
		
	def sendJsonMsg(self,id,msg):
		info = json.dumps({"type":"re","id":id,"msg":self.jsonMsg%msg})
		print info
		self.ws.send(info)	
		
if __name__ == "__main__":
	client = Clinet("client")			