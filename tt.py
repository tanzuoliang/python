import os,sys

if __name__ == '__main__':
	
	path = sys.argv[1]
	print path

	for item in os.walk(path):
		if not item[2]:
			continue

		for i in item[2]:
			file = os.path.join(item[0],i)

			f = open(file,"r")
			data = f.read()
			f.close()

			f = open(file,"w")
			f.write(data)
			f.close()

			print "-========== > %s"%file	
