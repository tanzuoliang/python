#!/usr/bin/python

import socket,time,json
import sys

HOST = "192.168.1.117"
POST = 41234	
BUFF_SIZE = 2056
sock = socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
sock.connect((HOST,POST))
index = 0
while True:
#	cmd = raw_input("input you message:>")
	time.sleep(0.05)
	sock.sendall(json.dumps({"index":index,"data":[time.time(),1,2,3,4,5,6,7] * 50}))
	print "send \tindex = \t",index
	index += 1
	try:
		data = sock.recv(BUFF_SIZE)
		print "get \tindex = \t",json.loads(data)["index"]
	except Exception as e:
		print e
		sock.close()
		break	

sock.close()	