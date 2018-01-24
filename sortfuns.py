#/usr/local/bin
#encoding=utf-8
import re

"""
https://github.com/pgbovine/OnlinePythonTutor.git
"""


cycleCount = 0
swapCount = 0

resultMap = {}

def addCycle():
	global cycleCount
	cycleCount = cycleCount + 1
def addSwap():
	global swapCount
	swapCount = swapCount + 1
	
def sortDector(name):
	def __dec(fun):
		def wrap(ls):
			global cycleCount,swapCount 
			cycleCount = 0
			swapCount = 0
			print "--------------------------------------------------------------------------------------------------"
			fun(ls)
			print "after:",ls
			print "{2} cycleCount = {0} swapCount = {1}".format(cycleCount,swapCount,name)
			resultMap[name] = {"cycleCount":cycleCount,"swapCount":swapCount} 
			print reduce(lambda x,y:x+y,ls)
		return wrap	
	return __dec	

"""
交换数组数据
"""
def swap(ls,f,t):
	if not f == t:
	 temp = ls[f]
	 ls[f] = ls[t]
	 ls[t] = temp

"""
冒泡排序
"""
@sortDector(name="bubble_sort")
def bubble_sort(ls):
	le = len(ls)
	for i in xrange(le - 1):
		for j in xrange(1,le - i):
			if ls[j - 1] > ls[j]:
				swap(ls,j - 1,j)
				addSwap()
			addCycle()
"""
简单选择排序
"""
@sortDector(name="select_sortleft")				
def select_sortleft(ls):
	le = len(ls)
	for i in xrange(le - 1):
		temp = ls[i]
		k = i
		for j in xrange(i,le):				
#			if (mode == -1 and ls[j] < temp) or (mode == 1 and ls[j] > temp):
			if ls[j] < temp:
				k = j
				hasSwap = True
				temp = ls[j]	
			addCycle()	
		swap(ls, k, i)
		addSwap()	

@sortDector(name="select_sortRight")		
def select_sortRight(ls):
	le = len(ls)
	for i in xrange(le - 1):
		temp = ls[0]
		k = 0
		for j in xrange(1,le - i):				
#			if (mode == -1 and ls[j] < temp) or (mode == 1 and ls[j] > temp):
			if ls[j] > temp:
				k = j
				temp = ls[j]	
			addCycle()
					
		swap(ls, k, j)
		addSwap()
	

"""
移动数组
"""
def moveList(ls,index,num):
	count = 0
	while ls[index] > num and index > -1:
		ls[index + 1] = ls[index]
		index = index - 1
		count = count + 1
		
	return index + 1,count	

"""
插入排序
"""
@sortDector(name="insert_sort")		
def insert_sort(ls):
	le = len(ls)
	for i in xrange(le - 1):
		check = ls[i]
		for j in xrange(i + 1,le):
			temp = ls[j]
			if temp < check:
#				print "temp = {0} check = {1}".format(temp,check)
				retTuple = moveList(ls, j - 1, temp)
				ls[retTuple[0]] = temp
				addSwap()
					
			addCycle()		
						
					
"""
快速排序
"""
@sortDector(name="quick_sort")	
def quick_sort(ls):

	def execute(ls,start_index,end_index,tag):
		left_point = start_index
		right_point = end_index
		check_num = ls[start_index]
	
		while left_point < right_point:
			while ls[right_point] > check_num:
				right_point = right_point - 1
				addCycle()
			swap(ls, right_point, left_point)
			addSwap()

			while ls[left_point] < check_num:
				left_point = left_point + 1
				addCycle()
			swap(ls, right_point, left_point)
			addSwap()
		
		
		if start_index < left_point:
			execute(ls, start_index, left_point - 1,"left")
			
		if right_point < end_index:
			execute(ls, right_point + 1, end_index,"right")
	execute(ls,0,len(ls) -1,"root")
					

"""
两端排弃
"""
@sortDector(name="port_sort")			
def port_sort(ls):
	le = len(ls)
	half = int(le * 0.5) if le % 2 == 0 else int(le * 0.5) + 1
	for i in xrange(half):
	
		startIndex = i
		endIndex = le - i - 1
		minValue = ls[startIndex]
		maxValue = ls[endIndex]
		
		minIndex = -1
		maxIndex = -1
		
#		print "start from {0} to {1} min = {2} max = {3}".format(startIndex,endIndex,minValue,maxValue)
		for k in xrange(i,endIndex):
			cur_data = ls[k]
			if cur_data > maxValue:
				maxValue = cur_data
				maxIndex = k
			if cur_data < minValue:
				minValue = cur_data
				minIndex = k
			addCycle()	
					
		if minIndex > -1:
			swap(ls, startIndex, minIndex)	
			addSwap()
						
		if maxIndex > -1:
			swap(ls, endIndex, maxIndex)
			addSwap()
		
				

def heapAdjist(ls,parent,le):
	temp = ls[parent]
	child = 2 * parent + 1
	while(child < le):
		addCycle()
		
		if child + 1 < le and ls[child] < ls[child + 1]:
			child = child + 1
			
		if ls[child] > temp:
			swap(ls, child, parent)
			parent = child
			child = 2 * parent + 1
			addSwap()
		else:
			break	
		

"""
"""
@sortDector(name="heap")		
def binaryTree_sort(ls):
	
	
	le = len(ls)
	half = int((le - 1) * 0.5)
	for i in xrange(half + 1):
		heapAdjist(ls, half, le)
		half = half - 1
		addCycle()
		
	for i in xrange(le):
		last = le - i - 1
		swap(ls, 0, last)
		addSwap()
		heapAdjist(ls, 0, last - 1)
		addCycle()	
		
		
					
if __name__ == "__main__":
	baseList = [34,21,13,67,89,2,5,14,100,11,10000,2001,45,43,23,456,421,3456,7854,3,4,12,45,64,12,345,111,32,123,3,12,3,4,5,12,34,54,32,21,43,54,12,34,54,65,76,54]
	print reduce(lambda x,y:x+y,baseList)
#	baseList = [5,1,2,3,4,8,7,6]

#	insert_sort(baseList[:])
#	port_sort(baseList[:])
#	bubble_sort(baseList[:])
#	select_sortleft(baseList[:])
#	select_sortRight(baseList[:])
#	quick_sort(baseList[:])
	binaryTree_sort(baseList[:])
	
	import json
	print json.dumps(resultMap, indent=2)	
	
