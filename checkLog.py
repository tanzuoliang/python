#!/usr/bin/python

while True:
	fileName = raw_input("input you file > ")

	with open(fileName) as f:
		lastNo = -1
		lastTime = -1
		lastLine = None
		for line in f.readlines():
			(no,time) = line.split(" ")
			if lastTime > -1:
				deltaNo = int(no) - int(lastNo)
				if deltaNo > 1 or int(time) > 120:
					print line
			lastNo = no
			lastTime = time	
			lastLine = line
		