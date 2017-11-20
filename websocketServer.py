#!/usr/bin/python
#encoding=utf-8
import socket
import struct
import hashlib,base64
import threading,random

connectionlist = {}


def sendMessage(message):
	global connectionlist
	print "send message %s"%message
	for con in connectionlist.values():
		con.send("\x00%s\xFF"%message)

def deleteconnection(item):
	global connectionlist
	del connectionlist['connection' + item]
	
def generate_token_2(self, key):  
	key = key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'  
	ser_key = hashlib.sha1(key).digest()  
	return base64.b64encode(ser_key) 
	
def generate_token(self, key1, key2, key3):  
	#list/tuple(ls)-list元组相互转换  
	#这句话没看懂,如何理解key是否为数字  
	num1 = int("".join([digit for digit in list(key1) if digit.isdigit()]))  
	#解析key1中空格的个数  
	spaces1 = len([char for char in list(key1) if char == " "])  
	#解析后number2对象  
	num2 = int("".join([digit for digit in list(key2) if digit.isdigit()]))  
	#统计空格的个数?安全性验证  
	spaces2 = len([char for char in list(key2) if char == " "])  
	#按照一定的格式进行打包,然后进行网络传输(格式可以自己进行预订)  
	#struck.pack：http://blog.sina.com.cn/s/blog_4b5039210100f1tu.html  
	combined = struct.pack(">II", num1/spaces1, num2/spaces2) + key3  
	#对打包的值进行md5解码后,并返回二进制的形式  
	##hexdigest() 为十六进制值，digest()为二进制值  
	#处理MD5: http://wuqinzhong.blog.163.com/blog/static/4522231200942225810117/  
	return hashlib.md5(combined).digest()	 

class WebSocket(threading.Thread):
	
	def __init__(self,conn,index,name,remote,path='/'):
		threading.Thread.__init__(self)
		
		self.conn = conn
		self.index = index
		self.name = name
		self.remote = remote
		self.path = path
		self.buffer = ""
		self.splitStr = '\r\n\r\n'
		
	def run(self):
		print "Socket %d Start!"%self.index
		
		headers = {}
		
		self.handshaken = False
		
		while True:
			if self.handshaken == False:
				self.buffer += 	self.conn.recv(1024)
#				print "buffer %s"%self.buffer
				if self.buffer.find(self.splitStr) != -1:
					header , data = self.buffer.split(self.splitStr,1)
					for line in header.split('\r\n')[1:]:
						key,value = line.split(": ",1)
						print key,value
						headers[key] = value
					
					headers["Location"] = "ws://%s%s"%(headers["Host"],self.path)
#					if len(data) < 8:
#						print "read more %d"%len(data)
#						data += self.conn.recv(8 - len(data))
#					
#					self.buffer = data[8:]
					sec_key = headers['Sec-WebSocket-Key']		
					res_key = generate_token_2(self, sec_key) 
					global HANDSHAKE_STRING
					handshake = 'HTTP/1.1 101 Switching Protocols\r\nUpgrade: WebSocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: %s\r\nWebSocket-Origin: %s\r\nWebSocket-Location: %s\r\n\r\n'%(res_key,headers['origin'], headers['Location'])
					self.conn.send(handshake)
					print handshake
					self.handshaken = True
			else:
				self.buffer += self.conn.recv(64)
				print self.buffer
				if self.buffer.find("\xFF") != -1:
					s = self.buffer.split("\xFF")[0][1:]
					sendMessage(s)
					self.buffer = ""
					
					
					
class WebSocketServer(object):
	
	def __init__(self):
		self.socket = None
	
	def begin(self):
		self.socket = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
		ip = '192.168.1.117'
		port = 8082
		self.socket.bind((ip,port))
		self.socket.listen(50)
		global connectionlist
		i = 0
		
		while True:
			connection,address = self.socket.accept()
			username = address[0]
			ws = WebSocket(connection, i, username, address)
			ws.start()
			connectionlist['connection'+str(i)] = connection
			i = i + 1

if __name__ == "__main__":
	server = WebSocketServer()
	server.begin()									
					
							