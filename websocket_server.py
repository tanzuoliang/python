#!/usr/bin/python
#coding=utf-8
import socket
import threading
import sys
import os
import base64
import hashlib
import struct
	
# ====== config ======
HOST = '192.168.1.117'
PORT = 8083
MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
HANDSHAKE_STRING = "HTTP/1.1 101 Switching Protocols\r\n" \
			"Upgrade:websocket\r\n" \
			"Connection: Upgrade\r\n" \
			"Sec-WebSocket-Accept: {1}\r\n" \
			"WebSocket-Location: ws://{2}/chat\r\n" \
			"WebSocket-Protocol:chat\r\n\r\n"
	
	
connectionList = {}

def sendMessage(message):
	global connectionList
	print "broad message : %s"%message
	for conn in connectionList.values():
		conn.send_data(message)
	
class WebSocket(threading.Thread):
	def __init__(self, connection,room):
		threading.Thread.__init__(self)
		self.con = connection
		self.room = room
		self.rid = self.room.rid
		self.id = 0
		self.tank_id = 0,
		self.camp = 0
	
	def toString(self):
		return {'id':self.id,'rid':self.rid,'camp':self.camp,'dir':1,'tank_id':self.tank_id};
	
 	def run(self):
		while True:
			msg = self.recv_data(1024)
			if msg:
				#sendMessage(msg)
				self.room.onmessage(msg,self)
#				print("message : %s"%msg)
#				self.send_data(msg)
				pass
		pass
	
 	def recv_data(self, num):
		try:
	 		all_data = self.con.recv(num)
	 		if not len(all_data):
				return False
		except:
	 		return False
		else:
	 		code_len = ord(all_data[1]) & 127
	 		if code_len == 126:
				masks = all_data[4:8]
				data = all_data[8:]
	 		elif code_len == 127:
				masks = all_data[10:14]
				data = all_data[14:]
	 		else:
				masks = all_data[2:6]
				data = all_data[6:]
	 	raw_str = ""
	 	i = 0
	 	for d in data:
			raw_str += chr(ord(d) ^ ord(masks[i % 4]))
			i += 1
	 	return raw_str.split("?")[0]
	
 	# send data
 	def send_data(self, data):
		if data:
	 		data = str(data)
		else:
	 		return False
		token = "\x81"
		length = len(data)
		if length < 126:
	 		token += struct.pack("B", length)
		elif length <= 0xFFFF:
	 		token += struct.pack("!BH", 126, length)
		else:
	 		token += struct.pack("!BQ", 127, length)
		#struct为Python中处理二进制数的模块，二进制流为C，或网络流的形式。
		data = '%s%s' % (token, data)
		self.con.send(data)
		return True
	
 	# handshake
	

	
class WebSocketServer(object):
	
	def __init__(self,room):
		self.room = room
		self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self.i = 0
		
		try:
			self.sock.bind((HOST, PORT))
			self.sock.listen(1000)
				#链接队列大小
			print "bind 3368,ready to use"
	 	except:
			print("Server is already running,quit")
			sys.exit()

	 	while True:
			connection, address = self.sock.accept()
				#返回元组（socket,add），accept调用时会进入waite状态
			print "Got connection from ", address
			if self.handshake(connection):
		 		print "handshake success"
		 	try:
				t = WebSocket(connection,self.room)
				self.room.connectionlist['conn%d'%self.i] = t
				self.i = self.i + 1
				t.start()
				print 'new thread for client ...'
		 	except Exception as e:
				print  e
				connection.close()
				
	def handshake(self,con):
		headers = {}
		shake = con.recv(1024)
		
		if not len(shake):
		 	return False
		
		header, data = shake.split('\r\n\r\n', 1)
		for line in header.split('\r\n')[1:]:
		 	key, val = line.split(': ', 1)
		 	headers[key] = val
		
		if 'Sec-WebSocket-Key' not in headers:
		 	print ('This socket is not websocket, client close.')
		 	con.close()
		 	return False
		
		sec_key = headers['Sec-WebSocket-Key']
		res_key = base64.b64encode(hashlib.sha1(sec_key + MAGIC_STRING).digest())
		
		str_handshake = HANDSHAKE_STRING.replace('{1}', res_key).replace('{2}', HOST + ':' + str(PORT))
		print str_handshake
		con.send(str_handshake)
		return True

import time
class Scheduler(threading.Thread):
	def __init__(self,func,duration):
		threading.Thread.__init__(self)
		self.func = func
		self.duration = duration
	
	def run(self):
		while True:
			time.sleep(self.duration)
			self.func()	



class ServerTimeLine(object):
	
	def __init__(self,room_id):
		self.room_id = room_id
		self.timeMap = {}
		
	def addFrameData(self,frame,data):
		self.timeMap[frame] = data
		
	def getFrameData(self,frame):
		return self.timeMap[frame]
	
	def getFrameDatas(self,frame,end):
		ret = []
		for i in xrange(frame,end):
			ret.push(self.timeMap[i])
		return ret

import json	

class Room(object):
	def __init__(self,rid):
		self.connectionlist = {}
		self.rid = rid
		self.actionList = []
		self.currentFrameIndex = 0
		self.timeline = ServerTimeLine(self.rid);
		
		self.roominfo = []
		self.scheduler = Scheduler(self.updateBroadMsg,0.05)
		self.scheduler.start()
	
	def sendMessage(self,message):
		print "broad message : %s"%message
		for conn in self.connectionlist.values():
			conn.send_data(message)
	def getBroadcastFromFrameToNow(self,frame):
		return self.timeline.getFrameDatas(frame + 1, self.currentFrameIndex);
	
	def onmessage(self,message,ws):
		print message
		data = json.loads(message)
		if data[0] == "enter":
			ws.id = data[4]
			ws.camp = data[5]
			ws.tank_id = data[6]
			
			response = json.dumps([[-1,0,0],{"type":"init","id":ws.id,"rid":self.rid,"camp":ws.camp}])
			ws.send_data(response)
			
			self.roominfo.append(ws.toString())
			
			self.startGame()
			
		else:
			self.addAction(data)	
	
	def startGame(self):
		res = json.dumps([[-2,0,0],{"type":"start","userlist":self.roominfo}])
		self.sendMessage(res)
		self.scheduler = Scheduler(self.updateBroadMsg,0.05)
		self.scheduler.start()
	
	def addAction(self,data):
		for a in data[1]:
			self.actionList.append(a)
	
	def updateBroadMsg(self):
		if len(self.actionList) == 0:
			return
		actionHead = [[self.currentFrameIndex,time.time()]];
		actionHead.extend(self.actionList)
		self.sendMessage(json.dumps(actionHead))
		self.currentFrameIndex = self.currentFrameIndex + 1
		self.actionList = []
															

if __name__ == '__main__':
	room = Room(12)
	WebSocketServer(room)